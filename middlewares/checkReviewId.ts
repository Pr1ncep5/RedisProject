import type { MiddlewareHandler } from "hono";
import { createErrorResponse } from "../utils/responses";
import { initializeRedisClient } from "../utils/client";
import { reviewDetailsKeyById } from "../utils/keys";

export const checkReviewExists: MiddlewareHandler = async (c, next) => {
  const reviewId = c.req.param("reviewId");

  if (!reviewId) {
    const errorBody = createErrorResponse("Review ID not provided");
    return c.json(errorBody, 400);
  }

  const client = await initializeRedisClient();
  const reviewDetailsKey = reviewDetailsKeyById(reviewId);

  const exists = await client.exists(reviewDetailsKey);

  if (!exists) {
    const errorBody = createErrorResponse("Review was not found");
    return c.json(errorBody, 404);
  }

  await next();
};
