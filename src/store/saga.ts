import { SAGA_ACTION } from '@redux-saga/symbols';
import { runSaga, stdChannel } from 'redux-saga';
import { map } from 'rxjs/operators';

import { Action, notEmptyActions, Store } from '@/store';

export function createSaga<
  SAGA extends (...args: any[]) => Iterator<any>,
  S,
  M,
  C = {}
>(
  { context: ctx, state, dispatchSync, dispatch$ }: Store<S, M, C>,
  saga: SAGA,
  ...args: Parameters<SAGA>
) {
  const channel = stdChannel<Action<keyof M, M>>();
  const sagaIO = {
    channel,
    dispatch(action: Action<keyof M, M>) {
      Reflect.get(action, SAGA_ACTION) && dispatchSync(action);
      channel.put(action);
    },
    getState: () => ({ state, ctx }),
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
