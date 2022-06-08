import { isArray, isFunction, isNull, isUndefined } from '@/helpers/is-type';
import {
  NodeDirective,
  NodeDirectiveClass,
} from '@/render/directives/nodeDirective';
import { rangeNodes, removeNode } from '@/render/helper';
import { Part } from '@/render/part';
import {
  createPart,
  getPartType,
  isPart,
} from '@/render/part/node/text/helper';

const isDirective = (value: any) => value instanceof NodeDirective;

export class FunctionPart implements Part {
  #startNode: Comment;
  #endNode: Comment;
  #DirectiveClass: NodeDirectiveClass | null = null;
  #directive: NodeDirective | null = null;
  #part: Part | null = null;

  constructor(startNode: Comment, endNode: Comment) {
    this.#startNode = startNode;
    this.#endNode = endNode;
  }

  commit(value: any) {
    if (!isFunction(value)) return;

    const directiveTuple = value();
    if (!isArray(directiveTuple)) return;

    const [DirectiveClass, args] = directiveTuple;
    if (!isFunction(DirectiveClass) || !isArray(args)) return;

    if (this.#DirectiveClass !== DirectiveClass) {
      this.clear();
      const directive = new DirectiveClass({
        startNode: this.#startNode,
        endNode: this.#endNode,
      });

      if (!isDirective(directive)) return;
      this.#directive = directive;
      this.#DirectiveClass = DirectiveClass;
    }

    const result = this.#directive?.render(args);
    if (isUndefined(result)) return;

    const type = getPartType(result);
    if (!isPart(type, this.#part)) {
      isNull(this.#part) || this.clear();
      this.#part = createPart(type, this.#startNode, this.#endNode);
    }

    this.#part?.commit(result);
  }

  clear() {
    this.#directive?.destroy();
    this.#part?.destroy && this.#part.destroy();
    rangeNodes(this.#startNode, this.#endNode).forEach(removeNode);
  }

  destroy() {
    this.clear();
  }
}
