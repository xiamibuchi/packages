import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { emptyDir, ensureDir } from 'fs-extra';
import consola from 'consola';
import { camelCase, capitalize } from 'lodash-es';
import glob from 'fast-glob';
import { format } from 'prettier';
import chalk from 'chalk';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { findWorkspacePackages } from '@pnpm/find-workspace-packages';
import { pathComponents } from './paths';

import type { BuiltInParserName } from 'prettier';

const getSvgFiles = async () => {
  const pkgs = await findWorkspacePackages(
    (await findWorkspaceDir(process.cwd()))!
  );
  const pkg = pkgs.find((pkg) => pkg.manifest.name === '@syseven/icons-svg')!;
  return glob('*.svg', { cwd: path.resolve(pkg.dir, 'svg'), absolute: true });
};

const getName = (file: string) => {
  const filename = path.basename(file).replace('.svg', '');
  const componentName = capitalize(camelCase(filename));
  return {
    filename,
    componentName,
  };
};

const formatCode = (code: string, parser: BuiltInParserName = 'typescript') =>
  format(code, {
    parser,
    semi: false,
    singleQuote: true,
  });

const transformToVueComponent = async (file: string) => {
  const content = await readFile(file, 'utf-8');
  const { filename, componentName } = getName(file);
  const vue = formatCode(
    `
<template>
${content}
</template>
<script lang="ts">
import type { DefineComponent } from 'vue'
export default ({
  name: "${componentName}",
}) as DefineComponent
</script>`,
    'vue'
  );
  writeFile(path.resolve(pathComponents, `${filename}.vue`), vue, 'utf-8');
};

const generateEntry = async (files: string[]) => {
  const code = formatCode(
    files
      .map((file) => {
        const { filename, componentName } = getName(file);
        return `export { default as ${componentName} } from './${filename}.vue'`;
      })
      .join('\n')
  );
  await writeFile(path.resolve(pathComponents, 'index.ts'), code, 'utf-8');
};

consola.info(chalk.blue('generating vue components'));
await ensureDir(pathComponents);
await emptyDir(pathComponents);
const files = await getSvgFiles();

consola.info(chalk.blue('generating vue files'));
await Promise.all(files.map((file) => transformToVueComponent(file)));

consola.info(chalk.blue('generating entry file'));
await generateEntry(files);
