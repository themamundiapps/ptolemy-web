export interface ElectionalTheme {
  key: string;
  label: string;
  description: string;
  pro: boolean;
}

export const ELECTIONAL_THEMES: ElectionalTheme[] = [
  {
    key: "love_relationships",
    label: "Love & Relationships",
    description: "Romance, attraction, and partnership",
    pro: false,
  },
  { key: "travel", label: "Travel", description: "Journeys, movement, and new horizons", pro: false },
  { key: "business_career", label: "Business & Career", description: "Work, money, and professional action", pro: true },
  { key: "health_body", label: "Health & Body", description: "Vitality, treatment, and physical matters", pro: true },
  {
    key: "spiritual_learning",
    label: "Spiritual & Learning",
    description: "Study, wisdom, and sacred practice",
    pro: true,
  },
  {
    key: "home_family",
    label: "Home & Family",
    description: "Domestic life, property, and family matters",
    pro: true,
  },
];
