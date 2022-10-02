import { htmlParser } from '@/parser';
import {
  DOMTemplateLiterals,
  Template,
  templateCache,
  TemplateLiteralsType,
} from '@/template';
import { createMarker } from '@/template/helper';
import { createTNode } from '@/template/tNode';

const createTagged =
  (type: TemplateLiteralsType.html | TemplateLiteralsType.svg) =>
  (strings: TemplateStringsArray, ...values: any[]): DOMTemplateLiterals => {
    const templateLiterals = {
      strings,
      values,
      type,
    } as DOMTemplateLiterals;

    if (templateCache.has(strings)) {
      const template = templateCache.get(strings) as Template;
      templateLiterals.template = template;
      return Object.freeze(templateLiterals);
    }

    const tpl = strings
      .reduce<Array<string>>((acc, cur, i) => {
        i < values.length ? acc.push(cur, createMarker(i)) : acc.push(cur);
        return acc;
      }, [])
      .join('');
    const node = createTNode(htmlParser(tpl));

    templateLiterals.template = Object.freeze({ node });
    templateCache.set(strings, templateLiterals.template);
    return Object.freeze(templateLiterals);
  };

export const html = createTagged(TemplateLiteralsType.html);
export const svg = createTagged(TemplateLiteralsType.svg);
