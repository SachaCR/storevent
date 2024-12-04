import { ConcurrencyError } from "../concurrencyError";

describe("Component ConcurrencyError", () => {
  describe("Given I detect a concurrency error", () => {
    describe("When I instanciate the ConcurrencyError", () => {
      const error = new ConcurrencyError({
        entityId: "entityId",
        entityName: "Card",
        offsetInConflict: 56,
      });

      test("Then error name is StoreventError", () => {
        expect(error.name).toStrictEqual("StoreventError");
      });

      test("Then error code is CONCURRENCY_ERROR", () => {
        expect(error.code).toStrictEqual("CONCURRENCY_ERROR");
      });

      test("Then error details match expected values", () => {
        expect(error.details).toStrictEqual({
          entityId: "entityId",
          entityName: "Card",
          offsetInConflict: 56,
        });
      });

      test("Then error message match expected values", () => {
        expect(error.message).toStrictEqual(
          "Concurrency error: Someone else added new events after this offset number 56",
        );
      });
    });
  });
});
