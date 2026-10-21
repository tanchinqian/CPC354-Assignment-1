/** Owner: Tan Jia Hong. Pure animation state; no DOM access or WebGL calls. */

/** Required order from the brief. Durations and easing remain to be decided. */
export const REQUIRED_PHASES = Object.freeze([
  "centre", "right180", "returnFromRight", "left180",
  "returnFromLeft", "enlarge", "move"
]);

/**
 * Owner: Tan Jia Hong. Return a fresh animation state for start/reset integration.
 * @returns {{running: boolean, phase: string, elapsed: number, pose: object}}
 * TODO: extend this state with phase timing once your animation design is ready.
 * Convention: seconds for elapsed time, radians for yaw, and uniform scale.
 */
export function createAnimationState() {
  return {
    running: false,
    phase: "centre",
    elapsed: 0,
    pose: { yaw: 0, scale: 1, translation: [0, 0, 0] }
  };
}

/**
 * Owner: Tan Jia Hong. Advance one frame and return the updated state.
 * @param {object} state - State returned by createAnimationState.
 * @param {number} deltaSeconds - Seconds since the previous frame, not milliseconds.
 * @param {number} speed - Positive multiplier from the UI settings.
 * @returns {object} Updated state with a pose usable by drawFrame.
 * TODO: implement centre -> right 180 -> return -> left 180 -> return -> enlarge
 * -> continuing movement. Use time-based progress, not frame-count increments.
 * Acceptance: every turn returns to the original orientation before the next stage.
 */
export function updateAnimation(state, deltaSeconds, speed) {
  // Placeholder only: the animation state does not advance yet.
  return state;
}

/**
 * Owner: Tan Jia Hong. Handle "start", "stop" or "reset" and return the next state.
 * TODO: implement each action, keeping reset in the original pose. Start/stop/reset
 * wiring belongs in main.js; do not query buttons from this module.
 * @param {object} state
 * @param {"start"|"stop"|"reset"} action
 * @returns {object}
 */
export function applyPlaybackAction(state, action) {
  // Placeholder only: playback actions are not implemented.
  return state;
}
