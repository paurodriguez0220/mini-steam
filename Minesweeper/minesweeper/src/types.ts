export type GameConfig = {
  rows: number;
  cols: number;
  mines: number;
};

export type Cell = {
  hasMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};
