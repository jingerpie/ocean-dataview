import { llms } from "fumadocs-core/source";

import { source } from "@/lib/docs/source";

export const revalidate = false;

export function GET() {
  return new Response(llms(source).index());
}
