export const packageJson = (pkg) =>
    import('sort-package-json').then(({ default: sortPackageJson, sortOrder }) => {
        sortOrder.splice(sortOrder.indexOf('style') + 1, 0, 'sass');

        let content = {
            ...pkg,
            main: 'index.js',
            module: 'index.module.js',
            types: 'index.d.ts',
            license: 'MIT',
            repository: {
                type: 'git',
                url: 'git://github.com/mistic100/Photo-Sphere-Viewer.git',
            },
            author: {
                name: "Damien 'Mistic' Sorel",
                email: 'contact@git.strangeplanet.fr',
                homepage: 'https://www.strangeplanet.fr',
            },
            keywords: ['photosphere', 'panorama', 'threejs'],
        };

        if (pkg.psv.style) {
            content.style = 'index.css';
            content.sass = 'index.scss';
        }

        if (pkg.name === '@photo-sphere-viewer/core') {
            content.contributors = [
                {
                    name: 'Jérémy Heleine',
                    email: 'jeremy.heleine@gmail.com',
                    homepage: 'https://jeremyheleine.me',
                },
            ];
        }

        delete content.devDependencies;
        delete content.psv;
        delete content.scripts;
        delete content.typedoc;

        return JSON.stringify(sortPackageJson(content), null, 2);
    });
