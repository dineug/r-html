type Observer<T> = (value: T) => void;
export type Unsubscribe = () => void;

export type Subject<T> = {
  subscribe: (fn: Observer<T>) => Unsubscribe;
  next: (value: T) => void;
  asReadonly: () => Pick<Subject<T>, 'subscribe'>;
};

export function createSubject<T>(): Subject<T> {
  const observers: Array<Observer<T>> = [];

  const subscribe = (fn: Observer<T>) => {
    observers.includes(fn) || observers.push(fn);

    return () => {
      observers.includes(fn) &&
        observers.splice(
          observers.findIndex(v => v === fn),
          1
        );
    };
  };

  const next = (value: T) => {
    observers.forEach(fn => fn(value));
  };

  const asReadonly = () => ({ subscribe });

  return {
    subscribe,
    next,
    asReadonly,
  };
}
