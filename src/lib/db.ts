export interface ImageSection {
  label: string;
  facts: string[];
}

export interface DreamImage {
  key: string;
  name: string;
  interestRank: number;
  sections: ImageSection[];
  orient: string;
}

/** Curated entries — returned instantly without an API call when matched. */
export const db: Record<string, DreamImage> = {
  alligator: {
    key: "alligator",
    name: "alligator",
    interestRank: 1,
    sections: [
      {
        label: "Body",
        facts: [
          "One of the oldest living species, largely unchanged for 200 million years",
          "Cold-blooded: body temperature is set by the surrounding environment",
          "Can hold still for hours at a time",
          "Capable of moving at high speed over short distances",
          "Has one of the strongest bite forces of any living animal",
          "No natural predators as an adult",
        ],
      },
      {
        label: "Behavior",
        facts: [
          "Primarily aquatic; most capable in or near water",
          "Waits in stillness and strikes when prey comes close — does not chase",
          "Can sense vibrations in water across long distances",
          "Spends most of its time resting or still",
          "Generally avoids humans unless nesting or cornered",
        ],
      },
    ],
    orient:
      "The orient is ancient, still, latent power. Something primordial is in the water nearby — not pursuing, but present and entirely in its element. This is not something to manage or overcome. It is something to be aware of and to respect the boundary of.",
  },
  porcupine: {
    key: "porcupine",
    name: "porcupine",
    interestRank: 2,
    sections: [
      {
        label: "Body",
        facts: [
          "Has roughly 30,000 quills, each with small backward-facing barbs at the tip",
          "Quills do not eject — they release on direct contact and work deeper into tissue as muscle moves",
          "Moves slowly; cannot outrun a threat",
          "Poor eyesight; relies mainly on smell and hearing",
        ],
      },
      {
        label: "Behavior",
        facts: [
          "Solitary; lives and forages alone",
          "When threatened, turns its back — leading with quills rather than teeth or claws",
          "Chatters its teeth and rattles its quills as a warning before any contact",
          "Does not pursue or initiate — contact is what causes injury",
          "Herbivore",
        ],
      },
    ],
    orient:
      "Something small and defensive is present, concealed, not seeking contact. It will only wound if approached carelessly or pressed against. It gives warning before harm occurs. The orient is one of respectful awareness — not confrontation, not avoidance, but attention to what happens when you don't look where you're going.",
  },
  swamp: {
    key: "swamp",
    name: "swamp",
    interestRank: 3,
    sections: [
      {
        label: "Body",
        facts: [
          "A wetland where land and water overlap — the boundary between them is not fixed",
          "Water is still or slow-moving and often opaque",
          "Ground can appear solid but may not hold weight",
          "Low in oxygen, high in nutrients; much of the life here is below the surface",
          "Organic matter decomposes continuously, which feeds new growth",
        ],
      },
      {
        label: "Character",
        facts: [
          "The surface does not show what is underneath",
          "Footing has to be tested; it cannot be assumed",
          "Many animals here stay hidden or partially submerged",
        ],
      },
    ],
    orient:
      "The orient is liminality under conditions of low visibility. The terrain here is genuinely uncertain — solid footing cannot be assumed. What is present is real but not fully knowable from the surface.",
  },
  water: {
    key: "water",
    name: "water's edge",
    interestRank: 4,
    sections: [
      {
        label: "Body",
        facts: [
          "The line where land meets water",
          "In a swamp, this line shifts — water level and vegetation move it",
          "The ground here belongs to neither element fully",
          "Animals from both land and water can be present",
        ],
      },
      {
        label: "Character",
        facts: [
          "The edge moves; what is dry ground at one time may be underwater at another",
          "Animals that live in water are closest to their range here",
        ],
      },
    ],
    orient:
      "The orient is the threshold. You are at the crossing point between two orders of reality, as close as you can be to the water without entering it. The decision of whether to go further, stay, or step back is implicit in this position.",
  },
  bush: {
    key: "bush",
    name: "bushes",
    interestRank: 5,
    sections: [
      {
        label: "Body",
        facts: [
          "Dense enough to partly conceal something but not to fully hide it",
          "Things can move in and out without much obstruction",
          "In a swamp, often sits along the water-land boundary",
        ],
      },
      {
        label: "Character",
        facts: [
          "Something in bushes is visible but not clearly so",
          "Getting closer reveals it; staying back does not",
        ],
      },
    ],
    orient:
      "The orient is partial concealment at the edge of awareness. Something is present but not yet fully disclosed — close enough to notice, far enough to remain indistinct.",
  },
};
