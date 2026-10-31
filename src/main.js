import { DEFAULT_SETTINGS } from "./config.js";
import { buildLogoMesh } from "./geometry.js";
import { createAnimationState, applyPlaybackAction } from "./animation.js";
import { bindControls } from "./ui.js";
import { createRenderer, uploadMesh, drawFrame } from "./renderer.js";

/**
 * Initialise the static WebGL preview and keep settings/actions on existing interfaces.
 * Integration owner: Goo Yong Shen.
 * @param {Document} root
 * @returns {{renderer: object|null, unbind: function(): void}}
 * Animation and control behavior remain placeholders; this draws the initial mesh.
 */
export function initialiseApp(root) {
  const status = root.getElementById("status");
  let settings = { ...DEFAULT_SETTINGS };
  let animation = createAnimationState();
  let renderer = null;
  let unbindControls = () => {};

  try {
    renderer = createRenderer(root.getElementById("gl-canvas"));
    uploadMesh(renderer, buildLogoMesh(settings));

    /** Redraw after the UI publishes a complete settings object. */
    function onSettingsChange(nextSettings) {
      const geometryChanged = settings.word !== nextSettings.word
        || settings.depth !== nextSettings.depth;
      settings = { ...nextSettings };
      if (geometryChanged) uploadMesh(renderer, buildLogoMesh(settings));
      drawFrame(renderer, animation.pose, settings);
    }

    /** Keep playback actions routed to the animation module's existing interface. */
    function onAction(action) {
      animation = applyPlaybackAction(animation, action);
      drawFrame(renderer, animation.pose, settings);
    }

    unbindControls = bindControls(root, onSettingsChange, onAction);
    drawFrame(renderer, animation.pose, settings);

    const view = root.defaultView;
    const redrawAfterResize = () => drawFrame(renderer, animation.pose, settings);
    view?.addEventListener("resize", redrawAfterResize);
    if (status) {
      status.textContent = "Static CPC preview rendered. Animation and control behavior are still unfinished.";
    }

    return {
      renderer,
      unbind() {
        unbindControls();
        view?.removeEventListener("resize", redrawAfterResize);
      }
    };
  } catch (error) {
    if (status) status.textContent = `Could not render the CPC preview: ${error.message}`;
    console.error(error);
    return { renderer, unbind: unbindControls };
  }
}

initialiseApp(document);
