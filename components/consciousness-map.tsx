"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type Book = { title: string; calibration?: number };

type Teacher = {
  id: string;
  name: string;
  calibration: number;
  tradition: string;
  bio: string;
  books: Book[];
};

type Level = {
  id: string;
  range: string;
  label: string;
  description: string;
  accentHex: string;
  teachers: Teacher[];
  sacredTexts: Book[];
};

// ── Full calibrated dataset ────────────────────────────────────────────────
const LEVELS: Level[] = [
  {
    id: "1000",
    range: "1000",
    label: "The Great Avatars",
    description:
      "Pure divine incarnation — consciousness beyond individual identity, radiating liberation to all beings across time. The calibration peaks here because these beings ARE the source.",
    accentHex: "#f5f0e8",
    teachers: [
      {
        id: "jesus",
        name: "Jesus Christ",
        calibration: 1000,
        tradition: "Christian Mysticism",
        bio: "The Christ — embodiment of unconditional love, sacrifice, and resurrection. His teachings calibrate at the highest level of truth ever recorded.",
        books: [
          { title: "The New Testament (KJV minus Revelation)", calibration: 790 },
          { title: "Gospel of St. Luke", calibration: 699 },
          { title: "Gospel of Thomas", calibration: 660 },
        ],
      },
      {
        id: "buddha",
        name: "Gautama Buddha",
        calibration: 1000,
        tradition: "Theravada · Mahayana",
        bio: "The Awakened One — his systematic path of liberation through the cessation of suffering remains among the most complete teachings ever transmitted.",
        books: [
          { title: "The Dhammapada", calibration: 840 },
          { title: "Heart Sutra", calibration: 780 },
          { title: "Lotus Sutra", calibration: 780 },
          { title: "Diamond Sutra", calibration: 700 },
        ],
      },
      {
        id: "krishna",
        name: "Lord Krishna",
        calibration: 1000,
        tradition: "Vaishnavism · Advaita",
        bio: "Divine incarnation of Vishnu — the Bhagavad Gita contains the complete map of consciousness from material bondage to liberation.",
        books: [{ title: "Bhagavad-Gita", calibration: 910 }],
      },
      {
        id: "zoroaster",
        name: "Zoroaster",
        calibration: 1000,
        tradition: "Zoroastrianism",
        bio: "The ancient Persian prophet of the cosmic battle between truth (Asha) and the lie (Druj) — the progenitor of much Abrahamic theology.",
        books: [{ title: "The Avesta (Gathas)" }],
      },
    ],
    sacredTexts: [
      { title: "Bhagavad-Gita", calibration: 910 },
      { title: "The Zohar", calibration: 905 },
    ],
  },
  {
    id: "800",
    range: "800–999",
    label: "The Great Sages",
    description:
      "Apostles, prophets, and realized teachers who carried the original transmission forward — their lives transformed entire civilizations.",
    accentHex: "#D4AF37",
    teachers: [
      {
        id: "apostles",
        name: "The Twelve Apostles",
        calibration: 980,
        tradition: "Early Christianity",
        bio: "Direct disciples of Jesus — their combined transmission calibrates at the apex of the Apostolic age.",
        books: [{ title: "New Testament (Lamsa)", calibration: 880 }],
      },
      {
        id: "huang-po",
        name: "Huang Po",
        calibration: 960,
        tradition: "Chan Buddhism",
        bio: "The 9th century Tang dynasty master whose transmission of 'original mind' is among the purest in Chan history.",
        books: [{ title: "Huang Po Teachings", calibration: 850 }],
      },
      {
        id: "john-baptist",
        name: "John the Baptist",
        calibration: 930,
        tradition: "Jewish Prophetism",
        bio: "The herald and forerunner — his radical witness and preparatory ministry calibrates at the level of the greatest prophets.",
        books: [],
      },
      {
        id: "moses",
        name: "Moses",
        calibration: 910,
        tradition: "Abrahamic / Hebrew",
        bio: "Lawgiver and liberator — he received the Torah and led an entire people toward liberation, establishing monotheistic civilization.",
        books: [{ title: "The Torah", calibration: 745 }],
      },
      {
        id: "abraham",
        name: "Abraham",
        calibration: 850,
        tradition: "Abrahamic",
        bio: "The patriarch of three world religions — his covenant with the divine establishes the unbroken thread of Western spiritual tradition.",
        books: [],
      },
    ],
    sacredTexts: [
      { title: "Lamsa Bible (NT minus Revelation + Gen, Psa, Pro)", calibration: 880 },
      { title: "Huang Po Teachings", calibration: 850 },
      { title: "Dhammapada", calibration: 840 },
      { title: "Ramayana", calibration: 810 },
    ],
  },
  {
    id: "700",
    range: "700–799",
    label: "Advanced Mystics",
    description:
      "Fully realized sages — the ego has dissolved, leaving only the Self. Their words carry the direct transmission of awakened consciousness.",
    accentHex: "#c8a130",
    teachers: [
      {
        id: "bodhidharma",
        name: "Bodhidharma",
        calibration: 795,
        tradition: "Chan / Zen Buddhism",
        bio: "The legendary patriarch who brought Dhyana meditation from India to China, founding Zen. 'Pointing directly at the mind.'",
        books: [{ title: "Bodhidharma Zen Teachings", calibration: 795 }],
      },
      {
        id: "gandhi",
        name: "Mahatma Gandhi",
        calibration: 760,
        tradition: "Hindu · Non-Violence",
        bio: "Satyagraha — truth force. Gandhi's non-violent resistance calibrates at the level of a saint, transforming an entire civilization.",
        books: [{ title: "The Story of My Experiments with Truth" }],
      },
      {
        id: "st-paul",
        name: "St. Paul",
        calibration: 745,
        tradition: "Early Christianity",
        bio: "The great apostle whose radical conversion and epistles form half the New Testament — the theologian of grace.",
        books: [{ title: "Epistles of Paul (New Testament)", calibration: 790 }],
      },
      {
        id: "dogen",
        name: "Dogen",
        calibration: 740,
        tradition: "Soto Zen",
        bio: "Founder of Soto Zen in Japan — the Shobogenzo is among the most profound philosophical-spiritual works in any tradition.",
        books: [{ title: "Shobogenzo (Treasury of the True Dharma Eye)" }],
      },
      {
        id: "sankara",
        name: "Adi Shankaracharya",
        calibration: 740,
        tradition: "Advaita Vedanta",
        bio: "The 8th century consolidator of Advaita non-dualism — his commentaries on the Upanishads remain unsurpassed in precision and depth.",
        books: [
          { title: "Vivekachudamani (Crest Jewel of Discrimination)" },
          { title: "Brahmasutra Bhashya" },
        ],
      },
      {
        id: "plotinus",
        name: "Plotinus",
        calibration: 730,
        tradition: "Neoplatonism",
        bio: "The great systematizer of mystical philosophy — the Enneads map the soul's ascent from matter to the One with luminous precision.",
        books: [{ title: "The Enneads" }],
      },
      {
        id: "ramana",
        name: "Ramana Maharshi",
        calibration: 720,
        tradition: "Advaita Vedanta",
        bio: "The sage of Arunachala, who attained Self-realization at 16. His teaching of self-enquiry ('Who am I?') is the most direct path to the Self.",
        books: [
          { title: "Who Am I?" },
          { title: "Talks with Sri Ramana Maharshi" },
          { title: "Be As You Are" },
        ],
      },
      {
        id: "nisargadatta",
        name: "Nisargadatta Maharaj",
        calibration: 720,
        tradition: "Advaita Vedanta",
        bio: "A beedi-seller from Mumbai who realized the Absolute. His dialogues strip away every concept until only pure awareness remains.",
        books: [
          { title: "I Am That" },
          { title: "Prior to Consciousness" },
          { title: "The Experience of Nothingness" },
        ],
      },
      {
        id: "teresa-avila",
        name: "St. Teresa of Ávila",
        calibration: 715,
        tradition: "Christian Mysticism",
        bio: "16th century Carmelite reformer — her map of contemplative prayer through seven interior 'mansions' remains unparalleled.",
        books: [
          { title: "The Interior Castle" },
          { title: "The Way of Perfection" },
          { title: "The Book of Her Life" },
        ],
      },
      {
        id: "patanjali",
        name: "Patanjali",
        calibration: 715,
        tradition: "Classical Yoga",
        bio: "Compiler of the Yoga Sutras — the foundational text of systematic yoga philosophy and the eight-limbed path.",
        books: [{ title: "Yoga Sutras of Patanjali", calibration: 740 }],
      },
      {
        id: "mother-teresa",
        name: "Mother Teresa",
        calibration: 710,
        tradition: "Catholic Christianity",
        bio: "The 'Saint of the Gutters' — her embodiment of compassionate service in Calcutta calibrates at the heart-chakra level of unconditional love.",
        books: [{ title: "Come Be My Light" }, { title: "A Simple Path" }],
      },
      {
        id: "eckhart",
        name: "Meister Eckhart",
        calibration: 705,
        tradition: "Christian Mysticism",
        bio: "14th century Dominican mystic — his sermons on the Godhead, the birth of the Word in the soul, and detachment remain among the most radical Christian texts.",
        books: [
          { title: "The Complete Mystical Works" },
          { title: "Sermons and Treatises" },
        ],
      },
      {
        id: "muhammad",
        name: "Muhammad",
        calibration: 700,
        tradition: "Islam",
        bio: "The Prophet who dictated the Quran — calibrated at 700 at the time of the original revelation.",
        books: [{ title: "The Quran (Koran)", calibration: 700 }],
      },
    ],
    sacredTexts: [
      { title: "Bodhidharma Zen Teachings", calibration: 795 },
      { title: "New Testament (KJV minus Revelation)", calibration: 790 },
      { title: "Heart Sutra", calibration: 780 },
      { title: "Lotus Sutra", calibration: 780 },
      { title: "The Torah", calibration: 745 },
      { title: "Yoga Sutras of Patanjali", calibration: 740 },
      { title: "Cloud of Unknowing", calibration: 705 },
      { title: "Rig Veda", calibration: 705 },
      { title: "Diamond Sutra", calibration: 700 },
      { title: "The Quran", calibration: 700 },
    ],
  },
  {
    id: "600",
    range: "600–699",
    label: "Enlightened Teachers",
    description:
      "Teachers in whom the personal self is transparent to the divine — their transmission radiates grace, and their lineages continue to awaken students.",
    accentHex: "#b8891e",
    teachers: [
      {
        id: "abhinavagupta",
        name: "Abhinavagupta",
        calibration: 655,
        tradition: "Kashmir Shaivism",
        bio: "The supreme philosopher-mystic of Kashmir Shaivism — his Tantraloka is the most comprehensive synthesis of Trika non-dualism.",
        books: [
          { title: "Abhinavagupta Writings", calibration: 655 },
          { title: "Tantraloka" },
          { title: "Vijnana Bhairava Tantra (ed.)", calibration: 635 },
        ],
      },
      {
        id: "muktananda",
        name: "Swami Muktananda",
        calibration: 655,
        tradition: "Siddha Yoga",
        bio: "The master of Shaktipat — his Play of Consciousness documents one of the most detailed accounts of Kundalini awakening in the literature.",
        books: [
          { title: "Play of Consciousness" },
          { title: "I Am That: The Science of Hamsa" },
        ],
      },
      {
        id: "ramakrishna",
        name: "Sri Ramakrishna",
        calibration: 620,
        tradition: "Hindu · Bhakti",
        bio: "The great 19th century mystic of Dakshineshwar — he traversed every major religious path and declared the unity of all as direct experience.",
        books: [{ title: "The Gospel of Sri Ramakrishna" }],
      },
      {
        id: "vivekananda",
        name: "Swami Vivekananda",
        calibration: 610,
        tradition: "Vedanta",
        bio: "Ramakrishna's foremost disciple — he introduced Vedanta to the West at the 1893 Parliament of Religions and founded the Ramakrishna Mission.",
        books: [
          { title: "Raja Yoga" },
          { title: "Jnana Yoga" },
          { title: "The Complete Works of Swami Vivekananda" },
        ],
      },
      {
        id: "lao-tzu",
        name: "Lao Tzu",
        calibration: 610,
        tradition: "Taoism",
        bio: "The legendary founder of Taoism — the Tao Te Ching's 81 verses contain a complete cosmology of yielding, emptiness, and natural harmony.",
        books: [
          { title: "Lao Tzu Teachings (Tao Te Ching)", calibration: 610 },
        ],
      },
    ],
    sacredTexts: [
      { title: "Gospel of St. Luke", calibration: 699 },
      { title: "Gospel of Thomas", calibration: 660 },
      { title: "Abhinavagupta Writings", calibration: 655 },
      { title: "Psalms (Lamsa Bible)", calibration: 650 },
      { title: "Aggadah", calibration: 645 },
      { title: "New Testament (KJV standard from Greek)", calibration: 640 },
      { title: "Vijnana Bhairava", calibration: 635 },
      { title: "Lao Tzu Teachings", calibration: 610 },
      { title: "Kabbalah", calibration: 605 },
      { title: "A Course in Miracles (Workbook)", calibration: 600 },
    ],
  },
  {
    id: "500",
    range: "500–599",
    label: "Saints & Spiritual Teachers",
    description:
      "Saints and sages of unconditional love — the heart fully opened. Their lives and writings have sustained spiritual communities across centuries.",
    accentHex: "#9e7035",
    teachers: [
      {
        id: "aurobindo",
        name: "Sri Aurobindo",
        calibration: 605,
        tradition: "Integral Yoga",
        bio: "Visionary mystic who mapped the descent of the supramental into matter — a vision of evolutionary spirituality without precedent.",
        books: [
          { title: "The Life Divine" },
          { title: "The Synthesis of Yoga" },
          { title: "Savitri" },
        ],
      },
      {
        id: "john-cross",
        name: "St. John of the Cross",
        calibration: 605,
        tradition: "Christian Mysticism",
        bio: "The great mystical theologian of dark nights and divine union — his poetry and commentaries chart the total purification of the soul.",
        books: [
          { title: "Dark Night of the Soul" },
          { title: "The Ascent of Mount Carmel" },
          { title: "The Spiritual Canticle" },
        ],
      },
      {
        id: "padmasambhava",
        name: "Padmasambhava",
        calibration: 595,
        tradition: "Vajrayana Buddhism",
        bio: "The 'Lotus-Born' guru who brought tantric Buddhism to Tibet and composed the essential liberation texts used at the moment of death.",
        books: [{ title: "Tibetan Book of the Dead (Bardo Thodol)" }],
      },
      {
        id: "chuang-tzu",
        name: "Chuang Tzu",
        calibration: 595,
        tradition: "Taoism",
        bio: "The second great Taoist sage — his Inner Chapters use parable and paradox to dissolve the illusion of a fixed self.",
        books: [{ title: "The Inner Chapters" }, { title: "The Complete Works of Chuang Tzu" }],
      },
      {
        id: "confucius",
        name: "Confucius",
        calibration: 590,
        tradition: "Confucianism",
        bio: "The master of rites and relationships — his vision of virtue through right relationship laid the ethical foundation for East Asian civilization.",
        books: [{ title: "The Analects" }],
      },
      {
        id: "pio",
        name: "Padre Pio",
        calibration: 585,
        tradition: "Catholic Christianity",
        bio: "Italian stigmatist and mystic — one of the most documented miracle workers of the modern era, bearing the wounds of Christ for fifty years.",
        books: [{ title: "Letters of Padre Pio" }],
      },
      {
        id: "dalai-lama",
        name: "The Dalai Lama",
        calibration: 570,
        tradition: "Tibetan Buddhism",
        bio: "Tenzin Gyatso — the 14th Dalai Lama and embodiment of Bodhicitta (compassion) in the modern world. Nobel Peace Laureate.",
        books: [
          { title: "The Art of Happiness" },
          { title: "Ethics for the New Millennium" },
          { title: "The Universe in a Single Atom" },
        ],
      },
      {
        id: "rumi",
        name: "Jalal ad-Din Rumi",
        calibration: 550,
        tradition: "Sufi Islam",
        bio: "The great Persian mystic poet. His love for Shams of Tabriz became the vehicle for the most ecstatic spiritual poetry in existence.",
        books: [
          { title: "The Masnavi" },
          { title: "The Divan of Shams of Tabriz" },
          { title: "The Essential Rumi (Coleman Barks trans.)" },
        ],
      },
      {
        id: "socrates",
        name: "Socrates",
        calibration: 540,
        tradition: "Greek Philosophy",
        bio: "The original Western philosopher who claimed to know only that he knew nothing — his maieutic method births wisdom through questioning.",
        books: [
          { title: "Dialogues of Plato (Socratic)" },
          { title: "The Apology" },
        ],
      },
      {
        id: "yogananda",
        name: "Paramahansa Yogananda",
        calibration: 540,
        tradition: "Kriya Yoga",
        bio: "The yogi who introduced Kriya Yoga to the West — his Autobiography of a Yogi has initiated more Western seekers than perhaps any modern text.",
        books: [
          { title: "Autobiography of a Yogi" },
          { title: "The Second Coming of Christ" },
        ],
      },
      {
        id: "merton",
        name: "Thomas Merton",
        calibration: 515,
        tradition: "Catholic Mysticism",
        bio: "Trappist monk, poet, and social critic — the bridge between contemplative Christianity and Eastern wisdom traditions.",
        books: [
          { title: "The Seven Storey Mountain" },
          { title: "New Seeds of Contemplation" },
          { title: "The Inner Experience" },
        ],
      },
      {
        id: "guru-nanak",
        name: "Guru Nanak",
        calibration: 495,
        tradition: "Sikhism",
        bio: "Founder of Sikhism — his vision of direct, unmediated relationship with the divine ('Ik Onkar: One Reality') transcends all religious categories.",
        books: [{ title: "Granth Sahib (Adi Granth)", calibration: 505 }],
      },
    ],
    sacredTexts: [
      { title: "Embraced by the Light (Betty Eadie)", calibration: 595 },
      { title: "Manual for Teachers (A Course in Miracles)", calibration: 555 },
      { title: "A Course in Miracles (Textbook)", calibration: 550 },
      { title: "Granth Sahib (Adi Granth)", calibration: 505 },
    ],
  },
  {
    id: "200",
    range: "200–499",
    label: "Integrous Thinkers",
    description:
      "Philosophers, scholars, and teachers operating from truth and courage — they advance human understanding without distorting it.",
    accentHex: "#8a7055",
    teachers: [
      {
        id: "black-elk",
        name: "Black Elk",
        calibration: 499,
        tradition: "Oglala Lakota",
        bio: "The Lakota holy man whose 'Great Vision' at age nine became one of the most sacred accounts of indigenous spiritual experience.",
        books: [{ title: "Black Elk Speaks (John Neihardt)" }],
      },
      {
        id: "hazrat-khan",
        name: "Hazrat Inayat Khan",
        calibration: 499,
        tradition: "Sufi Order",
        bio: "Indian Sufi master who brought the Chishti tradition to the West — founder of the Sufi Order International.",
        books: [
          { title: "The Sufi Message (14 vols)" },
          { title: "The Heart of Sufism" },
        ],
      },
      {
        id: "alan-watts",
        name: "Alan Watts",
        calibration: 485,
        tradition: "Zen · Perennial Philosophy",
        bio: "British-American philosopher who translated Eastern wisdom for the Western mind with incomparable wit and depth.",
        books: [
          { title: "The Way of Zen" },
          { title: "The Book: On the Taboo Against Knowing Who You Are" },
          { title: "The Wisdom of Insecurity" },
          { title: "The Supreme Identity" },
        ],
      },
      {
        id: "holmes",
        name: "Ernest Holmes",
        calibration: 485,
        tradition: "Science of Mind",
        bio: "Founder of Religious Science — his synthesis of mental science, New Thought, and mysticism became the foundation of the Center for Spiritual Living movement.",
        books: [
          { title: "The Science of Mind" },
          { title: "This Thing Called You" },
        ],
      },
      {
        id: "alice-bailey",
        name: "Alice Bailey",
        calibration: 445,
        tradition: "Theosophy · Esoteric",
        bio: "Prolific esoteric author who received transmissions from the Tibetan Master Djwhal Khul — her 24 books form one of the most comprehensive esoteric systems.",
        books: [
          { title: "A Treatise on Cosmic Fire" },
          { title: "The Light of the Soul" },
        ],
      },
      {
        id: "edgar-cayce",
        name: "Edgar Cayce",
        calibration: 285,
        tradition: "Christian Mysticism · Psychic",
        bio: "The 'Sleeping Prophet' of Virginia Beach — gave over 14,000 trance readings on health, past lives, and prophecy across three decades.",
        books: [
          { title: "Many Mansions (Gina Cerminara)" },
          { title: "There is a River (Thomas Sugrue)" },
        ],
      },
    ],
    sacredTexts: [
      { title: "Lamsa Bible (Standard Aramaic)", calibration: 495 },
      { title: "King James Bible (Standard Greek)", calibration: 475 },
      { title: "The I Ching", calibration: 430 },
      { title: "Book of Mormon", calibration: 405 },
      { title: "Apocrypha", calibration: 400 },
      { title: "Gnostic Gospels", calibration: 400 },
      { title: "The Impersonal Life (Joseph Benner)", calibration: 295 },
      { title: "Dead Sea Scrolls", calibration: 260 },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function CalibrationPip({ value, hex }: { value: number; hex: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="text-2xl font-mono font-bold tabular-nums leading-none"
        style={{ color: hex }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function ConsciousnessMap() {
  const [activeId, setActiveId] = useState<string>("1000");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const level = LEVELS.find((l) => l.id === activeId)!;

  function toggleTeacher(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #06040a 0%, #080510 100%)",
        color: "#e8e0d4",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Page header ── */}
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-8 space-y-3">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.35em]"
          style={{ color: "#D4AF37" }}
        >
          David Hawkins · Scale of Consciousness
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight"
          style={{ fontFamily: "var(--font-display, var(--font-heading))" }}
        >
          Map of Consciousness
        </h1>
        <p className="text-stone-400 max-w-xl text-sm leading-relaxed">
          A logarithmic scale from 1 to 1,000 — calibrating the attractor fields of
          consciousness. Each level represents a quantum leap in power, not a linear
          increment. Everything below 200 is net destructive to life; above 200, net
          supportive.
        </p>
      </div>

      {/* ── Layout ── */}
      <div className="max-w-6xl mx-auto px-6 pb-24 flex flex-col lg:flex-row gap-8">

        {/* ── Level nav (desktop sidebar / mobile top scroll) ── */}
        <nav
          className="lg:w-64 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0"
          aria-label="Consciousness levels"
        >
          {LEVELS.map((l) => {
            const isActive = l.id === activeId;
            return (
              <button
                key={l.id}
                onClick={() => setActiveId(l.id)}
                className="shrink-0 lg:shrink text-left rounded-xl px-4 py-3 transition-all"
                style={{
                  background: isActive ? `${l.accentHex}12` : "transparent",
                  border: `1px solid ${isActive ? l.accentHex + "40" : "rgba(255,255,255,0.06)"}`,
                  borderLeft: isActive ? `3px solid ${l.accentHex}` : undefined,
                }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-0.5 whitespace-nowrap"
                  style={{ color: isActive ? l.accentHex : "#6b5e4e" }}
                >
                  {l.range}
                </div>
                <div
                  className="text-sm font-medium whitespace-nowrap"
                  style={{ color: isActive ? "#f0e8d8" : "#8a7a6a" }}
                >
                  {l.label}
                </div>
              </button>
            );
          })}

          {/* Scale reference */}
          <div
            className="hidden lg:block mt-6 rounded-xl p-4 space-y-3"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#D4AF3760" }}>
              The Scale
            </p>
            {[
              { val: "1000", label: "Enlightenment" },
              { val: "700", label: "Non-ordinary states" },
              { val: "600", label: "Peace" },
              { val: "500", label: "Love" },
              { val: "400", label: "Reason" },
              { val: "200", label: "Courage ← threshold" },
              { val: "100", label: "Fear" },
              { val: "50", label: "Apathy" },
              { val: "20", label: "Shame" },
            ].map(({ val, label }) => (
              <div key={val} className="flex items-center gap-2">
                <span className="text-[10px] font-mono w-8 text-right" style={{ color: "#D4AF3766" }}>
                  {val}
                </span>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span className="text-[10px] text-stone-600">{label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* ── Main content panel ── */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* Level header */}
          <div
            className="rounded-2xl p-6 space-y-2"
            style={{
              background: `linear-gradient(135deg, ${level.accentHex}0a 0%, transparent 60%)`,
              border: `1px solid ${level.accentHex}20`,
            }}
          >
            <div className="flex items-baseline gap-3">
              <span
                className="text-3xl font-mono font-bold"
                style={{ color: level.accentHex }}
              >
                {level.range}
              </span>
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display, var(--font-heading))" }}
              >
                {level.label}
              </h2>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-2xl">
              {level.description}
            </p>
          </div>

          {/* Teachers grid */}
          <div className="space-y-3">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: level.accentHex + "99" }}
            >
              Teachers · {level.teachers.length}
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {level.teachers.map((t) => {
                const isOpen = expanded.has(t.id);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{
                      background: "#0e0b14",
                      border: `1px solid ${isOpen ? level.accentHex + "30" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    {/* Card header */}
                    <button
                      onClick={() => toggleTeacher(t.id)}
                      className="w-full text-left p-4 flex items-start gap-3 group"
                    >
                      {/* Calibration number */}
                      <div className="shrink-0 w-14 pt-0.5">
                        <span
                          className="text-xl font-mono font-bold tabular-nums leading-none"
                          style={{ color: level.accentHex }}
                        >
                          {t.calibration}
                        </span>
                      </div>

                      {/* Name + tradition */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm leading-snug text-stone-100 group-hover:text-white transition-colors">
                          {t.name}
                        </div>
                        <div className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: level.accentHex + "88" }}>
                          {t.tradition}
                        </div>
                        <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{t.bio}</p>
                      </div>

                      {/* Expand chevron */}
                      {t.books.length > 0 && (
                        <div className="shrink-0 mt-0.5">
                          {isOpen ? (
                            <ChevronUp size={14} style={{ color: level.accentHex }} />
                          ) : (
                            <ChevronDown size={14} className="text-stone-600" />
                          )}
                        </div>
                      )}
                    </button>

                    {/* Expanded books */}
                    {isOpen && t.books.length > 0 && (
                      <div
                        className="border-t px-4 py-3 space-y-2"
                        style={{ borderColor: "rgba(255,255,255,0.06)" }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen size={10} style={{ color: level.accentHex + "88" }} />
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest"
                            style={{ color: level.accentHex + "77" }}
                          >
                            Associated Texts
                          </span>
                        </div>
                        {t.books.map((b, i) => (
                          <div key={i} className="flex items-baseline gap-3">
                            {b.calibration && (
                              <span
                                className="text-[10px] font-mono tabular-nums shrink-0"
                                style={{ color: level.accentHex + "66" }}
                              >
                                {b.calibration}
                              </span>
                            )}
                            <span className="text-xs text-stone-400 leading-snug">{b.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sacred texts */}
          {level.sacredTexts.length > 0 && (
            <div className="space-y-3">
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: level.accentHex + "99" }}
              >
                Sacred Texts at this Level · {level.sacredTexts.length}
              </p>
              <div
                className="rounded-xl"
                style={{
                  background: "#0e0b14",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {level.sacredTexts.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-2.5"
                    style={{
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                    }}
                  >
                    {b.calibration && (
                      <span
                        className="text-sm font-mono font-semibold tabular-nums shrink-0 w-8 text-right"
                        style={{ color: level.accentHex }}
                      >
                        {b.calibration}
                      </span>
                    )}
                    <span className="text-sm text-stone-300">{b.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
