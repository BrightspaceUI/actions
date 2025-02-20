import cache from '@actions/cache';
import { context } from '@actions/github';

const paths = ['.d2l-test'];
const key = `d2l-test-${ context.run_id }-${ context.run_attempt }`
const restoreKeys = [
    `d2l-test-${ github.run_id }-`
]
const cacheKey = await cache.restoreCache(paths, key, restoreKeys)
