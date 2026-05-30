"use client";

import { useState, useEffect } from "react";
import type { DreamImage } from "@/lib/db";

type AppState = "idle" | "loading" | "done";

const PLACEHOLDER = "I am sitting on a rickety raft in the ocean, surrounded by sharks.";
const HISTORY_KEY = "dream-reader:history";
const MAX_HISTORY = 5;

interface HistoryEntry {
  dream: string;
  images: DreamImage[];
  note: string | null;
}

function sortSectionsContextFirst(sections: DreamImage["sections"]) {
  const context = sections.filter((s) => s.label.toLowerCase().includes("context"));
  const rest = sections.filter((s) => !s.label.toLowerCase().includes("context"));
  return [...context, ...rest];
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return (Array.isArray(raw) ? raw : []).filter(
      (e): e is HistoryEntry => e && typeof e === "object" && typeof e.dream === "string" && Array.isArray(e.images)
    );
  } catch {
    return [];
  }
}

function saveToHistory(entry: HistoryEntry) {
  const prev = loadHistory().filter((e) => e.dream !== entry.dream);
  const next = [entry, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [dream, setDream] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<DreamImage[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function translate() {
    if (!dream.trim()) return;
    setAppState("loading");
    setError(null);
    setImages([]);
    setNote(null);
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
      const n: string | null = data.note ?? null;
      setImages(imgs);
      setNote(n);
      setActiveKey(imgs[0]?.key ?? null);
      const entry: HistoryEntry = { dream: dream.trim(), images: imgs, note: n };
      saveToHistory(entry);
      setHistory(loadHistory());
      setAppState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setAppState("idle");
    }
  }

  function restore(entry: HistoryEntry) {
    setDream(entry.dream);
    setImages(entry.images);
    setNote(entry.note);
    setActiveKey(entry.images[0]?.key ?? null);
    setError(null);
    setAppState("done");
  }

  function reset() {
    setAppState("idle");
    setDream("");
    setImages([]);
    setNote(null);
    setActiveKey(null);
    setError(null);
  }

  const activeImage = images.find((img) => img.key === activeKey) ?? null;

  const aboutOverlay = showAbout && (
    <div className="about-overlay" onClick={() => setShowAbout(false)}>
      <div className="about-box" onClick={(e) => e.stopPropagation()}>
        <button className="about-close" onClick={() => setShowAbout(false)}>Close</button>
        <p>Dreams are made of images. Most approaches to understanding these images are subjective. Your associations, your feelings, your memories.</p>
        <p>The subjective is important, but Jungian analyst Yoram Kaufmann believed the objective facts contained meaning too. A shark isn't just a symbol that represents fear. It's also a fish, has no eyelids, must keep moving to breathe, and is one of the oldest living species on earth. These facts are not neutral.</p>
        <p>Enter your dream. We'll extract the most important images and facts. Use them to orient and find meaning in your dreams.</p>
      </div>
    </div>
  );

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
          <span className="loading-word">Translating</span>
        </div>
      </div>
    );
  }

  const aboutBtn = (
    <button className="about-btn" onClick={() => setShowAbout(true)}>About</button>
  );

  // ── Results screen ──────────────────────────────────────────────
  if (appState === "done") {
    return (
      <div className="container">
        {aboutBtn}
        {aboutOverlay}
        <div className="dream-readonly">
          <p className="dream-readonly-text">"{dream}"</p>
          <button className="reset-btn" onClick={reset}>↩ New dream</button>
        </div>

        {error && <div className="error-block">{error}</div>}

        {note && (
          <div className="note-block">
            <div className="section-label">Worth noting</div>
            <p className="note-text">{note}</p>
          </div>
        )}

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
                                <span className="warning-sign" title="Strange or abnormal">!</span>
                              )}
                              {fact}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
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
      {aboutBtn}
      {aboutOverlay}
      <h1 className="question-heading">What have you been dreaming about?</h1>
      <textarea
        value={dream}
        onChange={(e) => setDream(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (dream.trim()) translate();
          }
        }}
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

      {history.length > 0 && (
        <div className="history">
          <div className="found-label">Recent</div>
          {history.map((entry, i) => (
            <button key={i} className="history-item" onClick={() => restore(entry)}>
              "{entry.dream}"
            </button>
          ))}
        </div>
      )}

      <footer className="page-footer">
        Inspired by Yoram Kaufmann. Made by <a href="https://joshclement.com/" target="_blank" rel="noopener noreferrer" className="footer-link">Josh Clement</a>.
      </footer>
    </div>
  );
}
