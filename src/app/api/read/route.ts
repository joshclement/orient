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
Write 3–6 facts per section. Plain. Specific. Observable.
Add a "Context in this dream" section with 2–3 facts about how this image appears in this specific dream.

— On the Myth section —
Include a Myth section when the image has a documented presence in mythology, folklore, alchemy, religion, or fairy tale. Write only what the image actually does or is in those stories — not what it symbolises. If a river swallows a hero in a myth, write that. Also include patterns in how humans have consistently encountered or responded to this image across cultures and history: what they built around it, feared, revered, or institutionalised. Keep this factual. No interpretation.

— On anomaly detection —
In the "Context in this dream" section, flag any fact where the image appears in a way that departs from its normal context. Do not limit flags to environmental impossibilities. Flag:
- Inversions of use (a skateboard used with hands instead of feet — skateboards are designed for feet on the deck)
- Things in the wrong environment (a shark in fresh water — sharks require salt to regulate osmosis)
- Unusual pairings or social/functional mismatches
- Anything being used or appearing against its own nature

A skateboard ridden with hands is as significant as a shark in fresh water. Flag both.
Record the 0-based index of each flagged fact in abnormalIndices.

— On personal reactions —
After presenting the objective facts of each image, note what the gap between a typical personal reaction and the objective nature reveals. Do not discard the dreamer's associations — use them as a diagnostic. A dreamer who feels calm about a shark is more significant than one who feels frightened: the calm response indicates a failure to register what is objectively present. Name what a typical person tends to feel or think about this image, then state plainly what the objective facts show that the typical reaction misses or obscures. Keep this to 2–3 sentences.

— On ranking —
Assign interestRank: 1 = most animate/central, higher = more contextual or environmental. No ties.`;

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
          gap: {
            type: "string",
            description: "2–3 sentences: what the typical personal reaction to this image misses or obscures, given its objective nature.",
          },
        },
        required: ["key", "name", "interestRank", "sections", "gap"],
      },
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

    const { images } = toolUse.input as { images: DreamImage[] };

    images.sort((a, b) => a.interestRank - b.interestRank);

    return NextResponse.json({ images });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
