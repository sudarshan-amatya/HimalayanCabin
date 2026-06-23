import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaNeon({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.review.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.cabin.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@himalayancabins.com",
      phone: "9800000001",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      firstName: "Cabin",
      lastName: "Owner",
      email: "owner@himalayancabins.com",
      phone: "9800000002",
      password: hashedPassword,
      role: "OWNER",
    },
  });

  await prisma.cabin.createMany({
    data: [
      {
        name: "Nagarkot Forest Cabin",
        location: "Nagarkot, Nepal",
        price: 3500,
        image:
          "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?q=80&w=1200&auto=format&fit=crop",
        description:
          "A peaceful forest cabin with mountain views, perfect for a quiet weekend escape.",
        rating: 4.8,
        reviews: 82,
        status: "APPROVED",
        facilities: ["Mountain view", "Campfire", "Hot shower", "Parking"],
      },
      {
        name: "Pokhara Lakeview Cabin",
        location: "Pokhara, Nepal",
        price: 4200,
        image:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
        description:
          "Relax near Phewa Lake with cozy rooms, calm surroundings, and beautiful views.",
        rating: 4.7,
        reviews: 64,
        status: "APPROVED",
        facilities: ["Lake view", "Wi-Fi", "Breakfast", "Private balcony"],
      },
      {
        name: "Chitlang Countryside Retreat",
        location: "Chitlang, Nepal",
        price: 2800,
        image:
          "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1200&auto=format&fit=crop",
        description:
          "A simple countryside stay surrounded by greenery, farms, and peaceful village life.",
        rating: 4.6,
        reviews: 51,
        status: "APPROVED",
        facilities: ["Local food", "Garden", "Campfire", "Pet friendly"],
      },
      {
        name: "Bandipur Heritage Cabin",
        location: "Bandipur, Nepal",
        price: 3200,
        image:
          "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop",
        description:
          "A warm heritage-style cabin near Bandipur with traditional charm and hill views.",
        rating: 4.9,
        reviews: 73,
        status: "APPROVED",
        facilities: ["Hill view", "Local breakfast", "Wi-Fi", "Family friendly"],
      },
      {
        name: "Dhulikhel Hill Cabin",
        location: "Dhulikhel, Nepal",
        price: 3000,
        image:
          "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
        description:
          "A quiet hill cabin near Dhulikhel with fresh air and sunrise views.",
        rating: 4.5,
        reviews: 44,
        status: "APPROVED",
        facilities: ["Sunrise view", "Parking", "Breakfast", "Hot shower"],
      },
      {
        name: "Ghandruk Mountain Stay",
        location: "Ghandruk, Nepal",
        price: 4800,
        image:
          "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200&auto=format&fit=crop",
        description:
          "A mountain stay with village charm, trekking routes, and Annapurna views.",
        rating: 4.9,
        reviews: 91,
        status: "APPROVED",
        facilities: ["Mountain view", "Local food", "Trekking route", "Wi-Fi"],
      },
    ],
  });

  console.log("Seed data inserted successfully");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });