import { FC, html, observable } from '@dineug/r-html';

import Counter from '@/components/counter/Counter';

export type AppProps = {};

const App: FC<AppProps> = (props, ctx) => {
  const state = observable({ count: 0 });

  setInterval(() => {
    state.count++;
  }, 1000);

  return () => html`<${Counter} count=${state.count} />`;
};

export default App;
