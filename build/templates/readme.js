export const readme = (pkg) => {
    const title = pkg.psv.globalName
        .replace(/([A-Z])/g, ' $1')
        .replace('.', ' /')
        .trim();

    return Promise.resolve(`${title}
-----

${pkg.description}

## Documentation

${pkg.homepage}

## License

This library is available under the MIT license.
`);
};
