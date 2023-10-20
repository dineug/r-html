import { asap, safeCallback } from '@/helpers/fn';
import {
  Observer,
  observer,
  observerToTriggers,
  PropName,
  proxyToSubject,
  rawToObservers,
  rawToProxy,
  unobserve,
} from '@/observable';

interface Task {
  type: 'observer' | 'nextTick';
  fn: Observer | VoidFunction;
  tickCount: number;
}

const EXPIRATION_TICK = 1;

const queue: Task[] = [];
const watchQueue = new Map<any, Set<PropName>>();
const idleOptions = { timeout: 16 };

let executable = true;
let tickCount = 0;

function isTrigger(raw: any, p: PropName, observer: Observer) {
  const triggers = observerToTriggers.get(observer);
  if (!triggers) return false;

  const trigger = triggers.get(raw);
  if (!trigger) return false;

  return trigger.has(p);
}

const isQueue = (f: Observer | VoidFunction) =>
  Boolean(queue.find(({ fn }) => fn === f));

const createNextTick = (type: Task['type']) => (fn: VoidFunction) => {
  isQueue(fn) || queue.push({ type, fn, tickCount });

  if (executable) {
    asap(execute);
    executable = false;
  }
};

const observerNextTick = createNextTick('observer');
export const nextTick = createNextTick('nextTick');

export const effect = (raw: any, p: PropName) =>
  rawToObservers
    .get(raw)
    ?.forEach(
      observer => isTrigger(raw, p, observer) && observerNextTick(observer)
    );

function runTask() {
  const task = queue.shift();
  if (!task) return;

  if (task.type === 'observer') {
    unobserve(task.fn);
    observer(task.fn);
  } else if (task.type === 'nextTick') {
    safeCallback(task.fn);
  }

  if (isNextTaskExpires()) {
    runTask();
  }
}

function isNextTaskExpires() {
  const task = queue[0];
  return task ? EXPIRATION_TICK <= tickCount - task.tickCount : false;
}

function executeIdle() {
  const run = (deadline: IdleDeadline) => {
    do {
      runTask();
    } while (queue.length && deadline.timeRemaining() > 0);

    if (queue.length) {
      tickCount++;
      window.requestIdleCallback(run, idleOptions);
    } else {
      executable = true;
      tickCount = 0;
    }
  };

  window.requestIdleCallback(run, idleOptions);
}

function executeAsap() {
  while (queue.length) {
    runTask();
  }
  executable = true;
  tickCount = 0;
}

const isIdle = 'requestIdleCallback' in window;

function execute() {
  const exec = isIdle ? executeIdle : executeAsap;
  exec();
}

export function watchEffect(raw: any, p: PropName) {
  const proxy = rawToProxy.get(raw);
  if (!proxy) return;
  const subject = proxyToSubject.get(proxy);
  if (!subject) return;
  const trigger = watchQueue.get(proxy);

  if (!trigger) {
    watchQueue.set(proxy, new Set([p]));

    nextTick(() => {
      const trigger = watchQueue.get(proxy);
      if (!trigger) return;

      watchQueue.delete(proxy);
      trigger.forEach(propName => subject.next(propName));
    });
  } else if (!trigger.has(p)) {
    trigger.add(p);
  }
}
