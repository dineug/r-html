import { isEqual } from 'lodash-es';

import { isNull } from '@/helpers/is-type';
import {
  Directive,
  DirectiveCallback,
  DirectiveProps,
} from '@/render/directive';
import { isHTMLElement } from '@/render/helper';

type Conditional = Record<string, any>;

export function classMap(conditional: Conditional): DirectiveCallback {
  return () => [ClassMap, [conditional]];
}

class ClassMap extends Directive {
  #node: any;
  #classList: string[] | null = null;
  #conditional: Conditional = {};

  constructor({ node }: DirectiveProps) {
    super();
    this.#node = node;
  }

  render([conditional]: Parameters<typeof classMap>) {
    if (!isHTMLElement(this.#node) || isEqual(this.#conditional, conditional))
      return;

    const classList = [...this.#node.classList];
    const newClassList = Object.keys(conditional).filter(
      key => conditional[key]
    );

    if (isNull(this.#classList)) {
      this.#classList = classList;
    } else {
      const prevClassList = this.#classList;
      const oldClassList = classList.filter(
        className =>
          !prevClassList.includes(className) &&
          !newClassList.includes(className)
      );

      this.#node.classList.remove(...oldClassList);
    }

    this.#node.classList.add(...newClassList);
    this.#conditional = conditional;
  }
}
