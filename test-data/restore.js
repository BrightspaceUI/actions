import { context } from '@actions/github';
import cache from '@actions/cache';
const paths = ['.d2l-test'];
const key = `d2l-test-${ context.run_id }-${ context.run_attempt }`

const cacheId = await cache.saveCache(paths, key);
