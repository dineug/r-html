import { TAttrType } from '@/constants';
import {
  isArray,
  isBoolean,
  isFunction,
  isObject,
  isUndefined,
} from '@/helpers/is-type';
import { VNodeType } from '@/parser/node';
import { TemplateLiterals, TemplateLiteralsType } from '@/template';
import { html, svg } from '@/template/html';
import { TAttr, TNode } from '@/template/node';

type EventTuple = [
  Function,
  undefined | boolean | AddEventListenerOptions | EventListenerOptions
];

const createElement = (name: string, isSvg = false) =>
  isSvg
    ? document.createElementNS('http://www.w3.org/2000/svg', name)
    : document.createElement(name);

export const createNode = (
  { type, value }: TNode,
  isSvg = false
): HTMLElement | Text | Comment | SVGElement =>
  type === VNodeType.element
    ? createElement(value, isSvg)
    : type === VNodeType.text
    ? document.createTextNode(value)
    : document.createComment(value);

export const isTruthy = (value?: string | null) =>
  Boolean(value) && value !== 'false';

export function setAttr(node: Element, { type, name, value }: TAttr) {
  switch (type) {
    case TAttrType.attribute:
      node.setAttribute(name, value ?? '');
      break;
    case TAttrType.boolean:
      isTruthy(value) && node.setAttribute(name, '');
      break;
    case TAttrType.property:
      Reflect.set(node, name, value, node);
      break;
  }
}

export function setProps(props: any, { type, name, value }: TAttr) {
  switch (type) {
    case TAttrType.attribute:
    case TAttrType.property:
      Reflect.set(props, name, value);
      break;
    case TAttrType.boolean:
      Reflect.set(props, name, isTruthy(value));
      break;
  }
}

export const equalValues = (a: any[], b: any[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export const isEventTuple = (value: EventTuple) =>
  isArray(value) &&
  isFunction(value[0]) &&
  (isUndefined(value[1]) || isBoolean(value[1]) || isObject(value[1]));

export function insertBeforeNode(newChild: Node, refChild: Node) {
  const parent = refChild.parentNode;
  if (!parent) return;

  parent.insertBefore(newChild, refChild);
}

export function insertAfterNode(newChild: Node, refChild: Node) {
  const parent = refChild.parentNode;
  if (!parent) return;

  refChild.nextSibling
    ? parent.insertBefore(newChild, refChild.nextSibling)
    : parent.appendChild(newChild);
}

export const removeNode = (node: Node) =>
  node.parentNode && node.parentNode.removeChild(node);

export const isNode = (value: any): value is Node => value instanceof Node;

export function rangeNodes(startNode: Node, endNode: Node) {
  const nodes: Node[] = [];
  let currentNode = startNode.nextSibling;

  while (currentNode && currentNode !== endNode) {
    nodes.push(currentNode);
    currentNode = currentNode.nextSibling;
  }

  return nodes;
}

const templateMap: Record<TemplateLiteralsType, typeof html | typeof svg> = {
  [TemplateLiteralsType.html]: html,
  [TemplateLiteralsType.svg]: svg,
};

export const reCacheTemplate = ({ type, strings, values }: TemplateLiterals) =>
  templateMap[type](strings, values);

export const noop = () => {};

export const isHTMLElement = (value: any): value is HTMLElement =>
  value instanceof HTMLElement;

export const isPromise = (value: any): value is Promise<any> =>
  value instanceof Promise;
