# Task: Move Minesweeper win detection out of an effect

**Status:** Planned

## Goal

Clear the last outstanding ESLint error in the repository without changing how the game
plays.

## Context

`Minesweeper/minesweeper/src/components/GameContainer.tsx` detects the win condition inside
a `useEffect` that watches `board`, then calls `setWon(true)` and `setStarted(false)`:

```tsx
useEffect(() => {
  if (gameOver) return;
  const revealed = board.flat().filter(c => c.isRevealed).length;
  if (revealed === config.rows * config.cols - config.mines) {
    setWon(true);
    setStarted(false);
  }
}, [board, gameOver, config]);
```

ESLint flags this: `Calling setState synchronously within an effect can trigger cascading
renders`. Win state is derived from the board, so it should not be stored in an effect.

Left in place during the 2026-09-07 standards cleanup because it is game logic and the
repository has no tests to prove a refactor preserves behaviour. Depends on
`add-test-suites.md`.

## Proposed Design

Compute the win condition where the board actually changes - inside the reveal handler -
and set `won` / `started` there, or derive `won` during render from `board` and drop the
state entirely. Take care that the timer stop (`setStarted(false)`) still fires exactly
once.

## Acceptance Criteria

- [ ] `npm run lint` passes in `Minesweeper/minesweeper`
- [ ] Revealing the last safe cell still wins and stops the timer
- [ ] Hitting a mine still ends the game and does not mark a win
- [ ] Covered by a test
