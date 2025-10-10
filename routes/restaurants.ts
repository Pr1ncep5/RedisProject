import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => {
  return c.text("Hello, test from restaurants");
});

export default app;
