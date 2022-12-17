/**
 * Alters the paths in CSS maps
 */
export function cssMapPlugin() {
    return {
        name: 'cssMap',
        setup(build) {
            build.onEnd((result) => {
                const mapFile = result.outputFiles.find((f) => f.path.endsWith('index.css.map'));
                if (!mapFile) {
                    return;
                }

                const content = JSON.parse(mapFile.text);
                content.sources = content.sources.map((src) => {
                    return src
                        .replace('../src', 'src')
                        .replace('../../shared', '../shared');
                });
                mapFile.contents = Buffer.from(JSON.stringify(content));
            });
        },
    };
}
