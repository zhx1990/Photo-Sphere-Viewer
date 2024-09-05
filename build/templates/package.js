export const packageJson = (pkg) =>
    import('sort-package-json').then(({ default: sortPackageJson, sortOrder }) => {
        sortOrder.splice(sortOrder.indexOf('style') + 1, 0, 'sass');

        const content = {
            ...pkg,
            main: 'index.cjs',
            module: 'index.module.js',
            types: 'index.d.ts',
            license: 'MIT',
            // repository: {
            //     type: 'git',
            //     url: 'git://github.com/mistic100/Photo-Sphere-Viewer.git',
            // },
            // author: {
            //     name: "Damien 'Mistic' Sorel",
            //     email: 'contact@git.strangeplanet.fr',
            //     homepage: 'https://www.strangeplanet.fr',
            // },
            author: '中瑞网络',
            homepage: 'https://packages.aliyun.com/npm/npm-registry/artifacts',
            keywords: ['photosphere', 'panorama', 'threejs', ...(pkg.keywords || [])],
        };

        if (pkg.psv.style) {
            content.style = 'index.css';
            content.sass = 'index.scss';
        }

        // if (pkg.name === '@photo-sphere-viewer/core') {
        //     content.contributors = [
        //         {
        //             name: 'Jérémy Heleine',
        //             email: 'jeremy.heleine@gmail.com',
        //             homepage: 'https://jeremyheleine.me',
        //         },
        //     ];
        // }

        delete content.devDependencies;
        delete content.psv;
        delete content.scripts;

        return JSON.stringify(sortPackageJson(content), null, 2);
    });
