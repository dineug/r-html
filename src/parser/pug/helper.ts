import { Token, TokenType } from '@/parser/pug/tokenizer';

const createEqual =
  (prop: keyof Token) => (type: string) => (tokens: Token[]) => (pos: number) =>
    tokens[pos] ? tokens[pos][prop] === type : false;

const createTypeEqual = createEqual('type');

export const isParenLeftToken = createTypeEqual(TokenType.parenLeft);
export const isParenRightToken = createTypeEqual(TokenType.parenRight);
export const isSlashToken = createTypeEqual(TokenType.slash);
export const isEqualToken = createTypeEqual(TokenType.equal);
export const isStringToken = createTypeEqual(TokenType.string);
export const isDotToken = createTypeEqual(TokenType.dot);
export const isSharpToken = createTypeEqual(TokenType.sharp);
export const isNextLineToken = createTypeEqual(TokenType.nextLine);
export const isWhiteSpaceToken = createTypeEqual(TokenType.whiteSpace);
export const isTabToken = createTypeEqual(TokenType.tab);

export const isId = (tokens: Token[]) => (pos: number) =>
  isSharpToken(tokens)(pos) && isStringToken(tokens)(pos + 1);

export const isClassName = (tokens: Token[]) => (pos: number) =>
  isDotToken(tokens)(pos) && isStringToken(tokens)(pos + 1);

export const isStartTag = (tokens: Token[]) => (pos: number) =>
  isStringToken(tokens)(pos) ||
  isDotToken(tokens)(pos) ||
  isSharpToken(tokens)(pos);

export const isStartCommentTag = (tokens: Token[]) => (pos: number) =>
  isSlashToken(tokens)(pos) && isSlashToken(tokens)(pos + 1);
