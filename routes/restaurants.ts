import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { RestaurantSchema } from "../schema";

const app = new Hono();

app.get("/", async (c) => {
  return c.text("Hello, test from restaurants");
});

app.post("/", zValidator("json", RestaurantSchema), async (c) => {
  const validated = c.req.valid("json");
  return c.text("Data validated and received");
});

export default app;
