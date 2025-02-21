import * as cache from '@actions/cache';
import * as github from '@actions/github';
import * as core from '@actions/core';

const runAttempt = process.env.GITHUB_RUN_ATTEMPT;

core.info(github.context.runAttempt);
core.info(process.env.GITHUB_RUN_ATTEMPT);

core.info(process.env);

const paths = ['.d2l-test'];
const key = `d2l-test-${ github.context.runId }-${ runAttempt }`
const restoreKeys = [
    `d2l-test-${ github.context.runId }-`
]
const cacheKey = await cache.restoreCache(paths, key, restoreKeys)
