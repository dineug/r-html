import createEmotion, { Emotion } from '@emotion/css/create-instance';
import { camelCase, kebabCase } from 'lodash-es';
import { Observable } from 'rxjs';

import { Context, Props } from '@/component';
import { isSheet, isStyle } from '@/component/webComponent/styleSheets';
import { isArray, isFunction, isObject, isUndefined } from '@/helpers/is-type';
import { observable, observer } from '@/observable';
import { render } from '@/render';
import { TemplateLiterals } from '@/template';
import { html } from '@/template/html';

export type Callback = () => void;
export type Template = () =>
  | TemplateLiterals
  | PrimitiveType
  | void
  | Promise<any>
  | Observable<any>
  | Node;
export type PrimitiveType =
  | string
  | number
  | boolean
  | null
  | undefined
  | void
  | bigint
  | symbol;
export type Convert = (value: string | null) => PrimitiveType;
export type FunctionalComponent<P = {}, C = {}> = (
  this: Context<C>,
  props: Props<P>,
  ctx: Context<C>
) => Template;
export type FC<P = {}, C = {}> = FunctionalComponent<P, C>;

export interface PropOptions {
  type?: Convert | typeof String | typeof Number | typeof Boolean;
  default?: PrimitiveType;
}

export interface Options<P = any, C = any> {
  observedProps?:
    | string[]
    | Record<
        string,
        PropOptions | Convert | typeof String | typeof Number | typeof Boolean
      >;
  shadow?: ShadowRootMode | false;
  style?: string;
  styleMap?: Partial<CSSStyleDeclaration>;
  render: FunctionalComponent<P, C>;
}

export const BEFORE_MOUNT = Symbol('beforeMount');
export const MOUNTED = Symbol('mounted');
export const UNMOUNTED = Symbol('unmounted');
export const BEFORE_FIRST_UPDATE = Symbol('beforeFirstUpdate');
export const FIRST_UPDATED = Symbol('firstUpdated');
export const BEFORE_UPDATE = Symbol('beforeUpdate');
export const UPDATED = Symbol('updated');
const UNSUBSCRIBE = Symbol('unsubscribe');
const RENDER_ROOT = Symbol('renderRoot');
const TEMPLATE = Symbol('template');
const STYLE = Symbol('style');
const PROPS = Symbol('props');

export type LifecycleName =
  | typeof BEFORE_MOUNT
  | typeof MOUNTED
  | typeof UNMOUNTED
  | typeof BEFORE_FIRST_UPDATE
  | typeof FIRST_UPDATED
  | typeof BEFORE_UPDATE
  | typeof UPDATED;

interface ComponentLifecycle {
  [BEFORE_MOUNT]: Callback[] | null;
  [MOUNTED]: Callback[] | null;
  [UNMOUNTED]: Callback[] | null;
  [BEFORE_FIRST_UPDATE]: Callback[] | null;
  [FIRST_UPDATED]: Callback[] | null;
  [BEFORE_UPDATE]: Callback[] | null;
  [UPDATED]: Callback[] | null;
}

interface Component extends ComponentLifecycle, Context {
  [UNSUBSCRIBE]: Callback | null;
  [RENDER_ROOT]: ShadowRoot | HTMLElement;
  [TEMPLATE]: Template;
  [STYLE]: HTMLStyleElement | null;
  [PROPS]: any;
}

let currentInstance: ComponentLifecycle | null = null;

export function setCurrentInstance(component: any) {
  currentInstance = component;
}

const createLifecycle = (name: LifecycleName) => (f: Callback) => {
  currentInstance &&
    (currentInstance[name] ?? (currentInstance[name] = [])).push(f);
};

export const onBeforeMount = createLifecycle(BEFORE_MOUNT);
export const onMounted = createLifecycle(MOUNTED);
export const onUnmounted = createLifecycle(UNMOUNTED);
export const onBeforeFirstUpdate = createLifecycle(BEFORE_FIRST_UPDATE);
export const onFirstUpdated = createLifecycle(FIRST_UPDATED);
export const onBeforeUpdate = createLifecycle(BEFORE_UPDATE);
export const onUpdated = createLifecycle(UPDATED);

export function lifecycleHooks(instance: any, name: LifecycleName) {
  const hooks = Reflect.get(instance, name, instance);
  isArray(hooks) && hooks.forEach(hook => hook());
}

const getPropNames = (observedProps: Options['observedProps']): string[] =>
  isArray(observedProps)
    ? observedProps
    : isUndefined(observedProps)
    ? []
    : Object.keys(observedProps);

const getDefaultProps = (
  observedProps: Options['observedProps']
): Array<[string, PrimitiveType]> =>
  isUndefined(observedProps) || isArray(observedProps)
    ? []
    : Object.keys(observedProps)
        .filter(name => {
          const value = observedProps[name];
          return (
            value === Number ||
            value === String ||
            value === Boolean ||
            (isObject<PropOptions>(value) && !isUndefined(value.default))
          );
        })
        .map(name => {
          const value = observedProps[name];
          return isObject<PropOptions>(value)
            ? [name, Reflect.get(value, 'default')]
            : value === Number
            ? [name, 0]
            : value === Boolean
            ? [name, false]
            : [name, ''];
        });

const getPropTypes = (
  observedProps: Options['observedProps']
): Array<[string, Convert | typeof String | typeof Number | typeof Boolean]> =>
  isUndefined(observedProps) || isArray(observedProps)
    ? []
    : Object.keys(observedProps)
        .filter(name => {
          const value = observedProps[name];
          return (
            isFunction(value) ||
            (isObject<PropOptions>(value) && !isUndefined(value.type))
          );
        })
        .map(name => {
          const value = observedProps[name];
          return isObject<PropOptions>(value)
            ? [name, Reflect.get(value, 'type')]
            : [name, value];
        });

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

  const C = class extends HTMLElement implements Component {
    static get observedAttributes() {
      return Array.from(
        new Set([
          ...observedPropNames,
          ...observedPropNames.map(propName => kebabCase(propName)),
        ])
      );
    }

    [BEFORE_MOUNT]: Callback[] | null = null;
    [MOUNTED]: Callback[] | null = null;
    [UNMOUNTED]: Callback[] | null = null;
    [BEFORE_FIRST_UPDATE]: Callback[] | null = null;
    [FIRST_UPDATED]: Callback[] | null = null;
    [BEFORE_UPDATE]: Callback[] | null = null;
    [UPDATED]: Callback[] | null = null;
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
