import { FC, html, observable, onUnmounted } from '@dineug/r-html';

export type CounterProps = {
  count: number;
};

const Counter: FC<CounterProps> = (props, ctx) => {
  const state = observable({ count: 0 });

  const timerId = window.setInterval(() => {
    state.count++;
  }, 1000);

  onUnmounted(() => {
    window.clearInterval(timerId);
  });

  return () => html`<div foo=${state.count} bar="a">${props.count}</div>`;
};

export default Counter;
