import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import prettyBytes from 'pretty-bytes';

/**
 *
 */
export function assetsPlugin(files) {
    return {
        name: 'assets',
        setup(build) {
            if (build.initialOptions.format !== 'esm') {
                return;
            }

            build.onEnd((result) => {
                const outdir = build.initialOptions.outdir;

                return mkdir(path.resolve(outdir), { recursive: true })
                    .then(() =>
                        Promise.all(
                            Object.entries(files).map(([filename, content]) => {
                                const outpath = outdir + '/' + filename;
                                return content.then((content) => {
                                    console.log('ASSET', outpath, prettyBytes(content.length));
                                    return writeFile(outpath, content);
                                });
                            })
                        )
                    )
                    .then(() => undefined);
            });
        },
    };
}
