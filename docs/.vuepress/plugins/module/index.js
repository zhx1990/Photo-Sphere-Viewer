const container = require('markdown-it-container');

module.exports = (options, ctx) => ({
    name: 'module',
    extendMarkdown: (md) => {
        md.use(container, 'module', {
            render: (tokens, idx) => {
                const { nesting } = tokens[idx];
                if (nesting === 1) {
                    return `<div class="custom-block tip" style="border-color: var(--md-theme-default-primary, #448aff)">\n`;
                } else {
                    return `</div>\n`;
                }
            },
        });
    },
});
