import fs from 'fs';
import inquirer from 'inquirer';
import process from 'process';

const PACKAGES_DIR = 'packages';
const packages = fs.readdirSync(PACKAGES_DIR).filter((name) => name !== 'shared' && name !== 'core');

const prompt = inquirer.createPromptModule({ output: process.stderr });

process.stdin.on('data', (key) => {
    if (key == '\u0003') {
        process.stdout.write('--filter=noop');
    }
});

prompt([
    {
        name: 'packages',
        message: 'Select which packages to build',
        type: 'checkbox',
        choices: [
            { value: 'core', checked: true },
            ...packages,
        ],
    }
])
    .then((answers) => {
        const filters = [
            '//',
            ...answers.packages,
        ]
            .map(p => `--filter=${p}`)
            .join(' ');

        process.stdout.write(filters);
    });