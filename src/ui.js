import { DEFAULT_SETTINGS } from "./config.js";

/** 
 * Owner: Yap Han Lim. UI controls only.
 * This module reads and validates user input and sends the results to main.js.
 * It does not generate geometry, animate the logo, or make WebGL calls.
 */

// UI Step 1: Read the values currently shown in the controls.

/**
 * Read and validate depth, speed and colour from the controls.
 * @param {Document} root - The page document, supplied by main.js.
 * @returns {{word: string, depth: number, speed: number, color: string}}
 * Throws an Error with a readable message when depth or speed is invalid.
 * Word remains CPC.
 */
export function readSettings(root) {
  
  // Find the three parameter controls in index.html.
  const depthInput = root.getElementById("depth");
  const speedInput = root.getElementById("speed");
  const colorInput = root.getElementById("color");

  // HTML input values are strings.
  // Convert depth and speed into numbers before using them
  const depth = Number(depthInput.value);
  const speed = Number(speedInput.value);
  const color = colorInput.value;

  // UI Step 2: Validate the values.
  // Depth must be a finite positive number.
  if(!Number.isFinite(depth) || depth <= 0) {
    throw new Error("Extrusion depth must be a positive number.");
  }

  // Speed must also be a finite positive number.
  if(!Number.isFinite(speed) || speed <= 0) {
    throw new Error("Animation speed must be a positive number.");
  }

  // Return one complete settings object to main.js
  return { 
    word: DEFAULT_SETTINGS.word,
    depth: depth,
    speed: speed,
    color: color
   };
}

/**
 * Owner: Yap Han Lim. Connect the HTML controls to callbacks supplied by main.js
 * @param {Document} root - The page document
 * @param {function(object): void} onSettingsChange - Receives the complete validated setiings object.
 * @param {function(string): void} onAction - Receives "start", "stop" or "reset".
 * @returns {function(): void} Cleanup function removing the listeners you register.
 */
export function bindControls(root, onSettingsChange, onAction) {
  
  // UI Step 3: Find all controls and buttons.

  const depthInput = root.getElementById("depth");
  const speedInput = root.getElementById("speed");
  const colorInput = root.getElementById("color");
  
  const startButton = root.getElementById("start");
  const stopButton = root.getElementById("stop");
  const resetButton = root.getElementById("reset");

  const status = root.getElementById("status");

  // UI Step 4: Handle changes to depth, speed or colour
  function handleSettingsChange() {
    try{

      // Read and validate the latest values.
      const settings = readSettings(root);

      // Send the complete settings object to main.js.
      onSettingsChange(settings);

      // Tell the user that the values were accepted.
      if(status){
        status.textContent = "Settings updated.";
      }
    } catch (error) {

      // Show validation errors to the user.
      if(status){
        status.textContent = error.message;
      }
    }
  }

  // UI Step 5: Handle the Start Button.

  function startAnimation() {
    try{

      // Read the latest settings before starting.
      const settings = readSettings(root);

      // Send the settings first.
      onSettingsChange(settings);

      // Then tell main.js to start the animation.
      onAction("start");

      if(status) {
        status.textContent = "Animation started.";
      }
    } catch (error) {

      if (status) {
        status.textContent = error.message;
      }
    }
  }
  
  // UI Step 6: Handle the Stop button.

  function stopAnimation() {

    // Stop uses the existing settings and freezes the animation.
    onAction("stop");

      if(status) {
        status.textContent = "Animation stopped.";
      }
  }

  // UI Step 7: Handle the Reset button.

  function resetAnimation() {

    // Reset tells animation.js to return to its original pose.
    onAction("reset");

    if(status) {
      status.textContent = "Animation reset.";
    }
  }

  // UI Step 8: Handle keyboard interaction.
  function handleKeyDown(event){

    // Ignore shortcuts when using an input or button.
    if(event.target.tagName === "INPUT" || event.target.tagName === "BUTTON"){
      return;
    }

    // Ignore keyboard shortcuts using Ctrl, Cmd or Alt.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Enter starts the animation.
    if(event.key == "Enter"){
      startAnimation();
    }

    // Escape stops the animation.
    else if(event.key == "Escape"){
      stopAnimation();
    }

    // R resets the animation.
    else if(event.key.toLowerCase() == "r"){
      resetAnimation();
    }
  }

  // UI Step 9: Connect the controls to their event handlers.

  // The depth number is applied after its value changes.
  depthInput.addEventListener("change", handleSettingsChange);

  // The slider updates while the user moves it.
  speedInput.addEventListener("input", handleSettingsChange);

  // The colour updates when a new colour is selected.
  colorInput.addEventListener("input", handleSettingsChange);

  // Playback buttons.
  startButton.addEventListener("click", startAnimation);
  stopButton.addEventListener("click", stopAnimation);
  resetButton.addEventListener("click", resetAnimation);

  // Listen for keyboard presses.
  root.addEventListener("keydown", handleKeyDown);

  // UI Step 10: Remove the listeners when main.js asks for cleanup.
  function unbindControls() {

    depthInput.removeEventListener("change", handleSettingsChange);
    speedInput.removeEventListener("input", handleSettingsChange);
    colorInput.removeEventListener("input", handleSettingsChange);

    startButton.removeEventListener("click", startAnimation);
    stopButton.removeEventListener("click", stopAnimation);
    resetButton.removeEventListener("click", resetAnimation);

    root.removeEventListener("keydown", handleKeyDown);
  }

  return unbindControls;
}
