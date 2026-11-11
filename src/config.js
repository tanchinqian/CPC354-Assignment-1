/**
 * Shared starting values and the practical input range used by the application.
 * Keep settings numeric and colours as #RRGGBB strings.
 */
// Application limits keep the enlarged logo inside the tested camera framing.
// These are our interface choices, not limits imposed by the assignment brief.
export const DEPTH_LIMITS = Object.freeze({ min: 0.01, max: 1 });

export const DEFAULT_SETTINGS = Object.freeze({
  word: "CPC",
  depth: 0.5,
  speed: 1,
  color: "#000000"
});
