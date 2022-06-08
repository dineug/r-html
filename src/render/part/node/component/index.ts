import { insertAfterNode, insertBeforeNode } from '@/render/helper';
import { Part } from '@/render/part';
import { ObservableComponentPart } from '@/render/part/node/component/observableComponent';
import { TNode } from '@/template/node';

export class ComponentPart implements Part {
  #startNode = document.createComment('');
  #endNode = document.createComment('');
  #part: Part;

  constructor(node: Comment, tNode: TNode, parts: Part[]) {
    this.#part = new ObservableComponentPart(
      this.#startNode,
      this.#endNode,
      tNode,
      parts
    );

    insertBeforeNode(this.#startNode, node);
    insertAfterNode(this.#endNode, node);
    node.remove();
  }

  commit(values: any[]) {
    this.#part.commit(values);
  }

  destroy() {
    this.#part.destroy?.();
    this.#startNode.remove();
    this.#endNode.remove();
  }
}
