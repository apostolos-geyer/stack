console.log("[TRACE] @_/infra.db - START", Date.now());
export { prisma } from './client'
console.log("[TRACE] @_/infra.db - after client export", Date.now());
export * from './generated/prisma/client'
console.log("[TRACE] @_/infra.db - END", Date.now());
