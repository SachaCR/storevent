import { WrongOffsetError } from "../wrongOffsetError";

describe("Component WrongOffsetError", () => {
  describe("Given I detect an inconsistency on event offset", () => {
    describe("When I instanciate the WrongOffsetError", () => {
      const error = new WrongOffsetError({
        entityId: "entityId",
        entityName: "Card",
        invalidOffset: 89,
      });

      test("Then error name is StoreventError", () => {
        expect(error.name).toStrictEqual("StoreventError");
      });

      test("Then error code is WRONG_OFFSET_ERROR", () => {
        expect(error.code).toStrictEqual("WRONG_OFFSET_ERROR");
      });

      test("Then error details match expected values", () => {
        expect(error.details).toStrictEqual({
          entityId: "entityId",
          entityName: "Card",
          invalidOffset: 89,
        });
      });

      test("Then error message match expected values", () => {
        expect(error.message).toStrictEqual(
          "Wrong offset error: event must be appended with a continuous offset number 89",
        );
      });
    });
  });
});
