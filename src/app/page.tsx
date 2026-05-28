"use client";

import { useState } from "react";
import type { DreamImage } from "@/lib/db";

const PLACEHOLDER =
  "I'm in a swamp, near the edge of water. I see an alligator. I see a porcupine in the bushes too.";

export default function Home() {
  const [dream, setDream] = useState(PLACEHOLDER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<DreamImage[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  async function readImages() {
    if (!dream.trim()) return;
    setLoading(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const activeImage = images.find((img) => img.key === activeKey) ?? null;

  return (
    <div className="container">
      <h1>Dream Image Reader</h1>

      <p className="intro">
        Describe your dream below. Each image will be translated according to its
        objective nature — not your associations, not your life context. The orient
        emerges from what the thing actually is.
      </p>

      <div className="input-label">Dream</div>
      <textarea
        value={dream}
        onChange={(e) => setDream(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={4}
      />
      <button
        className="reread-btn"
        onClick={readImages}
        disabled={loading || !dream.trim()}
      >
        {loading ? "Reading…" : "Read images →"}
      </button>

      {loading && (
        <div className="loading">
          <div className="loading-dots">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
          Reading images
        </div>
      )}

      {error && (
        <div className="error-block">{error}</div>
      )}

      {!loading && images.length > 0 && (
        <div className="found-section">
          <div className="found-label">Images found</div>
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
              {activeImage.sections.map((section) => (
                <div className="section-group" key={section.label}>
                  <div className="section-label">{section.label}</div>
                  <table>
                    <tbody>
                      {section.facts.map((fact, i) => (
                        <tr key={i}>
                          <td className="fact-cell">{fact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="orient-block">
                <p className="orient-text">{activeImage.orient}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
