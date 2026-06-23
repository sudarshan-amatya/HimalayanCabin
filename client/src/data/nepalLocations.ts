export const nepalLocationSuggestions = [
  "Nagarkot",
  "Pokhara",
  "Chitlang",
  "Bandipur",
  "Dhulikhel",
  "Ghandruk",
  "Kakani",
  "Daman",
  "Namobuddha",
  "Balthali",
  "Kalinchowk",
  "Sauraha",
  "Ilam",
  "Kanyam",
  "Mustang",
  "Jomsom",
  "Rara",
  "Tansen",
  "Lumbini",
  "Nuwakot",
  "Kathmandu Valley",
  "Shivapuri",
  "Godawari",
  "Panauti",
  "Palpa",
  "Janakpur",
];

export function getFilteredNepalLocations(value: string, extraLocations: string[] = []) {
  const query = value.trim().toLowerCase();
  const uniqueLocations = Array.from(new Set([...nepalLocationSuggestions, ...extraLocations].filter(Boolean)));

  if (!query) {
    return uniqueLocations.slice(0, 8);
  }

  return uniqueLocations
    .filter((location) => location.toLowerCase().includes(query))
    .slice(0, 8);
}
