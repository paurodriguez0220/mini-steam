export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  prevRow?: number;
  prevCol?: number;
  spawn?: boolean;
};
