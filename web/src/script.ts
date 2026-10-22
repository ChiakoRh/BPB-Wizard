import { toFile, Uploadable } from "cloudflare";
import { CFAccount } from "./api";
import { randCode, randString } from "./random";

interface Script {
    script: Uploadable;
    path: string;
}

/**
 * Panel repositories the script is downloaded from, the fork first and the upstream
 * project as a fallback for as long as the fork has no release published.
 */
const PANEL_REPOSITORIES = [
    'https://github.com/ChiakoRh/BPB-Worker-Panel',
    'https://github.com/bia-pain-bache/BPB-Worker-Panel'
];

async function fetchFirstOk(urls: string[], description: string): Promise<Response> {
    let lastStatus = 0;
    let lastUrl = urls[0];

    for (const url of urls) {
        const res = await fetch(url);

        if (res.ok) return res;

        lastStatus = res.status;
        lastUrl = res.url || url;
    }

    throw new Error(`Failed to get ${description}: status ${lastStatus} at ${lastUrl}`);
}

export async function buildScript(
    account: CFAccount,
    workerName: string,
    subdomain: string,
    filename: string,
    preRelease: boolean
): Promise<Script> {
    const pathCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456780-_';
    const passCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&*_-+;:,.';
    const [panelRepository, fallbackPanelRepository] = PANEL_REPOSITORIES;

    let urls = [
        `${panelRepository}/releases/latest/download/worker.js`,
        `${fallbackPanelRepository}/releases/latest/download/worker.js`
    ];
    if (preRelease) {
        const res = await fetchFirstOk([
            `https://raw.githubusercontent.com/ChiakoRh/BPB-Worker-Panel/refs/heads/dev/package.json`,
            `https://raw.githubusercontent.com/bia-pain-bache/BPB-Worker-Panel/refs/heads/dev/package.json`
        ], 'pre-release script');

        const { version } = await res.json() as any;
        urls = [
            `${panelRepository}/releases/download/v${version}/worker.js`,
            `${fallbackPanelRepository}/releases/download/v${version}/worker.js`
        ];
    }

    const res = await fetchFirstOk(urls, 'panel script');

    const script = await res.text();
    const buildTimestamp = new Date().toISOString();
    const randomCode = randCode();
    const path = randString(pathCharset, 12, 16);

    const embededSettings = {
        accID: account.id,
        accEmail: account.email,
        apiToken: account.token,
        vlUUID: crypto.randomUUID(),
        trPass: randString(passCharset, 16, 20),
        securePath: path,
        proxyIpMode: 'proxyip',
        proxyIPs: [],
        prefixes: [],
        fallback: '',
        dohUrl: '',
        mainDomain: `${workerName}.${subdomain}`
    };

    const worker = [
        `// ${account.email}`,
        `// Build: ${buildTimestamp}`,
        '// @ts-nocheck',
        `${randomCode}const EMBEDED_SETTINGS = ${JSON.stringify(embededSettings)};${script}`
    ].join('\n');

    const file = new TextEncoder().encode(worker);
    const uploadable: Uploadable = await toFile(file, filename, {
        type: 'application/javascript+module',
    });

    return {
        script: uploadable,
        path: path
    }
}
