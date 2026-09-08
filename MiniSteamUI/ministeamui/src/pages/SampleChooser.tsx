import { Link } from "react-router-dom";

interface SampleEntry {
  slug: string;
  name: string;
  tagline: string;
  reference: string;
  mode: string;
}

const SAMPLES: SampleEntry[] = [
  {
    slug: "marketplace",
    name: "Marketplace",
    tagline: "Dark, dense, built for scanning a catalogue.",
    reference: "Steam",
    mode: "Dark",
  },
  {
    slug: "playroom",
    name: "Playroom",
    tagline: "Light and toy-like, every game a character.",
    reference: "Nintendo eShop",
    mode: "Light",
  },
  {
    slug: "zine",
    name: "Zine",
    tagline: "Riso-printed gig poster. Type as cover art.",
    reference: "itch.io",
    mode: "Paper",
  },
  {
    slug: "atrium",
    name: "Atrium",
    tagline: "Quiet luxury, editorial pacing, lots of air.",
    reference: "Apple Arcade",
    mode: "Both",
  },
];

/**
 * Neutral landing page for comparing the four design directions.
 * Deliberately plain so it does not colour the judgement of any sample.
 */
export function SampleChooser() {
  return (
    <div style={{ minHeight: "100vh", background: "#101215", color: "#e8eaed", padding: "clamp(1.5rem, 5vw, 4rem)" }}>
      <div style={{ maxWidth: "60rem", margin: "0 auto" }}>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.55, margin: 0 }}>
          MiniSteam
        </p>
        <h1 style={{ fontSize: "clamp(1.6rem, 5vw, 2.5rem)", margin: "0.4rem 0 0.5rem", fontWeight: 600 }}>
          Design directions
        </h1>
        <p style={{ opacity: 0.6, margin: "0 0 2.5rem", maxWidth: "40rem", lineHeight: 1.6 }}>
          Four independent takes on the same storefront, all reading the same live API.
          Open each and resize the window &mdash; every one is meant to hold up at 360px.
        </p>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))",
          }}
        >
          {SAMPLES.map((sample) => (
            <Link
              key={sample.slug}
              to={`/samples/${sample.slug}`}
              style={{
                display: "block",
                padding: "1.25rem",
                border: "1px solid #2a2f36",
                borderRadius: "0.5rem",
                textDecoration: "none",
                color: "inherit",
                background: "#16191d",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                <strong style={{ fontSize: "1.05rem" }}>{sample.name}</strong>
                <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>{sample.mode}</span>
              </div>
              <p style={{ margin: "0.5rem 0 0.75rem", fontSize: "0.875rem", opacity: 0.7, lineHeight: 1.5 }}>
                {sample.tagline}
              </p>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.45 }}>
                ref &middot; {sample.reference}
              </span>
            </Link>
          ))}
        </div>

        <p style={{ marginTop: "2.5rem", fontSize: "0.8rem", opacity: 0.45 }}>
          <Link to="/" style={{ color: "inherit" }}>&larr; current storefront</Link>
        </p>
      </div>
    </div>
  );
}

export default SampleChooser;
