export type ScaleLevel = {
  id: string;
  range: string;
  label: string;
  description: string;
  accentHex: string;
};

export const CONSCIOUSNESS_SCALE: ScaleLevel[] = [
  {
    id: "1000",
    range: "1000",
    label: "The Great Avatars",
    description:
      "Pure divine incarnation — consciousness beyond individual identity, radiating liberation to all beings across time.",
    accentHex: "#f5f0e8",
  },
  {
    id: "800",
    range: "800–999",
    label: "The Great Sages",
    description:
      "Apostles, prophets, and realized teachers who carried the original transmission forward — their lives transformed entire civilizations.",
    accentHex: "#D4AF37",
  },
  {
    id: "700",
    range: "700–799",
    label: "Advanced Mystics",
    description:
      "Profound realizers who attained non-dual awareness, leaving behind transformative teachings and lived examples of liberation.",
    accentHex: "#c8a130",
  },
  {
    id: "600",
    range: "600–699",
    label: "Enlightened Teachers",
    description:
      "Awakened teachers whose work radiates beyond personal liberation, opening pathways for countless seekers.",
    accentHex: "#b8891e",
  },
  {
    id: "500",
    range: "500–599",
    label: "Saints & Spiritual Teachers",
    description:
      "Saints, sages, and contemplative teachers at the leading edge of love, devotion, and service.",
    accentHex: "#9e7035",
  },
  {
    id: "200",
    range: "200–499",
    label: "Integrous Thinkers",
    description:
      "Philosophers, visionaries, and wisdom teachers who advanced human understanding from a place of truth and integrity.",
    accentHex: "#8a7055",
  },
];
