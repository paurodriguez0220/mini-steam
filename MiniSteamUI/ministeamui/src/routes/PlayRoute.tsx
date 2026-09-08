import type { JSX } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PlayOverlay } from "../components/PlayOverlay";
import type { GameContext } from "./outlet-context";

/**
 * Adapter so `PlayOverlay` stays router-agnostic.
 *
 * Closing goes back one entry rather than pushing `/games/:id`, so Escape,
 * the close button and the browser Back button all land in the same place.
 */
export default function PlayRoute(): JSX.Element {
  const { game, theme } = useOutletContext<GameContext>();
  const navigate = useNavigate();

  return <PlayOverlay game={game} theme={theme} onClose={() => navigate(-1)} />;
}
