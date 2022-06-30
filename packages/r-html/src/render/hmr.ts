import { Subject } from 'rxjs';

import { isFunction } from '@/helpers/is-type';
import { FC } from '@/render/part/node/component/observableComponent';

const originComponentCache = new WeakMap<FC, FC>();
const hmrComponentCache = new WeakMap<FC, FC>();
const hmrSubject$ = new Subject<FC>();
export const hmr$ = hmrSubject$.asObservable();

let active = false;

function handler(event: any) {
  let { origin, module }: any = event?.detail ?? {};

  if (
    origin &&
    module?.default &&
    isFunction(origin) &&
    isFunction(module.default)
  ) {
    if (originComponentCache.has(origin)) {
      origin = originComponentCache.get(origin);
    }
    originComponentCache.set(module.default, origin);

    hmrComponentCache.set(origin, module.default);
    hmrSubject$.next(origin);
  }
}

export function hmr() {
  active = true;
  window.addEventListener('hmr:r-html', handler);

  return () => {
    active = false;
    window.removeEventListener('hmr:r-html', handler);
  };
}

const hasHmrComponent = (value: any): boolean =>
  isFunction(value) && hmrComponentCache.has(value);

export const replaceComponent = (values: any[]): any[] =>
  active
    ? values.map(value =>
        hasHmrComponent(value) ? hmrComponentCache.get(value) : value
      )
    : values;
