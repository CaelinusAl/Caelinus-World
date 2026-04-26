export type Region = {
  name: string
  soil: string[]
  climate: string
}

export const regions: Region[] = [
  {
    name: "Aegean",
    soil: ["rocky", "loamy"],
    climate: "mediterranean"
  },

  {
    name: "Mediterranean",
    soil: ["dry", "rocky"],
    climate: "hot"
  },

  {
    name: "Central Anatolia",
    soil: ["clay", "dry"],
    climate: "continental"
  },

  {
    name: "Black Sea",
    soil: ["humid", "rich"],
    climate: "rainy"
  }
]