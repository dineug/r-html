import { isEqual } from 'lodash-es';

import { isNull } from '@/helpers/is-type';
import {
  AttributeDirective,
  AttributeDirectiveCallback,
  AttributeDirectiveProps,
} from '@/render/directives/attributeDirective';
import { isHTMLElement } from '@/render/helper';

type StyleRecord = Record<string, string>;

export function styleMap(
  styleRecord: Partial<CSSStyleDeclaration>
): AttributeDirectiveCallback {
  return () => [StyleMap, [styleRecord]];
}

class StyleMap extends AttributeDirective {
  #node: any;
  #styleRecord: Partial<CSSStyleDeclaration> = {};
  #origin: StyleRecord | null = null;

  constructor({ node }: AttributeDirectiveProps) {
    super();
    this.#node = node;
  }

  render([styleRecord]: Parameters<typeof styleMap>) {
    if (!isHTMLElement(this.#node) || isEqual(this.#styleRecord, styleRecord))
      return;

    const current = getStyleRecord(this.#node);

    if (isNull(this.#origin)) {
      this.#origin = current;
    } else {
      const prevStyleRecord = this.#origin;

      Object.keys(current)
        .filter((key: any) => !prevStyleRecord[key] && !styleRecord[key])
        .forEach(key => this.#node.style.removeProperty(key));
    }

    Object.keys(styleRecord).forEach((key: any) =>
      this.#node.style.setProperty(key, styleRecord[key] as string)
    );
    this.#styleRecord = styleRecord;
  }
}

function getStyleRecord(el: HTMLElement) {
  const styleRecord: StyleRecord = {};
  for (let i = 0; i < el.style.length; i++) {
    const name = el.style.item(i);
    styleRecord[name] = el.style.getPropertyValue(name);
  }
  return styleRecord;
}
