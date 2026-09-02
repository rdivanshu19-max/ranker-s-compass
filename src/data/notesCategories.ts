export type NotesCategory = {
  slug: string;
  /** Visible H1 */
  heading: string;
  /** <title> */
  seoTitle: string;
  description: string;
  /** Intro copy shown above the material list */
  intro: string;
  /** Any of these tags on a material puts it in this category */
  types: string[];
  /** Extra keyword-rich chapter/topic hints shown as chips */
  topics: string[];
  faqs: { q: string; a: string }[];
};

export const NOTES_CATEGORIES: NotesCategory[] = [
  {
    slug: 'jee-short-notes',
    heading: 'JEE Short Notes — Physics, Chemistry & Maths',
    seoTitle: 'Free JEE Short Notes PDF (Physics, Chemistry, Maths) | Rankers Star',
    description:
      'Download free JEE Main & Advanced short notes PDF for Physics, Chemistry and Maths — formula sheets, revision notes and chapter summaries. No sign-up needed.',
    intro:
      'Short notes are the fastest way to revise the entire JEE syllabus before Mains and Advanced. Every file below is a condensed, chapter-wise revision sheet covering key formulas, definitions, reactions and shortcut methods for Physics, Chemistry and Mathematics. Open any note directly in your browser — no account required.',
    types: ['JEE', 'JEE Advanced', 'Lecture PDF', 'Other Material'],
    topics: ['Rotational Motion', 'Electrostatics', 'Modern Physics', 'Organic Chemistry', 'Physical Chemistry', 'Calculus', 'Coordinate Geometry', 'Algebra'],
    faqs: [
      { q: 'Are these JEE short notes free to download?', a: 'Yes. Every note listed on this page is free to open and read. You do not need an account to access them.' },
      { q: 'Do short notes cover both JEE Main and JEE Advanced?', a: 'Most notes follow the NCERT-plus-JEE syllabus, which covers JEE Main fully and the core theory needed for JEE Advanced. Advanced-specific material is tagged separately.' },
      { q: 'When should I start revising from short notes?', a: 'Use short notes after finishing a chapter for the first revision, then again in the final 45 days before the exam for rapid recall.' },
    ],
  },
  {
    slug: 'neet-short-notes',
    heading: 'NEET Short Notes — Biology, Physics & Chemistry',
    seoTitle: 'Free NEET Short Notes PDF (Biology, Physics, Chemistry) | Rankers Star',
    description:
      'Free NEET short notes and revision PDFs for Biology, Physics and Chemistry — NCERT-based chapter summaries, diagrams and formula sheets, open to everyone.',
    intro:
      'NEET rewards precise NCERT recall. These short notes compress each chapter into the lines, diagrams and reactions that actually appear in the paper, across Biology, Physics and Chemistry. Ideal for last-month revision and for daily recall after coaching classes.',
    types: ['NEET', 'Biology', 'Other Material'],
    topics: ['Human Physiology', 'Genetics', 'Plant Physiology', 'Ecology', 'Biomolecules', 'Thermodynamics', 'Optics', 'Inorganic Chemistry'],
    faqs: [
      { q: 'Are these NEET notes based on NCERT?', a: 'Yes, the Biology and Chemistry notes follow the NCERT line-by-line structure, since NEET questions are drawn largely from NCERT text.' },
      { q: 'Is registration required?', a: 'No. The notes on this page are open to all visitors.' },
      { q: 'Can Class 11 students use them?', a: 'Yes — the notes are chapter-wise, so Class 11 students can use the Class 11 chapters alongside their school syllabus.' },
    ],
  },
  {
    slug: 'jee-previous-year-questions',
    heading: 'JEE Previous Year Questions (PYQs) with Solutions',
    seoTitle: 'JEE Main & Advanced Previous Year Questions PDF Free | Rankers Star',
    description:
      'Free JEE Main and JEE Advanced previous year question papers and chapter-wise PYQ PDFs with solutions. Practise real exam questions without signing up.',
    intro:
      'Solving previous year questions is the single highest-return activity in JEE preparation — patterns repeat, and question framing rarely changes. This collection includes full past papers and chapter-wise PYQ sets for JEE Main and JEE Advanced with solutions.',
    types: ['PYQs', 'JEE', 'JEE Advanced', 'JEE Test'],
    topics: ['JEE Main 2024', 'JEE Main 2023', 'JEE Advanced Paper 1', 'JEE Advanced Paper 2', 'Chapter-wise PYQ'],
    faqs: [
      { q: 'How many years of PYQs should I solve for JEE?', a: 'Aim for the last 10 years of JEE Main and the last 15 years of JEE Advanced, chapter-wise first and then as full timed papers.' },
      { q: 'Do the PYQ files include solutions?', a: 'Most sets include detailed solutions. Where a file is question-only, you can ask the doubt inside the Rankers Star community or with the AI mentor.' },
    ],
  },
  {
    slug: 'neet-previous-year-questions',
    heading: 'NEET Previous Year Questions (PYQs) with Solutions',
    seoTitle: 'NEET Previous Year Question Papers PDF Free Download | Rankers Star',
    description:
      'Free NEET previous year question papers and chapter-wise PYQs with solutions for Biology, Physics and Chemistry. Open access, no login required.',
    intro:
      'NEET repeats concepts more than any other national exam. Work through these past papers and chapter-wise PYQ sets to learn exactly how NCERT lines are converted into questions, then time yourself on full papers.',
    types: ['PYQs', 'NEET', 'NEET Test', 'Biology'],
    topics: ['NEET 2024 Paper', 'NEET 2023 Paper', 'Biology PYQ', 'Physics PYQ', 'Chemistry PYQ'],
    faqs: [
      { q: 'Are NEET PYQs enough to score above 600?', a: 'PYQs plus complete NCERT reading covers most of the paper, but you should add full-length mock tests for speed and accuracy.' },
      { q: 'Is the material free?', a: 'Yes, everything on this page is free and open to all visitors.' },
    ],
  },
  {
    slug: 'jee-neet-books',
    heading: 'Best Books for JEE & NEET — Free Reading Material',
    seoTitle: 'Best JEE & NEET Books List and Free Study Material | Rankers Star',
    description:
      'Curated books and reference material for JEE and NEET aspirants — NCERT companions, theory books and practice compilations, free to browse.',
    intro:
      'The right book list saves months. Below are the reference books and compiled study materials our community relies on for JEE and NEET, covering theory, solved examples and practice problems for every subject.',
    types: ['Books', 'Other Material'],
    topics: ['NCERT', 'Physics Theory', 'Organic Chemistry', 'Objective Maths', 'Biology Reference'],
    faqs: [
      { q: 'Which books matter most for NEET?', a: 'NCERT Biology is non-negotiable; add one reference each for Physics and Chemistry practice rather than collecting many books.' },
      { q: 'Do you own this content?', a: 'No. All third-party material belongs to its respective owners and is shared for educational purposes only.' },
    ],
  },
  {
    slug: 'jee-neet-lectures',
    heading: 'Free JEE & NEET Video Lectures and Lecture PDFs',
    seoTitle: 'Free JEE & NEET Video Lectures + Lecture Notes PDF | Rankers Star',
    description:
      'Watch free JEE and NEET lecture series and download matching lecture notes PDF for Physics, Chemistry, Maths and Biology.',
    intro:
      'Full lecture series plus the lecture PDFs that go with them, so you can learn a chapter and revise it from the same source. Useful for self-study students and for anyone catching up on missed coaching classes.',
    types: ['Lectures', 'Lecture PDF'],
    topics: ['Class 11 Physics', 'Class 12 Physics', 'Organic Chemistry', 'Maths Full Course', 'Biology Full Course'],
    faqs: [
      { q: 'Are the lectures free?', a: 'Yes — every lecture link on this page is freely accessible.' },
      { q: 'Can I self-study JEE or NEET from lectures alone?', a: 'Yes, provided you pair each lecture with problem solving, short-note revision and regular mock tests.' },
    ],
  },
  {
    slug: 'class-11-12-boards-material',
    heading: 'Class 11 & 12 Board Exam Study Material',
    seoTitle: 'Class 11 & 12 Board Exam Notes and Sample Papers Free | Rankers Star',
    description:
      'Free Class 11 and Class 12 board exam notes, sample papers and chapter material for Physics, Chemistry, Maths and Biology.',
    intro:
      'Board marks still matter for eligibility and college choices. These notes, sample papers and chapter summaries follow the CBSE/state board pattern while staying aligned with the JEE and NEET syllabus, so one revision serves both.',
    types: ['Boards', 'Other Material'],
    topics: ['CBSE Sample Papers', 'Class 12 Physics', 'Class 11 Chemistry', 'Board Revision Notes'],
    faqs: [
      { q: 'Do board notes overlap with JEE and NEET preparation?', a: 'Substantially. Both entrance exams are built on the NCERT syllabus, so board revision reinforces entrance preparation.' },
    ],
  },
];

export const getCategory = (slug?: string) => NOTES_CATEGORIES.find((c) => c.slug === slug);
