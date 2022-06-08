import {
  AttributeDirective,
  AttributeDirectiveCallback,
  AttributeDirectiveProps,
} from '@/render/directives/attributeDirective';

export interface Ref<T = unknown> {
  value: T;
}

export const createRef = <T>(value?: T): Ref<T> => ({ value } as Ref<T>);

export function ref<T>(refObject: Ref<T>): AttributeDirectiveCallback {
  return () => [RefDirective, [refObject]];
}

class RefDirective extends AttributeDirective {
  #node: any;
  #refObject: Ref<any> | null = null;

  constructor({ node }: AttributeDirectiveProps) {
    super();
    this.#node = node;
  }

  render([refObject]: Parameters<typeof ref>) {
    if (this.#refObject === refObject) return;

    refObject.value = this.#node;
    this.#refObject = refObject;
  }

  destroy() {
    if (this.#refObject) {
      this.#refObject.value = null;
    }
  }
}
