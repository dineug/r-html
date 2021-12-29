export type DirectiveTuple = [DirectiveClass, Array<any>];
export type DirectiveCallback = () => DirectiveTuple;

export interface DirectiveProps {
  node: any;
}

export interface DirectiveClass {
  new (props: DirectiveProps): Directive;
}

export abstract class Directive {
  abstract render(args: any[]): void;
  destroy() {}
}
