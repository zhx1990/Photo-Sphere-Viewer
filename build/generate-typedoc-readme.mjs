#!/usr/bin/env node

/**
 * Generates README files for typedoc
 */

import path from 'path';
import { readdirSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';

const PACKAGES_DIR = 'packages';
const PKG_FILE = 'package.json';
const DIST_DIR = '.typedoc';
const DIST_FILE = 'README.md';

readdirSync(PACKAGES_DIR)
    .filter((name) => name !== 'shared')
    .forEach(async (name) => {
        const pkgFile = path.join(PACKAGES_DIR, name, PKG_FILE);
        const distDir = path.join(PACKAGES_DIR, name, DIST_DIR);
        const destFile = path.join(distDir, DIST_FILE);

        const pkg = JSON.parse(await readFile(pkgFile, { encoding: 'utf8' }));

        const content = `
NPM package : [${pkg.name}](https://www.npmjs.com/package/${pkg.name})

Documentation : ${pkg.homepage}
`.trim();

        console.log(`create ${destFile}`);
        await mkdir(distDir, { recursive: true });
        await writeFile(destFile, content);
    });
