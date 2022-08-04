import { filter, Observable, Subject, Subscription } from 'rxjs';

import { flat } from '@/helpers/array';
import { asap, safeCallback } from '@/helpers/fn';
import { isFunction } from '@/helpers/is-type';
import { observable, Unsubscribe } from '@/observable';

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
type GeneratorActionCreator<T, S = any, C = any> = (
  state: S,
  ctx: C
) => RecursionGenerator<T>;
export type CompositionAction =
  | AnyAction
  | RecursionGenerator<AnyAction>
  | GeneratorActionCreator<AnyAction>;
export type CompositionActions = Array<CompositionAction>;

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

export type DispatchOperator = (
  dispatch$: Observable<Array<AnyAction>>
) => Observable<Array<AnyAction>>;

export type Store<S, C = {}> = {
  context: C;
  state: S;
  dispatch(...compositionActions: CompositionActions): void;
  dispatchSync(...compositionActions: CompositionActions): void;
  dispatch$: Observable<Array<AnyAction>>;
  pipe(...operators: DispatchOperator[]): Unsubscribe;
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
  const beforeDispatchSubject$ = new Subject<Array<AnyAction>>();
  const dispatchSubject$ = new Subject<Array<AnyAction>>();
  const dispatch$ = dispatchSubject$.pipe(notEmptyActions);
  let beforeDispatch$ = beforeDispatchSubject$.asObservable();
  let connectSubscription: Subscription | null = null;

  const connect = () => {
    connectSubscription?.unsubscribe();
    connectSubscription = beforeDispatch$.subscribe(actions =>
      dispatchSubject$.next(actions)
    );
  };

  const runReducer = (action: AnyAction) => {
    const reducer = Reflect.get(reducers, action.type, reducers);
    safeCallback(reducer as any, state, action.payload, context);
  };

  const dispatchSync = (...compositionActions: CompositionActions) => {
    const actions = [
      ...flat<AnyAction>(
        compositionActions.map(action =>
          isFunction(action) ? action(state, context) : action
        )
      ),
    ];
    beforeDispatchSubject$.next(actions);
  };

  const dispatch = (...compositionActions: CompositionActions) => {
    asap(() => dispatchSync(...compositionActions));
  };

  const subscription = dispatch$.subscribe(actions =>
    actions.forEach(runReducer)
  );

  const pipe = (...operators: DispatchOperator[]) => {
    // @ts-ignore
    beforeDispatch$ = beforeDispatchSubject$.pipe(...operators);
    connect();

    return () => {
      beforeDispatch$ = beforeDispatchSubject$.asObservable();
      connect();
    };
  };

  const destroy = () => {
    connectSubscription?.unsubscribe();
    subscription.unsubscribe();
    dispatchSubject$.unsubscribe();
    beforeDispatchSubject$.unsubscribe();
  };

  connect();

  return {
    context,
    state,
    dispatch,
    dispatchSync,
    dispatch$,
    pipe,
    destroy,
  };
}
