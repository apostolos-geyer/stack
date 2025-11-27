console.log("[TRACE] @_/platform - START", Date.now());
export { serverEnv, type ServerEnv } from "./server";
console.log("[TRACE] @_/platform - after server export", Date.now());
export { clientEnv, type ClientEnv } from "./client";
console.log("[TRACE] @_/platform - END", Date.now());
