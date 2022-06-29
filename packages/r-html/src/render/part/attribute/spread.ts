import { isEqual } from 'lodash-es';

import { isObject } from '@/helpers/is-type';
import { Part } from '@/render/part';
import { getMarkers, MarkerTuple } from '@/template/helper';
import { TAttr } from '@/template/node';

export class SpreadPart implements Part {
  #node: any;
  #markerTuple: MarkerTuple;
  #value: any = null;

  constructor(node: any, { name }: TAttr) {
    this.#node = node;
    this.#markerTuple = getMarkers(name)[0];
  }

  commit(values: any[]) {
    const [, index] = this.#markerTuple;
    const newValue = values[index];
    if (!isObject(newValue) || isEqual(this.#value, newValue)) return;

    Object.keys(newValue).forEach(key =>
      Reflect.set(this.#node, key, newValue[key], this.#node)
    );
    this.#value = newValue;
  }
}
