/**
 * Owner: Tan Jia Hong. Pure animation state; no DOM access or WebGL calls.
 * Turns elapsed time into a pose; the renderer decides how to draw that pose.
 * Convention: seconds for time, radians for yaw, uniform scale, world units
 * for translation (agreed in docs/INTERFACES.md).
 */

/** Required order from the brief. Durations and easing are decided below. */
export const REQUIRED_PHASES = Object.freeze([
  "centre", "right180", "returnFromRight", "left180",
  "returnFromLeft", "enlarge", "move"
]);

// Design step 1: choose the constants that describe the animation.
// Everything here is a design decision of this module, so it stays in this file.

// 180 degrees in radians. Positive yaw turns right; negative yaw turns left.
const TURN_ANGLE = Math.PI;

// Final scale of the "full-screen" size. The word is about 17 world units wide,
// so tune this together with the renderer's camera until it fills the window.
const FULL_SCALE = 3.1;

// Largest time step accepted per frame, in seconds. A hidden tab or a stalled
// machine could produce a huge dt that skips whole phases, so we clamp it.
const MAX_DELTA = 0.25;

// Duration of each finite phase in animation seconds, before speed is applied.
// At speed 2 the same phase takes half as long in real time. The "move" phase
// has no duration because it never ends.
const PHASE_DURATION = Object.freeze({
  centre: 1.0, right180: 2.0, returnFromRight: 2.0,
  left180: 2.0, returnFromLeft: 2.0, enlarge: 3.0
});

// "Move about" motion: a figure-8 drift plus a slow yaw sway.
//   x   = xAmp * sin(pathFreq * m)
//   y   = yAmp * sin(2 * pathFreq * m)   two up-down cycles per left-right cycle
//   yaw = yawAmp * sin(yawFreq * m)      slower than the drift
// Every term is 0 at m = 0, so there is no jump after the enlarge phase.
// Amplitudes are in world units (the word is about 17 wide and 7 high); tune them
// on screen so no letter leaves the window at full scale.
const MOVE = Object.freeze({
  yawAmp: 0.25,      // radians, about 14 degrees of sway
  xAmp: 1.2,        // world units, horizontal drift
  yAmp: 0.7,        // world units, vertical drift
  pathFreq: 1.5,    // rad/s: about 0.24 cycles per second, or 4.2 s per figure-8
  yawFreq: 0.75      // rad/s: half the path frequency, so 8.4 s per full yaw cycle
});

// Design step 2: small maths helpers used by the timeline.

/**
 * Owner: Tan Jia Hong. Linear interpolation between two numbers.
 * @param {number} a - Value returned when t is 0.
 * @param {number} b - Value returned when t is 1.
 * @param {number} t - Progress, normally between 0 and 1.
 * @returns {number} The value a fraction t of the way from a to b.
 */
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Owner: Tan Jia Hong. Ease-in-out curve: 3t^2 - 2t^3.
 * @param {number} t - Raw progress between 0 and 1.
 * @returns {number} Eased progress between 0 and 1.
 * The slope is 0 at t = 0 and t = 1, so every turn starts and stops gently
 * instead of jerking. The middle of the phase moves fastest.
 */
const smoothstep = (t) => t * t * (3 - 2 * t);

// Design step 3: describe each finite phase before calculating any pose.
// Each entry gives [value at the start of the phase, value at the end].
// A phase ends exactly where the next one starts (for example yaw returns to 0
// before left180 begins), so the whole sequence is continuous.
const PHASE_KEYFRAMES = Object.freeze({
  centre:          { yaw: [0, 0],           scale: [1, 1] },
  right180:        { yaw: [0, TURN_ANGLE],  scale: [1, 1] },
  returnFromRight: { yaw: [TURN_ANGLE, 0],  scale: [1, 1] },
  left180:         { yaw: [0, -TURN_ANGLE], scale: [1, 1] },
  returnFromLeft:  { yaw: [-TURN_ANGLE, 0], scale: [1, 1] },
  enlarge:         { yaw: [0, 0],           scale: [1, FULL_SCALE] }
});

// Finite phases in the required order, each with its start time. Start times are
// a running sum of the durations (right180 starts at 1 s because centre lasts 1 s).
// This is built once when the module loads.
const TIMELINE = (() => {
  let start = 0;
  return REQUIRED_PHASES.filter((p) => p in PHASE_DURATION).map((name) => {
    const entry = { name, start, duration: PHASE_DURATION[name] };
    start += entry.duration;
    return entry;
  });
})();

// Total length of the six finite phases, in animation seconds.
const INTRO_DURATION = TIMELINE.reduce((sum, p) => sum + p.duration, 0);

/**
 * Owner: Tan Jia Hong. Find the phase and the pose at one animation time.
 * @param {number} elapsed - Animation time in seconds, already multiplied by speed.
 * @returns {{phase: string, pose: {yaw: number, scale: number, translation: number[]}}}
 * Pure function with no hidden state, so it is easy to test and to plot for the report.
 * Finite phases ease their progress with smoothstep and interpolate with lerp;
 * after the intro, the "move" phase loops forever using sine waves.
 */
export function evaluateTimeline(elapsed) {
  // Never evaluate before the start of the animation.
  const t = Math.max(0, elapsed);

  // After the intro: the endless "move about" phase.
  if (t >= INTRO_DURATION) {
    // Seconds since the move phase began; all sine terms are 0 here.
    const m = t - INTRO_DURATION;
    return {
      phase: "move",
      pose: {
        yaw: MOVE.yawAmp * Math.sin(MOVE.yawFreq * m),
        scale: FULL_SCALE,
        translation: [
          MOVE.xAmp * Math.sin(MOVE.pathFreq * m),     // x = A sin(wt)
          MOVE.yAmp * Math.sin(2 * MOVE.pathFreq * m), // y = B sin(2wt) gives a figure 8
          0
        ]
      }
    };
  }

  // During the intro: find the active phase, ease its progress, interpolate.
  const active = TIMELINE.find((p) => t < p.start + p.duration);
  const u = (t - active.start) / active.duration; // raw progress, 0 to 1
  const e = smoothstep(u);                        // eased progress, 0 to 1
  const key = PHASE_KEYFRAMES[active.name];
  return {
    phase: active.name,
    pose: {
      yaw: lerp(key.yaw[0], key.yaw[1], e),
      scale: lerp(key.scale[0], key.scale[1], e),
      translation: [0, 0, 0]
    }
  };
}

/**
 * Owner: Tan Jia Hong. Return a fresh animation state for start/reset integration.
 * @returns {{running: boolean, phase: string, elapsed: number, pose: object}}
 * The state starts stopped, in the original pose, so parameters can be chosen first.
 * `elapsed` is animation time: real seconds multiplied by speed. Speed is applied
 * exactly once, in updateAnimation, as docs/INTERFACES.md requires.
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
 * @returns {object} New state with a pose usable by drawFrame; the old state is unchanged.
 * A stopped animation returns the same state, so its pose stays frozen.
 * Each frame adds deltaSeconds * speed to `elapsed` instead of multiplying the
 * total time by speed, so moving the speed slider never makes the pose jump.
 */
export function updateAnimation(state, deltaSeconds, speed) {
  // Stopped or reset: leave the pose frozen.
  if (!state.running) return state;

  // Guard against bad input so one NaN cannot freeze the animation for good.
  const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1;
  const dt = Number.isFinite(deltaSeconds)
    ? Math.min(Math.max(deltaSeconds, 0), MAX_DELTA)
    : 0;

  // Add this frame's scaled time, then look up the matching phase and pose.
  const elapsed = state.elapsed + dt * safeSpeed;
  const { phase, pose } = evaluateTimeline(elapsed);
  return { ...state, elapsed, phase, pose };
}

/**
 * Owner: Tan Jia Hong. Handle "start", "stop" or "reset" and return the next state.
 * @param {object} state - Current animation state.
 * @param {"start"|"stop"|"reset"} action - Playback action from the UI via main.js.
 * @returns {object} The next state; an unknown action leaves the state unchanged.
 * "start" begins or resumes from the current pose, "stop" freezes it, and "reset"
 * returns to the original pose, stopped, ready to play from the beginning.
 * Button wiring belongs in ui.js and main.js; this module never reads the page.
 */
export function applyPlaybackAction(state, action) {
  switch (action) {
    case "start": return { ...state, running: true };
    case "stop":  return { ...state, running: false };
    case "reset": return createAnimationState();
    default:
      console.warn(`applyPlaybackAction: unknown action "${action}"`);
      return state;
  }
}

/**
 * Owner: Tan Jia Hong. Check the key poses of the timeline in the browser console.
 * @returns {void} Prints "Assertion failed" lines only when a check fails.
 * Run: const a = await import('/src/animation.js'); a.selfTest();
 * Nothing printed means every check passed.
 */
export function selfTest() {
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const at = (t) => evaluateTimeline(t).pose;
  console.assert(near(at(0).yaw, 0), "start yaw = 0");
  console.assert(near(at(3).yaw, TURN_ANGLE), "end of right180 = +pi");
  console.assert(near(at(5).yaw, 0), "end of returnFromRight = 0");
  console.assert(near(at(7).yaw, -TURN_ANGLE), "end of left180 = -pi");
  console.assert(near(at(9).yaw, 0), "end of returnFromLeft = 0");
  console.assert(near(at(12).scale, FULL_SCALE), "enlarge complete");
  console.assert(near(at(12).translation[0], 0), "move starts at centre");
  let s = applyPlaybackAction(createAnimationState(), "start");
  s = updateAnimation(s, 0.1, 2);
  console.assert(near(s.elapsed, 0.2), "speed applied once");
  console.assert(applyPlaybackAction(s, "reset").elapsed === 0, "reset");
}
