import { createNodeDirective } from '@/render/directives/nodeDirective';
import {
  insertAfterNode,
  insertBeforeNode,
  rangeNodes,
  removeNode,
} from '@/render/helper';
import { Part } from '@/render/part';
import { Action, difference } from '@/render/part/node/text/arrayDiff';
import {
  createPart,
  getPartType,
  PartType,
} from '@/render/part/node/text/helper';

type RepeatFn = <T>(
  list: T[],
  getKey: (value: T) => any,
  getResult: (value: T, index: number, array: T[]) => any
) => [T[], (value: T) => any, (value: T, index: number, array: T[]) => any];

export const repeat = createNodeDirective<RepeatFn>(
  <T>(
    list: T[],
    getKey: (value: T) => any,
    getResult: (value: T, index: number, array: T[]) => any
  ) => {
    list.length; // observable dependency
    return [list, getKey, getResult];
  },
  ({ startNode, endNode }) => {
    let parts: ItemPart[] = [];

    const destroy = () => {
      parts.forEach(part => part.destroy());
    };

    return ([list, getKey, getResult]) => {
      const values = list.map((value, index, array) => ({
        key: getKey(value),
        value: getResult(value, index, array),
      }));
      const diff = difference(
        parts.map(({ type, key }) => ({ type, key })),
        values.map(({ key, value }) => ({ type: getPartType(value), key }))
      );
      const arrayLike: any = { length: values.length };

      diff.update.forEach(({ action, from, to }) => {
        switch (action) {
          case Action.create:
            const node = document.createComment('');

            to === 0
              ? insertAfterNode(node, startNode)
              : parts.length
              ? insertAfterNode(
                  node,
                  arrayLike[to - 1]
                    ? arrayLike[to - 1].endNode
                    : parts[to - 1].endNode
                )
              : insertBeforeNode(node, endNode);

            arrayLike[to] = new ItemPart(
              node,
              values[to].value,
              values[to].key
            );
            break;
          case Action.move:
            arrayLike[to] = parts[from];
            if (to === from) return;

            to === 0
              ? parts[from].insert('after', startNode)
              : parts[from].insert(
                  'after',
                  arrayLike[to - 1]
                    ? arrayLike[to - 1].endNode
                    : parts[to - 1].endNode
                );
            break;
        }
      });
      diff.delete.forEach(({ from }) => parts[from].destroy());

      parts = Array.from(arrayLike);
      parts.forEach((part, index) => part.commit(values[index].value));

      return destroy;
    };
  }
) as unknown as RepeatFn;

class ItemPart implements Part {
  #part: Part;
  startNode = document.createComment('');
  endNode = document.createComment('');
  type: PartType;
  key: any;

  constructor(node: Node, value: any, key: any) {
    insertBeforeNode(this.startNode, node);
    insertAfterNode(this.endNode, node);
    removeNode(node);
    this.key = key;
    this.type = getPartType(value);
    this.#part = createPart(this.type, this.startNode, this.endNode);
  }

  commit(value: any) {
    this.#part.commit(value);
  }

  insert(position: 'before' | 'after', refChild: Node) {
    const nodes = [
      this.startNode,
      ...rangeNodes(this.startNode, this.endNode),
      this.endNode,
    ];

    position === 'before'
      ? nodes.forEach(node => insertBeforeNode(node, refChild))
      : nodes.reverse().forEach(node => insertAfterNode(node, refChild));
  }

  destroy() {
    this.#part.destroy?.();
    rangeNodes(this.startNode, this.endNode).forEach(removeNode);
    this.startNode.remove();
    this.endNode.remove();
  }
}
