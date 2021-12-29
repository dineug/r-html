import { htmlParser } from '@/parser';
import {
  templateCache,
  TemplateLiterals,
  TemplateLiteralsType,
} from '@/template';
import { createMarker } from '@/template/helper';
import { createTNode } from '@/template/node';

const createTagged =
  (type: TemplateLiteralsType) =>
  (strings: TemplateStringsArray, ...values: any[]): TemplateLiterals => {
    const templateLiterals: TemplateLiterals = Object.freeze({
      strings,
      values,
      type,
    });
    if (templateCache.has(strings)) return templateLiterals;

    const tpl = strings
      .reduce<Array<string>>((acc, cur, i) => {
        i < values.length ? acc.push(cur, createMarker(i)) : acc.push(cur);
        return acc;
      }, [])
      .join('');
    const node = createTNode(htmlParser(tpl));

    templateCache.set(strings, { node });
    return templateLiterals;
  };

export const html = createTagged(TemplateLiteralsType.html);
export const svg = createTagged(TemplateLiteralsType.svg);
