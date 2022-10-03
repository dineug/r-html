import { DIRECTIVE } from '@/constants';
import { DirectiveType } from '@/render/directives';

export type AttributeDirectiveTuple = [AttributeDirectiveClass, Array<any>];
export type AttributeDirectiveCallback = () => AttributeDirectiveTuple;

export interface AttributeDirectiveProps {
  node: any;
}

export interface AttributeDirectiveClass {
  new (props: AttributeDirectiveProps): AttributeDirective;
}

export abstract class AttributeDirective {
  [DIRECTIVE]: DirectiveType.attribute;
  abstract render(args: any[]): void;
  destroy() {}
}
