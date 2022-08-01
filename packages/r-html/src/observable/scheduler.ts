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
}

const queue: Task[] = [];
const watchQueue = new Map<any, Array<PropName>>();
const idleOptions = { timeout: 16 };

let executable = true;

function isTrigger(raw: any, p: PropName, observer: Observer) {
  const triggers = observerToTriggers.get(observer);

  return triggers
    ? triggers.some(trigger => trigger.raw === raw && trigger.keys.includes(p))
    : false;
}

const isQueue = (f: Observer | VoidFunction) =>
  Boolean(queue.find(({ fn }) => fn === f));

const createNextTick = (type: Task['type']) => (fn: VoidFunction) => {
  isQueue(fn) || queue.push({ type, fn });

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
  if (!task) return false;

  if (task.type === 'observer') {
    unobserve(task.fn);
    observer(task.fn);
  } else if (task.type === 'nextTick') {
    safeCallback(task.fn);
  }

  return true;
}

function executeIdle() {
  const run = (deadline: IdleDeadline) => {
    do {
      runTask();
    } while (queue.length && deadline.timeRemaining() > 0);

    if (queue.length) {
      window.requestIdleCallback(run, idleOptions);
    } else {
      executable = true;
    }
  };

  window.requestIdleCallback(run, idleOptions);
}

function executeAsap() {
  while (queue.length) {
    runTask();
  }
  executable = true;
}

function execute() {
  const exec = 'requestIdleCallback' in window ? executeIdle : executeAsap;
  exec();
}

export function watchEffect(raw: any, p: PropName) {
  const proxy = rawToProxy.get(raw);
  if (!proxy) return;
  const subject = proxyToSubject.get(proxy);
  if (!subject) return;
  const trigger = watchQueue.get(proxy);

  if (!trigger) {
    watchQueue.set(proxy, [p]);

    nextTick(() => {
      const trigger = watchQueue.get(proxy);
      if (!trigger) return;

      watchQueue.delete(proxy);
      trigger.forEach(propName => subject.next(propName));
    });
  } else if (!trigger.includes(p)) {
    trigger.push(p);
  }
}
