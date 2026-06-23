export type Cabin = {
  id: string;
  name: string;
  location: string;
  price: number;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  facilities: string[];
};

export const cabins: Cabin[] = [
  {
    id: "1",
    name: "Nagarkot Forest Cabin",
    location: "Nagarkot, Nepal",
    price: 3500,
    image:
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?q=80&w=1200&auto=format&fit=crop",
    description:
      "A peaceful forest cabin with mountain views, perfect for a quiet weekend escape.",
    rating: 4.8,
    reviews: 82,
    facilities: ["Mountain view", "Campfire", "Hot shower", "Parking"],
  },
  {
    id: "2",
    name: "Pokhara Lakeview Cabin",
    location: "Pokhara, Nepal",
    price: 4200,
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    description:
      "Relax near Phewa Lake with cozy rooms, calm surroundings, and beautiful views.",
    rating: 4.7,
    reviews: 64,
    facilities: ["Lake view", "Wi-Fi", "Breakfast", "Private balcony"],
  },
  {
    id: "3",
    name: "Chitlang Countryside Retreat",
    location: "Chitlang, Nepal",
    price: 2800,
    image:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1200&auto=format&fit=crop",
    description:
      "A simple countryside stay surrounded by greenery, farms, and peaceful village life.",
    rating: 4.6,
    reviews: 51,
    facilities: ["Local food", "Garden", "Campfire", "Pet friendly"],
  },
  {
    id: "4",
    name: "Bandipur Heritage Cabin",
    location: "Bandipur, Nepal",
    price: 3200,
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop",
    description:
      "A warm heritage-style cabin near Bandipur with traditional charm and hill views.",
    rating: 4.9,
    reviews: 73,
    facilities: ["Hill view", "Local breakfast", "Wi-Fi", "Family friendly"],
  },
];