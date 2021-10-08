import type { FbtOptions } from "./fbt/types";

export interface Options {
  mode?: "fbt" | "i18next";
  fbtOptions?: FbtOptions;
}

export interface State {
  opts: Options;
}

export interface ThisScope {
  importInjected: boolean;
}
