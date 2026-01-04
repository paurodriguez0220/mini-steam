import type { Point } from "../types";

type FoodBlockProps = {
  position: Point;
  size: number;
};

export default function FoodBlock({ position, size }: FoodBlockProps) {
  return (
    <div
      style={{
        position: "absolute",
        width: size * 0.8,
        height: size * 0.8,
        left: position.x * size + size * 0.1,
        top: position.y * size + size * 0.1,
        backgroundColor: "red",
        borderRadius: "50%",
        border: "2px solid #FF6666",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* small leaf on top */}
      <div
        style={{
          width: size * 0.15,
          height: size * 0.15,
          backgroundColor: "green",
          borderRadius: "50% 50% 0 0",
          position: "absolute",
          top: -size * 0.05,
        }}
      />
    </div>
  );
}
