// For this project development
import '@vue/runtime-core';

declare module '@vue/runtime-core' {
  // GlobalComponents for Volar
  export interface GlobalComponents {
    SyText: typeof import('../packages/xiami')['SyText'];
  }
}

export {};
