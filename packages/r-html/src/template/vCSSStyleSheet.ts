import { supportsAdoptingStyleSheets } from '@/render/part/node/component/webComponent/styleSheets';
import { RCNode } from '@/template/rcNode';
import { TCNode } from '@/template/tcNode';

interface VCSSStyleSheet {
  selector: string;
  style: string;
  sheet: CSSStyleSheet | null;
  styleElement: HTMLStyleElement | null;
}

interface HostContext {
  vSheets: VCSSStyleSheet[];
  styleElements: HTMLStyleElement[];
}

interface CSSSharedContext {
  vCSSStyleSheetMap: Map<string, VCSSStyleSheet>;
  hostContextMap: Map<Document | ShadowRoot, HostContext>;
}

const CSS_SHARED_CONTEXT = Symbol.for(
  'https://github.com/dineug/r-html#cssSharedContext'
);

const globalContext = globalThis ?? window;

function getCSSSharedContext(): CSSSharedContext {
  const ctx: CSSSharedContext | null =
    Reflect.get(globalContext, CSS_SHARED_CONTEXT) ?? null;
  if (ctx) return ctx;

  const newCtx: CSSSharedContext = {
    vCSSStyleSheetMap: new Map(),
    hostContextMap: new Map(),
  };

  Reflect.set(globalContext, CSS_SHARED_CONTEXT, newCtx);
  return newCtx;
}

export function vRender(node: TCNode, values: any[]): string {
  const ctx = getCSSSharedContext();
  const rNode = new RCNode(node, null, values);

  [...rNode].forEach(node => {
    const selector = node.selector;
    if (ctx.vCSSStyleSheetMap.has(selector)) {
      return;
    }

    const sheet = supportsAdoptingStyleSheets ? new CSSStyleSheet() : null;
    const styleElement = supportsAdoptingStyleSheets
      ? null
      : document.createElement('style');

    const cssText =
      node.isAtRule && !node.style
        ? `${selector}`
        : `${selector} {\n${node.style}}`;

    if (sheet) {
      sheet.replaceSync(cssText);
    } else if (styleElement) {
      styleElement.textContent = cssText;
    }

    ctx.vCSSStyleSheetMap.set(selector, {
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
  supportsAdoptingStyleSheets ? updateStyleSheets() : updateStyleElements();
}

function updateStyleSheets() {
  const ctx = getCSSSharedContext();
  const sheets = Array.from(ctx.vCSSStyleSheetMap)
    .map(([, { sheet }]) => sheet)
    .filter(Boolean) as CSSStyleSheet[];

  Array.from(ctx.hostContextMap).forEach(([host]) => {
    host.adoptedStyleSheets = sheets;
  });
}

function updateStyleElements() {
  const ctx = getCSSSharedContext();

  Array.from(ctx.hostContextMap).forEach(
    ([host, { vSheets, styleElements }]) => {
      const newStyleElements = Array.from(ctx.vCSSStyleSheetMap)
        .filter(([, vCSSStyleSheet]) => !vSheets.includes(vCSSStyleSheet))
        .map(([, vCSSStyleSheet]) => {
          vSheets.push(vCSSStyleSheet);

          return vCSSStyleSheet.styleElement
            ? document.importNode(vCSSStyleSheet.styleElement)
            : null;
        })
        .filter(Boolean) as HTMLStyleElement[];

      newStyleElements.forEach(styleElement => {
        const target = host instanceof Document ? host.head : host;
        target.appendChild(styleElement);
      });

      styleElements.push(...newStyleElements);
    }
  );
}

export function addCSSHost(host: Document | ShadowRoot) {
  const ctx = getCSSSharedContext();
  if (ctx.hostContextMap.has(host)) {
    return;
  }

  ctx.hostContextMap.set(host, {
    vSheets: [],
    styleElements: [],
  });
  updateSheets();
}

export function removeCSSHost(host: Document | ShadowRoot) {
  const ctx = getCSSSharedContext();
  const hostContext = ctx.hostContextMap.get(host);
  if (!hostContext) {
    return;
  }

  if (supportsAdoptingStyleSheets) {
    host.adoptedStyleSheets = [];
  } else {
    const target = host instanceof Document ? host.head : host;
    hostContext.styleElements.forEach(styleElement =>
      target.removeChild(styleElement)
    );
  }

  ctx.hostContextMap.delete(host);
}
