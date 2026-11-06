import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SERVER_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  },
  emptyStringAsUndefined: true,
  // Builds and typechecks (next typegen loads next.config) run without env
  skipValidation: ["build", "check-types"].includes(
    process.env.npm_lifecycle_event ?? ""
  ),
});
