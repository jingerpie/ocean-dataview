import dotenv from "dotenv";

dotenv.config({ path: "../../apps/server/.env" });

// Dynamic imports - these run AFTER dotenv.config()
const { db } = await import("../index");
const { product } = await import("../schema/product");
const productsData = (await import("./products.json")).default;

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

async function seed() {
  console.log("Seeding product table...");

  const products = (productsData as ProductJson[]).map((p) => ({
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

  await db.insert(product).values(products);

  console.log(`Inserted ${products.length} products`);
}

seed()
  .then(() => {
    console.log("Seed completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
