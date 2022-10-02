import {
  addChild,
  addProperty,
  isDynamicProperty,
  isEndMultiCommentValue,
  isEndSingleCommentValue,
  isLeftBraceToken,
  isProperty,
  isRightBraceToken,
  isSelector,
  isStartMultiCommentValue,
  isStartSingleCommentValue,
} from '@/parser/css/helper';
import { Token, tokenizer } from '@/parser/css/tokenizer';
import { VCNode, VCNodeType } from '@/parser/vcNode';

export function parser(tokens: Token[]) {
  let pos = 0;

  const isToken = () => pos < tokens.length;
  const property = isProperty(tokens);
  const dynamicProperty = isDynamicProperty(tokens);
  const selector = isSelector(tokens);
  const leftBraceToken = isLeftBraceToken(tokens);
  const rightBraceToken = isRightBraceToken(tokens);
  const startMultiCommentValue = isStartMultiCommentValue(tokens);
  const endMultiCommentValue = isEndMultiCommentValue(tokens);
  const startSingleCommentValue = isStartSingleCommentValue(tokens);
  const endSingleCommentValue = isEndSingleCommentValue(tokens);

  const walkNode = (parent: VCNode | null, value?: string) => {
    const node = new VCNode({
      type: VCNodeType.style,
      parent,
      value,
    });

    while (isToken()) {
      let token = tokens[pos];

      if (rightBraceToken(pos)) {
        pos++;
        break;
      }

      if (property(pos)) {
        const valueToken = tokens[pos + 3];

        addProperty(node)({
          name: token.value,
          value: valueToken.value,
        });

        pos += 5;
        continue;
      } else if (dynamicProperty(pos)) {
        const valueToken = tokens[pos + 2];
        const value = `@@${valueToken.value}`;

        addProperty(node)({
          name: value,
          value,
        });

        pos += 4;
        continue;
      } else if (startMultiCommentValue(pos)) {
        let value = token.value;
        token = tokens[++pos];

        while (isToken() && !endMultiCommentValue(pos)) {
          value += token.value;
          token = tokens[++pos];
        }
        value += token.value;

        addChild(node)(
          new VCNode({
            type: VCNodeType.comment,
            parent: node,
            value,
          })
        );

        pos++;
        continue;
      } else if (startSingleCommentValue(pos)) {
        let value = token.value;
        token = tokens[++pos];

        while (isToken() && !endSingleCommentValue(pos)) {
          value += token.value;
          token = tokens[++pos];
        }

        addChild(node)(
          new VCNode({
            type: VCNodeType.comment,
            parent: node,
            value,
          })
        );

        pos++;
        continue;
      } else if (selector(pos)) {
        let value = token.value;
        token = tokens[++pos];

        while (isToken() && !leftBraceToken(pos)) {
          value += token.value;
          token = tokens[++pos];
        }

        addChild(node)(walkNode(node, value.trim()));
      }

      pos++;
    }

    return node;
  };

  const ast = walkNode(null);
  return ast;
}

export const cssParser = (source: string) => parser(tokenizer(source));
