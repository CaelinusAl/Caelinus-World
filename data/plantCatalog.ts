export type Plant = {
  id: string
  name: string
  frequency: number
  soil: string
  region: string[]
  season: string[]
  benefits: string[]
}

export const plants: Plant[] = [
  {
    id: "rose",
    name: "Rose",
    frequency: 320,
    soil: "loamy",
    region: ["Isparta", "Burdur"],
    season: ["spring"],
    benefits: [
      "heart opening",
      "anti stress",
      "skin regeneration"
    ]
  },

  {
    id: "lavender",
    name: "Lavender",
    frequency: 118,
    soil: "dry",
    region: ["Isparta", "Provence style climates"],
    season: ["summer"],
    benefits: [
      "sleep support",
      "anxiety reduction",
      "nervous system calm"
    ]
  },

  {
    id: "basil",
    name: "Basil",
    frequency: 256,
    soil: "rich",
    region: ["Mediterranean"],
    season: ["summer"],
    benefits: [
      "immune support",
      "anti inflammatory",
      "digestive aid"
    ]
  },

  {
    id: "jasmine",
    name: "Jasmine",
    frequency: 432,
    soil: "humid",
    region: ["Mediterranean", "Aegean"],
    season: ["summer"],
    benefits: [
      "mood elevation",
      "hormone balance",
      "relaxation"
    ]
  },

  {
    id: "olive",
    name: "Olive",
    frequency: 528,
    soil: "rocky",
    region: ["Aegean", "Mediterranean"],
    season: ["autumn"],
    benefits: [
      "longevity",
      "heart health",
      "antioxidant"
    ]
  },

  {
    id: "sage",
    name: "Sage",
    frequency: 741,
    soil: "dry",
    region: ["Mediterranean"],
    season: ["summer"],
    benefits: [
      "cleansing",
      "memory support",
      "anti bacterial"
    ]
  }
]