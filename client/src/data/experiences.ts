export type ExperienceCategory = "Nature" | "Relax" | "Family" | "Adventure" | "Culture";

export type Experience = {
  id: string;
  title: string;
  subtitle: string;
  category: ExperienceCategory;
  location: string;
  image: string;
  description: string;
  duration: string;
  search: string;
  tips: string[];
};

export const experiences: Experience[] = [
  {
    id: "nature-nagarkot",
    title: "Explore the forests of Nagarkot",
    subtitle: "For fresh air lovers",
    category: "Nature",
    location: "Nagarkot",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200&auto=format&fit=crop",
    description: "Wake up early, walk through peaceful trails, and enjoy mountain views from the hills around Nagarkot.",
    duration: "1-2 nights",
    search: "forest view nature",
    tips: ["Pack warm layers", "Best for sunrise", "Choose cabins with hill views"],
  },
  {
    id: "relax-pokhara",
    title: "Relax beside Phewa Lake",
    subtitle: "For slow weekends",
    category: "Relax",
    location: "Pokhara",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop",
    description: "Choose a calm cabin stay near Pokhara and spend the day reading, resting, and enjoying lake-side evenings.",
    duration: "2-3 nights",
    search: "lakeview relax",
    tips: ["Book two nights minimum", "Look for lakeview cabins", "Keep one day free"],
  },
  {
    id: "family-chitlang",
    title: "Take family to Chitlang",
    subtitle: "For you and yours",
    category: "Family",
    location: "Chitlang",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
    description: "A simple countryside cabin plan with short travel time, local food, open spaces, and family-friendly stays.",
    duration: "1 night",
    search: "family countryside",
    tips: ["Ask about food early", "Check room capacity", "Add special requests"],
  },
  {
    id: "hiking-dhulikhel",
    title: "Hike around Dhulikhel",
    subtitle: "For gentle adventure",
    category: "Adventure",
    location: "Dhulikhel",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    description: "Stay in Dhulikhel and plan a light hiking route with easy access to quiet villages and viewpoints.",
    duration: "1-2 nights",
    search: "hiking trail viewpoint",
    tips: ["Carry walking shoes", "Start early morning", "Choose cabins near trails"],
  },
  {
    id: "culture-bandipur",
    title: "Taste local food in Bandipur",
    subtitle: "For cultural breaks",
    category: "Culture",
    location: "Bandipur",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    description: "Plan a slower heritage stay with local food, old streets, warm hospitality, and peaceful hill views.",
    duration: "2 nights",
    search: "heritage local food",
    tips: ["Explore the bazaar", "Try local meals", "Book early in holidays"],
  },
  {
    id: "village-ghandruk",
    title: "Experience village life in Ghandruk",
    subtitle: "For mountain calm",
    category: "Culture",
    location: "Ghandruk",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
    description: "A mountain village stay with peaceful walks, local culture, and beautiful views around the Annapurna region.",
    duration: "2-3 nights",
    search: "mountain village",
    tips: ["Travel light", "Check weather", "Respect local routines"],
  },
];
