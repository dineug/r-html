import createEmotion, { Emotion } from '@emotion/css/create-instance';
import { camelCase, kebabCase } from 'lodash-es';

import {
  BEFORE_FIRST_UPDATE,
  BEFORE_MOUNT,
  BEFORE_UPDATE,
  FIRST_UPDATED,
  MOUNTED,
  UNMOUNTED,
  UPDATED,
} from '@/constants';
import { observable, observer } from '@/observable';
import { render } from '@/render';
import {
  Callback,
  lifecycleHooks,
  setCurrentInstance,
} from '@/render/part/node/component/hooks';
import { Template } from '@/render/part/node/component/observableComponent';
import {
  getDefaultProps,
  getPropNames,
  getPropTypes,
  Options,
} from '@/render/part/node/component/webComponent/helper';
import {
  isSheet,
  isStyle,
} from '@/render/part/node/component/webComponent/styleSheets';
import { html } from '@/template/html';

const UNSUBSCRIBE = Symbol('unsubscribe');
const RENDER_ROOT = Symbol('renderRoot');
const TEMPLATE = Symbol('template');
const STYLE = Symbol('style');
const PROPS = Symbol('props');

export function defineCustomElement<P = {}, C = HTMLElement>(
  name: string,
  options: Options<P, C>
) {
  options.shadow ?? (options.shadow = 'open');

  const observedPropNames = getPropNames(options.observedProps);
  const observedPropTypes = getPropTypes(options.observedProps);
  const observedDefaultProps = getDefaultProps(options.observedProps);
  const sheet = isSheet(options) ? new CSSStyleSheet() : null;
  sheet && sheet.replaceSync(options.style || '');

  const C = class extends HTMLElement {
    static get observedAttributes() {
      return Array.from(
        new Set([
          ...observedPropNames,
          ...observedPropNames.map(propName => kebabCase(propName)),
        ])
      );
    }

    [UNSUBSCRIBE]: Callback | null = null;
    [RENDER_ROOT]: ShadowRoot | HTMLElement = this;
    [TEMPLATE]: Template;
    [STYLE]: HTMLStyleElement | null = null;
    [PROPS] = observable<any>({}, { shallow: true });
    emotion: Emotion;
    host: HTMLElement = document.body;

    constructor() {
      super();

      observedDefaultProps.forEach(([name, value]) =>
        Reflect.set(this[PROPS], camelCase(name), value)
      );

      options.shadow &&
        (this[RENDER_ROOT] = this.attachShadow({ mode: options.shadow }));

      this.emotion = createEmotion({
        key: 'r',
        container: this[RENDER_ROOT] as any,
      });

      if (isStyle(options)) {
        const style = document.createElement('style');
        style.textContent = options.style || '';
        this[STYLE] = style;
      }

      sheet && ((this[RENDER_ROOT] as ShadowRoot).adoptedStyleSheets = [sheet]);

      setCurrentInstance(this);
      this[TEMPLATE] = options.render.call(
        this as any,
        this[PROPS],
        this as any
      );
      setCurrentInstance(null);
    }

    connectedCallback() {
      const rootNode = this.getRootNode();
      if (rootNode instanceof ShadowRoot) {
        this.host = rootNode.host as HTMLElement;
      }
      options.styleMap && Object.assign(this.style, options.styleMap);
      lifecycleHooks(this, BEFORE_MOUNT);

      let isMounted = false;
      this[UNSUBSCRIBE] = observer(() => {
        lifecycleHooks(this, isMounted ? BEFORE_UPDATE : BEFORE_FIRST_UPDATE);

        render(
          this[RENDER_ROOT],
          this[STYLE]
            ? html`${this[STYLE]}${this[TEMPLATE]()}`
            : html`${this[TEMPLATE]()}`
        );

        if (isMounted) {
          lifecycleHooks(this, UPDATED);
        } else {
          lifecycleHooks(this, FIRST_UPDATED);
          isMounted = true;
        }
      });

      lifecycleHooks(this, MOUNTED);
    }

    disconnectedCallback() {
      this[UNSUBSCRIBE]?.();
      this[UNSUBSCRIBE] = null;
      lifecycleHooks(this, UNMOUNTED);
    }

    attributeChangedCallback(
      propName: string,
      oldValue: string | null,
      newValue: string | null
    ) {
      const propTypeTuple = observedPropTypes.find(
        ([name]) => camelCase(name) === camelCase(propName)
      );

      propTypeTuple
        ? Reflect.set(
            this[PROPS],
            camelCase(propName),
            propTypeTuple[1] === Boolean
              ? newValue === 'true' || newValue === ''
              : propTypeTuple[1](newValue)
          )
        : Reflect.set(this[PROPS], camelCase(propName), newValue);
    }
  };

  observedPropNames.forEach(propName => {
    Object.defineProperty(C.prototype, propName, {
      get() {
        return Reflect.get(this[PROPS], propName);
      },
      set(value) {
        Reflect.set(this[PROPS], propName, value);
      },
    });
  });

  customElements.define(name, C);
}
