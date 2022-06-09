import {
  NodeDirective,
  NodeDirectiveCallback,
  NodeDirectiveProps,
} from '@/render/directives/nodeDirective';
import { insertBeforeNode, rangeNodes, removeNode } from '@/render/helper';
import { Part } from '@/render/part';
import { createPart, getPartType } from '@/render/part/node/text/helper';
import { isTemplateLiterals } from '@/template/helper';

interface CachePart {
  part: Part;
  fragment: DocumentFragment;
}

export function cache(value: any): NodeDirectiveCallback {
  return () => [Cache, [value]];
}

class Cache extends NodeDirective {
  #startNode: Comment;
  #endNode: Comment;
  #cache = new Map<any, CachePart>();
  #value: any = null;

  constructor({ startNode, endNode }: NodeDirectiveProps) {
    super();
    this.#startNode = startNode;
    this.#endNode = endNode;
  }

  getKey(value: any) {
    return isTemplateLiterals(value) ? value.strings : value;
  }

  getPart(value: any): CachePart | null {
    const key = this.getKey(value);
    return this.#cache.has(key) ? (this.#cache.get(key) as CachePart) : null;
  }

  setPart(value: any, cachePart: CachePart) {
    this.#cache.set(this.getKey(value), cachePart);
  }

  createPart(value: any): CachePart {
    const type = getPartType(value);
    const part = createPart(type, this.#startNode, this.#endNode);
    const template = document.createElement('template');
    return {
      part,
      fragment: template.content,
    };
  }

  render([value]: Parameters<typeof cache>) {
    const currentCachePart = this.getPart(this.#value);
    const oldCachePart = this.getPart(value);

    if (currentCachePart && this.getKey(this.#value) !== this.getKey(value)) {
      rangeNodes(this.#startNode, this.#endNode).forEach(node =>
        currentCachePart.fragment.appendChild(node)
      );
    }

    if (oldCachePart) {
      if (this.getKey(this.#value) !== this.getKey(value)) {
        insertBeforeNode(oldCachePart.fragment, this.#endNode);
      }
      oldCachePart.part.commit(value);
    } else {
      const newCachePart = this.createPart(value);
      this.setPart(value, newCachePart);
      newCachePart.part.commit(value);
    }

    this.#value = value;
  }

  destroy() {
    this.#cache.forEach(({ part }) => part.destroy?.());
    this.#cache = new Map();
    rangeNodes(this.#startNode, this.#endNode).forEach(removeNode);
  }
}
