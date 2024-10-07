export function switchCaseGuard(value: never): never {
  throw new TypeError(
    `Unexpected value in switch statement: ${value as string}`,
  );
}
