import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { DreamImage } from "@/lib/db";

const SYSTEM_PROMPT = `You are a dream image reader working in the "Way of the Image" / orientational approach.

Your task: identify every concrete image in the dream and describe each one according to its objective nature. Not symbolism. Not the dreamer's associations. What the thing actually is, how it actually behaves, what it actually does in the world.

— On plain language —
Every fact must describe what the thing does or is. If a sentence could not appear in a field guide or encyclopedia entry, cut it. Do not write what things represent or embody. Write what they are.

Wrong: "The river represents the flow of the unconscious."
Right: "Rivers move in one direction, from higher to lower elevation."

— On each image —
Choose 2–4 section labels from this list: Body, Behavior, Habitat, Movement, Ecology, Structure, Myth.
Use whichever labels fit the image — not all are required, but prefer labels that produce the most specific, observable facts.
Write 3–4 facts per section. Plain. Specific. Observable.
Add a "Context in this dream" section with 2–3 facts about how this image appears in this specific dream.

— On the Myth section —
Include a Myth section when the image has a documented presence in mythology, folklore, alchemy, religion, or fairy tale. Write only what the image actually does or is in those stories — not what it symbolises. If a river swallows a hero in a myth, write that. Also include patterns in how humans have consistently encountered or responded to this image across cultures and history: what they built around it, feared, revered, or institutionalised. Keep this factual. No interpretation.

— On anomaly detection —
For every image, after writing its objective facts, ask: does this image appear in its normal context in this dream, or has something about it been displaced, inverted, or misused?

In the "Context in this dream" section, write each fact about how the image appears — and for any fact that describes a departure from the image's normal use, environment, or nature, record its 0-based index in abnormalIndices.

Flag any of the following:
- Inversions of use (a skateboard ridden with hands — skateboards are designed for feet on the deck)
- Wrong environment (a shark in fresh water — sharks require salt to regulate osmosis)
- Functional mismatches (a vehicle on a wharf — wharves are designed for foot traffic and cargo, not driving)
- Social or relational mismatches
- Anything being used or appearing against its own nature

Do not describe a departure neutrally and then omit the flag. If a fact records something that departs from the image's normal use or nature, the index must appear in abnormalIndices.

— On the note —
The note is only for what the images say together that none of them says individually. Not a summary. Not a restatement of events. Not something already covered in the sections.

Reason through the combination fully — what each image is, what they establish together, what the dreamer's situation actually is given the objective facts. Then find the single sentence that carries the weight of all of it. The sentence that, once read, makes the others unnecessary.

Write only that one sentence. Plain. No interpretation. No conclusion stated — let the reader arrive there.

Example (pot plant + knot + pulling):
"The dreamer's method of removal — pulling — is the action that would make a knot grip harder."

If no single sentence rises to that level, omit the note entirely.

— On ranking —
Assign interestRank: 1 = most animate/central, higher = more contextual or environmental. No ties.
Return at most 5 images total. If the dream contains more, include only the 5 most significant.`;

const TOOL_INPUT_SCHEMA = {
  type: "object",
  properties: {
    images: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "lowercase identifier, e.g. 'alligator'",
          },
          name: {
            type: "string",
            description: "display name, e.g. 'alligator' or \"water's edge\"",
          },
          interestRank: {
            type: "number",
            description: "1 = most central, higher = more contextual",
          },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                facts: { type: "array", items: { type: "string" } },
                abnormalIndices: {
                  type: "array",
                  items: { type: "number" },
                  description: "0-based indices of context facts that depart from the image's normal nature or use",
                },
              },
              required: ["label", "facts"],
            },
          },
        },
        required: ["key", "name", "interestRank", "sections"],
      },
    },
    note: {
      type: "string",
      description: "Optional. One sentence — the single observation that carries the weight of what the images establish together. Omit if nothing rises to that level.",
    },
  },
  required: ["images"],
};

export async function POST(request: NextRequest) {
  const { dream } = await request.json();

  if (!dream?.trim()) {
    return NextResponse.json({ error: "No dream text provided" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the server." },
      { status: 500 }
    );
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: "read_dream_images",
          description: "Return every concrete image found in the dream with factual sections.",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input_schema: TOOL_INPUT_SCHEMA as any,
        },
      ],
      tool_choice: { type: "tool", name: "read_dream_images" },
      messages: [{ role: "user", content: dream }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("No tool use in response");
    }

    const { images, note } = toolUse.input as { images: DreamImage[]; note?: string };

    images.sort((a, b) => a.interestRank - b.interestRank);
    const top = images.slice(0, 5);

    return NextResponse.json({ images: top, note });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
