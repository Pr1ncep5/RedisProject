import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  RestaurantSchema,
  ReviewSchema,
  type Restaurant,
  type Review,
} from "../schema";
import { initializeRedisClient } from "../utils/client";
import { nanoid } from "nanoid";
import {
  cuisineKey,
  cuisinesKey,
  restaurantCuisinesKeyById,
  restaurantKeyById,
  restaurantsByRatingKey,
  reviewDetailsKeyById,
  reviewKeyById,
} from "../utils/keys";
import { createErrorResponse, createSuccessResponse } from "../utils/responses";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId";

const app = new Hono();

app.get("/", async (c) => {
  const client = await initializeRedisClient();
  const { page = 1, limit = 10 } = c.req.query();

  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit);

  const restaurantIds = await client.zRange(
    restaurantsByRatingKey,
    start,
    end,
    {
      REV: true,
    }
  );
  const restaurants = await Promise.all(
    restaurantIds.map((id) => client.hGetAll(restaurantKeyById(id)))
  );

  const responseBody = createSuccessResponse(restaurants);
  return c.json(responseBody, 200);
});

app.post("/", zValidator("json", RestaurantSchema), async (c) => {
  const validated: Restaurant = c.req.valid("json");
  const client = await initializeRedisClient();

  const id = nanoid();
  const restaurantKey = restaurantKeyById(id);

  const hashData = {
    id: id,
    name: validated.name,
    location: validated.location,
  };

  await Promise.all([
    ...validated.cuisines.map((cuisine) =>
      Promise.all([
        client.sAdd(cuisinesKey, cuisine),
        client.sAdd(cuisineKey(cuisine), id),
        client.sAdd(restaurantCuisinesKeyById(id), cuisine),
      ])
    ),
    client.hSet(restaurantKey, hashData),
    client.zAdd(restaurantsByRatingKey, {
      score: 0,
      value: id,
    }),
  ]);

  const responseBody = createSuccessResponse(
    { id, key: restaurantKey },
    "New restaurant created and saved"
  );

  return c.json(responseBody, 201);
});

app.post(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  zValidator("json", ReviewSchema),
  async (c) => {
    const restaurantId = c.req.param("restaurantId");
    const data: Review = c.req.valid("json");
    const client = await initializeRedisClient();

    const reviewId = nanoid();
    const reviewKey = reviewKeyById(restaurantId);
    const reviewDetailsKey = reviewDetailsKeyById(reviewId);
    const restaurantKey = restaurantKeyById(restaurantId);

    const reviewData = {
      id: reviewId,
      review: data.review,
      rating: data.rating,
      timestamp: Date.now(),
      restaurantId,
    };

    const [reviewCount, setResult, totalStarsString] = await Promise.all([
      client.lPush(reviewKey, reviewId),
      client.hSet(reviewDetailsKey, reviewData),
      client.hIncrByFloat(restaurantKey, "totalStars", data.rating),
    ]);

    const numericTotalStars = parseFloat(totalStarsString);
    const averageRating = Number((numericTotalStars / reviewCount).toFixed(1));

    await Promise.all([
      client.zAdd(restaurantsByRatingKey, {
        score: averageRating,
        value: restaurantId,
      }),
      client.hSet(restaurantKey, "avgStars", averageRating),
    ]);

    const responseBody = createSuccessResponse(reviewData, "Review added");
    return c.json(responseBody, 201);
  }
);

app.get("/:restaurantId/reviews", checkRestaurantExists, async (c) => {
  const restaurantId = c.req.param("restaurantId");
  const client = await initializeRedisClient();
  const reviewKey = reviewKeyById(restaurantId);

  const { page = 1, limit = 10 } = c.req.query();
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit) - 1;

  const reviewIds = await client.lRange(reviewKey, start, end);
  const reviews = await Promise.all(
    reviewIds.map((id) => client.hGetAll(reviewDetailsKeyById(id)))
  );

  const responseBody = createSuccessResponse(reviews, "Reviews fetched");
  return c.json(responseBody, 200);
});

app.delete(
  "/:restaurantId/reviews/:reviewId",
  checkRestaurantExists,
  async (c) => {
    const restaurantId = c.req.param("restaurantId");
    const reviewId = c.req.param("reviewId");
    const client = await initializeRedisClient();

    const reviewKey = reviewKeyById(restaurantId);
    const reviewDetailsKey = reviewDetailsKeyById(reviewId);

    const [removeResult, deleteResult] = await Promise.all([
      client.lRem(reviewKey, 0, reviewId),
      client.del(reviewDetailsKey),
    ]);

    if (removeResult === 0 && deleteResult === 0) {
      const errorBody = createErrorResponse("Review not found");
      return c.json(errorBody, 404);
    }

    const responseBody = createSuccessResponse(
      {
        reviewId,
        listRemoved: removeResult > 0,
        hashDeleted: deleteResult > 0,
      },
      "Review deleted"
    );
    return c.json(responseBody, 200);
  }
);

app.get("/:restaurantId", checkRestaurantExists, async (c) => {
  const restaurantId = c.req.param("restaurantId");
  const client = await initializeRedisClient();

  const restaurantKey = restaurantKeyById(restaurantId);

  const [viewCount, restaurantData, cuisines] = await Promise.all([
    client.hIncrBy(restaurantKey, "viewCount", 1),
    client.hGetAll(restaurantKey),
    client.sMembers(restaurantCuisinesKeyById(restaurantId)),
  ]);

  const responseBody = createSuccessResponse({
    ...restaurantData,
    cuisines,
  });
  return c.json(responseBody, 200);
});

export default app;
