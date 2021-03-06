import { put, select, takeEvery } from 'redux-saga/effects';
import { Observable } from 'rxjs';

import {
  AnyAction,
  createAction,
  createSaga,
  createStore,
  defineCustomElement,
  FC,
  html,
  observable,
  observer,
  Reducer,
  render,
  SagaRootState,
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
    html`
      <div class=${aStyles}>
        <div>
          <div @click=${onClick}>${props.count}</div>
        </div>
      </div>
      ${props.children}
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

interface ActionTypeMap {
  increase: {
    num: number;
  };
}

interface ActionTypeSagaMap {
  increaseSaga: void;
}

interface State {
  count: number;
}

interface Context {
  test: string;
}

type SelectRootState = SagaRootState<State, Context>;
type ReducerWithType<T extends keyof ActionTypeMap> = Reducer<
  State,
  T,
  ActionTypeMap,
  Context
>;

const increaseAction = createAction<ActionTypeMap['increase']>('increase');
const increaseSagaAction = createAction('increaseSaga');

const increase: ReducerWithType<'increase'> = (state, payload, ctx) => {
  state.count = payload.num;
};

function* increaseSaga(action: AnyAction<ActionTypeSagaMap['increaseSaga']>) {
  const { state }: SelectRootState = yield select();

  yield put(increaseAction({ num: state.count + 1 }));
}

function* rootSaga() {
  yield takeEvery(increaseSagaAction.type, increaseSaga);
}

const store = createStore<State, ActionTypeMap, Context>({
  context: {
    test: '1',
  },
  state: {
    count: 0,
  },
  reducers: {
    increase,
  },
});

const saga = createSaga(store, rootSaga);

observer(() => {
  console.log(store.state.count);

  setTimeout(() => {
    store.dispatch(increaseSagaAction());
  }, 1000);
});
