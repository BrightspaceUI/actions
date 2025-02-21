import * as cache from '@actions/cache';
import * as core from '@actions/core';

const runAttempt = process.env.GITHUB_RUN_ATTEMPT;
const runId = process.env.GITHUB_RUN_ID;

const paths = ['.d2l-test'];
const key = `d2l-test-${ runId }-${ runAttempt }`

const cacheId = await cache.saveCache(paths, key);

core.info(`Saved cache with key: ${key}`);
