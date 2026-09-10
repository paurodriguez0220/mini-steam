import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // shared/ plus any app that has pure, DOM-free logic worth testing.
    // Tic Tac Toe's rules and AI qualify; the other three games do not yet -
    // see docs/tasks/queue/add-test-suites.md.
    include: ["shared/**/*.test.ts", "TicTacToe/tictactoe/src/**/*.test.ts"],
    environment: "node",
  },
});
