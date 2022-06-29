import { TAttrType } from '@/constants';
import { AttributePart } from '@/render/part/attribute/attribute';
import { BooleanPart } from '@/render/part/attribute/boolean';
import { DirectivePart } from '@/render/part/attribute/directive';
import { EventPart } from '@/render/part/attribute/event';
import { PropertyPart } from '@/render/part/attribute/property';
import { RxEventPart } from '@/render/part/attribute/rxEvent';
import { SpreadPart } from '@/render/part/attribute/spread';
import { TAttr } from '@/template/node';

export const createAttrPart = (node: Element, attr: TAttr) =>
  attr.type === TAttrType.attribute
    ? new AttributePart(node, attr)
    : attr.type === TAttrType.boolean
    ? new BooleanPart(node, attr)
    : attr.type === TAttrType.event
    ? new EventPart(node, attr)
    : attr.type === TAttrType.rxEvent
    ? new RxEventPart(node, attr)
    : attr.type === TAttrType.property
    ? new PropertyPart(node, attr)
    : attr.type === TAttrType.spread
    ? new SpreadPart(node, attr)
    : new DirectivePart(node, attr);
