import { createRef } from '@/render/directives/attribute';
import { onBeforeMount, onUnmounted } from '@/render/part/node/component/hooks';
import { Context as Ctx } from '@/render/part/node/component/observableComponent';

import {
  Context,
  ContextEventDetail,
  contextSubscribe,
  contextUnsubscribe,
} from './createContext';

export function useContext<T>(
  ctx: Ctx<HTMLElement> | Ctx<{}>,
  context: Context<T>
) {
  const ref = createRef<T>(context.value);

  const observer = (value: T) => {
    ref.value = value;
  };

  const getTarget = () =>
    ctx instanceof HTMLElement ? ctx : ctx.parentElement ?? ctx.host;

  const subscribe = () => {
    const target = getTarget();

    target.dispatchEvent(
      new CustomEvent<ContextEventDetail<T>>(contextSubscribe, {
        bubbles: true,
        composed: true,
        detail: {
          context,
          observer,
        },
      })
    );
  };

  subscribe();
  onBeforeMount(subscribe);

  onUnmounted(() => {
    const target = getTarget();

    target.dispatchEvent(
      new CustomEvent<ContextEventDetail<T>>(contextUnsubscribe, {
        bubbles: true,
        composed: true,
        detail: {
          context,
          observer,
        },
      })
    );
  });

  return ref;
}
