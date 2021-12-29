export type OperatorTuple = [OperatorClass, Array<any>];
export type OperatorCallback = () => OperatorTuple;

export interface OperatorProps {
  startNode: Comment;
  endNode: Comment;
}

export interface OperatorClass {
  new (props: OperatorProps): Operator;
}

export abstract class Operator {
  abstract render(args: any[]): any;
  destroy() {}
}
