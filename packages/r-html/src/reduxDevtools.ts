import type { Store } from '@/store';

const key = '__REDUX_DEVTOOLS_EXTENSION__';
type Unsubscribe = () => void;

export function reduxDevtools<S, C>(
  store: Store<S, C>,
  config?: any
): Unsubscribe {
  const reduxDevtoolsExtension = Reflect.get(window, key);
  if (!reduxDevtoolsExtension) return () => {};

  const devTools = reduxDevtoolsExtension.connect(config);
  devTools.init(store.state);

  const subscription = store.dispatch$.subscribe(actions => {
    actions.forEach(action => devTools.send(action, store.state));
  });

  return () => {
    devTools?.unsubscribe();
    subscription.unsubscribe();
  };
}
