import { DEFAULT_SETTINGS } from "./config.js";

/**
 * Owner: Yap Han Lim. Read and validate depth, speed and colour from the controls.
 * @param {Document} root - The page document, supplied by main.js.
 * @returns {{word: string, depth: number, speed: number, color: string}}
 * TODO: use the existing element IDs, convert numeric strings, reject nonfinite or
 * nonpositive depth/speed, and show useful validation feedback. Word remains CPC.
 * Acceptance: parameters can be selected before starting the animation.
 */
export function readSettings(root) {
  // Placeholder only: actual controls are not read yet.
  return { ...DEFAULT_SETTINGS };
}

/**
 * Owner: Yap Han Lim. Connect inputs/buttons to the supplied callbacks.
 * @param {Document} root
 * @param {function(object): void} onSettingsChange - Pass complete validated settings.
 * @param {function(string): void} onAction - Pass "start", "stop" or "reset".
 * @returns {function(): void} Cleanup function removing the listeners you register.
 * TODO: bind input/change/click events and consider keyboard interaction. Do not
 * generate meshes or draw frames here; main.js will coordinate those operations.
 */
export function bindControls(root, onSettingsChange, onAction) {
  // Placeholder only: no event listeners are registered yet.
  /** Owner: Yap Han Lim. TODO: remove only the listeners installed above. */
  function unbindControls() {}
  return unbindControls;
}
