import { TNode } from '@/template/node';

export enum TemplateLiteralsType {
  html = 'html',
  svg = 'svg',
  pug = 'pug',
  pugSVG = 'pugSVG',
}

export interface TemplateLiterals {
  strings: TemplateStringsArray;
  values: any[];
  type: TemplateLiteralsType;
}

export interface Template {
  node: TNode;
}

export const templateCache = new WeakMap<TemplateStringsArray, Template>();
