//features\errors\errors.index.js

import { registerRoute } from '../../shared/core/router.js';
import { loadComponent } from '../../shared/components/component-loader.js';

registerRoute('404', async () => {
  const ok = await loadComponent('features/errors/errors-page.html', 'main-content-area');
  if (ok) {
    const { initializeNotFoundPage } = await import('./errors-page.js');
    initializeNotFoundPage({ seconds: 7 }); // optional config
    document.title = '404 - Not Found | Kazzy Enterprises';
  }
});
