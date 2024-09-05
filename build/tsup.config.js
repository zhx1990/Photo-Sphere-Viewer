import { sassPlugin } from 'esbuild-sass-plugin';
import { defineConfig } from 'tsup';
import { assetsPlugin } from './plugins/esbuild-plugin-assets';
import { mapFixPlugin } from './plugins/esbuild-plugin-map-fix';
import { scssBundlePlugin } from './plugins/esbuild-plugin-scss-bundle';
import { budgetPlugin } from './plugins/esbuild-plugin-budget';
import { license } from './templates/license';
import { npmrc } from './templates/npmrc';
import { packageJson } from './templates/package';
import { readme } from './templates/readme';

export default function createConfig(pkg) {
    const banner = `/*!
 * ${pkg.psv.title} ${pkg.version}
${
    pkg.name === '@photo-sphere-viewer/core' ? ' * @copyright 2014-2015 Jérémy Heleine\n' : ''
} * @copyright 2015-${new Date().getFullYear()} Damien "Mistic" Sorel
 * @licence MIT (https://opensource.org/licenses/MIT)
 */`;

    return defineConfig((options) => {
        const dev = options.watch || options.define?.['config'] === 'dev';
        const dts = !dev && options.define?.['dts'] !== 'off';

        return {
            entryPoints: [pkg.main],
            outDir: 'dist',
            format: dev ? ['esm'] : ['esm', 'cjs'],
            outExtension({ format }) {
                return {
                    js: { cjs: '.cjs', esm: '.module.js' }[format],
                };
            },
            dts: dts,
            sourcemap: true,
            external: ['three'],
            noExternal: [/three\/examples\/.*/],
            target: 'es2021',
            define: {
                PKG_VERSION: `'${pkg.version}'`,
            },
            esbuildPlugins: [
                sassPlugin(),
                mapFixPlugin(),
                budgetPlugin(pkg.psv.budget),
                ...(dev
                    ? []
                    : [
                          scssBundlePlugin(),
                          assetsPlugin({
                              'LICENSE': license(),
                              '.npmrc': npmrc(),
                              'README.md': readme(pkg),
                              'package.json': packageJson(pkg),
                          }),
                      ]),
            ],
            esbuildOptions(options, context) {
                options.banner = {
                    js: banner,
                    css: banner,
                };
                options.loader = {
                    '.svg': 'text',
                    '.glsl': 'text',
                };
            },
            clean: true,
        };
    });
}
