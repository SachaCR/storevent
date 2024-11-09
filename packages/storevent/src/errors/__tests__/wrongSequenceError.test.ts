import { WrongSequenceError } from "../wrongSequenceError";

describe("Component WrongSequenceError", () => {
  describe("Given I detect an inconsistency on event sequence", () => {
    describe("When I instanciate the WrongSequenceError", () => {
      const error = new WrongSequenceError({
        entityId: "entityId",
        entityName: "Card",
        invalidSequence: 89,
      });

      test("Then error name is StoreventError", () => {
        expect(error.name).toStrictEqual("StoreventError");
      });

      test("Then error code is WRONG_SEQUENCE_ERROR", () => {
        expect(error.code).toStrictEqual("WRONG_SEQUENCE_ERROR");
      });

      test("Then error details match expected values", () => {
        expect(error.details).toStrictEqual({
          entityId: "entityId",
          entityName: "Card",
          invalidSequence: 89,
        });
      });

      test("Then error message match expected values", () => {
        expect(error.message).toStrictEqual(
          "Wrong sequence error: event must be appended with a continuous sequence number 89",
        );
      });
    });
  });
});
