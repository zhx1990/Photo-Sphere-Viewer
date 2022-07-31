const container = require('markdown-it-container');
const path = require('path');

module.exports = (options, ctx) => ({
  name           : 'gallery',
  enhanceAppFiles: path.resolve(__dirname, './enhanceApp.js'),
  extendMarkdown : (md) => {
    md.use(container, 'gallery', {
      render: (tokens, idx) => {
        const token = tokens[idx];
        if (token.nesting === 1) {
          return `<Gallery>\n`
        }
        else {
          return `</Gallery>\n`
        }
      },
    });

    md.use(container, 'item', {
      render: (tokens, idx) => {
        const token = tokens[idx];
        const attributes = token.info.trim().slice('item '.length);

        if (token.nesting === 1) {
          return `<GalleryItem ${attributes}>\n`
        }
        else {
          return `</GalleryItem>\n`
        }
      },
    });
  }
});
