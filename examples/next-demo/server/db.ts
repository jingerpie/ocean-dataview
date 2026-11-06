import "server-only";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import productsData from "@/data/products.json";
import { product } from "./schema";

interface ProductJson {
  Availability: string;
  Category: string;
  Featured: boolean;
  "Last Restocked": string;
  Price: number;
  "Product Image": string;
  "Product Link": string;
  "Product Name": string;
  Rating: number;
  "Stock Level": number;
  "Supplier Email": string;
  "Supplier Phone": string;
  Tags: string[];
}

const CREATE_PRODUCT_TABLE = `
  CREATE TABLE IF NOT EXISTS product (
    id serial PRIMARY KEY,
    product_name varchar(255),
    price double precision,
    stock_level integer,
    rating integer,
    category varchar(100),
    tags text[],
    availability varchar(50),
    last_restocked date,
    featured boolean,
    product_link text,
    product_image text,
    supplier_phone varchar(50),
    supplier_email varchar(255),
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
  )
`;

const SEED_BATCH = 500;

/**
 * In-process Postgres (PGlite) seeded from data/products.json on first use.
 * Data lives in memory: it resets on restart, and each server process has
 * its own copy.
 */
function createDb() {
  const client = new PGlite();
  const instance = drizzle({ client, schema: { product } });
  const ready = (async () => {
    await client.exec(CREATE_PRODUCT_TABLE);
    const rows = (productsData as ProductJson[]).map((p) => ({
      productName: p["Product Name"],
      price: p.Price,
      stockLevel: p["Stock Level"],
      rating: p.Rating,
      category: p.Category,
      tags: p.Tags,
      availability: p.Availability,
      lastRestocked: p["Last Restocked"],
      featured: p.Featured,
      productLink: p["Product Link"],
      productImage: p["Product Image"],
      supplierPhone: p["Supplier Phone"],
      supplierEmail: p["Supplier Email"],
    }));
    await instance.transaction(async (tx) => {
      for (let i = 0; i < rows.length; i += SEED_BATCH) {
        await tx.insert(product).values(rows.slice(i, i + SEED_BATCH));
      }
    });
  })();
  return { instance, ready };
}

// Reuse one database across hot reloads in development.
const globalForDb = globalThis as unknown as {
  dataviewDemoDb?: ReturnType<typeof createDb>;
};
const created = globalForDb.dataviewDemoDb ?? createDb();
globalForDb.dataviewDemoDb = created;

export const db = created.instance;
/** Resolves once the schema exists and the seed data is loaded. */
export const dbReady = created.ready;
