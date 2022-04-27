import {
  MARKER,
  markerOnlyRegexp,
  markersRegexp,
  nextLineRegexp,
  PREFIX_BOOLEAN,
  PREFIX_EVENT,
  PREFIX_ON_EVENT,
  PREFIX_PROPERTY,
  SPREAD_MARKER,
  SUFFIX_RX_EVENT,
} from '@/constants';
import { groupBy } from '@/helpers/array';
import { isArray } from '@/helpers/is-type';
import { VAttr, VNode, VNodeType } from '@/parser/node';
import { TemplateLiterals, TemplateLiteralsType } from '@/template';
import { TAttr, TAttrType, TNode } from '@/template/node';

type AttrsTuple = [Array<TAttr>, Array<TAttr>];
export type MarkerTuple = [string, number];

const svgTypes = [TemplateLiteralsType.svg];

export const createMarker = (index: number) => `${MARKER}_${index}`;

export const isTemplateStringsArray = (
  value: any
): value is TemplateStringsArray =>
  isArray(value) && isArray((value as any).raw);

export const isTemplateLiterals = (value: any): value is TemplateLiterals =>
  value && isTemplateStringsArray(value.strings) && isArray(value.values);

const createIsMarker =
  (marker: string, prefix = true, suffix = false) =>
  (value?: string | null): value is string => {
    if (prefix) return Boolean(value?.trimStart().startsWith(marker));
    if (suffix) return Boolean(value?.trimEnd().endsWith(marker));
    const regexp = new RegExp(marker);
    return regexp.test(value ?? '');
  };

export const isPrefixSpreadMarker = createIsMarker(SPREAD_MARKER);
export const isPrefixPropertyMarker = createIsMarker(PREFIX_PROPERTY);
export const isPrefixBooleanMarker = createIsMarker(PREFIX_BOOLEAN);
export const isPrefixEventMarker = createIsMarker(PREFIX_EVENT);
export const isPrefixOnEventMarker = createIsMarker(PREFIX_ON_EVENT);
export const isSuffixRxEventMarker = createIsMarker(
  SUFFIX_RX_EVENT,
  false,
  true
);
export const isMarker = createIsMarker(MARKER, false);
export const isMarkerOnly = (value?: string | null) =>
  isMarker(value) && markerOnlyRegexp.test(value?.trim() ?? '');
export const isPartAttr = ({ type, value }: TAttr) =>
  type === TAttrType.spread || type === TAttrType.directive || isMarker(value);
export const isSVG = (type: TemplateLiteralsType) => svgTypes.includes(type);

export const getAttrType = (value: string): TAttrType =>
  isMarkerOnly(value)
    ? TAttrType.directive
    : isPrefixSpreadMarker(value)
    ? TAttrType.spread
    : isPrefixPropertyMarker(value)
    ? TAttrType.property
    : isPrefixEventMarker(value) || isPrefixOnEventMarker(value)
    ? TAttrType.event
    : isSuffixRxEventMarker(value)
    ? TAttrType.rxEvent
    : isPrefixBooleanMarker(value)
    ? TAttrType.boolean
    : TAttrType.attribute;

export const getAttrName = (value: string) =>
  isPrefixSpreadMarker(value)
    ? value.substring(3)
    : isMarkerOnly(value)
    ? value
    : isPrefixPropertyMarker(value) ||
      isPrefixEventMarker(value) ||
      isPrefixBooleanMarker(value)
    ? (value as string).substring(1)
    : isSuffixRxEventMarker(value)
    ? (value as string).substring(0, (value as string).length - 1)
    : isPrefixOnEventMarker(value)
    ? (value as string).substring(2)
    : value;

export function getMarkers(value: string): MarkerTuple[] {
  const markers: MarkerTuple[] = [];
  let match = markersRegexp.exec(value);

  while (match) {
    const index = Number(match[1]);
    markers.push([match[0], Number.isInteger(index) ? index : -1]);
    match = markersRegexp.exec(value);
  }

  return markers;
}

export function createAttrsTuple(attrs: VAttr[] = []): AttrsTuple {
  const groupMap = groupBy(attrs, attr => getAttrName(attr.name));
  return Object.keys(groupMap)
    .map(k => groupMap[k])
    .reduce<AttrsTuple>(
      (acc, attrGroup) => {
        const [staticAttrs, partAttrs] = acc;
        const lastAttr = attrGroup[attrGroup.length - 1];
        const type = getAttrType(lastAttr.name);

        if (type === TAttrType.event || type === TAttrType.rxEvent) {
          partAttrs.push(
            ...attrGroup
              .filter(attr => Boolean(attr.value))
              .map(attr => ({
                type: getAttrType(attr.name),
                name: getAttrName(attr.name),
                value: attr.value,
              }))
          );
        } else if (type === TAttrType.attribute) {
          const value = attrGroup
            .filter(attr => Boolean(attr.value))
            .map(attr => attr.value)
            .join(' ');
          const newAttr: TAttr = { type, name: getAttrName(lastAttr.name) };
          value && (newAttr.value = value);

          isPartAttr(newAttr)
            ? partAttrs.push(newAttr)
            : staticAttrs.push(newAttr);
        } else {
          const newAttr: TAttr = { type, name: getAttrName(lastAttr.name) };
          lastAttr.value && (newAttr.value = lastAttr.value);

          isPartAttr(newAttr)
            ? partAttrs.push(newAttr)
            : staticAttrs.push(newAttr);
        }

        return acc;
      },
      [[], []]
    );
}

export function splitTextNode(node: TNode) {
  const markers = getMarkers(node.value);

  node.value
    .replace(markersRegexp, MARKER)
    .split(MARKER)
    .reduce<Array<TNode>>((acc, value, i) => {
      i < markers.length
        ? acc.push(
            new TNode(new VNode({ type: VNodeType.text, value }), node.parent),
            new TNode(
              new VNode({ type: VNodeType.text, value: markers[i][0] }),
              node.parent
            )
          )
        : acc.push(
            new TNode(new VNode({ type: VNodeType.text, value }), node.parent)
          );
      return acc;
    }, [])
    .filter(
      node =>
        node.value !== '' &&
        !(!node.value.trim() && nextLineRegexp.test(node.value))
    )
    .reverse()
    .forEach((textNode, index, { length }) =>
      index === length - 1
        ? (node.value = textNode.value)
        : node.parent && node.parent.insert('after', textNode, node)
    );
}
