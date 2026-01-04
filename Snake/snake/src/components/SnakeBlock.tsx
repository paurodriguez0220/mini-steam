import type { Point } from "../types";

type SnakeBlockProps = {
  position: Point;
  size: number;
  isHead?: boolean;
};

export default function SnakeBlock({ position, size, isHead = false }: SnakeBlockProps) {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        left: position.x * size,
        top: position.y * size,
        backgroundColor: "#4A90E2", // blue snake
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isHead && (
        <>
          <div
            style={{
              width: size * 0.2,
              height: size * 0.2,
              backgroundColor: "white",
              borderRadius: "50%",
              position: "absolute",
              left: size * 0.25,
              top: size * 0.2,
            }}
          />
          <div
            style={{
              width: size * 0.2,
              height: size * 0.2,
              backgroundColor: "white",
              borderRadius: "50%",
              position: "absolute",
              right: size * 0.25,
              top: size * 0.2,
            }}
          />
        </>
      )}
    </div>
  );
}
