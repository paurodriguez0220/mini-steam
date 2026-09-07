# Issue: Snake shows "Game Over" a few seconds after loading

**Status:** Fix planned

## What Happens

Open Snake and do nothing. After roughly five seconds the board shows "Game Over" with a
"Restart" button, score 0, before the player has pressed a key.

## Context

The snake begins moving as soon as the component mounts, travelling in its default
direction until it reaches the edge of the grid and dies. There is no "press a key to
start" gate and no pause state, so any delay between the page loading and the first
keypress is fatal.

Reproduced on 2026-09-07 both standalone at `http://localhost:5175` and embedded in the
storefront iframe, which rules out the iframe embedding as a cause. Pre-existing.

## Possible Fix

Do not advance the game loop until the first direction input. Hold the snake stationary in
an "idle" state on mount, start the tick on the first arrow keypress, and show a short
"Press an arrow key to start" hint.

Consider also whether hitting a wall should end the game or wrap around - wrapping is
friendlier for a casual portfolio game.

## Acceptance Criteria

- [x] Root cause identified and documented
- [ ] The game does not advance until the first input
- [ ] Loading the page and waiting does not end the game
- [ ] Covered by a test

---
*Added: 2026-09-07*
