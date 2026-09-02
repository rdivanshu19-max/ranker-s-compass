import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://rankerstars.lovable.app';
const BRAND = 'Rankers Star';

type Meta = { title: string; description: string };

const DEFAULT_META: Meta = {
  title: 'Rankers Star: Free JEE NEET Prep & AI Tests',
  description:
    'Free JEE, NEET & Boards prep with AI mock tests, ASTRA mentor, doubt solving, PYQs, lectures, books, notes and study tracking on Rankers Star.',
};

/** Exact-path metadata. Dynamic routes fall back to their prefix entry. */
const ROUTE_META: Record<string, Meta> = {
  '/': DEFAULT_META,
  '/auth': {
    title: `Sign In or Create a Free Account | ${BRAND}`,
    description: 'Log in or sign up free to unlock AI mock tests, ASTRA mentor, the study library and progress tracking for JEE and NEET.',
  },
  '/reset-password': {
    title: `Reset Your Password | ${BRAND}`,
    description: 'Reset the password for your Rankers Star account and get back to your JEE and NEET preparation.',
  },
  '/terms': {
    title: `Terms & Conditions | ${BRAND}`,
    description: 'Read the terms and conditions covering the use of Rankers Star free study materials, AI tools and community features.',
  },
  '/privacy': {
    title: `Privacy Policy | ${BRAND}`,
    description: 'How Rankers Star collects, uses and protects your account data, study progress and cookie preferences.',
  },
  '/adsense': {
    title: `Advertising & AdSense Disclosure | ${BRAND}`,
    description: 'Details on the advertising partners and Google AdSense policies that keep Rankers Star free for every student.',
  },
  '/app': {
    title: `Your Study Dashboard | ${BRAND}`,
    description: 'Track study streaks, weekly hours, chapter-wise performance and ASTRA mentor tasks from your Rankers Star dashboard.',
  },
  '/app/library': {
    title: `Free JEE & NEET Study Library — Notes, PYQs, Books | ${BRAND}`,
    description: 'Download free short notes, previous year questions, books and lecture material for JEE, NEET and board exams.',
  },
  '/app/vault': {
    title: `Study Vault — Your Saved Materials | ${BRAND}`,
    description: 'Keep your downloaded notes, PYQs and books organised in one personal Rankers Star study vault.',
  },
  '/app/tests': {
    title: `Free AI Mock Tests for JEE & NEET | ${BRAND}`,
    description: 'Generate CBT-style AI mock tests for JEE and NEET with instant scoring, solutions and weak-topic analysis.',
  },
  '/app/apps': {
    title: `Study Apps & Practice Portals | ${BRAND}`,
    description: 'Explore curated study apps and practice portals for JEE, NEET and boards, all in one premium hub.',
  },
  '/app/store': {
    title: `Recommended Books & Study Gear | ${BRAND}`,
    description: 'Hand-picked books and study resources recommended by Rankers Star for JEE and NEET aspirants.',
  },
  '/app/community': {
    title: `Rankers Community — Doubts, Spaces & XP Leaderboard | ${BRAND}`,
    description: 'Ask doubts, join study spaces, share stories and climb the XP leaderboard with other JEE and NEET aspirants.',
  },
  '/app/test-series': {
    title: `JEE & NEET Test Series Hub | ${BRAND}`,
    description: 'Attempt full-syllabus and chapter-wise test series for JEE Main, JEE Advanced and NEET with detailed analysis.',
  },
  '/app/profile': {
    title: `Your Profile & Settings | ${BRAND}`,
    description: 'Manage your Rankers Star handle, avatar, bio, badges and account preferences.',
  },
  '/app/feedback': {
    title: `Share Feedback | ${BRAND}`,
    description: 'Tell us what to improve on Rankers Star — feature requests, bug reports and suggestions from students.',
  },
  '/app/about': {
    title: `About Rankers Star | ${BRAND}`,
    description: 'Rankers Star is a free platform giving every JEE, NEET and board student access to quality study material and AI tools.',
  },
  '/app/contribute': {
    title: `Contribute Materials or Support Us | ${BRAND}`,
    description: 'Share study materials or support Rankers Star financially to keep the platform free for every student.',
  },
};

/** Prefix fallbacks for dynamic routes. */
const PREFIX_META: [string, Meta][] = [
  ['/app/apps/', { title: `Study App Portals | ${BRAND}`, description: 'Open curated portals inside this study app for JEE, NEET and board preparation.' }],
  ['/app/test-series/', { title: `Test Series Details | ${BRAND}`, description: 'View tests, schedule and instructions for this Rankers Star test series.' }],
  ['/app/test/', { title: `Attempt Test | ${BRAND}`, description: 'Attempt this CBT-style test on Rankers Star with timer, palette and instant analysis.' }],
  ['/app/practice/', { title: `Infinite Practice | ${BRAND}`, description: 'Adaptive infinite practice for Maths, Physics and Chemistry with an AI tutor.' }],
  ['/app/portal/', { title: `Study Portal | ${BRAND}`, description: 'Study directly inside this curated portal on Rankers Star.' }],
];

function metaForPath(pathname: string): Meta {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  if (ROUTE_META[clean]) return ROUTE_META[clean];
  const prefix = PREFIX_META.find(([p]) => clean.startsWith(p));
  if (prefix) return prefix[1];
  return DEFAULT_META;
}

export default function RouteSeo() {
  const { pathname } = useLocation();
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  const { title, description } = metaForPath(pathname);
  const url = `${SITE_URL}${clean}`;
  const isPrivate = clean.startsWith('/app') || clean.startsWith('/.lovable') || clean === '/reset-password';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {isPrivate && <meta name="robots" content="noindex, follow" />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
