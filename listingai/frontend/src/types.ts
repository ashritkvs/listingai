export type PropertyType = "House" | "Condo" | "Townhouse" | "Commercial";

export type Tone = "Luxury" | "Standard" | "Concise";

export type GenerateRequest = {
  address: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  price: number;
  property_type: PropertyType;
  amenities: string;
  neighborhood_highlights: string;
  tone: Tone;
};

export type Variation = { tone: Tone; description: string };

export type GenerateResponse = { variations: Variation[] };

