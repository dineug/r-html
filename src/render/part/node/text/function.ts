import { isArray, isFunction, isNull, isUndefined } from '@/helpers/is-type';
import { rangeNodes, removeNode } from '@/render/helper';
import { Operator, OperatorClass } from '@/render/operator';
import { Part } from '@/render/part';
import {
  createPart,
  getPartType,
  isPart,
} from '@/render/part/node/text/helper';

const isOperator = (value: any) => value instanceof Operator;

export class FunctionPart implements Part {
  #startNode: Comment;
  #endNode: Comment;
  #OperatorClass: OperatorClass | null = null;
  #operator: Operator | null = null;
  #part: Part | null = null;

  constructor(startNode: Comment, endNode: Comment) {
    this.#startNode = startNode;
    this.#endNode = endNode;
  }

  commit(value: any) {
    if (!isFunction(value)) return;

    const operatorTuple = value();
    if (!isArray(operatorTuple)) return;

    const [OperatorClass, args] = operatorTuple;
    if (!isFunction(OperatorClass) || !isArray(args)) return;

    if (this.#OperatorClass !== OperatorClass) {
      this.clear();
      const operator = new OperatorClass({
        startNode: this.#startNode,
        endNode: this.#endNode,
      });

      if (!isOperator(operator)) return;
      this.#operator = operator;
      this.#OperatorClass = OperatorClass;
    }

    const result = this.#operator?.render(args);
    if (isUndefined(result)) return;

    const type = getPartType(result);
    if (!isPart(type, this.#part)) {
      isNull(this.#part) || this.clear();
      this.#part = createPart(type, this.#startNode, this.#endNode);
    }

    this.#part?.commit(result);
  }

  clear() {
    this.#operator?.destroy();
    this.#part?.destroy && this.#part.destroy();
    rangeNodes(this.#startNode, this.#endNode).forEach(removeNode);
  }

  destroy() {
    this.clear();
  }
}
