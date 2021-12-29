import { closestElement } from '@/component/webComponent/helper';

export interface ProviderElement<T> extends HTMLElement {
  value: T;
}

export function getContext<T = any>(selector: string, el: Element): T {
  const provider = closestElement(selector, el) as ProviderElement<T> | null;
  if (!provider) throw new Error(`Not Found ProviderElement "${selector}"`);
  return provider.value;
}
