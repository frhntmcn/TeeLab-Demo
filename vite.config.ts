import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fontPackages = ['anton', 'bebas-neue', 'caveat', 'montserrat', 'oswald', 'playfair-display'];

export default defineConfig(({ mode }) => {
  const isStudioDeployment = mode === 'studio';

  return {
    // The WooCommerce storefront stays at the domain root. The React/Fabric
    // experience is published independently at https://maymoon.com.tr/studio/.
    base: isStudioDeployment ? '/studio/' : '/',
    plugins: [
      react(),
      {
        name: 'studio-font-licenses',
        generateBundle() {
          const source = fontPackages.map((name) => {
            const path = fileURLToPath(new URL(`./node_modules/@fontsource/${name}/LICENSE`, import.meta.url));
            return `@fontsource/${name}\n${readFileSync(path, 'utf8')}`;
          }).join('\n\n---\n\n');
          this.emitFile({ type: 'asset', fileName: 'studio-font-licenses.txt', source });
        },
      },
      {
        name: 'maymoon-studio-metadata',
        transformIndexHtml(html) {
          if (!isStudioDeployment) return html;

          return html.replaceAll(
            'https://maymoon.com.tr/',
            'https://maymoon.com.tr/studio/',
          );
        },
      },
    ],
  };
});
