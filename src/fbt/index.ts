import { types as t } from "@babel/core";
import {
  identifier,
  isIdentifier,
  isJSXIdentifier,
  jSXElement,
  jsxOpeningElement,
  jsxAttribute,
  jsxClosingElement,
  jsxIdentifier,
  stringLiteral,
  isJSXAttribute,
  isJSXElement,
  isJSXExpressionContainer,
  isJSXText,
  isStringLiteral,
  isTemplateLiteral,
  isCallExpression,
} from "@babel/types";
import { NodePath } from "@babel/traverse";
import type { ThisScope, State } from "../types";
import { config } from "./config";

function getDescription(state: State): string {
  return (
    state.opts.fbtOptions?.description ||
    (config.defaultOptions.description as string)
  );
}

function isFbtCallExpression(path?: NodePath<t.CallExpression> | null) {
  return path && isIdentifier(path.node.callee, { name: config.identifier });
}

function isFbtJSXElement(path: NodePath<t.JSXElement> | t.JSXElement | null) {
  if (path instanceof NodePath) {
    return isJSXIdentifier(path.node.openingElement.name, {
      name: config.identifier,
    });
  }
  return isJSXIdentifier(path?.openingElement.name, {
    name: config.identifier,
  });
}

function isPrimitiveJSXElementWithText(
  jsxChild: t.JSXElement["children"][0],
  deep = 3
): boolean {
  /**
   * true
   *  - <lv2><lv1>text</lv1></lv2>
   *  - <Text>text</Text>
   *  - <Text>{'text'}</Text>
   *  - <Text>{'text'}</Text>
   *  - <Text>{`text`}</Text>
   */

  if (deep === 0) {
    return false;
  }

  if (isJSXElement(jsxChild)) {
    return (
      jsxChild.children.filter((item) =>
        isPrimitiveJSXElementWithText(item, deep - 1)
      ).length === 1
    );
  }

  if (isNotEmptyJSXText(jsxChild)) {
    return true;
  }

  return (
    isJSXExpressionContainer(jsxChild) &&
    (isStringLiteral(jsxChild.expression) ||
      (isTemplateLiteral(jsxChild.expression) &&
        jsxChild.expression.expressions.length === 0))
  );
}

function hasJSXFbtParent(path: NodePath) {
  const maybeFbtJsxElement = path.findParent((nodePath: NodePath) =>
    nodePath.isJSXElement()
  ) as NodePath<t.JSXElement> | null;

  if (!maybeFbtJsxElement) {
    return;
  }

  if (isFbtJSXElement(maybeFbtJsxElement)) {
    return true;
  }

  return (
    isJSXElement(maybeFbtJsxElement.parent) &&
    isFbtJSXElement(maybeFbtJsxElement.parent)
  );
}

function hasFbtCallParent(path: NodePath) {
  const maybeFbtCall = path.findParent((nodePath: NodePath) =>
    nodePath.isCallExpression()
  ) as NodePath<t.CallExpression> | null;

  return isFbtCallExpression(maybeFbtCall);
}

function createJsxFbt(
  childrenNodes: Array<
    | t.JSXText
    | t.JSXExpressionContainer
    | t.JSXSpreadChild
    | t.JSXElement
    | t.JSXFragment
  >,
  state: State
) {
  const jsxFbt = jSXElement(
    jsxOpeningElement(jsxIdentifier(config.identifier), [
      jsxAttribute(jsxIdentifier("desc"), stringLiteral(getDescription(state))),
    ]),
    jsxClosingElement(jsxIdentifier(config.identifier)),
    childrenNodes
  );

  return jsxFbt;
}

function isNotEmptyJSXText(node: t.Node): boolean {
  return isJSXText(node) && !isEmptyJSXText(node);
}

function isEmptyJSXText(node: t.JSXText): boolean {
  /**
   * Case 1:
   * <div>
   *   <div/>
   * ^^^ empty JSXText, value: "\n  "
   *
   * Case 2:
   * <div/>
   *      ^ break line, value: "\n  "
   */
  return node.value.trim() === "";
}

function getTextCount(node?: t.Node | null): number {
  if (!isJSXElement(node)) {
    return 0;
  }

  return node.children.filter((e) => isPrimitiveJSXElementWithText(e)).length;
}

function addImportOnce(this: ThisScope, path: NodePath): void {
  if (this.importInjected) {
    return;
  }

  const moduleName = "fbt";
  const varName = "fbt";
  const importDeclaration = t.importDeclaration(
    [t.importSpecifier(t.identifier(varName), t.identifier(varName))],
    t.stringLiteral(moduleName)
  );

  path.scope.getProgramParent().path.unshiftContainer(
    // @ts-ignore
    "body",
    importDeclaration
  );

  this.importInjected = true;
}

export function JSXText(
  this: ThisScope,
  path: NodePath<t.JSXText>,
  state: State
): void {
  if (isEmptyJSXText(path.node)) {
    return;
  }

  if (hasJSXFbtParent(path)) {
    // skip if it already wrapped <fbt>...</fbt>
    return;
  }

  const parentParent = getTextCount(path.parentPath?.parent);
  const parent = getTextCount(path.parent);
  const hasAtLeastOneNotEmpty =
    isJSXElement(path.parentPath?.parent) &&
    path.parentPath.parent.children.every((e) =>
      isPrimitiveJSXElementWithText(e, 1)
    );

  if (parentParent > parent && hasAtLeastOneNotEmpty) {
    return;
  }

  // @ts-ignore proved after getTextCount
  path.parent.children = [createJsxFbt(path.parent.children, state)];
  addImportOnce.call(this, path);
  return;
}

export function TemplateLiteral(
  this: ThisScope,
  path: NodePath<t.TemplateLiteral>,
  state: State
) {
  if (
    path.node.expressions.length === 0 &&
    isJSXExpressionContainer(path.parent)
  ) {
    path.replaceWith(stringLiteral(path.node.quasis[0].value.raw));
  }
}

export function StringLiteral(
  this: ThisScope,
  path: NodePath<t.StringLiteral>,
  state: State
): void {
  if (path.parentPath.isImportDeclaration()) {
    return;
  }

  if (
    isCallExpression(path.parent) &&
    isIdentifier(path.parent.callee, { name: "require" })
  ) {
    return;
  }

  if (hasFbtCallParent(path) || hasJSXFbtParent(path)) {
    // skip if it already wrapped <fbt>...</fbt> or fbt(...)
    return;
  }

  if (isJSXExpressionContainer(path.parent)) {
    /**
     * <Text>{"text"}</Text> => <Text><fbt>text<fbt></Text>
     */
    path.replaceWith(createJsxFbt([t.jsxText(path.node.value)], state));
    addImportOnce.call(this, path);
    return;
  }

  const wrapperString = t.callExpression(identifier(config.identifier), [
    path.node,
    stringLiteral(getDescription(state)),
  ]);

  if (
    isJSXAttribute(path.parent) &&
    ![
      "className",
      "href",
      "id",
      "aria-live",
      "acceptCharset",
      "htmlFor",
      "autoCapitalize",
      "autoCorrect",
    ].some((attrName) => (path.parent as t.JSXAttribute).name.name === attrName)
  ) {
    /**
     * <TextInput placeholder="text" /> => <TextInput placeholder={fbt('text')} />
     */
    path.replaceWith(t.jsxExpressionContainer(wrapperString));
    addImportOnce.call(this, path);
    return;
  }

  path.replaceWith(wrapperString);
  addImportOnce.call(this, path);
  return;
}
