const core = globalThis.__bootstrap;

import { createStdin, createStdout, createStderr } from './stdio.js';

// The "tjs" global.
//

const tjs = Object.create(null);
const noExport = [
    'TTY',
    'Worker',
    'XMLHttpRequest',
    'clearInterval',
    'clearTimeout',
    'evalScript',
    'guessHandle',
    'hrtimeMs',
    'loadScript',
    'random',
    'setInterval',
    'setTimeout',
    'wasm'
];

for (const [key, value] of Object.entries(core)) {
    if (noExport.includes(key)) {
        continue;
    }

    tjs[key] = value;
}

// These values should be immutable.
tjs.args = Object.freeze(core.args);
tjs.versions = Object.freeze(core.versions);

// For the REPL.
Object.defineProperty(tjs, '__evalScript', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: core.evalScript
});
Object.defineProperty(tjs, '__loadScript', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: core.loadScript
});

// Stdio.
Object.defineProperty(tjs, 'stdin', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: createStdin()
});
Object.defineProperty(tjs, 'stdout', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: createStdout()
});
Object.defineProperty(tjs, 'stderr', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: createStderr()
});

// tjs global.
Object.defineProperty(globalThis, 'tjs', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: Object.freeze(tjs)
});
