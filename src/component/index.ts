import { Emotion } from '@emotion/css/create-instance';

export type Props<T = {}> = T & { children?: DocumentFragment };
export type Context<T = {}> = T & {
  host: HTMLElement;
  emotion: Emotion;
  dispatchEvent(event: Event): boolean;
};
