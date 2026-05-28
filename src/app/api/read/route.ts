import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { db, type DreamImage } from "@/lib/db";

const SYSTEM_PROMPT = `You are a dream image reader working in the "Way of the Image" / orientational approach.

Your task: identify every concrete image in the dream text and describe each one according to its objective nature — not psychological symbolism, not the dreamer's personal associations. What the thing actually IS. How it actually moves, lives, functions. What its actual character is in the world.

For each image:
- Choose 2–4 section labels that fit the image (e.g. Body, Behavior, Habitat, Character, Movement, Nature)
- Write 3–6 brief facts per section describing the objective nature of the thing
- Add a "Context in this dream" section with 2–3 observations about how this image appears specifically in this dream

In the "Context in this dream" section: note any facts that are strange, out of place, or impossible given the image's actual nature. For example, a shark appearing in a freshwater river is abnormal — sharks cannot survive in fresh water. Flag these by including their 0-based index in abnormalIndices.

Images to find: animals, places (swamp, forest, city), objects, structures, elements (water, fire), people (stranger, child), plants, weather — anything concrete that appears in the dream.

Write facts that are true regardless of who is dreaming. The porcupine has 30,000 quills whether or not the dreamer owns one. The water's edge shifts whether or not the dreamer grew up near water.

Assign interestRank: 1 = the most alive/animate/central image, higher numbers = more contextual or environmental. No two images share the same rank.`;

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
          description:
            "Return every concrete image found in the dream with factual sections.",
          input_schema: {
            type: "object" as const,
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
                            description: "0-based indices of facts that are strange or impossible given the image's actual nature",
                          },
                        },
                        required: ["label", "facts"],
                      },
                    },
                  },
                  required: ["key", "name", "interestRank", "sections"],
                },
              },
            },
            required: ["images"],
          },
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

    // Merge: replace any image whose key matches a curated DB entry with the curated version,
    // preserving the Claude-generated interestRank and context section (with abnormalIndices).
    const merged = images.map((img) => {
      const curated = db[img.key];
      if (!curated) return img;

      const contextSection = img.sections.find((s) =>
        s.label.toLowerCase().includes("context")
      );
      const sections = contextSection
        ? [...curated.sections, contextSection]
        : curated.sections;

      return { ...curated, interestRank: img.interestRank, sections };
    });

    merged.sort((a, b) => a.interestRank - b.interestRank);

    return NextResponse.json({ images: merged });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
