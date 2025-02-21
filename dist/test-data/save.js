import { c as cacheExports, a as coreExports } from './core-DwZKyrm2.js';
import 'path';
import 'fs';
import 'assert';
import 'os';
import 'crypto';
import 'util';
import 'url';
import 'node:os';
import 'node:util';
import 'node:process';
import 'node:http';
import 'node:https';
import 'node:zlib';
import 'node:stream';
import 'net';
import 'tls';
import 'tty';
import 'http';
import 'https';
import 'events';
import 'stream';
import 'buffer';
import 'querystring';
import 'stream/web';
import 'node:events';
import 'worker_threads';
import 'perf_hooks';
import 'util/types';
import 'async_hooks';
import 'console';
import 'zlib';
import 'string_decoder';
import 'diagnostics_channel';
import 'child_process';
import 'timers';

const runAttempt = process.env.GITHUB_RUN_ATTEMPT;
const runId = process.env.GITHUB_RUN_ID;

const paths = ['.d2l-test'];
const key = `d2l-test-${ runId }-${ runAttempt }`;

const cacheId = await cacheExports.saveCache(paths, key);

if (cacheId != -1) {
  coreExports.info(`Saved cache with key: ${key}`);
}
