import { Category } from "@/src/types";

/**
 * Local category seed. Haiti-first defaults.
 * Replace with GET /categories from the DealLakay API when available
 * (see src/api/demands.ts). `icon` uses the Feather icon set.
 */
export const CATEGORIES: Category[] = [
  { id: "phones", name: "Telefòn", icon: "smartphone" },
  { id: "electronics", name: "Elektwonik", icon: "cpu" },
  { id: "computers", name: "Òdinatè", icon: "monitor" },
  { id: "appliances", name: "Aparèy Kay", icon: "coffee" },
  { id: "furniture", name: "Mèb", icon: "grid" },
  { id: "vehicles", name: "Machin & Moto", icon: "truck" },
  { id: "fashion", name: "Rad & Mòd", icon: "shopping-bag" },
  { id: "beauty", name: "Bote & Sante", icon: "heart" },
  { id: "food", name: "Manje & Bwason", icon: "shopping-cart" },
  { id: "construction", name: "Konstriksyon", icon: "tool" },
  { id: "services", name: "Sèvis & Teknisyen", icon: "briefcase" },
  { id: "other", name: "Lòt", icon: "more-horizontal" },
];

export const getCategory = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);
