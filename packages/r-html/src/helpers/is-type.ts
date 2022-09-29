import type { Observable } from 'rxjs';

type typeofKey =
  | 'bigint'
  | 'boolean'
  | 'function'
  | 'number'
  | 'object'
  | 'string'
  | 'symbol'
  | 'undefined';

const createIsTypeof =
  <T = any>(type: typeofKey) =>
  (value: any): value is T =>
    typeof value === type;

const isObjectRaw = createIsTypeof('object');
export const isBigint = createIsTypeof<bigint>('bigint');
export const isBoolean = createIsTypeof<boolean>('boolean');
export const isFunction = createIsTypeof<Function>('function');
export const isNumber = createIsTypeof<number>('number');
export const isString = createIsTypeof<string>('string');
export const isSymbol = createIsTypeof<symbol>('symbol');
export const isUndefined = createIsTypeof<undefined>('undefined');
export const isNull = (value: any): value is null => value === null;
export const { isArray } = Array;
export const isObject = <T = any>(value: any): value is T =>
  isObjectRaw(value) && !isNull(value) && !isArray(value);

export const isPrimitive = (value: any) =>
  isBigint(value) ||
  isBoolean(value) ||
  isNumber(value) ||
  isString(value) ||
  isSymbol(value) ||
  isUndefined(value) ||
  isNull(value);

export function isObservable(value: any): value is Observable<any> {
  if (!value) {
    return false;
  }

  if (
    typeof Symbol.observable === 'symbol' &&
    typeof value[Symbol.observable] === 'function'
  ) {
    return value === value[Symbol.observable]();
  }

  if (typeof value['@@observable'] === 'function') {
    return value === value['@@observable']();
  }

  return false;
}
