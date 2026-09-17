import React from 'react';

/**
 * Robust wrapper around React.lazy() that automatically handles
 * dynamic import failures caused by new deployments (stale chunk hashes).
 * 
 * When a user is in an active session and a new build is deployed to Vercel/production,
 * the old chunk files no longer exist. This helper automatically clears stale caches
 * and refreshes the page seamlessly, preventing the raw "Failed to fetch dynamically imported module" error.
 */
export function lazyWithRetry(componentImport) {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.name === 'TypeError';

      if (isChunkError) {
        const lastReload = parseInt(sessionStorage.getItem('billqyro_chunk_last_reload') || '0', 10);
        const now = Date.now();

        // Debounce: allow one auto-reload per 15 seconds to prevent reload loops
        if (now - lastReload > 15000) {
          sessionStorage.setItem('billqyro_chunk_last_reload', String(now));
          console.warn('[BillQyro] Dynamic chunk import failed due to updated deployment. Auto-refreshing...', error);

          // Clear Service Worker caches if available
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map((name) => caches.delete(name)));
            } catch (_) {}
          }

          // Hard reload with cache-buster query parameter to bypass browser disk cache
          const targetUrl = new URL(window.location.href);
          targetUrl.searchParams.set('_r', String(now));
          window.location.replace(targetUrl.toString());

          // Return a pending promise so React Suspense remains mounted without flashing the ErrorBoundary
          return new Promise(() => {});
        }
      }

      throw error;
    }
  });
}

export default lazyWithRetry;
