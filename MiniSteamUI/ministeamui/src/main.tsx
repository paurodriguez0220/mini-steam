import { StrictMode, Suspense, lazy } from "react";
import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import SampleBoot from "./pages/SampleBoot.tsx";
import SampleChooser from "./pages/SampleChooser.tsx";

// Each sample ships its own stylesheet. Loading them lazily means only the stylesheet
// for the route being viewed is in the document, so samples cannot bleed into one
// another while they are being compared.
const SAMPLES: Record<string, ComponentType> = {
  marketplace: lazy(() => import("./samples/marketplace")),
  playroom: lazy(() => import("./samples/playroom")),
  zine: lazy(() => import("./samples/zine")),
  atrium: lazy(() => import("./samples/atrium")),
};

function SampleRoute() {
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />

        {/* Design directions under evaluation. Remove these once one is chosen. */}
        <Route element={<SampleBoot />}>
          <Route path="/samples" element={<SampleChooser />} />
          <Route path="/samples/:slug" element={<SampleRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
