// Consciousness calibration levels — Source: Dr. David R. Hawkins, Map of Consciousness
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
  label?: string;
  items: CalibrationItem[];
};

// ── Sacred Texts ────────────────────────────────────────────────────────────

export const SACRED_TEXT_GROUPS: CalibrationGroup[] = [
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

// ── Spiritual Teachers ───────────────────────────────────────────────────────

export const TEACHER_GROUPS: CalibrationGroup[] = [
  {
    range: "1,000",
    label: "The Great Avatars",
    items: [
      { title: "Jesus Christ", level: 1000 },
      { title: "The Buddha (Siddhartha Gautama)", level: 1000 },
      { title: "Lord Krishna", level: 1000 },
      { title: "Zoroaster", level: 1000 },
    ],
  },
  {
    range: "800–999",
    label: "The Great Sages and Apostles",
    items: [
      { title: "Twelve Christian Apostles", level: 980 },
      { title: "Huang Po", level: 960, note: "Some sources cite 970" },
      { title: "John the Baptist", level: 930 },
      { title: "Moses", level: 910, note: "Historical/Talmud context: 770" },
      { title: "Abraham", level: 850, note: "Some sources cite 985" },
    ],
  },
  {
    range: "700–799",
    label: "Advanced Mystics and Sages",
    items: [
      { title: "Bodhidharma", level: 795 },
      { title: "Mahatma Gandhi", level: 760 },
      { title: "St. Paul (Saul of Tarsus)", level: 745 },
      { title: "Dogen", level: 740 },
      { title: "Adi Sankara Charya", level: 740, note: "Shankara Charya: 710" },
      { title: "Plotinus", level: 730 },
      { title: "Ramana Maharshi", level: 720 },
      { title: "Nisargadatta Maharaj", level: 720 },
      { title: "Rabbi Moses de Leon of Granada", level: 720 },
      { title: "St. Teresa of Avila", level: 715 },
      { title: "Patanjali", level: 715 },
      { title: "Mother Teresa", level: 710, note: "Heart chakra: 700" },
      { title: "Meister Eckhart", level: 705 },
      { title: "Muhammad", level: 700, note: "At the time he dictated the Koran" },
    ],
  },
  {
    range: "600–699",
    label: "Enlightened Teachers",
    items: [
      { title: "Abhinavagupta", level: 655 },
      { title: "Muktananda", level: 655 },
      { title: "Johann Tauler", level: 640 },
      { title: "Mechthild von Magdeburg", level: 640 },
      { title: "Karmapa", level: 630 },
      { title: "Ramakrishna", level: 620 },
      { title: "Vivekananda", level: 610 },
      { title: "Lao Tzu", level: 610 },
    ],
  },
  {
    range: "500–599",
    label: "Saints and Spiritual Teachers",
    items: [
      { title: "Swami Satchidananda", level: 605 },
      { title: "Sri Aurobindo", level: 605 },
      { title: "St. John of the Cross", level: 605 },
      { title: "Padmasambhava", level: 595 },
      { title: "Chuang Tzu", level: 595 },
      { title: "Confucius", level: 590 },
      { title: "St. Patrick", level: 590 },
      { title: "Father Pio", level: 585 },
      { title: "John Calvin", level: 580 },
      { title: "Martin Luther", level: 580 },
      { title: "Brother Lawrence", level: 575 },
      { title: "The Dalai Lama", level: 570 },
      { title: "Pope John Paul II", level: 570 },
      { title: "St. Thomas Aquinas", level: 570, note: "As a saint" },
      { title: "Roshi Suzuki", level: 565 },
      { title: "White Brotherhood", level: 560 },
      { title: "St. Augustine", level: 550 },
      { title: "Rumi", level: 550 },
      { title: "Socrates", level: 540 },
      { title: "Paramahansa Yogananda", level: 540 },
      { title: "Sri Ramanuja Charya", level: 530 },
      { title: "Sri Madhva Charya", level: 520 },
      { title: "Poonja-Ji", level: 520, note: "Also cited as 370" },
      { title: "Thomas Merton", level: 515 },
      { title: "Joseph Smith", level: 510 },
      { title: "James Allen", level: 505 },
      { title: "Erasmus", level: 500 },
    ],
  },
  {
    range: "200–499",
    label: "Integrous Teachers and Thinkers",
    items: [
      { title: "Wallace Black Elk", level: 499 },
      { title: "Hazrat Khan", level: 499 },
      { title: "Guru Nanak", level: 495 },
      { title: "Eric Butterworth", level: 495 },
      { title: "Mary Baker Eddy", level: 490 },
      { title: "Alan Watts", level: 485 },
      { title: "Ernest Holmes", level: 485 },
      { title: "Joel Goldsmith", level: 480, note: "Writings: 495" },
      { title: "Alice Bailey", level: 445, note: "Some sources cite 365" },
      { title: "Edgar Cayce", level: 285, note: "Also cited as 300" },
      { title: "Mother Mira", level: 240 },
      { title: "Mehir Baba", level: 240 },
    ],
  },
];
