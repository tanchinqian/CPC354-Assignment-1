/**
 * Owner: Tan Chin Qian. Only this module generates letter geometry.
 * Do not read HTML controls or issue WebGL calls here.
 */

/**
 * Build the manually defined CPC mesh, centred around the origin.
 * @param {{word: string, depth: number}} settings - Positive extrusion in world units.
 * @returns {{positions: Float32Array, normals: Float32Array, vertexCount: number}}
 * TODO Tan Chin Qian: define the C/P outlines or grids, triangulate front/back
 * faces, and add exposed side walls. Preserve the opening inside P. For the
 * shared renderer contract, use unindexed triangles and outward CCW winding.
 * Acceptance: three-dimensional CPC is visible at different positive depths;
 * positions.length and normals.length equal vertexCount * 3.
 */
export function buildLogoMesh(settings) {
  // Placeholder only: no letter shapes, extrusion or triangulation implemented.
  return {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    vertexCount: 0
  };
}
