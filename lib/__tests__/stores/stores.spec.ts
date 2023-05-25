import { sessionStore, memoryStore } from "../../stores";
import { MemoryStore } from "../../stores/MemoryStore";

describe("stores", () => {
  it("checks if sessionStore is memoStore for node environment", () => {
    expect(sessionStore).toBeInstanceOf(MemoryStore);
    expect(sessionStore).toBe(memoryStore);
  });
});
