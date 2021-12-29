import { insertBeforeNode, rangeNodes, removeNode } from '@/render/helper';
import { Operator, OperatorCallback, OperatorProps } from '@/render/operator';

export function innerHTML(value: string): OperatorCallback {
  return () => [InnerHTML, [value]];
}

class InnerHTML extends Operator {
  #startNode: Comment;
  #endNode: Comment;
  #value: string | null = null;

  constructor({ startNode, endNode }: OperatorProps) {
    super();
    this.#startNode = startNode;
    this.#endNode = endNode;
  }

  render([value]: Parameters<typeof innerHTML>) {
    if (this.#value === value) return;

    this.clear();
    const template = document.createElement('template');
    template.innerHTML = value;
    insertBeforeNode(template.content, this.#endNode);

    this.#value = value;
  }

  clear() {
    rangeNodes(this.#startNode, this.#endNode).forEach(removeNode);
  }

  destroy() {
    this.clear();
  }
}
