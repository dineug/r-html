import {
  Directive,
  DirectiveCallback,
  DirectiveProps,
} from '@/render/directive';

export interface Ref<T = unknown> {
  value: T;
}

export const createRef = <T>(value?: T): Ref<T> => ({ value } as Ref<T>);

export function ref<T>(refObject: Ref<T>): DirectiveCallback {
  return () => [RefDirective, [refObject]];
}

class RefDirective extends Directive {
  #node: any;
  #refObject: Ref<any> | null = null;

  constructor({ node }: DirectiveProps) {
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
