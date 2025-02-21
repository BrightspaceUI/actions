import * as cache from '@actions/cache';
import * as github from '@actions/github';

const runAttempt = process.env.GITHUB_RUN_ATTEMPT;

const paths = ['.d2l-test'];
const key = `d2l-test-${ github.context.runId }-${ runAttempt }`

const cacheId = await cache.saveCache(paths, key);
