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
