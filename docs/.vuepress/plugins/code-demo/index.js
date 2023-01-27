const container = require('markdown-it-container');
const path = require('path');
const { parse: parseYaml } = require('yaml');

const BLOCK_NAME = 'code-demo';

module.exports = (options, ctx) => ({
    name: 'code-demo',
    enhanceAppFiles: path.resolve(__dirname, './enhanceApp.js'),
    extendMarkdown: (md) => {
        md.use(container, BLOCK_NAME, {
            render: (tokens, idx) => {
                const { nesting } = tokens[idx];

                if (nesting === 1) {
                    const config = {
                        autoload: false,
                        title: '',
                        version: '',
                        html: '',
                        js: '',
                        css: '',
                        packages: [],
                    };
                    for (let index = idx; index < tokens.length; index++) {
                        const { type, content, info: info } = tokens[index];
                        if (type === `container_${BLOCK_NAME}_close`) {
                            break;
                        }
                        if (type === 'fence') {
                            if (info === 'yaml' || info === 'yml') {
                                Object.assign(config, parseYaml(content));
                            } else {
                                config[info] = content;
                            }
                        }
                    }

                    return `<CodeDemo autoload="${config.autoload}"
                            title="${config.title}"
                            version="${config.version}"
                            rawHtml="${encodeURIComponent(config.html)}"
                            rawJs="${encodeURIComponent(config.js)}"
                            rawCss="${encodeURIComponent(config.css)}"
                            rawPackages="${encodeURIComponent(JSON.stringify(config.packages))}"
                            ><template #demo>\n`;
                } else {
                    return `</template></CodeDemo>\n`;
                }
            },
        });
    },
});
