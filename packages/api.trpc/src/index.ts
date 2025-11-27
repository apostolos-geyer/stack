console.log("[TRACE] @_/api.trpc - START", Date.now());
export { type AppRouter, appRouter } from "./router";
console.log("[TRACE] @_/api.trpc - after router", Date.now());
export type { Context, ContextSource } from "./init";
console.log("[TRACE] @_/api.trpc - END", Date.now());
