/** @jest-environment jsdom */

import { BrowserSessionStore } from "../../stores/BrowserSessionStore";
import { sessionStore, memoryStore } from "../../stores";

describe("stores", () => {
  it("checks if sessionStore is memoStore for node environment", () => {
    expect(sessionStore).toBeInstanceOf(BrowserSessionStore);
    expect(sessionStore).not.toBe(memoryStore);
  });
});
