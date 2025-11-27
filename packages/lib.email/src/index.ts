console.log("[TRACE] @_/lib.email - START", Date.now());
// Re-export render utilities from react-email
export { render } from "@react-email/render";

// Export send function
export { sendEmail, type SendEmailOptions } from "./send";
console.log("[TRACE] @_/lib.email - after send export", Date.now());

// Export components
export * from "./components";

// Export templates
export * from "./templates";

// Export constants for customization
export * from "./constants";
