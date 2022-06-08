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
export type AnyAction<P = any> = {
  type: string;
  payload: P;
  timestamp: number;
};

type RecursionGenerator<T> = Generator<T | RecursionGenerator<T>>;
export type GeneratorActions = Array<AnyAction | RecursionGenerator<AnyAction>>;

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

export type Store<S, C> = {
  context: C;
  state: S;
  dispatch(...actions: GeneratorActions): void;
  dispatchSync(...actions: GeneratorActions): void;
  dispatchHistory(...actions: GeneratorActions): void;
  beforeDispatch$: Observable<Array<AnyAction>>;
  dispatch$: Observable<Array<AnyAction>>;
  destroy(): void;
};

export function createAction<P = void>(type: string) {
  function actionCreator(payload: P): AnyAction<P> {
    return {
      type,
      payload,
      timestamp: Date.now(),
    };
  }

  actionCreator.toString = () => `${type}`;
  actionCreator.type = type;
  return actionCreator;
}

export const notEmptyActions = filter((actions: Array<AnyAction>) =>
  Boolean(actions.length)
);

export function createStore<S, M, C = {}>({
  context,
  state: initialState,
  reducers,
}: Options<S, M, C>): Store<S, C> {
  const state = observable(initialState);
  const beforeDispatch$ = new Subject<Array<AnyAction>>();
  const dispatch$ = new Subject<Array<AnyAction>>();

  const runReducer = (action: AnyAction) => {
    const reducer = Reflect.get(reducers, action.type, reducers);
    safeCallback(reducer as any, state, action.payload, context);
  };

  const dispatchSync = (...generatorActions: GeneratorActions) => {
    const actions = [...flat<AnyAction>(generatorActions)];
    beforeDispatch$.next(actions);
    actions.forEach(runReducer);
    dispatch$.next(actions);
  };

  const dispatch = (...generatorActions: GeneratorActions) => {
    asap(() => dispatchSync(...generatorActions));
  };

  const dispatchHistory = (...generatorActions: GeneratorActions) => {
    asap(() => {
      const actions = [...flat<AnyAction>(generatorActions)];
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
