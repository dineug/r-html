import { TNode } from '@/template/tNode';

export enum TemplateLiteralsType {
  html = 'html',
  svg = 'svg',
  css = 'css',
}

export const TemplateLiteralsTypes = Object.values(TemplateLiteralsType);

interface TL {
  strings: TemplateStringsArray;
  values: any[];
}

export interface DOMTemplateLiterals extends TL {
  type: TemplateLiteralsType.html | TemplateLiteralsType.svg;
  template: Template;
}

export interface CSSTemplateLiterals extends TL {
  type: TemplateLiteralsType.css;
  template: CSSTemplate;
}

export type TemplateLiterals = DOMTemplateLiterals | CSSTemplateLiterals;

export interface Template {
  node: TNode;
}

export interface CSSTemplate {}

export const templateCache = new WeakMap<TemplateStringsArray, Template>();
export const cssTemplateCache = new WeakMap<
  TemplateStringsArray,
  CSSTemplate
>();
