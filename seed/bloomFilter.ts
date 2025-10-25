import { initializeRedisClient } from "../utils/client";
import { restaurantsBloomKey } from "../utils/keys";

async function createBloomFilter() {
  const client = await initializeRedisClient();

  await Promise.all([
    client.del(restaurantsBloomKey),
    client.bf.reserve(restaurantsBloomKey, 0.0001, 1000000),
  ]);
}

await createBloomFilter();
process.exit();
