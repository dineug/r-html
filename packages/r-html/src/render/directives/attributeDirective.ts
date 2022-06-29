export type AttributeDirectiveTuple = [AttributeDirectiveClass, Array<any>];
export type AttributeDirectiveCallback = () => AttributeDirectiveTuple;

export interface AttributeDirectiveProps {
  node: any;
}

export interface AttributeDirectiveClass {
  new (props: AttributeDirectiveProps): AttributeDirective;
}

export abstract class AttributeDirective {
  abstract render(args: any[]): void;
  destroy() {}
}
