// Consciousness calibration levels for sacred texts
// Source: Dr. David R. Hawkins — Map of Consciousness
// To add more entries: append to the relevant group's `items` array,
// or add a new group object following the same shape.

export type CalibrationItem = {
  title: string;
  author?: string;
  level: number;
  note?: string;
};

export type CalibrationGroup = {
  range: string;
  items: CalibrationItem[];
};

export const CALIBRATION_GROUPS: CalibrationGroup[] = [
  {
    range: "900–999",
    items: [
      { title: "Bhagavad-Gita", level: 910 },
      { title: "The Zohar", level: 905, note: "Some sources cite 720" },
    ],
  },
  {
    range: "800–899",
    items: [
      { title: "Lamsa Bible (Edited — NT minus Revelation, plus Gen, Psa, Pro)", level: 880 },
      { title: "Huang Po Teachings", level: 850, note: "Author calibrates at 960" },
      { title: "Dhammapada", level: 840 },
      { title: "Ramayana", level: 810 },
    ],
  },
  {
    range: "700–799",
    items: [
      { title: "Bodhidharma Zen Teachings", level: 795 },
      { title: "New Testament (KJV minus Revelation)", level: 790 },
      { title: "Heart Sutra", level: 780 },
      { title: "Lotus Sutra", level: 780 },
      { title: "The Torah", level: 745 },
      { title: "Yoga Sutras", author: "Patanjali", level: 740 },
      { title: "Rig Veda", level: 705 },
      { title: "Cloud of Unknowing", level: 705 },
      { title: "Diamond Sutra", level: 700 },
      { title: "Koran (Quran)", level: 700 },
    ],
  },
  {
    range: "600–699",
    items: [
      { title: "Gospel of St. Luke", level: 699 },
      { title: "Mishneh", level: 665 },
      { title: "Midrash", level: 665 },
      { title: "Genesis (Lamsa Bible)", level: 660 },
      { title: "Gospel of St. Thomas", level: 660 },
      { title: "Abhinavagupta Writings", level: 655 },
      { title: "Psalms (Lamsa Bible)", level: 650 },
      { title: "Aggadah", level: 645 },
      { title: "New Testament (KJV standard from Greek)", level: 640 },
      { title: "Vijnana Bhairava", level: 635 },
      { title: "Lao Tzu Teachings", level: 610 },
      { title: "Kabbalah", level: 605 },
      { title: "A Course in Miracles (Workbook)", level: 600 },
    ],
  },
  {
    range: "500–599",
    items: [
      { title: "Embraced by the Light", author: "Betty Eadie", level: 595 },
      { title: "Life and Teachings of the Great Masters of the Far East", level: 560 },
      { title: "A Course in Miracles (Manual for Teachers)", level: 555 },
      { title: "A Course in Miracles (Textbook)", level: 550 },
      { title: "Granth Sahib (Adi Granth)", level: 505 },
    ],
  },
  {
    range: "200–499",
    items: [
      { title: "Lamsa Bible (Standard Aramaic)", level: 495 },
      { title: "King James Bible (Standard Greek)", level: 475 },
      { title: "The I Ching", level: 430 },
      { title: "Book of Mormon", level: 405 },
      { title: "Apocrypha", level: 400 },
      { title: "Gnostic Gospels", level: 400 },
      { title: "The Impersonal Life", author: "Joseph Benner", level: 295 },
      { title: "Dead Sea Scrolls", level: 260 },
    ],
  },
];
