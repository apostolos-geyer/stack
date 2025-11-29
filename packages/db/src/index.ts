console.log("[TRACE] @_/db - START", Date.now());
export { prisma } from './client'
console.log("[TRACE] @_/db - after client export", Date.now());
export * from './generated/prisma/client'
console.log("[TRACE] @_/db - END", Date.now());
