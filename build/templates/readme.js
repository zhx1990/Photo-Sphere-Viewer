export const readme = (pkg) => {
    const title = pkg.psv.globalName
        .replace(/([A-Z])/g, ' $1')
        .replace('.', ' /')
        .trim();

    return Promise.resolve(`# ${title}

[![NPM version](https://img.shields.io/npm/v/${pkg.name}?logo=npm)](https://www.npmjs.com/package/${pkg.name})
[![NPM Downloads](https://img.shields.io/npm/dm/${pkg.name}?color=f86036&label=npm&logo=npm)](https://www.npmjs.com/package/${pkg.name})
[![jsDelivr Hits](https://img.shields.io/jsdelivr/npm/hm/${pkg.name}?color=%23f86036&logo=jsdelivr)](https://www.jsdelivr.com/package/npm/${pkg.name})

${pkg.description}

## Documentation

${pkg.homepage}

## License

This library is available under the MIT license.
`);
};
