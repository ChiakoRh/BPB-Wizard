import { test } from 'node:test';
import assert from 'node:assert/strict';

import { nodejsCompatFlags } from './compat.ts';

/**
 * Compatibility flags that Cloudflare enables by default from a given compatibility date.
 * Sending one of them together with such a date is rejected by the Workers runtime and
 * prevents the Worker from starting (Cloudflare error 1101).
 */
const FLAGS_ENABLED_BY_DATE = [
    { flag: 'nodejs_compat', since: '2026-08-04' }
];

test('compatibility date with Node.js compatibility enabled by default omits the flag', () => {
    assert.deepEqual(nodejsCompatFlags('2026-10-22'), []);
});

test('the default-on boundary date omits the flag', () => {
    assert.deepEqual(nodejsCompatFlags('2026-08-04'), []);
});

test('older compatibility dates still request Node.js compatibility', () => {
    assert.deepEqual(nodejsCompatFlags('2026-08-03'), ['nodejs_compat']);
    assert.deepEqual(nodejsCompatFlags('2024-09-23'), ['nodejs_compat']);
});

test('an unparsable compatibility date keeps requesting Node.js compatibility', () => {
    assert.deepEqual(nodejsCompatFlags('not-a-date'), ['nodejs_compat']);
});

test('no flag that the compatibility date already enables is ever sent', () => {
    const dates = ['2024-09-23', '2026-08-03', '2026-08-04', '2026-08-05', '2026-10-22', '2027-01-01'];

    for (const date of dates) {
        const flags = nodejsCompatFlags(date);

        for (const { flag, since } of FLAGS_ENABLED_BY_DATE) {
            if (date >= since) {
                assert.ok(
                    !flags.includes(flag),
                    `"${flag}" must not be sent for compatibility date "${date}"`
                );
            }
        }
    }
});
