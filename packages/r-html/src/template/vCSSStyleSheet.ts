import { supportsAdoptingStyleSheets } from '@/render/part/node/component/webComponent/styleSheets';
import { RCNode } from '@/template/rcNode';
import { TCNode } from '@/template/tcNode';

interface VCSSStyleSheet {
  selector: string;
  style: string;
  sheet: CSSStyleSheet | null;
  styleElement: HTMLStyleElement | null;
}

const vCSSStyleSheetMap = new Map<string, VCSSStyleSheet>();
const hostToSheetsMap = new Map<Document | ShadowRoot, Array<VCSSStyleSheet>>();
addCSSHost(document);

export function vRender(node: TCNode, values: any[]): string {
  const rNode = new RCNode(node, null, values);

  [...rNode].forEach(node => {
    const selector = node.selector;
    if (vCSSStyleSheetMap.has(selector)) {
      return;
    }

    const sheet = supportsAdoptingStyleSheets ? new CSSStyleSheet() : null;
    const styleElement = supportsAdoptingStyleSheets
      ? null
      : document.createElement('style');

    const cssText = `${selector} { ${node.style} }`;

    if (sheet) {
      sheet.replaceSync(cssText);
    } else if (styleElement) {
      styleElement.textContent = cssText;
    }

    vCSSStyleSheetMap.set(selector, {
      selector,
      style: node.style,
      sheet,
      styleElement,
    });

    updateSheets();
  });

  return String(rNode);
}

function updateSheets() {
  if (supportsAdoptingStyleSheets) {
    const sheets = [...vCSSStyleSheetMap]
      .map(([, { sheet }]) => sheet)
      .filter(Boolean) as CSSStyleSheet[];

    [...hostToSheetsMap].forEach(([host]) => {
      host.adoptedStyleSheets = sheets;
    });
  } else {
    [...hostToSheetsMap].forEach(([host, values]) => {
      const styleElements = [...vCSSStyleSheetMap]
        .filter(([, vCSSStyleSheet]) => !values.includes(vCSSStyleSheet))
        .map(([, vCSSStyleSheet]) => {
          values.push(vCSSStyleSheet);

          return vCSSStyleSheet.styleElement
            ? document.importNode(vCSSStyleSheet.styleElement)
            : null;
        })
        .filter(Boolean) as HTMLStyleElement[];

      styleElements.forEach(styleElement => {
        const target = host instanceof Document ? host.head : host;
        target.appendChild(styleElement);
      });
    });
  }
}

export function addCSSHost(host: Document | ShadowRoot) {
  if (hostToSheetsMap.has(host)) {
    return;
  }

  hostToSheetsMap.set(host, []);
  updateSheets();
}

export function removeCSSHost(host: Document | ShadowRoot) {
  hostToSheetsMap.delete(host);
}
