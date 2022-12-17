import assert from 'assert';
import { PressHandler } from './PressHandler';

describe('utils:PressHandler', () => {
    it('should wait at least X ms before exec', (done) => {
        const handler = new PressHandler(100);

        const start = new Date().getTime();

        handler.down();
        handler.up(() => {
            const elapsed = new Date().getTime() - start;
            assert.ok(elapsed >= 100, `Expected ${elapsed} to be greater than 100`);
            done();
        });
    });

    it('should exec immediately if X ms already elapsed', (done) => {
        const handler = new PressHandler(100);

        handler.down();

        setTimeout(() => {
            const start = new Date().getTime();
            handler.up(() => {
                const elapsed = new Date().getTime() - start;
                assert.ok(elapsed < 20, `Expected ${elapsed} to be lower than 20`);
                done();
            });
        }, 200);
    });
});
