import dotenv from "dotenv";

dotenv.config({ path: "../../apps/server/.env" });

// Dynamic imports - these run AFTER dotenv.config()
const { db } = await import("../index");
const { product } = await import("../schema/product");
const productsData = (await import("./products.json")).default;

interface ProductJson {
  "Product Name": string;
  Price: number;
  "Stock Level": number;
  Rating: number;
  Category: string;
  Tags: string[];
  Availability: string;
  "Last Restocked": string;
  Featured: boolean;
  "Product Link": string;
  "Product Image": string;
  "Supplier Phone": string;
  "Supplier Email": string;
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
