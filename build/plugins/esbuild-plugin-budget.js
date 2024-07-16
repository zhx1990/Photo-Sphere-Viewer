import chalk from 'chalk';

/**
 * Checks the final bundle size
 */
export function budgetPlugin(budget) {
    if (!budget || !budget.endsWith('kb')) {
        throw new Error('Missing/invalid budget');
    }

    const maxsize = 1024 * parseInt(budget, 10);

    return {
        name: 'budget',
        setup(build) {
            build.onEnd((result) => {
                ['index.cjs', 'index.module.js'].forEach((filename) => {
                    const file = result.outputFiles.find((f) => f.path.endsWith(filename));
                    if (file) {
                        if (file.contents.length > maxsize) {
                            throw chalk.red(`File ${filename} exceeds budget of ${budget}, current size: ${Math.round(file.contents.length / 1024)}kb`);
                        }
                    }
                });
            });
        },
    };
}
