export const PREFIX_ON_EVENT = 'on';
export const PREFIX_EVENT = '@';
export const SUFFIX_RX_EVENT = '$';
export const PREFIX_PROPERTY = '.';
export const PREFIX_BOOLEAN = '?';
const PREFIX_SPREAD = '...';
const PREFIX_MARKER = 'r-html';
const SUFFIX_MARKER = Math.random().toString().substring(2, 8);

export const MARKER = `${PREFIX_MARKER}-${SUFFIX_MARKER}`;
export const SPREAD_MARKER = `${PREFIX_SPREAD}${MARKER}`;

export const markersRegexp = new RegExp(`${MARKER}_(\\d+)`, 'g');
export const markerOnlyRegexp = new RegExp(`^${MARKER}_\\d+$`);
export const nextLineRegexp = /^\n/;

export enum TAttrType {
  attribute = 'attribute',
  boolean = 'boolean',
  event = 'event',
  rxEvent = 'rxEvent',
  property = 'property',
  spread = 'spread',
  directive = 'directive',
}

export const BEFORE_MOUNT = Symbol('beforeMount');
export const MOUNTED = Symbol('mounted');
export const UNMOUNTED = Symbol('unmounted');
export const BEFORE_FIRST_UPDATE = Symbol('beforeFirstUpdate');
export const BEFORE_UPDATE = Symbol('beforeUpdate');
export const FIRST_UPDATED = Symbol('firstUpdated');
export const UPDATED = Symbol('updated');

export const LIFECYCLE_NAMES: LifecycleName[] = [
  BEFORE_MOUNT,
  MOUNTED,
  UNMOUNTED,
  BEFORE_FIRST_UPDATE,
  BEFORE_UPDATE,
  FIRST_UPDATED,
  UPDATED,
];

export type LifecycleName =
  | typeof BEFORE_MOUNT
  | typeof MOUNTED
  | typeof UNMOUNTED
  | typeof BEFORE_FIRST_UPDATE
  | typeof FIRST_UPDATED
  | typeof BEFORE_UPDATE
  | typeof UPDATED;
