/**
 * Database seed script.
 *
 * Populates the database with demo data: categories, brands, products,
 * an admin account, shipping zones/methods, and a couple of coupons.
 *
 * Usage:
 *   npx tsx src/db/seed/index.ts
 *
 * Safe to re-run: it checks for existing rows (by slug/email/code) and
 * skips ones that already exist instead of creating duplicates.
 */
import "dotenv/config";
import { db, pool } from "@/db";
import { categories, brands, products, users, shippingZones, shippingMethods, coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { generateId } from "@/lib/utils";

async function upsertCategory(data: {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
}) {
  const existing = await db.select().from(categories).where(eq(categories.slug, data.slug)).limit(1);
  if (existing[0]) return existing[0].id;

  const id = generateId("cat");
  await db.insert(categories).values({
    id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    image: data.image,
    level: 0,
    sortOrder: data.sortOrder,
    isActive: true,
  });
  return id;
}

async function upsertBrand(data: { name: string; slug: string; description: string; logo: string; sortOrder: number }) {
  const existing = await db.select().from(brands).where(eq(brands.slug, data.slug)).limit(1);
  if (existing[0]) return existing[0].id;

  const id = generateId("brd");
  await db.insert(brands).values({
    id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    logo: data.logo,
    isActive: true,
    sortOrder: data.sortOrder,
  });
  return id;
}

async function upsertProduct(data: {
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  brandId: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  tags: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
}) {
  const existing = await db.select().from(products).where(eq(products.slug, data.slug)).limit(1);
  if (existing[0]) return existing[0].id;

  const id = generateId("prd");
  await db.insert(products).values({
    id,
    name: data.name,
    slug: data.slug,
    sku: data.sku,
    description: data.description,
    categoryId: data.categoryId,
    brandId: data.brandId,
    status: "active",
    price: data.price.toFixed(2),
    compareAtPrice: data.compareAtPrice ? data.compareAtPrice.toFixed(2) : null,
    stock: data.stock,
    lowStockThreshold: 10,
    images: data.images,
    thumbnail: data.images[0],
    tags: data.tags,
    colors: [],
    sizes: [],
    isFeatured: !!data.isFeatured,
    isNewArrival: !!data.isNewArrival,
    isBestSeller: !!data.isBestSeller,
    isOnSale: !!data.isOnSale,
    rating: "0",
    reviewCount: 0,
    soldCount: Math.floor(Math.random() * 200),
    publishedAt: new Date(),
  });
  return id;
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@shopelite.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const isLocalDb = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(process.env.DATABASE_URL || "");

  // Never create a well-known admin login on a remote (public) database
  if (!password && !isLocalDb) {
    console.log("  admin NOT created: set ADMIN_PASSWORD (and optionally ADMIN_EMAIL) to create one on a remote database");
    return;
  }
  if (password && password.length < 8) {
    console.log("  admin NOT created: ADMIN_PASSWORD must be at least 8 characters");
    return;
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    console.log(`  admin already exists (${email})`);
    return;
  }

  const passwordHash = await hashPassword(password || "Admin123!");
  await db.insert(users).values({
    id: generateId("usr"),
    email,
    emailVerified: true,
    name: "Admin User",
    firstName: "Admin",
    lastName: "User",
    role: "super_admin",
    passwordHash,
    isActive: true,
  });
  console.log(password ? `  created admin: ${email}` : `  created admin: ${email} / Admin123! (local database only)`);
}

async function seedShipping() {
  const existingZone = await db.select().from(shippingZones).limit(1);
  if (existingZone[0]) {
    console.log("  delivery companies already exist, skipping");
    return;
  }

  const zoneId = generateId("shz");
  await db.insert(shippingZones).values({
    id: zoneId,
    name: "Algérie",
    countries: ["DZ"],
    states: [],
    isActive: true,
  });

  await db.insert(shippingMethods).values([
    {
      id: generateId("shm"),
      zoneId,
      name: "Rapid Livraison",
      description: "Livraison à domicile, paiement à la réception",
      type: "flat_rate",
      price: "400.00",
      estimatedDays: 3,
      isActive: true,
    },
    {
      id: generateId("shm"),
      zoneId,
      name: "Star Delivery Express",
      description: "Livraison rapide sous 24-48h",
      type: "flat_rate",
      price: "600.00",
      estimatedDays: 2,
      isActive: true,
    },
    {
      id: generateId("shm"),
      zoneId,
      name: "Confort Express (Bureau)",
      description: "Retrait au bureau de livraison le plus proche",
      type: "flat_rate",
      price: "300.00",
      estimatedDays: 4,
      isActive: true,
    },
  ]);
  console.log("  created 1 zone (Algérie), 3 delivery companies");
}

async function seedCoupons() {
  const items = [
    {
      code: "WELCOME10",
      type: "percentage" as const,
      value: "10.00",
      minimumAmount: "0",
      description: "10% off your first order",
    },
    {
      code: "SAVE20",
      type: "fixed" as const,
      value: "2000.00",
      minimumAmount: "15000.00",
      description: "2000 DA de réduction dès 15000 DA d'achat",
    },
  ];

  for (const item of items) {
    const existing = await db.select().from(coupons).where(eq(coupons.code, item.code)).limit(1);
    if (existing[0]) continue;
    await db.insert(coupons).values({
      id: generateId("cpn"),
      code: item.code,
      type: item.type,
      value: item.value,
      minimumAmount: item.minimumAmount,
      description: item.description,
      isActive: true,
      applicableCategories: [],
      applicableProducts: [],
    });
  }
  console.log(`  created/verified ${items.length} coupons`);
}

async function main() {
  console.log("Seeding database...\n");

  console.log("Categories:");
  const categoryData = [
    { name: "Souris", slug: "souris", description: "Souris gaming filaires et sans fil, capteurs haute précision", image: "https://picsum.photos/seed/cat-souris/800/800", sortOrder: 1 },
    { name: "Claviers", slug: "claviers", description: "Claviers mécaniques et membranes pour le gaming et la productivité", image: "https://picsum.photos/seed/cat-claviers/800/800", sortOrder: 2 },
    { name: "Casques & Audio", slug: "casques-audio", description: "Casques gaming, écouteurs et microphones", image: "https://picsum.photos/seed/cat-casques-audio/800/800", sortOrder: 3 },
    { name: "Manettes", slug: "manettes", description: "Manettes filaires et sans fil pour PC et consoles", image: "https://picsum.photos/seed/cat-manettes/800/800", sortOrder: 4 },
    { name: "Webcams", slug: "webcams", description: "Webcams streaming haute définition", image: "https://picsum.photos/seed/cat-webcams/800/800", sortOrder: 5 },
    { name: "Moniteurs", slug: "moniteurs", description: "Écrans gaming haute fréquence de rafraîchissement", image: "https://picsum.photos/seed/cat-moniteurs/800/800", sortOrder: 6 },
    { name: "Tapis de Souris", slug: "tapis-de-souris", description: "Tapis de souris contrôle et vitesse, formats standards et XXL", image: "https://picsum.photos/seed/cat-tapis/800/800", sortOrder: 7 },
    { name: "Refroidissement PC", slug: "refroidissement-pc", description: "Ventilateurs, watercooling AIO et pâtes thermiques", image: "https://picsum.photos/seed/cat-refroidissement/800/800", sortOrder: 8 },
    { name: "Accessoires & Câbles", slug: "accessoires-cables", description: "Hubs, câbles tressés, docks de charge et autres accessoires", image: "https://picsum.photos/seed/cat-accessoires/800/800", sortOrder: 9 },
  ];
  const categoryIds: Record<string, string> = {};
  for (const c of categoryData) {
    categoryIds[c.slug] = await upsertCategory(c);
    console.log(`  ${c.name}`);
  }

  console.log("\nBrands:");
  const brandData = [
    { name: "Voidtech", slug: "voidtech", description: "Périphériques gaming haute performance", logo: "https://api.dicebear.com/7.x/initials/svg?seed=Voidtech", sortOrder: 1 },
    { name: "NovaStrike", slug: "novastrike", description: "Équipement esports ultra-légers et compétitifs", logo: "https://api.dicebear.com/7.x/initials/svg?seed=NovaStrike", sortOrder: 2 },
    { name: "Ironclad", slug: "ironclad", description: "Claviers mécaniques et refroidissement robustes", logo: "https://api.dicebear.com/7.x/initials/svg?seed=Ironclad", sortOrder: 3 },
    { name: "Apex Gear", slug: "apex-gear", description: "Accessoires gaming polyvalents pour tous les setups", logo: "https://api.dicebear.com/7.x/initials/svg?seed=ApexGear", sortOrder: 4 },
  ];
  const brandIds: Record<string, string> = {};
  for (const b of brandData) {
    brandIds[b.slug] = await upsertBrand(b);
    console.log(`  ${b.name}`);
  }

  console.log("\nProducts:");
  const productData = [
    {
      name: "Voidtech Vortex Pro - Souris Gaming Sans Fil",
      slug: "voidtech-vortex-pro-souris-sans-fil",
      sku: "VDT-MS-001",
      description: "Souris gaming sans fil avec capteur optique 26000 DPI, switches optiques et 70h d'autonomie.",
      categoryId: categoryIds["souris"],
      brandId: brandIds["voidtech"],
      price: 10500,
      compareAtPrice: 12900,
      stock: 85,
      images: ["https://picsum.photos/seed/voidtech-vortex-pro/800/800"],
      tags: ["souris", "sans-fil", "esports"],
      isFeatured: true,
      isOnSale: true,
    },
    {
      name: "NovaStrike Talon - Souris Ultra-Légère",
      slug: "novastrike-talon-souris-ultra-legere",
      sku: "NVS-MS-002",
      description: "Souris ultra-legere 59g avec coque perforée, pensée pour la compétition esports.",
      categoryId: categoryIds["souris"],
      brandId: brandIds["novastrike"],
      price: 7900,
      stock: 100,
      images: ["https://picsum.photos/seed/novastrike-talon/800/800"],
      tags: ["souris", "ultra-legere", "esports"],
      isNewArrival: true,
      isBestSeller: true,
    },
    {
      name: "Ironclad Sentinel - Clavier Mécanique Hot-Swap",
      slug: "ironclad-sentinel-clavier-mecanique",
      sku: "IRC-KB-001",
      description: "Clavier mecanique hot-swappable avec châssis aluminium, switches linéaires et rétroéclairage RGB.",
      categoryId: categoryIds["claviers"],
      brandId: brandIds["ironclad"],
      price: 19500,
      compareAtPrice: 23400,
      stock: 50,
      images: ["https://picsum.photos/seed/ironclad-sentinel/800/800"],
      tags: ["clavier", "mecanique", "hot-swap"],
      isFeatured: true,
      isOnSale: true,
      isBestSeller: true,
    },
    {
      name: "Apex Gear Striker TKL - Clavier Compact",
      slug: "apex-gear-striker-tkl-clavier",
      sku: "APX-KB-002",
      description: "Clavier mecanique format TKL, compact et réactif, idéal pour un setup épuré.",
      categoryId: categoryIds["claviers"],
      brandId: brandIds["apex-gear"],
      price: 11900,
      stock: 70,
      images: ["https://picsum.photos/seed/apex-gear-striker-tkl/800/800"],
      tags: ["clavier", "tkl", "compact"],
      isNewArrival: true,
    },
    {
      name: "Voidtech Aether - Casque Gaming Sans Fil",
      slug: "voidtech-aether-casque-sans-fil",
      sku: "VDT-HS-002",
      description: "Casque gaming sans fil avec son surround 7.1, micro amovible et coussinets à mémoire de forme.",
      categoryId: categoryIds["casques-audio"],
      brandId: brandIds["voidtech"],
      price: 16900,
      stock: 60,
      images: ["https://picsum.photos/seed/voidtech-aether/800/800"],
      tags: ["casque", "sans-fil", "surround"],
      isBestSeller: true,
    },
    {
      name: "NovaStrike Echo Pro - Écouteurs Intra-Auriculaires",
      slug: "novastrike-echo-pro-ecouteurs",
      sku: "NVS-EB-003",
      description: "Ecouteurs intra-auriculaires filaires basse latence, idéaux pour le gaming mobile et compétitif.",
      categoryId: categoryIds["casques-audio"],
      brandId: brandIds["novastrike"],
      price: 5900,
      compareAtPrice: 7300,
      stock: 90,
      images: ["https://picsum.photos/seed/novastrike-echo-pro/800/800"],
      tags: ["ecouteurs", "basse-latence"],
      isOnSale: true,
    },
    {
      name: "Apex Gear Vox - Microphone USB",
      slug: "apex-gear-vox-microphone-usb",
      sku: "APX-MC-004",
      description: "Microphone USB a condensateur avec support anti-choc et filtre anti-pop intégré, pour streaming et podcast.",
      categoryId: categoryIds["casques-audio"],
      brandId: brandIds["apex-gear"],
      price: 9100,
      stock: 55,
      images: ["https://picsum.photos/seed/apex-gear-vox/800/800"],
      tags: ["microphone", "streaming"],
      isNewArrival: true,
    },
    {
      name: "NovaStrike Pulse - Manette Sans Fil",
      slug: "novastrike-pulse-manette-sans-fil",
      sku: "NVS-CT-001",
      description: "Manette sans fil avec joysticks à effet Hall, gâchettes ajustables et compatibilité PC/consoles.",
      categoryId: categoryIds["manettes"],
      brandId: brandIds["novastrike"],
      price: 8500,
      stock: 75,
      images: ["https://picsum.photos/seed/novastrike-pulse/800/800"],
      tags: ["manette", "sans-fil"],
      isFeatured: true,
    },
    {
      name: "Voidtech Ranger Pro - Manette Filaire",
      slug: "voidtech-ranger-pro-manette-filaire",
      sku: "VDT-CT-003",
      description: "Manette filaire robuste avec retour haptique et boutons arrière programmables.",
      categoryId: categoryIds["manettes"],
      brandId: brandIds["voidtech"],
      price: 5200,
      stock: 95,
      images: ["https://picsum.photos/seed/voidtech-ranger-pro/800/800"],
      tags: ["manette", "filaire"],
    },
    {
      name: "Apex Gear StreamCam 4K",
      slug: "apex-gear-streamcam-4k",
      sku: "APX-WC-005",
      description: "Webcam 4K30 avec autofocus rapide et correction de lumière automatique, pensee pour le streaming.",
      categoryId: categoryIds["webcams"],
      brandId: brandIds["apex-gear"],
      price: 13000,
      compareAtPrice: 15900,
      stock: 40,
      images: ["https://picsum.photos/seed/apex-gear-streamcam/800/800"],
      tags: ["webcam", "streaming", "4k"],
      isOnSale: true,
      isNewArrival: true,
    },
    {
      name: "Voidtech Horizon 27\" - Écran Gaming 165Hz",
      slug: "voidtech-horizon-27-ecran-165hz",
      sku: "VDT-MN-004",
      description: "Ecran gaming 27 pouces QHD 165Hz, dalle IPS avec temps de réponse 1ms et compatibilite FreeSync.",
      categoryId: categoryIds["moniteurs"],
      brandId: brandIds["voidtech"],
      price: 45900,
      stock: 25,
      images: ["https://picsum.photos/seed/voidtech-horizon-27/800/800"],
      tags: ["moniteur", "165hz", "qhd"],
      isFeatured: true,
      isBestSeller: true,
    },
    {
      name: "Ironclad Vision 24\" - Écran Esports 240Hz",
      slug: "ironclad-vision-24-ecran-240hz",
      sku: "IRC-MN-002",
      description: "Ecran esports 24 pouces Full HD 240Hz, optimisé pour la réactivité en compétition.",
      categoryId: categoryIds["moniteurs"],
      brandId: brandIds["ironclad"],
      price: 36500,
      compareAtPrice: 41500,
      stock: 20,
      images: ["https://picsum.photos/seed/ironclad-vision-24/800/800"],
      tags: ["moniteur", "240hz", "esports"],
      isOnSale: true,
    },
    {
      name: "NovaStrike Glide XXL - Tapis de Souris",
      slug: "novastrike-glide-xxl-tapis-souris",
      sku: "NVS-MP-002",
      description: "Tapis de souris format XXL en tissu tissé serré, base antidérapante en caoutchouc naturel.",
      categoryId: categoryIds["tapis-de-souris"],
      brandId: brandIds["novastrike"],
      price: 3300,
      stock: 150,
      images: ["https://picsum.photos/seed/novastrike-glide-xxl/800/800"],
      tags: ["tapis-souris", "xxl"],
      isBestSeller: true,
    },
    {
      name: "Apex Gear Control Speed - Tapis de Souris",
      slug: "apex-gear-control-speed-tapis",
      sku: "APX-MP-006",
      description: "Tapis de souris hybride control/speed, surface équilibrée pour précision et glisse.",
      categoryId: categoryIds["tapis-de-souris"],
      brandId: brandIds["apex-gear"],
      price: 2600,
      stock: 160,
      images: ["https://picsum.photos/seed/apex-gear-control-speed/800/800"],
      tags: ["tapis-souris", "control"],
      isNewArrival: true,
    },
    {
      name: "Ironclad Frostline - Watercooling AIO 240mm",
      slug: "ironclad-frostline-aio-240mm",
      sku: "IRC-CL-003",
      description: "Kit watercooling AIO 240mm avec pompe silencieuse et ventilateurs PWM inclus.",
      categoryId: categoryIds["refroidissement-pc"],
      brandId: brandIds["ironclad"],
      price: 15900,
      stock: 35,
      images: ["https://picsum.photos/seed/ironclad-frostline/800/800"],
      tags: ["watercooling", "aio", "refroidissement"],
      isFeatured: true,
    },
    {
      name: "Voidtech Airflow - Pack 3 Ventilateurs RGB",
      slug: "voidtech-airflow-pack-3-ventilateurs",
      sku: "VDT-FN-005",
      description: "Pack de 3 ventilateurs 120mm ARGB, haut débit d'air et faible niveau sonore.",
      categoryId: categoryIds["refroidissement-pc"],
      brandId: brandIds["voidtech"],
      price: 7200,
      compareAtPrice: 9100,
      stock: 65,
      images: ["https://picsum.photos/seed/voidtech-airflow-fans/800/800"],
      tags: ["ventilateurs", "rgb", "refroidissement"],
      isOnSale: true,
    },
    {
      name: "Apex Gear Cable Tresse USB-C 2m",
      slug: "apex-gear-cable-tresse-usbc-2m",
      sku: "APX-CB-007",
      description: "Cable USB-C tresse renforce, charge rapide et transfert de données haute vitesse, longueur 2m.",
      categoryId: categoryIds["accessoires-cables"],
      brandId: brandIds["apex-gear"],
      price: 1900,
      stock: 200,
      images: ["https://picsum.photos/seed/apex-gear-cable-usbc/800/800"],
      tags: ["cable", "usb-c"],
    },
    {
      name: "NovaStrike Hub USB 4 Ports",
      slug: "novastrike-hub-usb-4-ports",
      sku: "NVS-HB-004",
      description: "Hub USB 3.0 compact 4 ports, idéal pour étendre la connectique de votre setup.",
      categoryId: categoryIds["accessoires-cables"],
      brandId: brandIds["novastrike"],
      price: 3000,
      stock: 110,
      images: ["https://picsum.photos/seed/novastrike-hub-usb/800/800"],
      tags: ["hub", "usb"],
      isNewArrival: true,
    },
    {
      name: "Voidtech Dock - Station de Charge Manette",
      slug: "voidtech-dock-station-charge-manette",
      sku: "VDT-DK-006",
      description: "Station de charge double pour manettes sans fil, avec indicateur LED de charge.",
      categoryId: categoryIds["accessoires-cables"],
      brandId: brandIds["voidtech"],
      price: 3900,
      stock: 80,
      images: ["https://picsum.photos/seed/voidtech-dock-charge/800/800"],
      tags: ["dock", "charge", "manette"],
    },
  ];


  for (const p of productData) {
    await upsertProduct(p);
    console.log(`  ${p.name}`);
  }

  console.log("\nAdmin account:");
  await seedAdmin();

  console.log("\nShipping:");
  await seedShipping();

  console.log("\nCoupons:");
  await seedCoupons();

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error("\nSeed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
