import { DEFAULT_SETTINGS } from "./config.js";
import { buildLogoMesh } from "./geometry.js";
import { createAnimationState, applyPlaybackAction } from "./animation.js";
import { bindControls } from "./ui.js";
import { createRenderer, uploadMesh, drawFrame } from "./renderer.js";

/**
 * Integration owner: Goo Yong Shen, with interface changes reviewed by all members.
 * @param {Document} root
 * TODO: once modules are implemented, coordinate a single requestAnimationFrame
 * loop, pass elapsed seconds to updateAnimation, and call drawFrame each frame.
 * Rebuild geometry only when depth/word changes. Handle resize through renderer.js.
 * No rendering algorithm or animation loop is implemented by this scaffold.
 */
export function initialiseApp(root) {
  let settings = { ...DEFAULT_SETTINGS };
  let animation = createAnimationState();
  const renderer = createRenderer(root.getElementById("gl-canvas"));
  uploadMesh(renderer, buildLogoMesh(settings));

  /** Integration callback: connect UI settings to the mesh and renderer modules. */
  function onSettingsChange(nextSettings) {
    // TODO integration: compare old/new depth before rebuilding, then redraw.
    settings = nextSettings;
  }

  /** Integration callback: delegate playback decisions to Tan Jia Hong's module. */
  function onAction(action) {
    animation = applyPlaybackAction(animation, action);
  }

  const unbind = bindControls(root, onSettingsChange, onAction);
  drawFrame(renderer, animation.pose, settings);
  root.getElementById("status").textContent =
    "Skeleton loaded. Geometry, playback, control bindings and WebGL drawing are TODO.";
  return { renderer, unbind };
}

initialiseApp(document);
