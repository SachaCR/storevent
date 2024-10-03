export function switchCaseGuard(value: never): never {
  throw new Error(`Unexpected value in switch statement: ${value as string}`);
}
