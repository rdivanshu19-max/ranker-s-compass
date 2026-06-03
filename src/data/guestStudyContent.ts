export type GuestMaterial = {
  id: string;
  title: string;
  description: string;
  link: string;
  types: string[];
  pinned: boolean;
  rating_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type GuestCourseResource = { title: string; url: string; type: string };

export type GuestCourse = {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  resources: GuestCourseResource[];
  created_at: string;
  pinned: boolean;
  tags: string[];
};

export const DATA_TIMEOUT_MS = 8000;

export const withDataTimeout = async <T,>(request: PromiseLike<T>, timeoutMs = DATA_TIMEOUT_MS): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Study data service timed out')), timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(request), timeout]);
  } finally {
    clearTimeout(timer!);
  }
};

const now = '2026-06-03T00:00:00.000Z';

export const OFFLINE_LIBRARY_MATERIALS: GuestMaterial[] = [
  {
    id: 'guest-ncert-physics-11',
    title: 'NCERT Physics Class 11 Textbook',
    description: 'Official NCERT Physics chapters for JEE, NEET and Boards foundation study.',
    link: 'https://ncert.nic.in/textbook.php?keph1=0-8',
    types: ['Books', 'Physics', 'JEE', 'NEET', 'Boards'],
    pinned: true,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'guest-ncert-physics-12',
    title: 'NCERT Physics Class 12 Textbook',
    description: 'Official Class 12 Physics chapters for electrostatics, optics, modern physics and more.',
    link: 'https://ncert.nic.in/textbook.php?leph1=0-8',
    types: ['Books', 'Physics', 'JEE', 'NEET', 'Boards'],
    pinned: true,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'guest-ncert-chemistry-11',
    title: 'NCERT Chemistry Class 11 Textbook',
    description: 'Official NCERT Chemistry for physical, inorganic and organic basics.',
    link: 'https://ncert.nic.in/textbook.php?kech1=0-9',
    types: ['Books', 'Chemistry', 'JEE', 'NEET', 'Boards'],
    pinned: true,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'guest-ncert-chemistry-12',
    title: 'NCERT Chemistry Class 12 Textbook',
    description: 'Official Class 12 Chemistry chapters for exam revision and concept clarity.',
    link: 'https://ncert.nic.in/textbook.php?lech1=0-10',
    types: ['Books', 'Chemistry', 'JEE', 'NEET', 'Boards'],
    pinned: true,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'guest-ncert-maths-11',
    title: 'NCERT Mathematics Class 11 Textbook',
    description: 'Official Mathematics chapters covering sets, trigonometry, coordinate geometry and calculus basics.',
    link: 'https://ncert.nic.in/textbook.php?kemh1=0-16',
    types: ['Books', 'Maths', 'JEE', 'Boards'],
    pinned: false,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'guest-ncert-maths-12',
    title: 'NCERT Mathematics Class 12 Textbook',
    description: 'Official Mathematics chapters for relations, matrices, calculus, vectors and probability.',
    link: 'https://ncert.nic.in/textbook.php?lemh1=0-13',
    types: ['Books', 'Maths', 'JEE', 'Boards'],
    pinned: false,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'guest-ncert-biology-11',
    title: 'NCERT Biology Class 11 Textbook',
    description: 'Official Biology chapters for NEET fundamentals and school exam preparation.',
    link: 'https://ncert.nic.in/textbook.php?kebo1=0-22',
    types: ['Books', 'Biology', 'NEET', 'Boards'],
    pinned: false,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'guest-ncert-biology-12',
    title: 'NCERT Biology Class 12 Textbook',
    description: 'Official Biology chapters for reproduction, genetics, ecology, evolution and biotechnology.',
    link: 'https://ncert.nic.in/textbook.php?lebo1=0-13',
    types: ['Books', 'Biology', 'NEET', 'Boards'],
    pinned: false,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'guest-nta-abhyas',
    title: 'NTA Mock Test Practice Portal',
    description: 'Official NTA practice area for CBT-style exam preparation.',
    link: 'https://www.nta.ac.in/Quiz',
    types: ['Tests', 'JEE Test', 'NEET Test', 'JEE', 'NEET'],
    pinned: false,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'guest-cbse-sample-papers',
    title: 'CBSE Academic Sample Papers',
    description: 'Official CBSE sample paper portal for board exam practice.',
    link: 'https://cbseacademic.nic.in/SQP_CLASSXII_2025-26.html',
    types: ['PYQs', 'Boards', 'Tests'],
    pinned: false,
    rating_enabled: false,
    created_at: now,
    updated_at: now,
  },
];

export const OFFLINE_COURSES: GuestCourse[] = [
  {
    id: 'guest-course-jee-foundation',
    title: 'JEE Foundation Starter Pack',
    description: 'A fast-start bundle for Physics, Chemistry and Maths basics using official textbooks and NTA practice.',
    poster_url: '',
    resources: [
      { title: 'NCERT Physics Class 11', url: 'https://ncert.nic.in/textbook.php?keph1=0-8', type: 'Book' },
      { title: 'NCERT Chemistry Class 11', url: 'https://ncert.nic.in/textbook.php?kech1=0-9', type: 'Book' },
      { title: 'NCERT Mathematics Class 11', url: 'https://ncert.nic.in/textbook.php?kemh1=0-16', type: 'Book' },
      { title: 'NTA Mock Tests', url: 'https://www.nta.ac.in/Quiz', type: 'Practice' },
    ],
    created_at: now,
    pinned: true,
    tags: ['popular', 'most used'],
  },
  {
    id: 'guest-course-neet-ncert',
    title: 'NEET NCERT Core Course',
    description: 'NCERT-first Biology, Physics and Chemistry plan for NEET students when login is unavailable.',
    poster_url: '',
    resources: [
      { title: 'NCERT Biology Class 11', url: 'https://ncert.nic.in/textbook.php?kebo1=0-22', type: 'Book' },
      { title: 'NCERT Biology Class 12', url: 'https://ncert.nic.in/textbook.php?lebo1=0-13', type: 'Book' },
      { title: 'NCERT Chemistry Class 12', url: 'https://ncert.nic.in/textbook.php?lech1=0-10', type: 'Book' },
      { title: 'NTA Mock Tests', url: 'https://www.nta.ac.in/Quiz', type: 'Practice' },
    ],
    created_at: now,
    pinned: true,
    tags: ['hot', 'popular'],
  },
  {
    id: 'guest-course-boards-revision',
    title: 'Class 12 Boards Revision Hub',
    description: 'Board-focused revision with official NCERT textbooks and CBSE sample papers.',
    poster_url: '',
    resources: [
      { title: 'CBSE Sample Papers', url: 'https://cbseacademic.nic.in/SQP_CLASSXII_2025-26.html', type: 'Practice' },
      { title: 'NCERT Physics Class 12', url: 'https://ncert.nic.in/textbook.php?leph1=0-8', type: 'Book' },
      { title: 'NCERT Chemistry Class 12', url: 'https://ncert.nic.in/textbook.php?lech1=0-10', type: 'Book' },
      { title: 'NCERT Mathematics Class 12', url: 'https://ncert.nic.in/textbook.php?lemh1=0-13', type: 'Book' },
    ],
    created_at: now,
    pinned: false,
    tags: ['boards', 'most used'],
  },
];