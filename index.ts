import { Hono } from "hono";
import { createErrorResponse } from "./src/utils/responses";
import restaurantsRouter from "./src/routes/restaurants";
import cuisinesRouter from "./src/routes/cuisines";

const PORT = parseInt(process.env.PORT || "3000");

const app = new Hono();

app.route("/restaurants", restaurantsRouter);
app.route("/cuisines", cuisinesRouter);

app.onError((err, c) => {
  console.error(`Application Error: ${err.message}`, err.stack);

  const errorBody = createErrorResponse("Internal Server Error");

  return c.json(errorBody, 500);
});

app.notFound((c) => {
  const errorBody = createErrorResponse("Not Found");
  return c.json(errorBody, 404);
});

console.log(`Application running on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
