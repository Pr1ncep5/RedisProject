export function getKeyName(...args: string[]) {
  return `redisRestaurant:${args.join(":")}`;
}

export const restaurantKeyById = (id: string) => getKeyName("restaurants", id);
export const reviewKeyById = (id: string) => getKeyName("reviews", id);
export const reviewDetailsKeyById = (id: string) =>
  getKeyName("review_details", id);

export const cuisinesKey = getKeyName("cuisines");
export const cuisineKey = (cuisineName: string) =>
  getKeyName("cuisine", cuisineName);
export const restaurantCuisinesKeyById = (id: string) =>
  getKeyName("restaurant_cuisines", id);

export const restaurantsByRatingKey = getKeyName("restaurants_by_rating");
