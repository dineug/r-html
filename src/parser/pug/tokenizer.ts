export interface Token {
  type: TokenType;
  value: string;
}

export enum TokenType {
  parenLeft = 'parenLeft',
  parenRight = 'parenRight',
  slash = 'slash',
  equal = 'equal',
  string = 'string',
  dot = 'dot',
  sharp = 'sharp',
  nextLine = 'nextLine',
  whiteSpace = 'whiteSpace',
  tab = 'tab',
}

enum NodeType {
  element = 'element',
  text = 'text',
  comment = 'comment',
}

const pattern = {
  parenLeft: '(',
  parenRight: ')',
  slash: '/',
  equal: '=',
  doubleQuote: `"`,
  singleQuote: `'`,
  dot: '.',
  sharp: '#',
  nextLine: '\n',
  whiteSpace: /\s/,
  string: /\S/,
  breakString: /\(|\)|=/,
  breakText: /#|\./,
};

const createEqual = (type: string) => (char: string) => type === char;
const createTest = (regexp: RegExp) => (char: string) => regexp.test(char);

const match = {
  parenLeft: createEqual(pattern.parenLeft),
  parenRight: createEqual(pattern.parenRight),
  slash: createEqual(pattern.slash),
  equal: createEqual(pattern.equal),
  doubleQuote: createEqual(pattern.doubleQuote),
  singleQuote: createEqual(pattern.singleQuote),
  nextLine: createEqual(pattern.nextLine),
  dot: createEqual(pattern.dot),
  sharp: createEqual(pattern.sharp),
  whiteSpace: createTest(pattern.whiteSpace),
  string: createTest(pattern.string),
  breakString: createTest(pattern.breakString),
  breakText: createTest(pattern.breakText),
};

const isTab = (source: string) => (pos: number) =>
  match.whiteSpace(source[pos]) && match.whiteSpace(source[pos + 1]);

const isStartCommentTag = (source: string) => (pos: number) =>
  match.slash(source[pos]) && match.slash(source[pos + 1]);

export function tokenizer(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  const isChar = () => pos < source.length;
  const tab = isTab(source);
  const startCommentTag = isStartCommentTag(source);

  const walk = (nodeType = NodeType.text) => {
    while (isChar()) {
      let char = source[pos];

      if (match.whiteSpace(char)) {
        if (match.nextLine(char)) {
          nodeType !== NodeType.element &&
            tokens.push({ type: TokenType.nextLine, value: char });
          pos++;

          if (nodeType === NodeType.comment) break;
          continue;
        }

        if (tab(pos)) {
          nodeType !== NodeType.element &&
            tokens.push({ type: TokenType.tab, value: '  ' });
          pos += 2;
          continue;
        }

        nodeType !== NodeType.element &&
          tokens.push({ type: TokenType.whiteSpace, value: char });
        pos++;
        continue;
      }

      if (nodeType === NodeType.element) {
        if (match.parenLeft(char)) {
          tokens.push({ type: TokenType.parenLeft, value: char });
          pos++;
          continue;
        }

        if (match.parenRight(char)) {
          tokens.push({ type: TokenType.parenRight, value: char });
          pos++;
          break;
        }

        if (match.equal(char)) {
          tokens.push({ type: TokenType.equal, value: char });
          pos++;
          continue;
        }

        if (match.doubleQuote(char)) {
          let value = '';
          char = source[++pos];

          while (!match.doubleQuote(char)) {
            value += char;
            char = source[++pos];
          }

          tokens.push({ type: TokenType.string, value });
          pos++;
          continue;
        }

        if (match.singleQuote(char)) {
          let value = '';
          char = source[++pos];

          while (!match.singleQuote(char)) {
            value += char;
            char = source[++pos];
          }

          tokens.push({ type: TokenType.string, value });
          pos++;
          continue;
        }
      } else if (nodeType === NodeType.comment) {
        if (match.slash(char)) {
          tokens.push({ type: TokenType.slash, value: char });
          pos++;
          continue;
        }
      } else {
        if (match.parenLeft(char)) {
          walk(NodeType.element);
          continue;
        }

        if (match.dot(char)) {
          tokens.push({ type: TokenType.dot, value: char });
          pos++;
          continue;
        }

        if (match.sharp(char)) {
          tokens.push({ type: TokenType.sharp, value: char });
          pos++;
          continue;
        }

        if (startCommentTag(pos)) {
          walk(NodeType.comment);
          continue;
        }
      }

      if (match.string(char)) {
        let value = '';

        while (isChar() && match.string(char) && !match.breakString(char)) {
          if (nodeType === NodeType.text && match.breakText(char)) break;
          value += char;
          char = source[++pos];
        }

        tokens.push({ type: TokenType.string, value });
        continue;
      }

      pos++;
    }
  };

  walk();

  return tokens;
}
