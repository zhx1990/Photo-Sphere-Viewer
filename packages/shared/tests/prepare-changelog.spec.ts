import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import assert from 'assert';

const testDir = path.join(__dirname, 'fixtures/prepare-changelog');

describe('prepare-changelog', () => {
    it('should works', () => {
        execSync(`cat ${path.join(testDir, 'git-log.txt')} | node ${path.join(__dirname, '../../../build/prepare-changelog.mjs')} 5.7.4 5.8.0`, { cwd: testDir });

        
        const actual = readFileSync(path.join(testDir, 'dist/changelog_5.8.0.md'), { encoding: 'utf8' });

        const expected = `
Full changelog: [5.7.4...5.8.0](https://github.com/mistic100/Photo-Sphere-Viewer/compare/5.7.4...5.8.0)

- Fix #1329 virtual-tour: cannot click on arrows
- Fix #1326 markers: update marker failed when not in view
- Read additional XMP data
- Close #1288 dual fisheye adapter
- Fix overlays: export model
- Close #1163 virtual-tour: new arrows
- Close #1118 markers: add new "elementLayer" type
- Remove LittlePlanetAdapter`;

        assert.strictEqual(actual.trim(), expected.trim());
    });
});
