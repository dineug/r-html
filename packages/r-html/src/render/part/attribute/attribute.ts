import { isNull, isPrimitive, isUndefined } from '@/helpers/is-type';
import { equalValues } from '@/render/helper';
import { Part } from '@/render/part';
import { getMarkers, MarkerTuple } from '@/template/helper';
import { TAttr } from '@/template/tNode';

export class AttributePart implements Part {
  #node: Element;
  #attrName: TAttr['name'];
  #attrValue: TAttr['value'];
  #markerTuples: Array<MarkerTuple> = [];
  #values: any[] = [];

  constructor(node: Element, { name, value }: TAttr) {
    this.#node = node;
    this.#attrName = name;
    this.#attrValue = value;
    this.#markerTuples = getMarkers(value ?? '');
  }

  commit(values: any[]) {
    const newValues = this.#markerTuples.map(([_, index]) => values[index]);
    if (equalValues(this.#values, newValues)) return;

    const value = newValues.reduce<string>(
      (acc, cur, i) =>
        acc.replace(
          new RegExp(this.#markerTuples[i][0]),
          isPrimitive(cur) && !isNull(cur) && !isUndefined(cur)
            ? String(cur)
            : ''
        ),
      this.#attrValue ?? ''
    );

    this.#node.setAttribute(this.#attrName, value.trim());
    this.#values = newValues;
  }
}
