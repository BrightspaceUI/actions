import * as cache from '@actions/cache';
import * as github from '@actions/github';

const paths = ['.d2l-test'];
const key = `d2l-test-${ github.context.runId }-${ github.context.runNumber }`
const restoreKeys = [
    `d2l-test-${ github.context.runId }-`
]
const cacheKey = await cache.restoreCache(paths, key, restoreKeys)
