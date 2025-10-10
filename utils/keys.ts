export function getKeyName(...args: string[]) {
  return `redisRestaurant:${args.join(":")}`;
}
