import * as cache from '@actions/cache';
import * as github from '@actions/github';

const paths = ['.d2l-test'];
const key = `d2l-test-${ github.context.runId }-${ github.context.runNumber }`

const cacheId = await cache.saveCache(paths, key);
