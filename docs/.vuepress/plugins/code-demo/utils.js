import { getParameters } from 'codesandbox-import-utils/lib/api/define';

const ORG = '@photo-sphere-viewer/';
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/';
const VERSION = 'alpha';
const THREE_PATH = CDN_BASE + 'three/build/three.min.js';

function fullname(name) {
    return ORG + name;
}

function buildPath(name, type) {
    return CDN_BASE + name + '@' + VERSION + '/index.' + type;
}

export function getFullJs(js) {
    return js;
}

export function getFullCss(css) {
    return `
html, body, #viewer {
  margin: 0;
  width: 100vw;
  height: 100vh;
  font-family: sans-serif;
}

${css}`.trim();
}

export function getFullHtml(html) {
    return `
<div id="viewer"></div>

${html}`.trim();
}

export function getFullPackages(packages) {
    return [
        {
            name: fullname('core'),
            imports: 'Viewer',
            style: true,
        },
        ...packages.map((pkg) => ({
            ...pkg,
            name: fullname(pkg.name),
        })),
    ];
}

export function getAllResources(packages) {
    return [
        THREE_PATH,
        ...packages.map(({ name }) => buildPath(name, 'js')),
        ...packages.filter(({ style }) => style).map(({ name }) => buildPath(name, 'css')),
    ];
}

export function getIframeContent({ title, html, js, css, packages }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${title}</title>

${getAllResources(packages)
    .map((path) => {
        if (path.endsWith('.js')) {
            return `<script src="${path}"><\/script>`;
        } else {
            return `<link rel="stylesheet" href="${path}">`;
        }
    })
    .join('\n')}

  <style>
    ${css}
  </style>
</head>

<body>
  ${html}

  <script>
  ${js}
  </script>
</body>
</html>`;
}

export function getCodePenValue({ title, js, css, html, packages }) {
    const resources = getAllResources(packages);

    return JSON.stringify({
        title: title,
        js: js,
        css: css,
        html: html,
        js_external: resources.filter((path) => path.endsWith('.js')),
        css_external: resources.filter((path) => path.endsWith('.css')),
    });
}

export function getCodeSandboxValue({ title, js, css, html, packages }) {
    return getParameters({
        files: {
            'package.json': {
                content: {
                    description: title,
                    main: 'index.html',
                    scripts: {
                        start: 'parcel index.html --open',
                        build: 'parcel build index.html',
                    },
                    dependencies: packages.reduce((deps, { name }) => {
                        deps[name] = VERSION;
                        return deps;
                    }, {}),
                    devDependencies: {
                        'parcel-bundler': '^2.8.0',
                        'typescript': '^4.8',
                    },
                },
            },
            'index.html': {
                isBinary: false,
                content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${title}</title>
</head>

<body>
    ${html}

    <script src="src/index.ts"></script>
</body>
</html>`,
            },
            'src/index.ts': {
                isBinary: false,
                content: `
import './styles.css';
${packages
    .filter(({ imports }) => imports)
    .map(({ name, imports }) => `import { ${imports} } from '${name}';`)
    .join('\n')}

${js.replace(/PhotoSphereViewer\./g, '')}`.trim(),
            },
            'src/styles.css': {
                isBinary: false,
                content: `
${packages
    .filter(({ style }) => style)
    .map(({ name }) => `@import '../node_modules/${name}/index.css';`)
    .join('\n')}

${css}`.trim(),
            },
        },
    });
}
