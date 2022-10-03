import { DIRECTIVE } from '@/constants';
import { isArray, isFunction } from '@/helpers/is-type';
import { DirectiveType } from '@/render/directives';
import {
  AttributeDirective,
  AttributeDirectiveClass,
} from '@/render/directives/attributeDirective';
import { Part } from '@/render/part';
import { getMarkers, MarkerTuple } from '@/template/helper';
import { TAttr } from '@/template/tNode';

const isDirective = (value: any) =>
  Reflect.get(value, DIRECTIVE) === DirectiveType.attribute;

export class DirectivePart implements Part {
  #node: any;
  #markerTuple: MarkerTuple;
  #DirectiveClass: AttributeDirectiveClass | null = null;
  #directive: AttributeDirective | null = null;

  constructor(node: any, { name }: TAttr) {
    this.#node = node;
    this.#markerTuple = getMarkers(name)[0];
  }

  commit(values: any[]) {
    const [, index] = this.#markerTuple;
    const newValue = values[index];
    if (!isFunction(newValue)) return;

    const directiveTuple = newValue();
    if (!isArray(directiveTuple)) return;

    const [DirectiveClass, args] = directiveTuple;
    if (!isFunction(DirectiveClass) || !isArray(args)) return;

    if (this.#DirectiveClass !== DirectiveClass) {
      this.clear();
      const directive = new DirectiveClass({ node: this.#node });

      if (!isDirective(directive)) return;
      this.#directive = directive;
      this.#DirectiveClass = DirectiveClass;
    }

    this.#directive?.render(args);
  }

  clear() {
    this.#directive?.destroy();
  }

  destroy() {
    this.clear();
  }
}
