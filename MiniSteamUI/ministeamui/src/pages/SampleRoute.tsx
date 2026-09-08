import { Suspense, lazy } from "react";
import type { ComponentType, JSX } from "react";
import { Navigate, useParams } from "react-router-dom";

/**
 * Design directions kept reachable only while the playroom promotion is being
 * checked against them. Delete this file, `SampleBoot`, `SampleChooser` and
 * `src/samples/` once the comparison is signed off.
 *
 * Each sample ships its own stylesheet. Loading them lazily means only the
 * stylesheet for the route being viewed is in the document, so samples cannot
 * bleed into one another - or into the real storefront.
 */
const SAMPLES: Record<string, ComponentType> = {
  marketplace: lazy(() => import("../samples/marketplace")),
  playroom: lazy(() => import("../samples/playroom")),
  zine: lazy(() => import("../samples/zine")),
  atrium: lazy(() => import("../samples/atrium")),
};

export default function SampleRoute(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const Sample = slug ? SAMPLES[slug] : undefined;

  if (!Sample) {
    return <Navigate to="/samples" replace />;
  }

  return (
    <Suspense
      fallback={
        <div style={{ padding: "2rem", fontFamily: "sans-serif", color: "#888" }}>
          Loading sample&hellip;
        </div>
      }
    >
      <Sample />
    </Suspense>
  );
}
