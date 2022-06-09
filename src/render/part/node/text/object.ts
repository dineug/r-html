import { Observable, Subscription } from 'rxjs';

import { isPromise, noop, rangeNodes, removeNode } from '@/render/helper';
import { Part } from '@/render/part';
import {
  createPart,
  getPartType,
  isPart,
} from '@/render/part/node/text/helper';

export class ObjectPart implements Part {
  #startNode: Comment;
  #endNode: Comment;
  #value: any = null;
  #part: Part | null = null;
  #cancel = noop;
  #subscription: Subscription | null = null;

  constructor(startNode: Comment, endNode: Comment) {
    this.#startNode = startNode;
    this.#endNode = endNode;
  }

  commit(value: any) {
    if (this.#value === value) return;

    this.clear();
    if (isPromise(value)) {
      this.promiseCommit(value);
    } else if (isObservable(value)) {
      this.observableCommit(value);
    }
  }

  promiseCommit(promise: Promise<any>) {
    const [newPromise, cancel] = cancelPromise(promise);
    this.#cancel = cancel;

    newPromise.then(value => {
      const type = getPartType(value);
      this.#part = createPart(type, this.#startNode, this.#endNode);
      this.#part?.commit(value);
    });

    this.#value = promise;
  }

  observableCommit(observable: Observable<any>) {
    this.#subscription = observable.subscribe(value => {
      const type = getPartType(value);
      if (!isPart(type, this.#part)) {
        this.partClear();
        this.#part = createPart(type, this.#startNode, this.#endNode);
      }

      this.#part?.commit(value);
    });

    this.#value = observable;
  }

  partClear() {
    this.#part?.destroy?.();
    rangeNodes(this.#startNode, this.#endNode).forEach(removeNode);
  }

  clear() {
    this.#cancel();
    this.#subscription?.unsubscribe();
    this.#part?.destroy?.();
    rangeNodes(this.#startNode, this.#endNode).forEach(removeNode);
    this.#cancel = noop;
    this.#subscription = null;
  }

  destroy() {
    this.clear();
  }
}

function cancelPromise(promise: Promise<any>): [Promise<any>, () => void] {
  let cancelReject = noop;
  const cancelPromise = new Promise((_, reject) => (cancelReject = reject));
  const cancel = () => cancelReject();
  return [Promise.race([cancelPromise, promise]), cancel];
}

function isObservable(value: any): value is Observable<any> {
  return value instanceof Observable;
}
