import { SAGA_ACTION } from '@redux-saga/symbols';
import { runSaga, stdChannel } from 'redux-saga';
import { map } from 'rxjs';

import { AnyAction, notEmptyActions, Store } from '@/store';

export type SagaRootState<S, C> = { state: S; ctx: C };

export function createSaga<
  SAGA extends (...args: any[]) => Iterator<any>,
  S,
  C = {}
>(
  { context: ctx, state, dispatchSync, dispatch$ }: Store<S, C>,
  saga: SAGA,
  ...args: Parameters<SAGA>
) {
  const channel = stdChannel<AnyAction>();
  const sagaIO = {
    channel,
    dispatch(action: AnyAction) {
      Reflect.get(action, SAGA_ACTION) && dispatchSync(action);
      channel.put(action);
    },
    getState: (): SagaRootState<S, C> => ({ state, ctx }),
  };
  const task = runSaga(sagaIO, saga, ...args);

  const subscription = dispatch$
    .pipe(
      map(actions =>
        actions.filter(action => !Reflect.get(action, SAGA_ACTION))
      ),
      notEmptyActions
    )
    .subscribe(actions => actions.forEach(sagaIO.dispatch));

  const destroy = () => {
    subscription.unsubscribe();
    task.cancel();
  };

  return {
    dispatch: sagaIO.dispatch,
    destroy,
  };
}
