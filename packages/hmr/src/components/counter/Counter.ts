import { FC, html } from '@dineug/r-html';

import { useStyles } from './Counter.styles';

export type CounterProps = {
  count: number;
};

const Counter: FC<CounterProps> = (props, ctx) => {
  const styles = useStyles(ctx.emotion);

  return () => html`<div>${props.count}</div>`;
};

export default Counter;
