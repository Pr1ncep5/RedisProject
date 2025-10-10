import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { RestaurantSchema } from "../schema";
import { initializeRedisClient } from "../utils/client";

const app = new Hono();

app.get("/", async (c) => {
  return c.text("Hello, test from restaurants");
});

app.post("/", zValidator("json", RestaurantSchema), async (c) => {
  const validated = c.req.valid("json");
  const client = await initializeRedisClient();

  return c.text("Data validated and received, Redis client initialized");
});

export default app;
