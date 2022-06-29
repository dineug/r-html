import { hmr, html, render } from '@dineug/r-html';

import App from '@/components/app/App';

hmr();

render(document.body, html`<${App} />`);
