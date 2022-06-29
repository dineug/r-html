import { Subject } from 'rxjs';

import { isFunction } from '@/helpers/is-type';
import { FC } from '@/render/part/node/component/observableComponent';

const originComponent = new WeakMap<FC, FC>();
const hmrComponent = new WeakMap<FC, FC>();
export const hmrSubject = new Subject<FC>();

let active = false;

export function hmr() {
  active = true;

  window.addEventListener('hmr:r-html', (event: any) => {
    let { origin, module }: any = event?.detail ?? {};

    if (
      origin &&
      module?.default &&
      isFunction(origin) &&
      isFunction(module.default)
    ) {
      if (originComponent.has(origin)) {
        origin = originComponent.get(origin);
      }
      originComponent.set(module.default, origin);

      hmrComponent.set(origin, module.default);
      hmrSubject.next(origin);
    }
  });
}

function hasHmrComponent(value: any) {
  return isFunction(value) && hmrComponent.has(value);
}

export function replaceComponent(values: any[]): any[] {
  return active
    ? values.map(value =>
        hasHmrComponent(value) ? hmrComponent.get(value) : value
      )
    : values;
}
