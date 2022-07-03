import { Subject } from 'rxjs';

import { isFunction } from '@/helpers/is-type';
import { Part } from '@/render/part';
import { FC } from '@/render/part/node/component/observableComponent';

const originComponentCache = new WeakMap<FC, FC>();
const hmrComponentCache = new WeakMap<FC, FC>();
const hmrObservableCache = new WeakMap<Part, Array<any>>();
const hmrObservablePrevCache = new WeakMap<Part, Array<any>>();
const hmrSubject$ = new Subject<FC>();
export const hmr$ = hmrSubject$.asObservable();

let active = false;
let hmrInstance: Part | null = null;

function handler(event: any) {
  let { originComponent, newComponent }: any = event?.detail ?? {};

  if (isFunction(originComponent) && isFunction(newComponent)) {
    if (originComponentCache.has(originComponent)) {
      originComponent = originComponentCache.get(originComponent);
    }
    originComponentCache.set(newComponent, originComponent);

    hmrComponentCache.set(originComponent, newComponent);
    hmrSubject$.next(originComponent);
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

export const hotReplaceComponent = (values: any[]): any[] =>
  active
    ? values.map(value =>
        hasHmrComponent(value) ? hmrComponentCache.get(value) : value
      )
    : values;

export function setHmrInstance(component: Part | null) {
  if (!active) return;
  hmrInstance = component;

  if (component !== null) {
    const prevObservableList = hmrObservableCache.get(component);

    if (prevObservableList) {
      hmrObservablePrevCache.set(component, prevObservableList);
      hmrObservableCache.delete(component);
    }
  }
}

export function addHmrObservable(proxy: any) {
  if (!active || !hmrInstance) {
    return;
  }

  const observableList = hmrObservableCache.get(hmrInstance) ?? [];
  if (!observableList.includes(proxy)) {
    observableList.push(proxy);
    hmrObservableCache.set(hmrInstance, observableList);
  }
}

export function hotReloadObservable(component: Part) {
  if (!active) return;

  const prevObservableList = hmrObservablePrevCache.get(component);
  const observableList = hmrObservableCache.get(component);

  if (prevObservableList && observableList) {
    observableList.forEach((observable, index) => {
      const prevObservable = prevObservableList[index];
      if (!prevObservable) return;

      Object.assign(observable, prevObservable);
    });
  }
}
