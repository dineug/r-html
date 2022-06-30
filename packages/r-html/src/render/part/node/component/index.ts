import { Subscription } from 'rxjs';

import { insertAfterNode, insertBeforeNode } from '@/render/helper';
import { hmr$, replaceComponent } from '@/render/hmr';
import { Part } from '@/render/part';
import { ObservableComponentPart } from '@/render/part/node/component/observableComponent';
import { TNode } from '@/template/node';

export class ComponentPart implements Part {
  #startNode = document.createComment('');
  #endNode = document.createComment('');
  #part: Part;
  #prevValues: any[] = [];
  #hmrSubscription: Subscription | null = null;

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

    this.hmr();
  }

  commit(values: any[]) {
    const newValues = replaceComponent(values);
    this.#part.commit(newValues);
    this.#prevValues = values;
  }

  hmr() {
    this.#hmrSubscription = hmr$.subscribe(
      value => this.#prevValues.includes(value) && this.commit(this.#prevValues)
    );
  }

  destroy() {
    this.#hmrSubscription?.unsubscribe();
    this.#part.destroy?.();
    this.#startNode.remove();
    this.#endNode.remove();
  }
}
