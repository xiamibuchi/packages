import BaseConfig from '../../tailwind.config.ts';
import type { Config } from 'tailwindcss';

const config: Config = {
  ...BaseConfig,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};
export default config;
