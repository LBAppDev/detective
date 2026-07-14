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
  briefing:
    'You’re reopening the file at the family’s request. Start where the original report never looked twice: her bedroom, sealed since the morning she was found. Everything is exactly where she left it — and Vera was a journalist. She kept notes only she could find.',
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
      'A bar matchbox kicked behind the desk. Inside the flap, in pencil: "clock · book · shelf" — not a code, an order. Vera scattered the suitcase digits around the room and left herself only the sequence to read them back. The Blue Room is a quiet bar across town. Not her neighborhood.',
  },
  train_ticket: {
    name: 'Train Ticket',
    description:
      'A one-way ticket for the 11:40 night train, dated October 14th \u2014 the night she died. Locked in a packed suitcase. Vera wasn\u2019t running from the story. She was leaving to finish it somewhere safe.',
  },

  drawer_key: {
    name: 'Small Brass Key',
    description:
      'Taped to the underside of her office chair. It fits the locked writing-desk drawer — Vera hid the key in the room it unlocked, the habit of someone who never expected the danger to come from inside the house.',
  },

  /* --- Office (Chapter 2) --- */
  cipher_notebook: {
    name: 'Cipher Notebook',
    description:
      'Vera\u2019s working notebook, every page in a hand-rolled cipher. In the margin of the last page: the circle-and-cross mark, three tallies beneath \u2014 her key. Slide each letter back by three and one line repeats: \u0022The third mark reads the mail.\u0022',
  },
  ledger_page: {
    name: 'Torn Ledger Page',
    description:
      'A page torn from the Halloway Trust\u2019s private ledger \u2014 the page her source passed her at The Blue Room. Recurring payments, going back years, to initials in this order, every month: E.V. \u2026 R.K. \u2026 and M.H. Stamped in the corner: the circle-and-cross mark from her bedroom wall. Three tallies. Three names on the payroll \u2014 and two men in this file answer to that last set of initials.',
  },
  voss_letters: {
    name: 'Legal Threats \u2014 Voss',
    description:
      'Three letters from Councilman Edward Voss\u2019s attorneys, each angrier than the last, demanding Vera drop the Halloway story. Loud. Public. On the record. The third was never mailed \u2014 it came by hand, and the delivery receipt stapled to it is signed \u0022M. Harrow.\u0022 Voss\u2019s fixer knew this house, and knew the way to her door.',
  },
  story_draft: {
    name: 'Final Draft \u2014 The Halloway Skim',
    description:
      'Vera\u2019s finished expos\u00e9, printed and locked in a wall safe behind her press photo \u2014 the combination was the date she died. Every claim sourced, every payment traced. A note clipped to the byline page, in her hand: \u0022If you\u2019re reading this without me, the ledger page is the proof. Trust no one at the paper.\u0022 She was ready to publish.',
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
      'An expensive bottle, brought that night, not from her rack. The handwritten tag: \u0022To the next chapter \u2014 M.\u0022 One initial \u2014 and two men in this case own it. The tag alone won\u2019t say which; the words might. \u0022The next chapter\u0022 is how an editor talks.',
  },
  blue_room_photo: {
    name: 'Photograph \u2014 The Blue Room',
    description:
      'Hidden behind a loose kitchen tile that only reveals itself when the shelf ornaments\u2019 shadows align with her pencil marks \u2014 Vera\u2019s best hiding place yet. The photo: her source \u0022Iris\u0022 passing the ledger page across a Blue Room table, October 14th. And at the bar behind them, half-turned away but unmistakable in the mirror \u2014 Marcus Hale. He was watching the handoff.',
  },
  crumpled_note: {
    name: 'Crumpled Note',
    description:
      'From the kitchen bin: \u0022Keep the ledger page close. I\u2019ll come to you \u2014 M.\u0022 The visitor asked her to have the evidence ready and waiting. Another lone \u0022M\u0022 \u2014 but read it against the answering machine: \u0022I\u2019ll come to you\u0022 is the voicemail, word for word.',
  },

  /* --- Stairwell (Chapter 4) --- */
  cufflink: {
    name: 'Silver Cufflink',
    description:
      'Wedged under the stair runner, engraved \u0022M.H.\u0022 \u2014 lost in the struggle to move a body no one was supposed to examine closely. Two men in this file wear those initials, and a cufflink won\u2019t say which. Ask instead who she\u2019d have opened the door for.',
  },
  stair_scratches: {
    name: 'Drag Marks',
    description:
      'Viewed from the right angle, scratches on the floorboards line up from the office doorway to the foot of the stairs. Bodies don\u2019t fall uphill. She was placed there.',
  },
  nadia_statement: {
    name: 'Nadia\u2019s Statement',
    description:
      '\u0022I was Iris. I set the Blue Room meeting through the paper\u2019s tip line \u2014 it was supposed to be safe. Only one person at The Ledger could read that tip line.\u0022 She hung up before saying the name. She didn\u2019t have to.',
  },
};

/* ------------------------------------------------------------------ */
/* Case closed — the epilogue shown after the correct accusation        */
/* ------------------------------------------------------------------ */

export const EPILOGUE = {
  title: 'Case Closed \u2014 The Halloway File',
  text:
    'Marcus Hale. Her mentor \u2014 and the third set of initials on the Trust\u2019s payroll. Miles Harrow shared those initials and the taste in cufflinks, and that was the Trust\u2019s insurance: if anyone ever read the ledger, the fixer would take the suspicion. But Vera would never have poured wine for the man who delivered her threats, and Harrow couldn\u2019t read The Ledger\u2019s tip line \u2014 only her editor could do both. Hale killed her story twice: once at the paper, citing \u0022insufficient sourcing,\u0022 and once in her kitchen, with a bottle marked \u0022to the next chapter.\u0022 The tip line told him his own reporter had the proof; the Blue Room mirror caught him watching the handoff; his voicemail kept her home; his cufflink stayed under the runner where he dragged her. The residue, the photograph, the drag marks, and Nadia\u2019s statement go to the district attorney in the morning. Vera\u2019s expos\u00e9 runs the day after \u2014 every word hers, under her byline, five years late. The 11:40 train still leaves on time. Case #47-1014: closed.',
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
    linkedClues: ['hale_voicemail', 'wine_gift', 'crumpled_note', 'cufflink', 'ledger_page', 'nadia_statement', 'cipher_notebook', 'story_draft', 'blue_room_photo'],
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
    id: 'harrow',
    name: 'Miles Harrow',
    role: '\u0022Security consultant,\u0022 Halloway Trust \u2014 Voss\u2019s fixer',
    portrait: '\ud83d\udd75\ufe0f',
    bio: 'Ex-detective, paid off the books to make the Trust\u2019s problems quiet. Hand-delivered the final legal threat, so he knew the house \u2014 a neighbor puts his car on her street twice that October. Wears monogrammed silver cufflinks. No alibi for the night of the 14th. His initials: M.H.',
    linkedClues: ['voss_letters', 'cufflink', 'ledger_page', 'wine_gift', 'crumpled_note'],
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
    text: 'Marcus Hale kills Vera\u2019s Halloway Trust expos\u00e9 at The Ledger \u2014 \u0022insufficient sourcing.\u0022 She keeps working it alone \u2014 and finishes it.',
    revealedBy: ['cipher_notebook', 'voss_letters', 'story_draft'],
  },
  {
    id: 'hand-delivery',
    time: 'One week before',
    text: 'The last legal threat arrives by hand. The receipt is signed M. Harrow \u2014 from here on, two men in this file share one set of initials.',
    revealedBy: ['voss_letters'],
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
    text: 'Vera meets her source \u0022Iris\u0022 at The Blue Room and receives a torn page from the Trust\u2019s real ledger. Someone she knows is at the bar, watching.',
    revealedBy: ['matchbox', 'ledger_page', 'blue_room_photo'],
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
