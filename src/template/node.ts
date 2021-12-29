import { VNode, VNodeType } from '@/parser/node';
import {
  createAttrsTuple,
  isMarker,
  isMarkerOnly,
  splitTextNode,
} from '@/template/helper';

export enum TAttrType {
  attribute = 'attribute',
  boolean = 'boolean',
  event = 'event',
  rxEvent = 'rxEvent',
  property = 'property',
  spread = 'spread',
  directive = 'directive',
}

export interface TAttr {
  type: TAttrType;
  name: string;
  value?: string;
}

export class TNode {
  type: VNodeType = VNodeType.comment;
  value: string = '';
  staticAttrs?: TAttr[];
  attrs?: TAttr[];
  parent: TNode | null = null;
  children?: TNode[];

  get isMarker(): boolean {
    return isMarker(this.value);
  }

  get isMarkerOnly(): boolean {
    return isMarkerOnly(this.value);
  }

  get isSvg(): boolean {
    return this.type === VNodeType.element && /^svg$/i.test(this.value);
  }

  get isComponent(): boolean {
    return this.type === VNodeType.element && this.isMarkerOnly;
  }

  constructor(node: VNode, parent: TNode | null = null) {
    this.type = node.type;
    this.value = node.value;
    this.parent = parent;

    if (node.attrs) {
      const [staticAttrs, partAttrs] = createAttrsTuple(node.attrs);
      staticAttrs.length && (this.staticAttrs = staticAttrs);
      partAttrs.length && (this.attrs = partAttrs);
    }

    node.children &&
      (this.children = node.children.map(child => new TNode(child, this)));
  }

  insert(position: 'before' | 'after', newChild: TNode, refChild: TNode) {
    if (this.children) {
      const pos = position === 'before' ? 0 : 1;
      this.children.includes(refChild) &&
        this.children.splice(
          this.children.indexOf(refChild) + pos,
          0,
          newChild
        );
    } else {
      this.children = [newChild];
    }
  }

  *iterParent(): Generator<TNode, TNode | undefined> {
    yield this;
    if (!this.parent) return;
    yield* this.parent.iterParent();
  }

  *[Symbol.iterator](): Generator<TNode, TNode | undefined> {
    yield this;
    if (!this.children) return;
    for (const node of this.children) {
      yield* node;
    }
  }
}

export function createTNode(vNode: VNode) {
  const tNode = new TNode(vNode);

  for (const node of tNode) {
    if (node.type === VNodeType.text && !isMarkerOnly(node.value)) {
      splitTextNode(node);
    }
  }

  return tNode;
}
