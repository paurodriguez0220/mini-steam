import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import StorePage from "./routes/StorePage.tsx";
import GameDetailPage from "./routes/GameDetailPage.tsx";
import PlayRoute from "./routes/PlayRoute.tsx";
import SampleBoot from "./pages/SampleBoot.tsx";
import SampleChooser from "./pages/SampleChooser.tsx";
import SampleRoute from "./pages/SampleRoute.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<StorePage />} />
          <Route path="games/:id" element={<GameDetailPage />}>
            {/* Renders over the detail page, so closing it goes back one entry. */}
            <Route path="play" element={<PlayRoute />} />
          </Route>
        </Route>

        {/* Visual reference for the playroom rewrite. Removed once signed off. */}
        <Route element={<SampleBoot />}>
          <Route path="/samples" element={<SampleChooser />} />
          <Route path="/samples/:slug" element={<SampleRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
