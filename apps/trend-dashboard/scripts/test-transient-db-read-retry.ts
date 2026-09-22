import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  TRANSIENT_DB_READ_RETRY_DELAY_MS,
  withTransientDbReadRetry
} from "../src/db/transient-read-retry.js";

const immediateDelay = async () => undefined;
const socketError = (code: string) => Object.assign(new Error("socket failure"), {
  code,
  syscall: "connect",
  errno: -111
});

let calls = 0;
assert.equal(await withTransientDbReadRetry(async () => ++calls, { delay: immediateDelay }), 1);
assert.equal(calls, 1, "a successful read runs once");

calls = 0;
let retryEvents: Array<[string, number]> = [];
const delays: number[] = [];
const value = await withTransientDbReadRetry(async () => {
  calls += 1;
  if (calls === 1) throw socketError("ECONNRESET");
  return "recovered";
}, {
  delay: async (milliseconds) => { delays.push(milliseconds); },
  onRetry: (type, attempt) => retryEvents.push([type, attempt])
});
assert.equal(value, "recovered");
assert.equal(calls, 2, "a transient connection error retries exactly once");
assert.deepEqual(delays, [TRANSIENT_DB_READ_RETRY_DELAY_MS]);
assert.equal(TRANSIENT_DB_READ_RETRY_DELAY_MS, 1_000);
assert.deepEqual(retryEvents, [["ECONNRESET", 1]]);

calls = 0;
const secondFailure = socketError("ETIMEDOUT");
await assert.rejects(withTransientDbReadRetry(async () => {
  calls += 1;
  throw secondFailure;
}, { delay: immediateDelay, onRetry: () => undefined }), (error) => error === secondFailure);
assert.equal(calls, 2, "a second transient failure is surfaced without a third attempt");

const prismaAdapterError = Object.assign(new Error("adapter wrapper"), {
  name: "DriverAdapterError",
  cause: { kind: "ConnectionClosed" }
});
calls = 0;
assert.equal(await withTransientDbReadRetry(async () => {
  calls += 1;
  if (calls === 1) throw prismaAdapterError;
  return "wrapped recovery";
}, { delay: immediateDelay, onRetry: () => undefined }), "wrapped recovery");
assert.equal(calls, 2, "the PrismaPg structured wrapper is recognized");

for (const message of [
  "Database not reachable: 127.0.0.1:5432",
  "Server has closed the connection.",
  "Socket timeout"
]) {
  const prismaPgKnownError = Object.assign(new Error("adapter connection failure"), {
    name: "PrismaClientKnownRequestError",
    code: "P2010",
    meta: { code: "N/A", message }
  });
  calls = 0;
  await assert.rejects(withTransientDbReadRetry(async () => {
    calls += 1;
    throw prismaPgKnownError;
  }, { delay: immediateDelay, onRetry: () => undefined }), (error) => error === prismaPgKnownError);
  assert.equal(calls, 2, `${message} from PrismaPg's structured P2010 wrapper retries only once`);
}

for (const code of ["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT"]) {
  const prismaSocketError = Object.assign(new Error("PrismaPg socket failure"), {
    name: "PrismaClientKnownRequestError",
    code
  });
  calls = 0;
  await assert.rejects(withTransientDbReadRetry(async () => {
    calls += 1;
    throw prismaSocketError;
  }, { delay: immediateDelay, onRetry: () => undefined }), (error) => error === prismaSocketError);
  assert.equal(calls, 2, `Prisma's ${code} wrapper retries once without requiring Node socket fields`);
}

for (const nonTransient of [
  Object.assign(new Error("missing table"), { code: "P2021" }),
  Object.assign(new Error("validation"), { name: "PrismaClientValidationError" }),
  Object.assign(new Error("classic engine connectivity"), { code: "P1001" }),
  Object.assign(new Error("unrelated raw query error"), { name: "PrismaClientKnownRequestError", code: "P2010", meta: { code: "23505", message: "unique constraint failed" } }),
  Object.assign(new Error("unrecognized adapter wrapper"), { name: "PrismaClientKnownRequestError", code: "P2010", meta: { code: "N/A", message: "some other driver failure" } }),
  new Error("unclassified application failure")
]) {
  calls = 0;
  await assert.rejects(withTransientDbReadRetry(async () => {
    calls += 1;
    throw nonTransient;
  }, { delay: immediateDelay, onRetry: () => undefined }), (error) => error === nonTransient);
  assert.equal(calls, 1, "schema, validation, legacy/unknown and arbitrary errors do not retry");
}

for (const code of ["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT"]) {
  calls = 0;
  await withTransientDbReadRetry(async () => {
    calls += 1;
    if (calls === 1) throw socketError(code);
    return undefined;
  }, { delay: immediateDelay, onRetry: () => undefined });
  assert.equal(calls, 2, `${code} from Node socket errors is retryable`);
}

const appRoot = resolve(import.meta.dirname, "../src/app");
for (const path of [resolve(appRoot, "page.tsx"), resolve(appRoot, "archive/page.tsx")]) {
  assert.match(readFileSync(path, "utf8"), /withTransientDbReadRetry/);
}
assert.doesNotMatch(readFileSync(resolve(import.meta.dirname, "../src/db/transient-read-retry.ts"), "utf8"), /from ["']@prisma\/client["']/);

console.log("Transient read retry tests passed.");
