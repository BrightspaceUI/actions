import * as cache from '@actions/cache';
import * as core from '@actions/core';

const runAttempt = process.env.GITHUB_RUN_ATTEMPT;
const runId = process.env.GITHUB_RUN_ID;

const paths = ['.d2l-test'];
const key = `d2l-test-${ runId }-${ runAttempt - 1 }`
const restoreKeys = [
    `d2l-test-${ runId }-`
]
const cacheKey = await cache.restoreCache(paths, key, restoreKeys);

if (!cacheKey) {
  core.info(`Cache not found for input keys: ${[ key, ...restoreKeys ].join(", ")}`);
} else {
  core.info(`Restored cache with key: ${cacheKey}`);
}
