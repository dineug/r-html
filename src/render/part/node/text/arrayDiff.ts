import { ItemPart } from '@/render/part/node/text/array';
import { getPartType, PartType } from '@/render/part/node/text/helper';

export enum Action {
  create = 'create',
  move = 'move',
}

interface DiffItem {
  type: PartType;
  key: any;
}

interface Position {
  from: number;
  to: number;
}

interface Diff {
  update: Array<Position & { action: Action }>;
  delete: Array<Pick<Position, 'from'>>;
}

export const partsToDiffItems = (parts: ItemPart[]): DiffItem[] =>
  parts.map(({ type, value }) => ({
    type,
    key: type === PartType.templateLiterals ? value.strings : value,
  }));

export const valuesToDiffItems = (values: any[]): DiffItem[] =>
  values.map(value => {
    const type = getPartType(value);
    return {
      type,
      key: type === PartType.templateLiterals ? value.strings : value,
    };
  });

export function difference(oldItems: DiffItem[], newItems: DiffItem[]) {
  const diff: Diff = {
    update: [],
    delete: [],
  };
  const create: Array<Pick<Position, 'to'>> = [];
  const move: Position[] = [];
  const updateOldItems: DiffItem[] = [];

  oldItems.forEach((oldItem, from) => {
    const to = newItems.findIndex(
      (newItem, to) =>
        oldItem.type === newItem.type &&
        oldItem.key === newItem.key &&
        !move.some(item => item.to === to)
    );
    to === -1 ? updateOldItems.push(oldItem) : move.push({ from, to });
  });

  updateOldItems.forEach(oldItem => {
    const from = oldItems.indexOf(oldItem);
    const toItem = newItems.find(
      (newItem, to) =>
        oldItem.type === newItem.type && !move.some(item => item.to === to)
    );
    toItem
      ? move.push({
          from,
          to: newItems.indexOf(toItem),
        })
      : diff.delete.push({ from });
  });

  newItems
    .filter((_, to) => !move.some(item => item.to === to))
    .forEach(newItem => create.push({ to: newItems.indexOf(newItem) }));

  diff.update = [
    ...create.map(v => ({ action: Action.create, ...v, from: -1 })),
    ...move.map(v => ({ action: Action.move, ...v })),
  ].sort((a, b) => a.to - b.to);

  return diff;
}
