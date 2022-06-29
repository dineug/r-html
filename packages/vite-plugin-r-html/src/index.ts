import * as t from '@babel/core';
import { createFilter } from '@rollup/pluginutils';
import type { Plugin } from 'vite';

export interface Options {
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
}

const hmr = (name: string) => `
if (import.meta.hot) {
  import.meta.hot.accept((mod) => {
    window.dispatchEvent(new CustomEvent('hmr:r-html', {
      detail: {origin: ${name}, module: mod}
    }));
  });
}
`;

function rHtml(options: Options = {}): Plugin {
  const filter = createFilter(
    options.include,
    options.exclude ?? '**/node_modules/**'
  );

  return {
    name: 'vite:r-html-refresh',
    async transform(code, id) {
      if (!filter(id)) {
        return;
      }

      const result = await t.transformAsync(code, {
        babelrc: false,
        configFile: false,
        ast: true,
        code: false,
        filename: id,
      });

      const isBoundary = result?.ast?.program.body.every(node => {
        if (node.type !== 'ExportNamedDeclaration') {
          return true;
        }
        const { declaration, specifiers } = node;

        if (declaration) {
          if (declaration.type === 'VariableDeclaration') {
            return declaration.declarations.every(variable =>
              isComponentLikeIdentifier(variable.id)
            );
          }
          if (declaration.type === 'FunctionDeclaration') {
            return (
              !!declaration.id && isComponentLikeIdentifier(declaration.id)
            );
          }
        }
        return specifiers.every(spec => {
          return isComponentLikeIdentifier(spec.exported);
        });
      });

      if (!isBoundary) {
        return;
      }

      const node = result?.ast?.program.body.find(
        node => node.type === 'ExportDefaultDeclaration'
      );

      if (node?.type === 'ExportDefaultDeclaration') {
        const name = (node.declaration as any).name;

        return {
          code: code + hmr(name),
        };
      }
    },
  };
}

function isComponentLikeIdentifier(node: t.Node): boolean {
  return node.type === 'Identifier' && isComponentLikeName(node.name);
}

function isComponentLikeName(name: string): boolean {
  return typeof name === 'string' && name[0] >= 'A' && name[0] <= 'Z';
}

export default rHtml;
