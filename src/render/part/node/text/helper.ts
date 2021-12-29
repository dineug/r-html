import { isArray, isFunction, isPrimitive } from '@/helpers/is-type';
import { isNode } from '@/render/helper';
import { ArrayPart } from '@/render/part/node/text/array';
import { FunctionPart } from '@/render/part/node/text/function';
import { NodePart } from '@/render/part/node/text/node';
import { ObjectPart } from '@/render/part/node/text/object';
import { PrimitivePart } from '@/render/part/node/text/primitive';
import { TemplateLiteralsPart } from '@/render/part/node/text/templateLiterals';
import { isTemplateLiterals } from '@/template/helper';

export enum PartType {
  primitive = 'primitive',
  templateLiterals = 'templateLiterals',
  array = 'array',
  node = 'node',
  object = 'object',
  function = 'function',
}

const createInstanceof = (type: Function) => (value: any) =>
  value instanceof type;
export const isPrimitivePart = createInstanceof(PrimitivePart);
export const isTemplateLiteralsPart = createInstanceof(TemplateLiteralsPart);
export const isArrayPart = createInstanceof(ArrayPart);
export const isNodePart = createInstanceof(NodePart);
export const isObjectPart = createInstanceof(ObjectPart);
export const isFunctionPart = createInstanceof(FunctionPart);

export const getPartType = (value: any): PartType =>
  isPrimitive(value)
    ? PartType.primitive
    : isTemplateLiterals(value)
    ? PartType.templateLiterals
    : isArray(value)
    ? PartType.array
    : isNode(value)
    ? PartType.node
    : isFunction(value)
    ? PartType.function
    : PartType.object;

export const isPartMap: Record<
  PartType,
  ReturnType<typeof createInstanceof>
> = {
  [PartType.primitive]: isPrimitivePart,
  [PartType.templateLiterals]: isTemplateLiteralsPart,
  [PartType.array]: isArrayPart,
  [PartType.node]: isNodePart,
  [PartType.function]: isFunctionPart,
  [PartType.object]: isObjectPart,
};

export const partMap: Record<PartType, any> = {
  [PartType.primitive]: PrimitivePart,
  [PartType.templateLiterals]: TemplateLiteralsPart,
  [PartType.array]: ArrayPart,
  [PartType.node]: NodePart,
  [PartType.function]: FunctionPart,
  [PartType.object]: ObjectPart,
};
