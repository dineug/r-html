import { Observable } from 'rxjs';

import {
  defineCustomElement,
  FC,
  html,
  observable,
  pug,
  render,
} from '@/index';

const Test: FC<{ count: number }> = (
  props,
  { emotion: { css }, dispatchEvent }
) => {
  const aStyles = css`
    display: flex;
  `;

  const onClick = () => {
    dispatchEvent(new CustomEvent('click', { detail: 1 }));
  };

  return () =>
    pug`
      div(class=${aStyles})
        div
          div(@click=${onClick}) ${props.count} ${props.children}
    `;
};

const MyTest: FC<{}, HTMLElement> = (props, { emotion: { css } }) => {
  const state = observable({ count: 0, foo: 'test' });

  const aStyles = css`
    display: flex;
  `;

  const onClick = (event: Event) => {
    console.log('onClick', event);
  };

  const onClick$ = (event$: Observable<Event>) =>
    event$.subscribe(event => console.log('onClick$', event));

  setInterval(() => {
    state.count++;
  }, 1000);

  return () => html`
    <div foo="${state.count}" bar=${state.count}></div>
    <div ?foo=${true}></div>
    <!-- 주석처리 -->
    <div id="test" class="editor foo" click$=${() => {}}></div>
    <div .foo=${state.count}>
      <span>
        test${state.count}
        <span>test${state.count}</span>
      </span>
    </div>
    <div @click=${() => {}}></div>
    <hr class="test" class=${aStyles} />
    <${Test} .count=${state.count} @click=${onClick} click$=${onClick$}>
      <div>FC child ${state.count}</div>
    <//>
  `;
};

defineCustomElement('my-test', {
  render: MyTest,
});

const app = () => html`<my-test />`;

render(document.body, app());
