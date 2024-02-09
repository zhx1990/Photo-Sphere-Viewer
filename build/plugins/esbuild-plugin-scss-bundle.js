import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Bundler } from 'scss-bundle';
import prettyBytes from 'pretty-bytes';

/**
 * Generates a bundled scss file
 */
export function scssBundlePlugin() {
    return {
        name: 'scss-bundle',
        setup(build) {
            if (build.initialOptions.format !== 'esm') {
                return;
            }

            const outdir = build.initialOptions.outdir;
            const outpath = outdir + '/index.scss';

            build.onEnd((result) => {
                const scssFile = Object.keys(result.metafile.inputs).find((file) => file.endsWith('.scss'));
                if (!scssFile) {
                    return;
                }

                const banner = build.initialOptions.banner.css;

                return mkdir(path.resolve(outdir), { recursive: true })
                    .then(() => new Bundler(undefined, process.cwd()).bundle(scssFile))
                    .then(({ bundledContent }) => banner + '\n\n' + bundledContent)
                    .then((content) => {
                        console.log('SCSS', outpath, prettyBytes(content.length));
                        return writeFile(path.resolve(outpath), content);
                    })
                    .then(() => undefined);
            });
        },
    };
}
