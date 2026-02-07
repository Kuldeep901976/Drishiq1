/**
 * Custom Worker Entrypoint
 * Extends OpenNext worker with custom Durable Objects
 * 
 * This file wraps the OpenNext worker and exports ConversationDO
 * so it can be used by wrangler.toml
 */

// Import OpenNext worker (generated)
// @ts-expect-error: Will be resolved by wrangler build
import openNextWorker from './.open-next/worker.js';

// Export our custom Durable Object
export { ConversationDO } from './functions/durable-objects/ConversationDO';

// Re-export OpenNext Durable Objects
// @ts-expect-error: Will be resolved by wrangler build
export { DOQueueHandler } from './.open-next/.build/durable-objects/queue.js';
// @ts-expect-error: Will be resolved by wrangler build
export { DOShardedTagCache } from './.open-next/.build/durable-objects/sharded-tag-cache.js';
// @ts-expect-error: Will be resolved by wrangler build
export { BucketCachePurge } from './.open-next/.build/durable-objects/bucket-cache-purge.js';

// Export the default worker handler
export default openNextWorker;

