"use client";

import { useState, useEffect } from "react";
import type { DreamImage } from "@/lib/db";

type AppState = "idle" | "loading" | "done";

const PLACEHOLDER = "I dream of a shark in the river. There is also a giant squid.";

function sortSectionsContextFirst(sections: DreamImage["sections"]) {
  const context = sections.filter((s) => s.label.toLowerCase().includes("context"));
  const rest = sections.filter((s) => !s.label.toLowerCase().includes("context"));
  return [...context, ...rest];
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [dream, setDream] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<DreamImage[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loadingWord, setLoadingWord] = useState("Decoding");

  useEffect(() => {
    if (appState !== "loading") return;
    setLoadingWord("Decoding");
    const interval = setInterval(() => {
      setLoadingWord((w) => (w === "Decoding" ? "Translating" : "Decoding"));
    }, 4000);
    return () => clearInterval(interval);
  }, [appState]);

  async function translate() {
    if (!dream.trim()) return;
    setAppState("loading");
    setError(null);
    setImages([]);
    setActiveKey(null);

    try {
      const res = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      const imgs: DreamImage[] = data.images ?? [];
      setImages(imgs);
      setActiveKey(imgs[0]?.key ?? null);
      setAppState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setAppState("idle");
    }
  }

  function reset() {
    setAppState("idle");
    setDream("");
    setImages([]);
    setActiveKey(null);
    setError(null);
  }

  const activeImage = images.find((img) => img.key === activeKey) ?? null;

  // ── Loading screen ──────────────────────────────────────────────
  if (appState === "loading") {
    return (
      <div className="loading-screen">
        <div className="loading-screen-inner">
          <div className="loading-dots">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
          <span className="loading-word">{loadingWord}</span>
        </div>
      </div>
    );
  }

  // ── Results screen ──────────────────────────────────────────────
  if (appState === "done") {
    return (
      <div className="container">
        <div className="dream-readonly">
          <p className="dream-readonly-text">"{dream}"</p>
          <button className="reset-btn" onClick={reset}>↩ New dream</button>
        </div>

        {error && <div className="error-block">{error}</div>}

        {images.length > 0 && (
          <div className="found-section">
            <div className="found-label">Images</div>
            <div className="pills">
              {images.map((img) => (
                <button
                  key={img.key}
                  className={`pill${activeKey === img.key ? " active" : ""}`}
                  onClick={() => setActiveKey(img.key)}
                >
                  {img.name}
                </button>
              ))}
            </div>

            {activeImage && (
              <>
                <hr className="divider" />
                <div className="image-name">{activeImage.name}</div>
                {sortSectionsContextFirst(activeImage.sections).map((section) => (
                  <div className="section-group" key={section.label}>
                    <div className="section-label">{section.label}</div>
                    <table>
                      <tbody>
                        {section.facts.map((fact, i) => (
                          <tr key={i}>
                            <td className="fact-cell">
                              {section.abnormalIndices?.includes(i) && (
                                <span className="warning-sign" title="Strange or abnormal">⚠</span>
                              )}
                              {fact}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                {activeImage.gap && (
                  <div className="gap-block">
                    <div className="section-label">Reaction gap</div>
                    <p className="gap-text">{activeImage.gap}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Idle / input screen ─────────────────────────────────────────
  return (
    <div className="container">
      <h1 className="question-heading">What have you been dreaming about?</h1>
      <textarea
        value={dream}
        onChange={(e) => setDream(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={4}
        autoFocus
      />
      <button
        className="reread-btn"
        onClick={translate}
        disabled={!dream.trim()}
      >
        Translate →
      </button>
      {error && <div className="error-block">{error}</div>}
    </div>
  );
}
