export type Soil = {
  name: string
  ph: string
  minerals: string[]
}

export const soils: Soil[] = [
  {
    name: "loamy",
    ph: "6-7",
    minerals: ["nitrogen", "phosphorus"]
  },

  {
    name: "dry",
    ph: "7-8",
    minerals: ["calcium", "magnesium"]
  },

  {
    name: "rocky",
    ph: "7-8",
    minerals: ["silica", "iron"]
  },

  {
    name: "humid",
    ph: "6",
    minerals: ["organic matter"]
  }
]