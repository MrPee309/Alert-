import { LocationOption } from "@/src/types";

/**
 * Local Haitian location seed.
 * Replace with GET /locations from the DealLakay API when available.
 */
export const LOCATIONS: LocationOption[] = [
  { id: "port-au-prince", name: "Port-au-Prince", department: "Ouest" },
  { id: "delmas", name: "Delmas", department: "Ouest" },
  { id: "petion-ville", name: "Pétion-Ville", department: "Ouest" },
  { id: "carrefour", name: "Carrefour", department: "Ouest" },
  { id: "croix-des-bouquets", name: "Croix-des-Bouquets", department: "Ouest" },
  { id: "tabarre", name: "Tabarre", department: "Ouest" },
  { id: "kenscoff", name: "Kenscoff", department: "Ouest" },
  { id: "cap-haitien", name: "Cap-Haïtien", department: "Nord" },
  { id: "gonaives", name: "Gonaïves", department: "Artibonite" },
  { id: "jacmel", name: "Jacmel", department: "Sud-Est" },
  { id: "les-cayes", name: "Les Cayes", department: "Sud" },
  { id: "saint-marc", name: "Saint-Marc", department: "Artibonite" },
];

export const getLocation = (id: string): LocationOption | undefined =>
  LOCATIONS.find((l) => l.id === id);
