/**
 * Alters the paths in maps
 */
export function mapFixPlugin() {
    return {
        name: 'mapFix',
        setup(build) {
            build.onEnd((result) => {
                ['index.css.map', 'index.cjs.map', 'index.module.js.map'].forEach((filename) => {
                    const mapFile = result.outputFiles.find((f) => f.path.endsWith(filename));
                    if (!mapFile) {
                        return;
                    }

                    console.log('MAP', `Fix ${mapFile.path}`);

                    const content = JSON.parse(mapFile.text);
                    content.sources = content.sources.map((src) => {
                        return src
                            .replace('../src', 'src')
                            .replace('../../shared', '../shared')
                            .replace('../../../node_modules', '../node_modules');
                    });
                    mapFile.contents = Buffer.from(JSON.stringify(content));
                });
            });
        },
    };
}
