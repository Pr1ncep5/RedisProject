import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { RestaurantSchema } from "../schema";
import { initializeRedisClient } from "../utils/client";
import { nanoid } from "nanoid";
import { restaurantKeyById } from "../utils/keys";
import { createSuccessResponse } from "../utils/responses";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId";

const app = new Hono();

app.get("/:restaurantId", checkRestaurantExists, async (c) => {
  const restaurantId = c.req.param("restaurantId");
  const client = await initializeRedisClient();

  const restaurantKey = restaurantKeyById(restaurantId);

  const [viewCount, restaurantData] = await Promise.all([
    client.hIncrBy(restaurantKey, "viewCount", 1),
    client.hGetAll(restaurantKey),
  ]);

  const responseBody = createSuccessResponse(restaurantData);
  return c.json(responseBody, 200);
});

app.post("/", zValidator("json", RestaurantSchema), async (c) => {
  const validated = c.req.valid("json");
  const client = await initializeRedisClient();

  const id = nanoid();
  const restaurantKey = restaurantKeyById(id);

  const hashData = {
    id: id,
    name: validated.name,
    location: validated.location,
  };

  const addResult = await client.hSet(restaurantKey, hashData);
  console.log(`Added ${addResult} fields to Redis Key: ${restaurantKey}`);

  const responseBody = createSuccessResponse(
    { id, key: restaurantKey },
    "New restaurant created and saved"
  );

  return c.json(responseBody, 201);
});

export default app;
