import { cssParser } from '@/parser';
import {
  CSSTemplate,
  cssTemplateCache,
  CSSTemplateLiterals,
  TemplateLiteralsType,
} from '@/template';
import { createMarker } from '@/template/helper';

export const css = (
  strings: TemplateStringsArray,
  ...values: any[]
): CSSTemplateLiterals => {
  const templateLiterals = {
    strings,
    values,
    type: TemplateLiteralsType.css,
  } as CSSTemplateLiterals;

  if (cssTemplateCache.has(strings)) {
    const template = cssTemplateCache.get(strings) as CSSTemplate;
    templateLiterals.template = template;
    return Object.freeze(templateLiterals);
  }

  const tpl = strings
    .reduce<Array<string>>((acc, cur, i) => {
      i < values.length ? acc.push(cur, createMarker(i)) : acc.push(cur);
      return acc;
    }, [])
    .join('');

  const vcNode = cssParser(tpl);
  console.log(vcNode);

  templateLiterals.template = Object.freeze({});
  cssTemplateCache.set(strings, templateLiterals.template);
  return Object.freeze(templateLiterals);
};
