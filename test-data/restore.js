import * as github from '@actions/github';
import * as cache from '@actions/cache';
const paths = ['.d2l-test'];
const key = `d2l-test-${ github.context.runId }-${ github.context.runNumber }`

const cacheId = await cache.saveCache(paths, key);
