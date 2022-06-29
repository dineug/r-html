import { getProviderElement } from '@/render/part/node/component/webComponent/helper';

export interface ProviderElement<T> extends HTMLElement {
  value: T;
}

export function getContext<T = any>(selector: string, el: Element): T | null {
  const provider = getProviderElement(
    selector,
    el
  ) as ProviderElement<T> | null;
  return provider?.value ?? null;
}
