const container = require('markdown-it-container');
const path = require('path');

module.exports = (options, ctx) => ({
    name: 'dialog',
    enhanceAppFiles: path.resolve(__dirname, './enhanceApp.js'),
    extendMarkdown: (md) => {
        md.use(container, 'dialog', {
            render: (tokens, idx) => {
                const { nesting, info } = tokens[idx];

                if (nesting === 1) {
                    const [, button, title] = info.match(/dialog "(.*?)" "(.*?)"/);
                    return `<Dialog button="${button}" title="${title}">\n`;
                } else {
                    return `</Dialog>\n`;
                }
            },
        });
    },
});
