export type NodeDirectiveTuple = [NodeDirectiveClass, Array<any>];
export type NodeDirectiveCallback = () => NodeDirectiveTuple;

export interface NodeDirectiveProps {
  startNode: Comment;
  endNode: Comment;
}

export interface NodeDirectiveClass {
  new (props: NodeDirectiveProps): NodeDirective;
}

export abstract class NodeDirective {
  abstract render(args: any[]): any;
  destroy() {}
}
