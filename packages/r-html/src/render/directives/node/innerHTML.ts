import {
  NodeDirective,
  NodeDirectiveCallback,
  NodeDirectiveProps,
} from '@/render/directives/nodeDirective';
import { insertBeforeNode, rangeNodes, removeNode } from '@/render/helper';

export function innerHTML(value: string): NodeDirectiveCallback {
  return () => [InnerHTML, [value]];
}

class InnerHTML extends NodeDirective {
  #startNode: Comment;
  #endNode: Comment;
  #value: string | null = null;

  constructor({ startNode, endNode }: NodeDirectiveProps) {
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
