import { addAttr, addChild } from '@/parser/html/helper';
import { VAttr, VNode, VNodeType } from '@/parser/node';
import {
  isClassName,
  isEqualToken,
  isId,
  isNextLineToken,
  isParenLeftToken,
  isParenRightToken,
  isStartCommentTag,
  isStartTag,
  isStringToken,
  isTabToken,
  isWhiteSpaceToken,
} from '@/parser/pug/helper';
import { tokenizer } from '@/parser/pug/tokenizer';

export function parser(tokens: any[]) {
  const ast = new VNode({
    type: VNodeType.element,
    value: 'template',
    children: [],
  });
  let pos = 0;

  const isToken = () => pos < tokens.length;
  const id = isId(tokens);
  const className = isClassName(tokens);
  const startTag = isStartTag(tokens);
  const startCommentTag = isStartCommentTag(tokens);
  const equalToken = isEqualToken(tokens);
  const nextLineToken = isNextLineToken(tokens);
  const parenLeftToken = isParenLeftToken(tokens);
  const parenRightToken = isParenRightToken(tokens);
  const stringToken = isStringToken(tokens);
  const tabToken = isTabToken(tokens);
  const whiteSpaceToken = isWhiteSpaceToken(tokens);

  const prevTabDepth = () => {
    let depth = 0;
    let tempPos = pos - 1;

    while (tempPos && tabToken(tempPos)) {
      depth++;
      tempPos--;
    }

    return depth;
  };

  const nextTabDepth = () => {
    let depth = 0;
    let tempPos = pos;

    while (tabToken(tempPos)) {
      depth++;
      tempPos++;
    }

    return depth;
  };

  const walkAttr = () => {
    let token = tokens[pos];
    const attr: VAttr = { name: token.value.toLowerCase() };
    token = tokens[++pos];

    if (equalToken(pos)) {
      token = tokens[++pos];

      if (stringToken(pos)) {
        attr.value = token.value;
        pos++;
      }
    }

    return attr;
  };

  const walkNode = (parent: VNode) => {
    const depth = prevTabDepth();
    let token = tokens[pos];

    if (startCommentTag(pos)) {
      let value = '';
      pos += 2;
      token = tokens[pos];

      while (isToken() && !nextLineToken(pos)) {
        value += token.value;
        token = tokens[++pos];
      }

      if (nextLineToken(pos)) {
        pos++;
      }

      return new VNode({ parent, type: VNodeType.comment, value });
    }

    if (startTag(pos)) {
      token = tokens[pos];
      const node = new VNode({
        parent,
        type: VNodeType.element,
        value: token.value.toLowerCase(),
      });

      if (stringToken(pos)) {
        pos++;
      } else {
        node.value = 'div';
      }

      while (
        (id(pos) || className(pos)) &&
        !parenLeftToken(pos) &&
        !nextLineToken(pos)
      ) {
        addAttr(node)({
          name: id(pos) ? 'id' : 'class',
          value: tokens[++pos].value,
        });
        pos++;
      }

      if (parenLeftToken(pos)) {
        while (isToken() && !parenRightToken(pos)) {
          if (stringToken(pos)) {
            addAttr(node)(walkAttr());
            continue;
          }
          pos++;
        }
        pos++;
      }

      token = tokens[pos];

      if (whiteSpaceToken(pos)) {
        let value = token.value;
        token = tokens[++pos];

        while (isToken() && !nextLineToken(pos)) {
          value += token.value;
          token = tokens[++pos];
        }

        value = value.trim();
        addChild(node)(
          value.length
            ? new VNode({ parent: node, type: VNodeType.text, value })
            : null
        );
        pos++;
      }

      if (nextLineToken(pos)) {
        pos++;
      }

      const nextDepth = nextTabDepth();
      while (isToken() && depth < nextTabDepth()) {
        pos += nextDepth;
        addChild(node)(walkNode(node));
      }

      return node;
    }

    pos++;
    return null;
  };

  while (isToken()) {
    addChild(ast)(walkNode(ast));
  }

  return ast;
}

export const pugParser = (source: string) => parser(tokenizer(source));
