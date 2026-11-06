// Vercel serverless entry point.
// buildCommand in vercel.json runs `nest build` first, producing dist/.
// This file re-exports the handler that main.ts exports for Vercel.
export { default } from '../dist/main';
