import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo/site";

/**
 * Site-wide social share card, generated at request time by next/og.
 *
 * Placing this at the app root means Next automatically attaches `og:image` and
 * `twitter:image` to every route that doesn't define its own — so shared links
 * to the home page, /about, /contact and /howtobuy stop rendering as bare text.
 * Product pages override it with the actual bottle shot.
 *
 * Deliberately no remote font fetch: it would add a network hop to every render
 * and fails closed (a broken card) if the font host is slow. System serif
 * carries the brand adequately at this size.
 */
export const runtime = "edge";
export const alt = `${SITE.name} — Perfumes originales en Costa Rica`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#c9a96e";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 12% 8%, #1e1e1e 0%, #111 45%, #000 100%)",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {/* Top hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            width: "100%",
            height: 2,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          }}
        />

        <div
          style={{
            fontSize: 104,
            letterSpacing: 28,
            color: "#ffffff",
            fontWeight: 300,
            display: "flex",
          }}
        >
          AROMA
        </div>

        <div
          style={{
            fontSize: 28,
            letterSpacing: 12,
            color: GOLD,
            fontStyle: "italic",
            marginTop: 8,
            display: "flex",
          }}
        >
          Luxury Fragrance
        </div>

        {/*
          flexShrink: 0 is required — Satori (the next/og layout engine) is
          flex-only, so a fixed-width rule inside a column flex container gets
          collapsed to a dot without it.
        */}
        <div
          style={{
            width: 160,
            height: 2,
            flexShrink: 0,
            background: GOLD,
            opacity: 0.55,
            margin: "44px 0",
          }}
        />

        <div
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.62)",
            letterSpacing: 3,
            display: "flex",
          }}
        >
          Perfumes originales · Costa Rica
        </div>

        {/* Bottom hairline */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 2,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          }}
        />
      </div>
    ),
    size
  );
}
