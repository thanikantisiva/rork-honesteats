import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { authRouter } from "./routes/auth";
import { restaurantsRouter } from "./routes/restaurants";
import { addressesRouter } from "./routes/addresses";
import { ordersRouter } from "./routes/orders";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  auth: authRouter,
  restaurants: restaurantsRouter,
  addresses: addressesRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;
