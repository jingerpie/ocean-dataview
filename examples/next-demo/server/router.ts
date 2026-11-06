import { productRouter } from "./product-router";
import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  product: productRouter,
});

export type AppRouter = typeof appRouter;
