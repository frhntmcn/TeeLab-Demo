import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isStudioDeployment = mode === 'studio';

  return {
    // The WooCommerce storefront stays at the domain root. The React/Fabric
    // experience is published independently at https://maymoon.com.tr/studio/.
    base: isStudioDeployment ? '/studio/' : '/',
    plugins: [
      react(),
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
