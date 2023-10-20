import { RCNode } from '@/template/rcNode';
import { TCNode } from '@/template/tcNode';

interface VCSSStyleSheet {
  selector: string;
  cssText: string;
  style: string;
  sheet: CSSStyleSheet | null;
  styleElement: HTMLStyleElement | null;
}

interface HostContext {
  vSheets: Set<VCSSStyleSheet>;
  styleElements: Set<HTMLStyleElement>;
}

interface CSSSharedContext {
  vCSSStyleSheetMap: Map<string, VCSSStyleSheet>;
  hostContextMap: Map<Document | ShadowRoot, HostContext>;
}

const CSS_SHARED_CONTEXT = Symbol.for(
  'https://github.com/dineug/r-html#cssSharedContext_v2'
);

const globalContext = globalThis ?? window;

let supportsAdoptingStyleSheets =
  window.ShadowRoot &&
  'adoptedStyleSheets' in Document.prototype &&
  'replace' in CSSStyleSheet.prototype;

export function cssUnwrap() {
  if (!supportsAdoptingStyleSheets) {
    return;
  }

  supportsAdoptingStyleSheets = false;
  const ctx = getCSSSharedContext();
  const vCSSStyleSheets = ctx.vCSSStyleSheetMap.values();
  for (const vCSSStyleSheet of vCSSStyleSheets) {
    if (!vCSSStyleSheet.styleElement) {
      const styleElement = document.createElement('style');
      styleElement.textContent = vCSSStyleSheet.cssText;
      vCSSStyleSheet.styleElement = styleElement;
    }
  }
  updateSheets();
}

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
      cssText,
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
        .filter(([, vCSSStyleSheet]) => !vSheets.has(vCSSStyleSheet))
        .map(([, vCSSStyleSheet]) => {
          vSheets.add(vCSSStyleSheet);

          return vCSSStyleSheet.styleElement
            ? document.importNode(vCSSStyleSheet.styleElement, true)
            : null;
        })
        .filter(Boolean) as HTMLStyleElement[];

      newStyleElements.forEach(styleElement => {
        const target = host instanceof Document ? host.head : host;
        target.appendChild(styleElement);
        styleElements.add(styleElement);
      });
    }
  );
}

export function addCSSHost(host: Document | ShadowRoot) {
  const ctx = getCSSSharedContext();
  if (ctx.hostContextMap.has(host)) {
    return;
  }

  ctx.hostContextMap.set(host, {
    vSheets: new Set(),
    styleElements: new Set(),
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
