import {
  createRef,
  defineCustomElement,
  FC,
  html,
  innerHTML,
  observable,
  onMounted,
  ref,
  render,
  repeat,
} from '@/index';

const MyTest: FC<{}, HTMLElement> = props => {
  const state = observable({ count: 0 });
  const divRef = createRef<HTMLDivElement>();
  const list: Array<{ name: string }> = [
    { name: 'a' },
    { name: 'b' },
    { name: 'c' },
  ];

  onMounted(() => {
    console.log('divRef', divRef);
  });

  setInterval(() => {
    state.count++;
  }, 1000);

  return () => html`
    <div foo="${state.count}" bar=${state.count}>${state.count}</div>
    <div ${ref(divRef)}>${innerHTML('<span>innerHTML</span>')}</div>
    <div>
      ${repeat(
        list,
        v => v.name,
        v => v.name
      )}
    </div>
  `;
};

defineCustomElement('my-test', {
  render: MyTest,
});

const app = () => html`<my-test />`;

render(document.body, app());
