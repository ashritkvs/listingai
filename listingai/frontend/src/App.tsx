import { useMemo, useState } from "react";
import { generateListings } from "./api";
import type { GenerateRequest, Tone, Variation } from "./types";

type Status = "idle" | "loading" | "success" | "error";

const TONES: Tone[] = ["Luxury", "Standard", "Concise"];

function clampInt(value: string, min: number, max: number): number {
  const n = Number.parseInt(value || "0", 10);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function badgeClass(tone: Tone): string {
  if (tone === "Luxury") return "badge badge--luxury";
  if (tone === "Standard") return "badge badge--standard";
  return "badge badge--concise";
}

function resultCardClass(tone: Tone): string {
  if (tone === "Luxury") return "resultCard resultCard--luxury";
  if (tone === "Standard") return "resultCard resultCard--standard";
  return "resultCard resultCard--concise";
}

function textClass(tone: Tone): string {
  if (tone === "Luxury") return "resultText resultText--luxury";
  if (tone === "Standard") return "resultText resultText--standard";
  return "resultText resultText--concise";
}

function normalizeVariations(variations: Variation[] | null): Variation[] {
  if (!variations) return [];
  const byTone = new Map(variations.map((v) => [v.tone, v]));
  return TONES.map((t) => byTone.get(t) ?? { tone: t, description: "" });
}

export default function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [variations, setVariations] = useState<Variation[] | null>(null);
  const [copiedTone, setCopiedTone] = useState<Tone | null>(null);

  const [form, setForm] = useState<GenerateRequest>({
    address: "",
    property_type: "House",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    price: 650000,
    amenities: "",
    neighborhood_highlights: "",
    tone: "Standard",
  });

  const canSubmit = useMemo(() => {
    return form.address.trim().length > 0 && form.sqft >= 0 && form.price >= 0;
  }, [form.address, form.price, form.sqft]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    setVariations(null);
    try {
      const res = await generateListings(form);
      setVariations(res.variations);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  async function copy(tone: Tone, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTone(tone);
      window.setTimeout(() => setCopiedTone(null), 2000);
    } catch {
      setError("Could not copy to clipboard. Please copy manually.");
      setStatus("error");
    }
  }

  const normalized = normalizeVariations(variations);
  const showResults = status === "success" && normalized.some((v) => v.description);

  return (
    <div className="page">
      <header className="hero">
        <div className="heroInner">
          <div className="heroTitle">ListingAI 🏠</div>
          <div className="heroSubtitle">
            Generate professional property listings in seconds
          </div>
          <div className="heroDivider" />
        </div>
      </header>

      <main className="main">
        <section className="card">
          <div className="formKicker">PROPERTY DETAILS</div>
          <h2 className="cardTitle">Property Details</h2>

          <form onSubmit={onSubmit} className="form">
            <label className="field">
              <span className="label">Property Address</span>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="123 Main St, City, ST 12345"
                required
              />
            </label>

            <div className="grid2">
              <label className="field">
                <span className="label">Property Type</span>
                <select
                  className="input"
                  value={form.property_type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      property_type: e.target.value as GenerateRequest["property_type"],
                    }))
                  }
                >
                  <option>House</option>
                  <option>Condo</option>
                  <option>Townhouse</option>
                  <option>Commercial</option>
                </select>
              </label>

              <label className="field">
                <span className="label">Tone (optional)</span>
                <select
                  className="input"
                  value={form.tone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tone: e.target.value as Tone }))
                  }
                >
                  <option>Luxury</option>
                  <option>Standard</option>
                  <option>Concise</option>
                </select>
              </label>
            </div>

            <div className="grid3">
              <label className="field">
                <span className="label">Bedrooms</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={10}
                  value={form.bedrooms}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      bedrooms: clampInt(e.target.value, 1, 10),
                    }))
                  }
                />
              </label>

              <label className="field">
                <span className="label">Bathrooms</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={10}
                  value={form.bathrooms}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      bathrooms: clampInt(e.target.value, 1, 10),
                    }))
                  }
                />
              </label>

              <label className="field">
                <span className="label">Square Footage</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={form.sqft}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sqft: Math.max(0, Number(e.target.value || 0)),
                    }))
                  }
                />
              </label>
            </div>

            <label className="field">
              <span className="label">Listing Price</span>
              <div className="money">
                <span className="moneyPrefix">$</span>
                <input
                  className="input moneyInput"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      price: Math.max(0, Number(e.target.value || 0)),
                    }))
                  }
                  aria-label="Listing price"
                />
              </div>
              <div className="hint">Preview: ${formatPrice(form.price)}</div>
            </label>

            <label className="field">
              <span className="label">Key Amenities</span>
              <textarea
                className="input textarea"
                value={form.amenities}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amenities: e.target.value }))
                }
                placeholder="Pool, gym, hardwood floors, renovated kitchen..."
              />
            </label>

            <label className="field">
              <span className="label">Neighborhood Highlights</span>
              <textarea
                className="input textarea"
                value={form.neighborhood_highlights}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    neighborhood_highlights: e.target.value,
                  }))
                }
                placeholder="Walking distance to Central Park, top-rated schools, vibrant dining scene..."
              />
            </label>

            {status === "error" && error ? (
              <div className="errorBanner" role="alert">
                {error}
              </div>
            ) : null}

            <button className="button" disabled={!canSubmit || status === "loading"}>
              {status === "loading" ? (
                <span className="buttonRow">
                  <span className="spinner" aria-hidden="true" />
                  Generating...
                </span>
              ) : (
                "Generate Listing Descriptions"
              )}
            </button>
          </form>
        </section>

        <section className="results">
          <div className="resultsHeader">
            <h2 className="resultsTitle">Results</h2>
            <div className="resultsSub">
              {showResults ? "3 variations generated" : "Ready when you are"}
            </div>
          </div>

          {!showResults ? (
            <div className="emptyState">
              Fill in the property details and click Generate
            </div>
          ) : (
            <div className="resultGrid fadeIn">
              {normalized.map((v) => (
                <article key={v.tone} className={resultCardClass(v.tone)}>
                  <div className="resultTop">
                    <span className={badgeClass(v.tone)}>{v.tone}</span>
                    <button
                      className={
                        copiedTone === v.tone ? "copyButton copyButton--copied" : "copyButton"
                      }
                      onClick={() => copy(v.tone, v.description)}
                      type="button"
                      disabled={!v.description}
                    >
                      {copiedTone === v.tone ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <div className="resultBody">
                    <div className="resultScroll" role="region" aria-label={`${v.tone} description`}>
                      <div className={textClass(v.tone)}>{v.description}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <div>Powered by GPT-4o-mini</div>
        <div>Built by Venkata Sai Ashrit Kommireddy</div>
      </footer>
    </div>
  );
}

