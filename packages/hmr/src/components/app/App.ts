import { FC, html, observable } from '@dineug/r-html';

import Counter from '@/components/counter/Counter';

import { useStyles } from './App.styles';

export type AppProps = {};

const App: FC<AppProps> = (props, ctx) => {
  const styles = useStyles(ctx.emotion);
  const state = observable({ count: 0 });

  setInterval(() => {
    state.count++;
  }, 1000);

  return () => html`<${Counter} count=${state.count} />`;
};

export default App;
