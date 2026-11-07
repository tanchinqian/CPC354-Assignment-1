import { DEFAULT_SETTINGS } from "./config.js";
import { buildLogoMesh } from "./geometry.js";
import {
  createAnimationState,
  updateAnimation,
  applyPlaybackAction
} from "./animation.js";
import { bindControls } from "./ui.js";
import { createRenderer, uploadMesh, drawFrame } from "./renderer.js";

/**
 * Initialise the CPC WebGL renderer, UI controls and requestAnimationFrame loop.
 * Integration owner: Goo Yong Shen.
 * @param {Document} root - Document containing the canvas, status and controls.
 * @returns {{renderer: object|null, unbind: function(): void}}
 * Coordinates settings updates, playback actions, frame timing and listener cleanup.
 */
export function initialiseApp(root) {
  const status = root.getElementById("status");
  const view = root.defaultView;
  let settings = { ...DEFAULT_SETTINGS };
  let animation = createAnimationState();
  let renderer = null;
  let unbindControls = () => {};
  let frameId = null;
  let previousTimestamp = null;
  let cleanedUp = false;

  /**
   * Cancel any pending animation frame and clear the stored timestamp so resuming
   * or returning from a hidden tab starts with a fresh time reference.
   * Owner: Goo Yong Shen.
   * @returns {void}
   */
  function stopFrameLoop() {
    if (frameId !== null) {
      view?.cancelAnimationFrame(frameId);
      frameId = null;
    }
    previousTimestamp = null;
  }

  /**
   * Advance the animation state by one frame and schedule the next frame while running.
   * Owner: Goo Yong Shen.
   * @param {number} timestamp - High-resolution frame time in milliseconds.
   * @returns {void}
   */
  function stepFrame(timestamp) {
    frameId = null;
    if (cleanedUp || !animation.running) {
      previousTimestamp = null;
      return;
    }

    const deltaSeconds = previousTimestamp === null
      ? 0
      : (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;

    animation = updateAnimation(animation, deltaSeconds, settings.speed);
    drawFrame(renderer, animation.pose, settings);

    if (!cleanedUp && animation.running && view?.requestAnimationFrame) {
      frameId = view.requestAnimationFrame(stepFrame);
    }
  }

  /**
   * Schedule the animation loop only if playback is running and no frame is pending.
   * Owner: Goo Yong Shen.
   * @returns {void}
   */
  function ensureFrameLoop() {
    if (cleanedUp || !animation.running || frameId !== null) return;
    if (view?.requestAnimationFrame) {
      frameId = view.requestAnimationFrame(stepFrame);
    }
  }

  try {
    renderer = createRenderer(root.getElementById("gl-canvas"));
    uploadMesh(renderer, buildLogoMesh(settings));

    /**
     * Update active settings, rebuild the mesh when depth changes and redraw.
     * Owner: Goo Yong Shen.
     * @param {{word: string, depth: number, speed: number, color: string}} nextSettings
     * @returns {void}
     */
    function onSettingsChange(nextSettings) {
      if (cleanedUp) return;
      const geometryChanged = settings.word !== nextSettings.word
        || settings.depth !== nextSettings.depth;
      settings = { ...nextSettings };
      if (geometryChanged) uploadMesh(renderer, buildLogoMesh(settings));
      drawFrame(renderer, animation.pose, settings);
    }

    /**
     * Route playback actions to animation.js and start or stop the frame loop.
     * Owner: Goo Yong Shen.
     * @param {"start"|"stop"|"reset"} action
     * @returns {void}
     */
    function onAction(action) {
      if (cleanedUp) return;
      const wasRunning = animation.running;
      animation = applyPlaybackAction(animation, action);

      if (animation.running) {
        if (!wasRunning) previousTimestamp = null;
        drawFrame(renderer, animation.pose, settings);
        ensureFrameLoop();
      } else {
        stopFrameLoop();
        drawFrame(renderer, animation.pose, settings);
      }
    }

    /**
     * Redraw the current pose when the window resizes.
     * Owner: Goo Yong Shen.
     * @returns {void}
     */
    function redrawAfterResize() {
      if (cleanedUp) return;
      drawFrame(renderer, animation.pose, settings);
    }

    /**
     * Reset the frame timestamp when switching tabs so returning does not jump.
     * Owner: Goo Yong Shen.
     * @returns {void}
     */
    function handleVisibilityChange() {
      if (root.hidden) previousTimestamp = null;
    }

    unbindControls = bindControls(root, onSettingsChange, onAction);
    drawFrame(renderer, animation.pose, settings);

    view?.addEventListener("resize", redrawAfterResize);
    root.addEventListener("visibilitychange", handleVisibilityChange);
    if (status) {
      status.textContent = "CPC preview ready. Choose parameters and press Start.";
    }

    return {
      renderer,
      unbind() {
        cleanedUp = true;
        stopFrameLoop();
        unbindControls();
        view?.removeEventListener("resize", redrawAfterResize);
        root.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  } catch (error) {
    if (status) status.textContent = `Could not render the CPC preview: ${error.message}`;
    console.error(error);
    return {
      renderer,
      unbind() {
        cleanedUp = true;
        stopFrameLoop();
        unbindControls();
      }
    };
  }
}

initialiseApp(document);
