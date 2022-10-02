import { fromEvent, Observable, Subscription } from 'rxjs';

import { isFunction } from '@/helpers/is-type';
import { equalValues } from '@/render/helper';
import { Part } from '@/render/part';
import { getMarkers, MarkerTuple } from '@/template/helper';
import { TAttr } from '@/template/tNode';

export class RxEventPart implements Part {
  #markerTuples: Array<MarkerTuple> = [];
  #values: any[] = [];
  #subscriptions: Subscription[] = [];
  #event$: Observable<Event>;

  constructor(node: Element, { name, value }: TAttr) {
    this.#markerTuples = getMarkers(value ?? '');
    this.#event$ = fromEvent(node, name);
  }

  commit(values: any[]) {
    const newValues = this.#markerTuples
      .map(([_, index]) => values[index])
      .filter(value => isFunction(value));
    if (equalValues(this.#values, newValues)) return;

    this.clear();
    this.#subscriptions.push(
      ...newValues
        .map(handle => handle(this.#event$))
        .filter(value => value instanceof Subscription)
    );

    this.#values = newValues;
  }

  clear() {
    this.#subscriptions.forEach(subscription => subscription.unsubscribe());
    this.#subscriptions = [];
  }

  destroy() {
    this.clear();
  }
}
