export type Context<T> = {
  key: string | symbol;
  value: T;
};

export function createContext<T>(key: string | symbol, value: T): Context<T> {
  return Object.freeze({ key, value });
}

export const contextSubscribe = '@@r-html/context-subscribe' as const;
export const contextUnsubscribe = '@@r-html/context-unsubscribe' as const;

export type ContextEventDetail<T = any> = {
  context: Context<T>;
  observer: (value: T) => void;
};
