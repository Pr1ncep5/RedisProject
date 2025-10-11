export function getKeyName(...args: string[]) {
  return `redisRestaurant:${args.join(":")}`;
}

export const restaurantKeyById = (id: string) => getKeyName("restaurants", id);