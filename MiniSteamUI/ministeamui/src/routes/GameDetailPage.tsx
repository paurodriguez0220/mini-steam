import type { JSX } from "react";
import { Outlet, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import type { Game } from "../store/useAppStore";
import { GameDetail } from "../components/GameDetail";
import { NoticePanel } from "../components/NoticePanel";
import { LoadingSkeletons } from "../components/LoadingSkeletons";
import { GameLeaderboard } from "./GameLeaderboard";
import type { GameContext, ShellContext } from "./outlet-context";

/** Minesweeper ranks per difficulty; the other games have a single board. */
const RANKED_DIFFICULTIES: Record<string, string[]> = {
  minesweeper: ["easy", "medium", "hard"],
};

export default function GameDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { theme } = useOutletContext<ShellContext>();
  const games = useAppStore((state) => state.games);
  const loading = useAppStore((state) => state.loading);
  const navigate = useNavigate();

  if (loading && !games) {
    return <LoadingSkeletons cardCount={0} />;
  }

  const gameId = Number(id);
  const game: Game | null =
    Number.isInteger(gameId) ? (games?.find((entry) => entry.id === gameId) ?? null) : null;

  if (!game) {
    return (
      <NoticePanel
        tone="empty"
        title="We could not find that game"
        message="The link may be out of date, or the game is no longer on the shelf."
        actionLabel="Back to the store"
        onAction={() => navigate("/")}
      />
    );
  }

  const context: GameContext = { game, theme };

  return (
    <div className="flex flex-col gap-8">
      <GameDetail
        game={game}
        related={(games ?? []).filter((entry) => entry.id !== game.id)}
        onBack={() => navigate("/")}
        onPlay={(entry) => navigate(`/games/${entry.id}/play`)}
        onOpen={(entry) => navigate(`/games/${entry.id}`)}
      />

      <GameLeaderboard
        gameId={game.id}
        difficulties={RANKED_DIFFICULTIES[game.title.toLowerCase()]}
      />

      {/* /games/:id/play renders the play overlay here. */}
      <Outlet context={context} />
    </div>
  );
}
