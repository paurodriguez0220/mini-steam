import type { Tile as TileType } from "../types";

type Props = {
  tile: TileType;
};

// Map tile values to background and text colors
const COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: "bg-[#EEE4DA]", text: "text-[#776E65]" },
  4: { bg: "bg-[#EDE0C8]", text: "text-[#776E65]" },
  8: { bg: "bg-[#F2B179]", text: "text-[#F9F6F2]" },
  16: { bg: "bg-[#F59563]", text: "text-[#F9F6F2]" },
  32: { bg: "bg-[#F67C60]", text: "text-[#F9F6F2]" },
  64: { bg: "bg-[#F65E3B]", text: "text-[#F9F6F2]" },
  128: { bg: "bg-[#EDCF73]", text: "text-[#F9F6F2]" },
  256: { bg: "bg-[#EDCC62]", text: "text-[#F9F6F2]" },
  512: { bg: "bg-[#EDC850]", text: "text-[#F9F6F2]" },
  1024: { bg: "bg-[#EDC53F]", text: "text-[#F9F6F2]" },
  2048: { bg: "bg-[#EDC22D]", text: "text-[#F9F6F2]" },
};

// Fallback for very large numbers
const getTileColor = (value: number) => COLORS[value] ?? { bg: "bg-black", text: "text-white" };

export const Tile = ({ tile }: Props) => {
  const { bg, text } = getTileColor(tile.value);

  return (
    <div
      className={`absolute w-20 h-20 flex items-center justify-center font-bold text-4xl rounded transition-all duration-300 transform ${bg} ${text} ${tile.spawn ? "scale-0 animate-pop" : "scale-100"}`}
      style={{
        top: tile.row * 84 + "px",
        left: tile.col * 84 + "px",
      }}
    >
      {tile.value}
    </div>
  );
};
