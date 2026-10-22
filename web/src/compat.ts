/**
 * nodejsCompatDefaultSince is the compatibility date from which Cloudflare enables the
 * nodejs_compat (and nodejs_compat_v2) compatibility flags by default. The flags must be
 * omitted for such dates, because the runtime rejects them as redundant and refuses to
 * start the Worker, which Cloudflare reports as error 1101.
 */
const NODEJS_COMPAT_DEFAULT_SINCE = '2026-08-04';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * nodejsCompatFlags returns the compatibility flags required for the given compatibility
 * date. The nodejs_compat flag is only needed for dates before 2026-08-04.
 */
export function nodejsCompatFlags(compatibilityDate: string): string[] {
    if (!ISO_DATE_PATTERN.test(compatibilityDate) || compatibilityDate < NODEJS_COMPAT_DEFAULT_SINCE) {
        return ['nodejs_compat'];
    }

    return [];
}
