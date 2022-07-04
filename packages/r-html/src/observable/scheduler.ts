import { asap, idle, safeCallback } from '@/helpers/fn';
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

let batch = false;

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

  if (!batch) {
    asap(execute);
    batch = true;
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

function execute() {
  const run = (deadline: IdleDeadline) => {
    do {
      const task = queue.shift();
      if (!task) break;

      if (task.type === 'observer') {
        unobserve(task.fn);
        observer(task.fn);
      } else if (task.type === 'nextTick') {
        safeCallback(task.fn);
      }
    } while (queue.length && deadline.timeRemaining() > 0);

    if (queue.length) {
      idle(run, idleOptions);
    } else {
      batch = false;
    }
  };

  idle(run, idleOptions);
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
