import { strict as assert } from "node:assert/strict";
import {
  decodeFilter,
  encodeFilter,
  getManyInput,
  validateFilter,
  type WhereNode,
} from "@sparkyidea/dataview-core";
import { buildSort, buildWhere } from "@sparkyidea/dataview-drizzle";
import { createDataViewParamsCache } from "@sparkyidea/dataview-react/nuqs/server";
import { integer, PgDialect, pgTable, text } from "drizzle-orm/pg-core";

const products = pgTable("products", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price"),
});

const properties = [
  { id: "name", key: "name", name: "Name", type: "text" },
  { id: "price", key: "price", name: "Price", type: "number" },
] as const;

const filter: WhereNode[] = [{ property: "price", condition: "gt", value: 10 }];

// URL codec round trip
const encoded = encodeFilter(filter);
assert.deepEqual(decodeFilter(encoded), filter);

// Validation keeps known properties
assert.deepEqual(validateFilter(filter, properties), filter);

// Transport schema accepts the filter
const input = getManyInput.parse({ filter, limit: 25, sort: [] });
assert.equal(input.limit, 25);

// SQL builders produce PostgreSQL
const dialect = new PgDialect();
const where = buildWhere(products, filter);
assert.ok(where, "buildWhere returned no SQL");
const { sql, params } = dialect.sqlToQuery(where);
assert.match(sql, /"price"/);
assert.deepEqual(params, [10]);
assert.ok(buildSort(products, [{ property: "name", direction: "asc" }]));

// Server params cache with a URL prefix
const cache = createDataViewParamsCache({ urlPrefix: "orders." });
const parsed = cache.parse({ "orders.filter": encoded, "orders.limit": "50" });
assert.deepEqual(parsed.filter, filter);
assert.equal(parsed.limit, 50);

console.log("server fixture ok");
