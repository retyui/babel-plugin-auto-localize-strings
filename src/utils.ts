import prettier from "prettier";
import { transformSync } from "@babel/core";
import plugin from "./index";
import type { Options } from "./types";

export function transform(source: string, options: Options = {}): string {
  const { code } = transformSync(source, {
    filename: "file.tsx",
    ast: false,
    plugins: [[plugin, options]],
    sourceType: "module",
    babelrc: false,
    configFile: false,
    compact: false,
  })!;

  return prettier
    .format(code!, { parser: "babel" })
    .replace(`"use strict";\n`, "");
}
