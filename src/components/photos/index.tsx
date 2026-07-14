/**
 * Photographic evidence art. Each photo is an inline SVG (no assets
 * shipped, matching the synthesized-audio convention) rendered inside
 * the Photo modal and as a thumbnail in the case-file notebook.
 *
 * To add a photo: draw a component here, register it in PHOTO_ART,
 * and (if an inventory item should show it) map the item id in
 * ITEM_PHOTOS.
 */
import type { ComponentType } from 'react';

/** The Blue Room, Oct 14 — the handoff, and Hale in the bar mirror. */
function BlueRoomArt() {
  return (
    <svg viewBox="0 0 320 240" role="img" aria-label="Photograph of the Blue Room bar">
      <defs>
        <linearGradient id="br-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2740" />
          <stop offset="1" stopColor="#0c111d" />
        </linearGradient>
        <radialGradient id="br-lamp" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#ffe9b8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffe9b8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="br-vig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* bar-room wall */}
      <rect width="320" height="240" fill="url(#br-wall)" />

      {/* pendant lamp + cone of light over the table */}
      <line x1="92" y1="0" x2="92" y2="38" stroke="#0a0d14" strokeWidth="3" />
      <path d="M80 38 L104 38 L97 50 L87 50 Z" fill="#26334a" />
      <ellipse cx="92" cy="50" rx="7" ry="4" fill="#ffe9b8" opacity="0.9" />
      <path d="M92 50 L30 190 L165 190 Z" fill="url(#br-lamp)" />

      {/* back bar: shelf, bottles, mirror */}
      <rect x="196" y="34" width="104" height="78" rx="3" fill="#2b3a52" stroke="#3e5674" strokeWidth="3" />
      {/* Hale's reflection in the mirror */}
      <g fill="#0e1420">
        <path d="M226 112 Q231 84 248 82 Q266 84 270 112 Z" />
        <circle cx="248" cy="70" r="12" />
        {/* hat brim */}
        <path d="M233 66 Q248 58 263 66 L263 62 Q248 52 233 62 Z" />
      </g>
      {/* face sliver caught turning — enough to recognize */}
      <path d="M252 62 Q258 64 258 72 Q258 78 253 80 Q256 71 252 62 Z" fill="#8fa3c0" opacity="0.75" />
      {/* glass in his hand, half raised */}
      <rect x="264" y="92" width="6" height="10" fill="#8fa3c0" opacity="0.5" />

      {/* bottle shelf under the mirror */}
      <rect x="192" y="126" width="112" height="5" fill="#211a12" />
      <g fill="#101722">
        <rect x="203" y="102" width="9" height="24" rx="2" />
        <rect x="217" y="96" width="8" height="30" rx="2" />
        <rect x="286" y="100" width="9" height="26" rx="2" />
      </g>
      <rect x="219" y="90" width="4" height="8" fill="#101722" />

      {/* bar counter */}
      <rect x="184" y="131" width="136" height="16" fill="#2b2013" />
      <rect x="184" y="147" width="136" height="50" fill="#17111a" />

      {/* the table, foreground */}
      <ellipse cx="92" cy="178" rx="62" ry="13" fill="#232c3d" />
      <rect x="86" y="184" width="12" height="42" fill="#141a26" />

      {/* Vera, left — hair pinned up */}
      <g fill="#0a0f1a">
        <path d="M18 226 Q20 176 44 170 Q60 172 62 200 L60 226 Z" />
        <circle cx="46" cy="156" r="13" />
        <path d="M36 148 Q46 140 57 149 Q58 143 46 141 Q37 142 36 148 Z" />
        {/* arm reaching to the paper */}
        <path d="M58 182 Q78 172 96 172 L96 178 Q78 178 62 190 Z" />
      </g>

      {/* "Iris", right — headscarf, passing the page */}
      <g fill="#0c1220">
        <path d="M170 226 Q168 178 144 172 Q128 174 126 202 L128 226 Z" />
        <circle cx="142" cy="158" r="12" />
        <path d="M130 158 Q128 144 142 143 Q155 144 154 158 Q148 148 136 150 Q131 152 130 158 Z" />
        <path d="M128 184 Q110 174 96 172 L96 178 Q112 180 124 192 Z" />
      </g>

      {/* the ledger page changing hands, lit by the lamp */}
      <rect x="84" y="167" width="20" height="13" rx="1" fill="#e9e4d2" transform="rotate(-7 94 173)" />
      <line x1="88" y1="170" x2="100" y2="169" stroke="#8a8064" strokeWidth="1" />
      <line x1="88" y1="173" x2="100" y2="172" stroke="#8a8064" strokeWidth="1" />

      {/* film grain */}
      <g fill="#ffffff" opacity="0.05">
        <circle cx="40" cy="60" r="1.2" />
        <circle cx="150" cy="30" r="1" />
        <circle cx="240" cy="200" r="1.4" />
        <circle cx="300" cy="60" r="1" />
        <circle cx="70" cy="120" r="1" />
        <circle cx="200" cy="170" r="1.2" />
      </g>
      <rect width="320" height="240" fill="url(#br-vig)" />

      {/* Vera's red grease pencil: the circle around the mirror, her scrawl */}
      <ellipse
        cx="249"
        cy="82"
        rx="34"
        ry="30"
        fill="none"
        stroke="#c94436"
        strokeWidth="3.2"
        strokeDasharray="34 5 55 4 40 6"
        strokeLinecap="round"
        transform="rotate(-6 249 82)"
        opacity="0.92"
      />
      <text
        x="278"
        y="40"
        fill="#c94436"
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fontSize="15"
        transform="rotate(4 278 40)"
      >
        M.H.
      </text>

      {/* her date scrawl, bottom corner */}
      <text
        x="252"
        y="228"
        fill="#e8e0cc"
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fontSize="12"
        opacity="0.8"
        transform="rotate(-2 252 228)"
      >
        10 · 14 — B.R.
      </text>
    </svg>
  );
}

/** Registry: photoId → art component. */
export const PHOTO_ART: Record<string, ComponentType> = {
  blue_room: BlueRoomArt,
};

/** Inventory items that carry a viewable photograph. */
export const ITEM_PHOTOS: Record<string, { photoId: string; caption: string }> = {
  blue_room_photo: {
    photoId: 'blue_room',
    caption:
      '"Iris" passes the ledger page across a Blue Room table. In the bar mirror: Marcus Hale, half-turned away — circled in red grease pencil, in Vera\u2019s own hand. She knew she\u2019d been followed.',
  },
};
