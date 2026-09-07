export interface GameCardProps {
  title: string;
  price: string;
  discount?: string;
  /** Icon URL from the API. Falls back to a placeholder when empty. */
  imageUrl?: string;
  /** Called when the user chooses to play. Omit to render a non-interactive card. */
  onPlay?: () => void;
}

export function GameCard({
  title,
  price,
  discount,
  imageUrl,
  onPlay,
}: GameCardProps) {
  const isPlayable = Boolean(onPlay);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow transition flex flex-col overflow-hidden text-gray-900 dark:text-white ${
        isPlayable ? "hover:shadow-lg cursor-pointer" : ""
      }`}
      onClick={onPlay}
    >
      {/* Cover art */}
      <div className="h-32 sm:h-36 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <h3 className="text-sm sm:text-base font-semibold">{title}</h3>
        <div className="flex items-center gap-2 mt-2 text-sm sm:text-base">
          <span>{price}</span>
          {discount && <span className="text-red-500 font-semibold">-{discount}</span>}
        </div>

        <button
          type="button"
          disabled={!isPlayable}
          // The card is clickable too; stop the bubble so play is not fired twice.
          onClick={(event) => {
            event.stopPropagation();
            onPlay?.();
          }}
          className="mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium py-1 sm:py-2 rounded transition"
        >
          {isPlayable ? `Play ${title}` : "Unavailable"}
        </button>
      </div>
    </div>
  );
}

export default GameCard;
