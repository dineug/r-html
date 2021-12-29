import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { flat } from '@/helpers/array';
import { asap, safeCallback } from '@/helpers/fn';
import { observable } from '@/observable';

export type Action<K extends keyof M, M> = {
  type: K;
  payload: M[K];
  timestamp: number;
};

type RecursionGenerator<T> = Generator<T | RecursionGenerator<T>>;

export type GeneratorActions<K extends keyof M, M> = Array<
  Action<K, M> | RecursionGenerator<Action<K, M>>
>;

export type Reducer<S, K extends keyof M, M, C = {}> = (
  state: S,
  payload: Action<K, M>['payload'],
  ctx: C
) => void;

type ReducerRecord<S, K extends keyof M, M, C> = {
  [P in K]: Reducer<S, P, M, C>;
};

type Options<S, M, C> = {
  context: C;
  state: S;
  reducers: ReducerRecord<S, keyof M, M, C>;
};

export type Store<S, M, C> = {
  context: C;
  state: S;
  dispatch(...actions: GeneratorActions<keyof M, M>): void;
  dispatchSync(...actions: GeneratorActions<keyof M, M>): void;
  dispatchHistory(...actions: GeneratorActions<keyof M, M>): void;
  beforeDispatch$: Observable<Array<Action<keyof M, M>>>;
  dispatch$: Observable<Array<Action<keyof M, M>>>;
  destroy(): void;
};

export function createAction<K extends keyof M, M>(
  type: K,
  payload: Action<K, M>['payload']
): Action<K, M> {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}

export const notEmptyActions = filter(<M>(actions: Array<Action<keyof M, M>>) =>
  Boolean(actions.length)
);

export function createStore<S, M, C = {}>({
  context,
  state: initialState,
  reducers,
}: Options<S, M, C>): Store<S, M, C> {
  const state = observable(initialState);
  const beforeDispatch$ = new Subject<Array<Action<keyof M, M>>>();
  const dispatch$ = new Subject<Array<Action<keyof M, M>>>();

  const runReducer = (action: Action<keyof M, M>) => {
    const reducer = reducers[action.type];
    safeCallback(reducer as any, state, action.payload, context);
  };

  const dispatchSync = (...generatorActions: GeneratorActions<keyof M, M>) => {
    const actions = [...flat<Action<keyof M, M>>(generatorActions)];
    beforeDispatch$.next(actions);
    actions.forEach(runReducer);
    dispatch$.next(actions);
  };

  const dispatch = (...generatorActions: GeneratorActions<keyof M, M>) => {
    asap(() => dispatchSync(...generatorActions));
  };

  const dispatchHistory = (
    ...generatorActions: GeneratorActions<keyof M, M>
  ) => {
    asap(() => {
      const actions = [...flat<Action<keyof M, M>>(generatorActions)];
      actions.forEach(runReducer);
      dispatch$.next(actions);
    });
  };

  const destroy = () => {
    beforeDispatch$.unsubscribe();
    dispatch$.unsubscribe();
  };

  return {
    context,
    state,
    dispatch,
    dispatchSync,
    dispatchHistory,
    beforeDispatch$: beforeDispatch$.pipe(notEmptyActions),
    dispatch$: dispatch$.pipe(notEmptyActions),
    destroy,
  };
}
