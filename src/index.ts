import { types as t } from "@babel/core";
import type { Visitor, NodePath } from "@babel/traverse";

// @ts-ignore
import { declare } from "@babel/helper-plugin-utils";
// @ts-ignore
import jsx from "@babel/plugin-syntax-jsx";
import * as fbt from "./fbt/index";
import { State, ThisScope } from "./types";

const internationalizationFrameworkBabelPlugin = declare(
  function internationalizationFrameworkBabelPlugin(api: unknown) {
    // @ts-ignore
    api?.assertVersion?.(7);

    return {
      name: "internationalization-framework",
      inherits: jsx,
      pre(this: ThisScope) {
        this.importInjected = false;
      },
      visitor: {
        TemplateLiteral(path: NodePath<t.TemplateLiteral>, state: State) {
          try {
            fbt.TemplateLiteral.call(this, path, state);
          } catch (error) {
            if (error instanceof Error) {
              path.buildCodeFrameError(error.message);
            }
          }
        },

        StringLiteral(path: NodePath<t.StringLiteral>, state: State) {
          try {
            fbt.StringLiteral.call(this, path, state);
          } catch (error) {
            if (error instanceof Error) {
              path.buildCodeFrameError(error.message);
            }
          }
        },

        JSXText(path: NodePath<t.JSXText>, state: State) {
          try {
            fbt.JSXText.call(this, path, state);
          } catch (error) {
            if (error instanceof Error) {
              path.buildCodeFrameError(error.message);
            }
          }
        },
      },
    };
  } as Visitor<ThisScope>
);

export default internationalizationFrameworkBabelPlugin;
