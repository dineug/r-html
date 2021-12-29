import {
  insertAfterNode,
  insertBeforeNode,
  rangeNodes,
  removeNode,
} from '@/render/helper';
import { Operator, OperatorCallback, OperatorProps } from '@/render/operator';
import { Part } from '@/render/part';
import { Action, difference } from '@/render/part/node/text/arrayDiff';
import { getPartType, partMap, PartType } from '@/render/part/node/text/helper';

export function repeat<T>(
  list: T[],
  getKey: (value: T) => any,
  getResult: (value: T, index: number, array: T[]) => any
): OperatorCallback {
  list.length; // observable dependency
  return () => [Repeat, [list, getKey, getResult]];
}

class Repeat extends Operator {
  #startNode: Comment;
  #endNode: Comment;
  #parts: ItemPart[] = [];

  constructor({ startNode, endNode }: OperatorProps) {
    super();
    this.#startNode = startNode;
    this.#endNode = endNode;
  }

  render([list, getKey, getResult]: Parameters<typeof repeat>) {
    const values = list.map((value, index, array) => ({
      key: getKey(value),
      value: getResult(value, index, array),
    }));
    const diff = difference(
      this.#parts.map(({ type, key }) => ({ type, key })),
      values.map(({ key, value }) => ({ type: getPartType(value), key }))
    );
    const arrayLike: any = { length: values.length };

    diff.update.forEach(({ action, from, to }) => {
      switch (action) {
        case Action.create:
          const node = document.createComment('');

          to === 0
            ? insertAfterNode(node, this.#startNode)
            : this.#parts.length
            ? insertAfterNode(
                node,
                arrayLike[to - 1]
                  ? arrayLike[to - 1].endNode
                  : this.#parts[to - 1].endNode
              )
            : insertBeforeNode(node, this.#endNode);

          arrayLike[to] = new ItemPart(node, values[to].value, values[to].key);
          break;
        case Action.move:
          arrayLike[to] = this.#parts[from];
          if (to === from) return;

          to === 0
            ? this.#parts[from].insert('after', this.#startNode)
            : this.#parts[from].insert(
                'after',
                arrayLike[to - 1]
                  ? arrayLike[to - 1].endNode
                  : this.#parts[to - 1].endNode
              );
          break;
      }
    });
    diff.delete.forEach(({ from }) => this.#parts[from].destroy());

    this.#parts = Array.from(arrayLike);
    this.#parts.forEach((part, index) => part.commit(values[index].value));
  }

  destroy() {
    this.#parts.forEach(part => part.destroy());
  }
}

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
    this.#part = new partMap[this.type](this.startNode, this.endNode);
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
    this.#part.destroy && this.#part.destroy();
    rangeNodes(this.startNode, this.endNode).forEach(removeNode);
    this.startNode.remove();
    this.endNode.remove();
  }
}
