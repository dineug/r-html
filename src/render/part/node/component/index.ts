import {
  cache,
  css,
  cx,
  flush,
  getRegisteredStyles,
  hydrate,
  injectGlobal,
  keyframes,
  merge,
  sheet,
} from '@emotion/css';
import { Emotion } from '@emotion/css/create-instance';

import { Context } from '@/component';
import {
  BEFORE_FIRST_UPDATE,
  BEFORE_MOUNT,
  BEFORE_UPDATE,
  FIRST_UPDATED,
  lifecycleHooks,
  LifecycleName,
  MOUNTED,
  setCurrentInstance,
  UNMOUNTED,
  UPDATED,
} from '@/component/webComponent';
import { isFunction } from '@/helpers/is-type';
import { observable, observer, Unsubscribe } from '@/observable';
import {
  insertAfterNode,
  insertBeforeNode,
  rangeNodes,
  removeNode,
  setProps,
} from '@/render/helper';
import { createTemplate, Part } from '@/render/part';
import { DirectivePart } from '@/render/part/attribute/directive';
import { EventPart } from '@/render/part/attribute/event';
import { RxEventPart } from '@/render/part/attribute/rxEvent';
import { SpreadPart } from '@/render/part/attribute/spread';
import { PropPart } from '@/render/part/node/component/prop';
import {
  getPartType,
  isPartMap,
  partMap,
} from '@/render/part/node/text/helper';
import { getMarkers, MarkerTuple } from '@/template/helper';
import { TAttr, TAttrType, TNode } from '@/template/node';

export class ComponentPart implements Part {
  #startNode = document.createComment('');
  #endNode = document.createComment('');
  #markerTuple: MarkerTuple;
  #tNode: TNode;
  #directiveAttrs: TAttr[] = [];
  #parts: Part[] = [];
  #part: Part | null = null;
  #props = observable<any>({}, { shallow: true });
  #Component: Function | null = null;
  #unsubscribe: Unsubscribe | null = null;
  #eventBus = document.createElement('div');

  constructor(node: Comment, tNode: TNode, parts: Part[]) {
    this.#tNode = tNode;
    this.#markerTuple = getMarkers(tNode.value)[0];

    tNode.staticAttrs &&
      tNode.staticAttrs.forEach(attr => setProps(this.#props, attr));

    tNode.attrs?.forEach(attr => {
      attr.type === TAttrType.directive
        ? this.#directiveAttrs.push(attr)
        : attr.type === TAttrType.spread
        ? parts.push(new SpreadPart(this.#props, attr))
        : attr.type === TAttrType.event
        ? parts.push(new EventPart(this.#eventBus, attr))
        : attr.type === TAttrType.rxEvent
        ? parts.push(new RxEventPart(this.#eventBus, attr))
        : parts.push(new PropPart(this.#props, attr));
    });

    insertBeforeNode(this.#startNode, node);
    insertAfterNode(this.#endNode, node);
    node.remove();
  }

  commit(values: any[]) {
    const [, index] = this.#markerTuple;
    const functionalComponent = values[index];
    if (
      !isFunction(functionalComponent) ||
      this.#Component === functionalComponent
    ) {
      this.#parts.forEach(part => part.commit(values));
      return;
    }

    const ctx: Context = {
      host: document.body,
      emotion: {
        cache,
        css,
        cx,
        flush,
        getRegisteredStyles,
        hydrate,
        injectGlobal,
        keyframes,
        merge,
        sheet,
      },
      dispatchEvent: (event: Event) => this.#eventBus.dispatchEvent(event),
    };

    const rootNode = this.#startNode.getRootNode();
    if (rootNode instanceof ShadowRoot) {
      const host = rootNode.host as HTMLElement;
      const emotion = Reflect.get(host, 'emotion') as Emotion | undefined;
      emotion && (ctx.emotion = emotion);
      ctx.host = host;
    }

    this.clear();
    setCurrentInstance(this);
    const render = functionalComponent.call(ctx, this.#props, ctx);
    setCurrentInstance(null);

    if (this.#directiveAttrs.length) {
      this.#parts.push(
        ...this.#directiveAttrs.map(attr => new DirectivePart(ctx, attr))
      );
    }

    if (this.#tNode.children) {
      const [fragment, parts] = createTemplate(this.#tNode);
      Reflect.set(this.#props, 'children', fragment);
      this.#parts.push(...parts);
    }

    lifecycleHooks(this, BEFORE_MOUNT);

    let isMounted = false;
    this.#unsubscribe = observer(() => {
      const result = render();
      const type = getPartType(result);

      if (!isPartMap[type](this.#part)) {
        this.partClear();
        this.#part = new partMap[type](this.#startNode, this.#endNode);
      }

      lifecycleHooks(this, isMounted ? BEFORE_UPDATE : BEFORE_FIRST_UPDATE);

      this.#part?.commit(result);

      if (isMounted) {
        lifecycleHooks(this, UPDATED);
      } else {
        lifecycleHooks(this, FIRST_UPDATED);
        isMounted = true;
      }
    });

    this.#parts.forEach(part => part.commit(values));
    lifecycleHooks(this, MOUNTED);
    this.#Component = functionalComponent;
  }

  partClear() {
    this.#part?.destroy && this.#part.destroy();
    rangeNodes(this.#startNode, this.#endNode).forEach(removeNode);
  }

  clear() {
    rangeNodes(this.#startNode, this.#endNode).forEach(removeNode);
    lifecycleHooks(this, UNMOUNTED);
    this.#parts.forEach(part => part.destroy && part.destroy());
    this.#unsubscribe?.();
    this.#parts = [];
    this.#unsubscribe = null;
    clearLifecycleHooks(this, BEFORE_MOUNT);
    clearLifecycleHooks(this, BEFORE_UPDATE);
    clearLifecycleHooks(this, BEFORE_FIRST_UPDATE);
    clearLifecycleHooks(this, UPDATED);
    clearLifecycleHooks(this, FIRST_UPDATED);
    clearLifecycleHooks(this, MOUNTED);
    clearLifecycleHooks(this, UNMOUNTED);
  }

  destroy() {
    this.clear();
    this.partClear();
    this.#startNode.remove();
    this.#endNode.remove();
  }
}

function clearLifecycleHooks(instance: ComponentPart, name: LifecycleName) {
  Reflect.set(instance, name, null, instance);
}
