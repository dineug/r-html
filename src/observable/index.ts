import { Observable, Subject } from 'rxjs';

import { safeCallback } from '@/helpers/fn';
import { isArray, isObject } from '@/helpers/is-type';
import { effect, watchEffect } from '@/observable/scheduler';

export type PropName = string | number | symbol;
export type Observer = () => void;
export type Unsubscribe = () => void;
export type ObservableOptions = {
  shallow: boolean;
};

interface Trigger {
  raw: any;
  keys: PropName[];
}

export const rawToProxy = new WeakMap();
export const rawToObservers = new WeakMap<object, Array<Observer>>();
const proxyToRaw = new WeakMap();
export const proxyToSubject = new WeakMap<object, Subject<PropName>>();
export const observerToTriggers = new WeakMap<Observer, Array<Trigger>>();

const defaultObservableOptions: ObservableOptions = { shallow: false };

let currentObserver: Observer | null = null;

export function observer(f: Observer): Unsubscribe {
  currentObserver = f;
  safeCallback(f);
  currentObserver = null;

  return () => unobserve(f);
}

export function unobserve(observer: Observer) {
  const triggers = observerToTriggers.get(observer);

  triggers?.forEach(({ raw }) => {
    const observers = rawToObservers.get(raw);

    observers &&
      observers.includes(observer) &&
      observers.splice(observers.indexOf(observer), 1);
  });

  triggers && observerToTriggers.delete(observer);
}

function addObserver(raw: any) {
  if (!currentObserver) return;

  const observers = rawToObservers.get(raw);

  if (!observers) {
    rawToObservers.set(raw, [currentObserver]);
  } else if (!observers.includes(currentObserver)) {
    observers.push(currentObserver);
  }
}

function addTrigger(raw: any, p: PropName) {
  if (!currentObserver) return;

  const triggers = observerToTriggers.get(currentObserver);

  if (triggers) {
    const trigger = triggers.find(trigger => trigger.raw === raw);

    if (!trigger) {
      triggers.push({ raw, keys: [p] });
    } else if (!trigger.keys.includes(p)) {
      trigger.keys.push(p);
    }
  } else {
    observerToTriggers.set(currentObserver, [{ raw, keys: [p] }]);
  }
}

const exclude = (value: any) =>
  value instanceof Node ||
  value instanceof Map ||
  value instanceof Set ||
  value instanceof WeakMap ||
  value instanceof WeakSet ||
  value instanceof RegExp ||
  value instanceof Date ||
  value instanceof Promise;

export function observable<T>(
  raw: T,
  options: Partial<ObservableOptions> = {}
): T {
  const { shallow } = Object.assign({}, defaultObservableOptions, options);
  const proxy = new Proxy(raw as any, {
    get(target, p, receiver) {
      const value = Reflect.get(target, p, receiver);
      if (exclude(value)) return value;

      addObserver(raw);
      addTrigger(raw, p);

      if (!shallow && isObject(value) && !proxyToRaw.has(value)) {
        return rawToProxy.has(value)
          ? rawToProxy.get(value)
          : observable(value, options);
      }

      return value;
    },
    set(target, p, value, receiver) {
      const oldValue = Reflect.get(target, p, receiver);
      const res = Reflect.set(target, p, value, receiver);
      const isEffect =
        !isArray(target) && oldValue !== value ? true : p === 'length';

      if (isEffect) {
        effect(target, p);
        watchEffect(target, p);
      }

      return res;
    },
  });

  rawToProxy.set(raw as any, proxy);
  proxyToRaw.set(proxy, raw);

  return proxy;
}

export function watch(proxy: any): Observable<PropName> {
  const subject =
    proxyToSubject.get(proxy) ??
    (proxyToSubject
      .set(proxy, new Subject<PropName>())
      .get(proxy) as Subject<PropName>);

  return subject.asObservable();
}
