/** Owner: Goo Yong Shen. Raw WebGL only; no graphics library or Common utilities. */

const VERTEX_SHADER_SOURCE = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uMvp;
uniform mat4 uModel;
varying vec3 vNormal;

void main() {
  gl_Position = uMvp * vec4(aPosition, 1.0);
  vNormal = mat3(uModel) * aNormal;
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;
uniform vec3 uColor;
varying vec3 vNormal;

void main() {
  vec3 lightDirection = normalize(vec3(0.35, 0.6, 1.0));
  float diffuse = max(dot(normalize(vNormal), lightDirection), 0.0);
  float brightness = 0.32 + 0.68 * diffuse;
  gl_FragColor = vec4(uColor * brightness, 1.0);
}
`;

/**
 * Compile one WebGL shader and report a useful error if the source is invalid.
 * Owner: Goo Yong Shen.
 * @param {WebGLRenderingContext} gl
 * @param {number} type - VERTEX_SHADER or FRAGMENT_SHADER.
 * @param {string} source - GLSL ES shader source.
 * @returns {WebGLShader}
 */
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL could not allocate a shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

/**
 * Multiply two column-major 4x4 matrices for WebGL's column-vector convention.
 * Owner: Goo Yong Shen.
 * @param {Float32Array} left
 * @param {Float32Array} right
 * @returns {Float32Array} left multiplied by right.
 */
function multiplyMatrices(left, right) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      result[column * 4 + row] =
        left[row] * right[column * 4]
        + left[4 + row] * right[column * 4 + 1]
        + left[8 + row] * right[column * 4 + 2]
        + left[12 + row] * right[column * 4 + 3];
    }
  }
  return result;
}

/**
 * Build the model matrix from the animation module's yaw, scale and translation.
 * Positive yaw rotates the +Z front face towards +X; translation is in world units
 * and remains independent of scale.
 * Owner: Goo Yong Shen.
 * @param {{yaw: number, scale: number, translation: number[]}} pose
 * @returns {Float32Array} Column-major model matrix.
 */
function createModelMatrix(pose = {}) {
  const yaw = Number.isFinite(pose.yaw) ? pose.yaw : 0;
  const scale = Number.isFinite(pose.scale) ? pose.scale : 1;
  const [translateX = 0, translateY = 0, translateZ = 0] = pose.translation || [];
  const cosine = Math.cos(yaw) * scale;
  const sine = Math.sin(yaw) * scale;

  return new Float32Array([
    cosine, 0, -sine, 0,
    0, scale, 0, 0,
    sine, 0, cosine, 0,
    translateX, translateY, translateZ, 1
  ]);
}

/**
 * Create a view matrix for a fixed, slightly angled camera that keeps the CPC
 * logo within the view frustum at full enlargement (scale 2.2) and throughout
 * the looping figure-8 drift (x in +/-3, y in +/-1.5, yaw in +/-0.5 rad).
 * Owner: Goo Yong Shen.
 * @returns {Float32Array} Column-major camera view matrix.
 */
function createViewMatrix() {
  const eye = [15, 11.25, 45];
  const eyeLength = Math.hypot(...eye);
  const zAxis = eye.map((component) => component / eyeLength);
  const xAxisRaw = [zAxis[2], 0, -zAxis[0]];
  const xLength = Math.hypot(...xAxisRaw);
  const xAxis = xAxisRaw.map((component) => component / xLength);
  const yAxis = [
    zAxis[1] * xAxis[2] - zAxis[2] * xAxis[1],
    zAxis[2] * xAxis[0] - zAxis[0] * xAxis[2],
    zAxis[0] * xAxis[1] - zAxis[1] * xAxis[0]
  ];
  const dot = (axis) => axis[0] * eye[0] + axis[1] * eye[1] + axis[2] * eye[2];

  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis), -dot(yAxis), -dot(zAxis), 1
  ]);
}

/**
 * Create a perspective projection that fits the centred 17-by-7 CPC layout,
 * its 2.2x enlargement and the looping movement path across both desktop (16:9+)
 * and narrow viewports. Extrusion depth has no upper bound in the brief; this
 * fixed frustum fits depths up to ~5 world units at full movement and ~20 units
 * before reaching the near clipping plane.
 * Owner: Goo Yong Shen.
 * @param {number} aspect - Canvas width divided by its height.
 * @returns {Float32Array} Column-major projection matrix.
 */
function createProjectionMatrix(aspect) {
  const fieldOfView = Math.PI / 4;
  const near = 0.1;
  const far = 200;
  const focalLength = 1 / Math.tan(fieldOfView / 2);
  const referenceAspect = 16 / 9;
  const effectiveAspect = Math.max(aspect, referenceAspect);
  const xScale = focalLength / effectiveAspect;
  const yScale = xScale * aspect;
  const range = 1 / (near - far);

  return new Float32Array([
    xScale, 0, 0, 0,
    0, yScale, 0, 0,
    0, 0, (far + near) * range, -1,
    0, 0, 2 * far * near * range, 0
  ]);
}

/**
 * Convert a CSS #RRGGBB value to normalized RGB components.
 * Owner: Goo Yong Shen.
 * @param {string} color
 * @returns {number[]} Three components in the range 0 to 1.
 */
function parseColor(color) {
  const match = /^#?([\da-f]{6})$/i.exec(typeof color === "string" ? color : "#000000");
  if (!match) return [0, 0, 0];
  const value = match[1];
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
}

/**
 * Create a WebGL renderer, shader program, buffers and preview state.
 * Owner: Goo Yong Shen.
 * @param {HTMLCanvasElement} canvas
 * @returns {object} Renderer state consumed by the functions below.
 * Throws when WebGL, shaders, program linking or GPU buffers are unavailable.
 */
export function createRenderer(canvas) {
  if (!canvas) throw new TypeError("A canvas is required to create the renderer.");
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
  if (!gl) throw new Error("This browser could not create a WebGL context.");

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL could not allocate a shader program.");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Unknown shader link error.");
  }

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const normalLocation = gl.getAttribLocation(program, "aNormal");
  const mvpLocation = gl.getUniformLocation(program, "uMvp");
  const modelLocation = gl.getUniformLocation(program, "uModel");
  const colorLocation = gl.getUniformLocation(program, "uColor");
  const positionBuffer = gl.createBuffer();
  const normalBuffer = gl.createBuffer();
  if (positionLocation < 0 || normalLocation < 0 || !mvpLocation || !modelLocation
    || !colorLocation || !positionBuffer || !normalBuffer) {
    throw new Error("WebGL could not create the CPC shader inputs or buffers.");
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
  gl.clearColor(1, 1, 1, 1);

  return {
    canvas,
    gl,
    program,
    positionLocation,
    normalLocation,
    mvpLocation,
    modelLocation,
    colorLocation,
    positionBuffer,
    normalBuffer,
    vertexCount: 0,
    aspect: canvas.width / canvas.height
  };
}

/**
 * Upload geometry.js positions and normals into the renderer's GPU buffers.
 * Owner: Goo Yong Shen.
 * @param {object} renderer - State returned by createRenderer.
 * @param {{positions: Float32Array, normals: Float32Array, vertexCount: number}} mesh
 * @returns {void} Stores the GPU data and vertex count on renderer.
 * Empty meshes are accepted and draw as a cleared canvas.
 */
export function uploadMesh(renderer, mesh) {
  if (!mesh || !(mesh.positions instanceof Float32Array)
    || !(mesh.normals instanceof Float32Array)
    || !Number.isInteger(mesh.vertexCount) || mesh.vertexCount < 0
    || mesh.positions.length !== mesh.vertexCount * 3
    || mesh.normals.length !== mesh.vertexCount * 3) {
    throw new TypeError("Mesh positions, normals and vertexCount do not match the renderer contract.");
  }

  const { gl } = renderer;
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
  renderer.vertexCount = mesh.vertexCount;
}

/**
 * Draw the uploaded mesh from the supplied pose and colour settings.
 * Owner: Goo Yong Shen.
 * @param {object} renderer
 * @param {{yaw: number, scale: number, translation: number[]}} pose
 * @param {{color: string}} settings
 * @returns {void} Clears the canvas and draws the current triangles.
 */
export function drawFrame(renderer, pose = {}, settings = {}) {
  const { gl } = renderer;
  resizeRenderer(renderer);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (renderer.vertexCount === 0) return;

  const model = createModelMatrix(pose);
  const view = createViewMatrix();
  const projection = createProjectionMatrix(renderer.aspect);
  const viewProjection = multiplyMatrices(projection, view);
  const mvp = multiplyMatrices(viewProjection, model);

  gl.useProgram(renderer.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer);
  gl.enableVertexAttribArray(renderer.positionLocation);
  gl.vertexAttribPointer(renderer.positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.normalBuffer);
  gl.enableVertexAttribArray(renderer.normalLocation);
  gl.vertexAttribPointer(renderer.normalLocation, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(renderer.mvpLocation, false, mvp);
  gl.uniformMatrix4fv(renderer.modelLocation, false, model);
  gl.uniform3fv(renderer.colorLocation, parseColor(settings.color));
  gl.drawArrays(gl.TRIANGLES, 0, renderer.vertexCount);
}

/**
 * Match the canvas drawing buffer to its displayed size and update the viewport.
 * Owner: Goo Yong Shen.
 * @param {object} renderer
 * @returns {void} Updates canvas dimensions, aspect ratio and WebGL viewport.
 */
export function resizeRenderer(renderer) {
  const { canvas, gl } = renderer;
  const pixelRatio = globalThis.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth || canvas.width || 800;
  const displayHeight = canvas.clientHeight || displayWidth * 9 / 16;
  const width = Math.max(1, Math.round(displayWidth * pixelRatio));
  const height = Math.max(1, Math.round(displayHeight * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  renderer.aspect = width / height;
  gl.viewport(0, 0, width, height);
}
