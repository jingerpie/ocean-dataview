import { publicProcedure, router } from "../index";
import { productRouter } from "./product";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  product: productRouter,
});
export type AppRouter = typeof appRouter;
