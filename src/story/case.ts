/**
 * Canonical case data for "The Halloway File".
 * Single source of truth for the clue catalog, suspects, and the
 * reconstructed timeline. Levels reference clue ids from here; the
 * Notebook renders all of it. Future rooms add clues to this catalog —
 * never define clue text anywhere else.
 */

export type ItemDetails = {
  name: string;
  description: string;
};

export const CASE_INFO = {
  number: 'Case #47-1014 · reopened',
  title: 'The Halloway File',
  victim: 'Vera Caldwell, 34 — investigative journalist, The Ledger',
  verdict:
    'Found at the foot of her home-office stairs on the morning of October 15th, five years ago. Ruled an accidental fall. Her brother never accepted it. The house has been kept untouched ever since.',
};

/* ------------------------------------------------------------------ */
/* Clue catalog                                                         */
/* ------------------------------------------------------------------ */

export const ITEM_DETAILS: Record<string, ItemDetails> = {
  /* --- Bedroom --- */
  bedroom_key: {
    name: 'Brass Key',
    description:
      'A small brass key hidden beneath the bedroom rug. It fits the door to Vera\u2019s home office \u2014 she kept it locked, even inside her own house.',
  },
  wall_symbol_clue: {
    name: 'The Mark',
    description:
      'Drawn on the bedroom wall in invisible ink: a circle, crossed through, with three tally marks beneath. Vera copied this from somewhere \u2014 an old journalist\u2019s habit of keeping notes only she could find. Three tallies. Three of something. Or three of someone.',
  },
  matchbox: {
    name: 'Matchbox \u2014 The Blue Room',
    description:
      'A bar matchbox kicked behind the desk. Inside the flap, in pencil: \u00224 \u00b7 7 \u00b7 2 \u00b7 9\u0022 \u2014 Vera\u2019s press ID number. The Blue Room is a quiet bar across town. Not her neighborhood.',
  },
  train_ticket: {
    name: 'Train Ticket',
    description:
      'A one-way ticket for the 11:40 night train, dated October 14th \u2014 the night she died. Locked in a packed suitcase. Vera wasn\u2019t running from the story. She was leaving to finish it somewhere safe.',
  },

  /* --- Office (Chapter 2) --- */
  cipher_notebook: {
    name: 'Cipher Notebook',
    description:
      'Vera\u2019s working notebook, written entirely in a substitution cipher. Decoded, one line repeats: \u0022The third mark reads the mail.\u0022',
  },
  ledger_page: {
    name: 'Torn Ledger Page',
    description:
      'A page torn from the Halloway Trust\u2019s private ledger \u2014 the page her source passed her at The Blue Room. Recurring payments, going back years, to initials: E.V. \u2026 R.K. \u2026 and M.H.',
  },
  voss_letters: {
    name: 'Legal Threats \u2014 Voss',
    description:
      'Three letters from Councilman Edward Voss\u2019s attorneys, each angrier than the last, demanding Vera drop the Halloway story. Loud. Public. On the record \u2014 which is exactly why they feel like the wrong answer.',
  },
  hale_voicemail: {
    name: 'Voicemail \u2014 Marcus Hale',
    description:
      'Answering machine, October 14th, 7:52 PM: \u0022Vera, it\u2019s Marcus. I know you\u2019re still chasing it. Don\u2019t do anything rash \u2014 stay home tonight, I\u2019ll come to you and we\u2019ll talk it through.\u0022 He knew she\u2019d be home.',
  },

  /* --- Kitchen (Chapter 3) --- */
  two_glasses: {
    name: 'Two Wine Glasses',
    description:
      'Two poured glasses on the kitchen counter, five years dry. No forced entry anywhere in the house. Vera poured wine for her visitor. She trusted whoever killed her.',
  },
  poison_residue: {
    name: 'Residue \u2014 Glass One',
    description:
      'Under UV light, a crystalline residue rings the inside of one glass only. The original autopsy never tested for it. The fall didn\u2019t kill her \u2014 the wine did.',
  },
  wine_gift: {
    name: 'Wine Bottle \u2014 Gift Tag',
    description:
      'An expensive bottle, brought that night, not from her rack. The handwritten tag: \u0022To the next chapter \u2014 M.\u0022',
  },
  crumpled_note: {
    name: 'Crumpled Note',
    description:
      'From the kitchen bin: \u0022Keep the ledger page close. I\u2019ll come to you \u2014 M.\u0022 The visitor asked her to have the evidence ready and waiting.',
  },

  /* --- Stairwell (Chapter 4) --- */
  cufflink: {
    name: 'Silver Cufflink',
    description:
      'Wedged under the stair runner, engraved \u0022M.H.\u0022 \u2014 lost in the struggle to move a body no one was supposed to examine closely.',
  },
  stair_scratches: {
    name: 'Drag Marks',
    description:
      'Viewed from the right angle, scratches on the floorboards line up from the office doorway to the foot of the stairs. Bodies don\u2019t fall uphill. She was placed there.',
  },
  nadia_statement: {
    name: 'Nadia\u2019s Statement',
    description:
      '\u0022I was Iris. I set the Blue Room meeting through the paper\u2019s tip line \u2014 it was supposed to be safe. Only one person at The Ledger could read that tip line. Her editor. Marcus Hale.\u0022',
  },
};

/* ------------------------------------------------------------------ */
/* Suspects                                                             */
/* ------------------------------------------------------------------ */

export type Suspect = {
  id: string;
  name: string;
  role: string;
  portrait: string;
  bio: string;
  /** Clue ids that count as evidence concerning this suspect. */
  linkedClues: string[];
};

export const SUSPECTS: Suspect[] = [
  {
    id: 'hale',
    name: 'Marcus Hale',
    role: 'Editor, The Ledger \u2014 Vera\u2019s mentor',
    portrait: '\ud83d\udd76\ufe0f',
    bio: 'Hired Vera, trained her, championed her \u2014 then killed her Halloway story two weeks before she died, citing \u0022insufficient sourcing.\u0022 Publicly devastated by her death. Gave a eulogy. Still runs the paper.',
    linkedClues: ['hale_voicemail', 'wine_gift', 'crumpled_note', 'cufflink', 'ledger_page', 'nadia_statement', 'cipher_notebook'],
  },
  {
    id: 'voss',
    name: 'Edward Voss',
    role: 'City Councilman \u2014 public face of the Halloway Trust',
    portrait: '\ud83c\udfdb\ufe0f',
    bio: 'Loud, litigious, and the first name on Vera\u2019s list. Sent legal threats for months. On the night of the murder he was giving a speech at a televised gala \u2014 four hundred witnesses.',
    linkedClues: ['voss_letters', 'ledger_page'],
  },
  {
    id: 'nadia',
    name: 'Nadia Sorel',
    role: 'Bookkeeper, Halloway Trust',
    portrait: '\ud83d\udc69\u200d\ud83d\udcbc',
    bio: 'Kept the Trust\u2019s real ledgers. Nervous, evasive, caught lying about knowing Vera. Was seen near The Blue Room on October 14th. If anyone could have handed Vera the Trust\u2019s secrets \u2014 or sold her out \u2014 it\u2019s her.',
    linkedClues: ['matchbox', 'ledger_page', 'nadia_statement'],
  },
  {
    id: 'ashe',
    name: 'Gregory Ashe',
    role: 'Ex-fianc\u00e9',
    portrait: '\ud83e\udd35',
    bio: 'The engagement ended eight months before her death, badly. Still had a key to the house \u2014 which would explain the lack of forced entry. No alibi. Never returned the ring.',
    linkedClues: ['two_glasses'],
  },
];

/* ------------------------------------------------------------------ */
/* Timeline of October 14th (reconstructed as clues are found)          */
/* ------------------------------------------------------------------ */

export type TimelineEntry = {
  id: string;
  time: string;
  text: string;
  /** Entry is revealed once ANY of these clues is collected. */
  revealedBy: string[];
};

export const TIMELINE: TimelineEntry[] = [
  {
    id: 'story-killed',
    time: 'Two weeks before',
    text: 'Marcus Hale kills Vera\u2019s Halloway Trust expos\u00e9 at The Ledger \u2014 \u0022insufficient sourcing.\u0022 She keeps working it alone.',
    revealedBy: ['cipher_notebook', 'voss_letters'],
  },
  {
    id: 'ticket',
    time: '6:10 PM',
    text: 'Vera buys a one-way ticket for the 11:40 night train. She plans to finish the story from somewhere safe.',
    revealedBy: ['train_ticket'],
  },
  {
    id: 'voicemail',
    time: '7:52 PM',
    text: 'A voicemail from Marcus Hale: stay home tonight, he\u2019ll come to her. Now he knows where she\u2019ll be.',
    revealedBy: ['hale_voicemail'],
  },
  {
    id: 'blue-room',
    time: '8:00 PM',
    text: 'Vera meets her source \u0022Iris\u0022 at The Blue Room and receives a torn page from the Trust\u2019s real ledger.',
    revealedBy: ['matchbox', 'ledger_page'],
  },
  {
    id: 'packing',
    time: '9:30 PM',
    text: 'Home. She packs a suitcase, locks the ticket inside, and copies the Trust\u2019s mark on her wall in invisible ink.',
    revealedBy: ['wall_symbol_clue', 'train_ticket'],
  },
  {
    id: 'visitor',
    time: '10:15 PM',
    text: 'A visitor arrives. No forced entry. Vera pours two glasses of wine \u2014 she trusts them completely.',
    revealedBy: ['two_glasses', 'crumpled_note'],
  },
  {
    id: 'murder',
    time: '~10:45 PM',
    text: 'One glass is poisoned. The body is dragged to the stairs and arranged as a fall. The laptop disappears. The ledger page is never found \u2014 because she\u2019d already hidden it.',
    revealedBy: ['poison_residue', 'stair_scratches', 'cufflink'],
  },
  {
    id: 'train',
    time: '11:40 PM',
    text: 'The night train leaves. Seat 14C is empty.',
    revealedBy: ['train_ticket'],
  },
];
