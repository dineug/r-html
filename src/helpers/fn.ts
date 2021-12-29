type Callback = (...args: any[]) => any;

export function safeCallback<F extends Callback>(
  callback?: F | void,
  ...args: Parameters<F>
) {
  try {
    callback?.(...args);
  } catch (e) {
    window.console.error(e);
  }
}

const queueMicrotaskFallback = (callback: () => void) => {
  Promise.resolve().then(callback);
};

export const asap = window.queueMicrotask ?? queueMicrotaskFallback;

const requestIdleCallbackFallback = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number => {
  const start = Date.now();
  return window.setTimeout(
    () =>
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      }),
    options?.timeout ?? 1
  );
};

export const idle = window.requestIdleCallback ?? requestIdleCallbackFallback;

export const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
