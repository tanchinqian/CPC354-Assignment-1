/**
 * Owner: Tan Chin Qian. Only this module generates letter geometry.
 * Do not read HTML controls or issue WebGL calls here.
 */

// Learning step 1: describe the flat letter shapes before calculating any vertices.
// Each string is one row, read left to right. Rows run from top to bottom.
// "1" means a filled square; "0" means empty space. Both grids are 5 by 7.
const LETTER_GRIDS = {
  C: [
    "11111",
    "10000",
    "10000",
    "10000",
    "10000",
    "10000",
    "11111"
  ],
  P: [
    "11111",
    "10001",
    "10001",
    "11111",
    "10000",
    "10000",
    "10000"
  ]
};

/**
 * Learning step 2. Owner: Tan Chin Qian.
 * Convert one grid cell into its four flat [x, y] corners.
 * @param {number} row - Zero-based row, counting downward from the top.
 * @param {number} column - Zero-based column, counting rightward from the left.
 * @param {number} cellSize - Positive square width/height in world units.
 * @returns {number[][]} Bottom-left, bottom-right, top-right, top-left corners.
 * Rows increase downward, so negate the row to make y decrease downward.
 * Corners run counterclockwise for the future outward-facing front surface.
 * This positions one cell only; depth and centring the whole word come later.
 */
function getCellCorners(row, column, cellSize = 1) {
  const left = column * cellSize;
  const right = left + cellSize;
  const top = -row * cellSize;
  const bottom = top - cellSize;

  return [
    [left, bottom],
    [right, bottom],
    [right, top],
    [left, top]
  ];
}

/**
 * Learning step 3. Owner: Tan Chin Qian.
 * Split one flat square into two triangles using its existing four corners.
 * @param {number} row - Zero-based row of this cell.
 * @param {number} column - Zero-based column of this cell.
 * @param {number} cellSize - Positive square width/height in world units.
 * @returns {number[][]} Six [x, y] points, grouped as two sets of three.
 * Both triangles run counterclockwise and share the bottom-left/top-right diagonal.
 * We repeat the shared corners because our agreed mesh uses unindexed triangles.
 * This helper only prepares flat points; it does not add depth or draw anything.
 */
function getCellTriangles(row, column, cellSize = 1) {
  const [bottomLeft, bottomRight, topRight, topLeft] =
    getCellCorners(row, column, cellSize);

  return [
    bottomLeft, bottomRight, topRight, // Triangle 1
    bottomLeft, topRight, topLeft     // Triangle 2
  ];
}

/**
 * Learning step 4. Owner: Tan Chin Qian.
 * Assemble the flat triangles for all filled cells in one letter grid.
 * @param {string[]} grid - Letter rows where "1" is filled and "0" is empty.
 * @param {number} cellSize - Positive square width/height in world units.
 * @returns {number[][]} [x, y] triangle points for every filled square.
 * Each filled cell contributes six points; empty cells contribute none.
 * Coordinates start at the grid's top-left and remain flat; letters are not
 * positioned beside each other here, and no depth or WebGL drawing is added.
 */
function getLetterTriangles(grid, cellSize = 1) {
  const triangles = [];

  for (let row = 0; row < grid.length; row += 1) {
    for (let column = 0; column < grid[row].length; column += 1) {
      if (grid[row][column] !== "1") continue;

      const cellTriangles = getCellTriangles(row, column, cellSize);
      for (const point of cellTriangles) {
        triangles.push(point);
      }
    }
  }

  return triangles;
}

/**
 * Learning step 5. Owner: Tan Chin Qian.
 * Place the supported flat letters side by side and centre the word at (0, 0).
 * @param {string} word - A sequence of letters available in LETTER_GRIDS.
 * @param {number} cellSize - Positive square width/height in world units.
 * @param {number} letterGap - Empty cell widths between neighbouring letters.
 * @returns {number[][]} Centred [x, y] triangle points for the flat word.
 * Letter spacing is a layout choice; all current CPC grids use equal dimensions.
 * This still returns 2D points and does not add depth or issue WebGL calls.
 */
function getWordTriangles(word, cellSize = 1, letterGap = 1) {
  // Make lowercase input uppercase so it matches the keys in LETTER_GRIDS.
  const letters = Array.from(word.toUpperCase());
  if (letters.length === 0) return [];

  // Look up the grid for each character; stop if a character has no grid.
  const grids = letters.map((letter) => LETTER_GRIDS[letter]);
  const missingGridIndex = grids.findIndex((grid) => grid === undefined);
  if (missingGridIndex !== -1) {
    throw new Error(`Unsupported letter in word: ${letters[missingGridIndex]}`);
  }

  // Measure each letter in world units, then add the gaps between letters.
  const letterWidths = grids.map((grid) => grid[0].length * cellSize);
  const wordWidth = letterWidths.reduce((total, width) => total + width, 0)
    + (letters.length - 1) * letterGap * cellSize;
  const wordHeight = Math.max(...grids.map((grid) => grid.length)) * cellSize;
  const wordTriangles = [];

  // Begin half the word's width left of zero, so its centre lands at x = 0.
  let letterLeft = -wordWidth / 2;

  for (let index = 0; index < grids.length; index += 1) {
    // These points start at a letter's own top-left corner, so shift them into
    // their place in the word. The y shift centres the shared grid height.
    const letterTriangles = getLetterTriangles(grids[index], cellSize);
    for (const [x, y] of letterTriangles) {
      wordTriangles.push([x + letterLeft, y + wordHeight / 2]);
    }

    // Move to the next letter's left edge, leaving the requested gap.
    letterLeft += letterWidths[index] + letterGap * cellSize;
  }

  return wordTriangles;
}

/**
 * Learning step 6. Owner: Tan Chin Qian.
 * Find the outside edges around filled cells in one letter grid.
 * @param {string[]} grid - Letter rows where "1" is filled and "0" is empty.
 * @param {number} cellSize - Positive square width/height in world units.
 * @returns {number[][][]} Edges as pairs of [x, y] endpoints in local coordinates.
 * Edges between two filled cells are skipped; off-grid neighbours count as empty.
 * Endpoints follow the outline counterclockwise for outward side-wall winding.
 * The edges are still 2D and have not been moved into the CPC word yet.
 */
function getLetterBoundaryEdges(grid, cellSize = 1) {
  const edges = [];

  for (let row = 0; row < grid.length; row += 1) {
    for (let column = 0; column < grid[row].length; column += 1) {
      if (grid[row][column] !== "1") continue;

      const hasFilledAbove = row > 0 && grid[row - 1][column] === "1";
      const hasFilledRight = grid[row][column + 1] === "1";
      const hasFilledBelow = row + 1 < grid.length && grid[row + 1][column] === "1";
      const hasFilledLeft = column > 0 && grid[row][column - 1] === "1";

      // Only keep a cell edge when the neighbouring cell is empty or outside.
      const [bottomLeft, bottomRight, topRight, topLeft] =
        getCellCorners(row, column, cellSize);
      if (!hasFilledAbove) edges.push([topRight, topLeft]);
      if (!hasFilledRight) edges.push([bottomRight, topRight]);
      if (!hasFilledBelow) edges.push([bottomLeft, bottomRight]);
      if (!hasFilledLeft) edges.push([topLeft, bottomLeft]);
    }
  }

  return edges;
}

/**
 * Position every letter's exposed edges using the same layout as getWordTriangles.
 * @param {string} word - A sequence of letters available in LETTER_GRIDS.
 * @param {number} cellSize - Positive square width/height in world units.
 * @param {number} letterGap - Empty cell widths between neighbouring letters.
 * @returns {number[][][]} Word-positioned edges, each containing two [x, y] points.
 * Keeping this layout aligned with the front-face layout lets side walls meet it.
 */
function getWordBoundaryEdges(word, cellSize = 1, letterGap = 1) {
  const letters = Array.from(word.toUpperCase());
  if (letters.length === 0) return [];

  const grids = letters.map((letter) => LETTER_GRIDS[letter]);
  const missingGridIndex = grids.findIndex((grid) => grid === undefined);
  if (missingGridIndex !== -1) {
    throw new Error(`Unsupported letter in word: ${letters[missingGridIndex]}`);
  }

  const letterWidths = grids.map((grid) => grid[0].length * cellSize);
  const wordWidth = letterWidths.reduce((total, width) => total + width, 0)
    + (letters.length - 1) * letterGap * cellSize;
  const wordHeight = Math.max(...grids.map((grid) => grid.length)) * cellSize;
  const wordEdges = [];
  let letterLeft = -wordWidth / 2;

  for (let index = 0; index < grids.length; index += 1) {
    const letterEdges = getLetterBoundaryEdges(grids[index], cellSize);
    for (const [[startX, startY], [endX, endY]] of letterEdges) {
      wordEdges.push([
        [startX + letterLeft, startY + wordHeight / 2],
        [endX + letterLeft, endY + wordHeight / 2]
      ]);
    }

    letterLeft += letterWidths[index] + letterGap * cellSize;
  }

  return wordEdges;
}

/**
 * Append one unindexed triangle and repeat its flat normal for each vertex.
 * @param {number[]} positions - Destination list of XYZ coordinates.
 * @param {number[]} normals - Destination list of XYZ normals.
 * @param {number[][]} vertices - Three XYZ points in counterclockwise order.
 * @param {number[]} normal - One outward unit normal shared by this triangle.
 * @returns {void} Adds three vertices and their three normals to the lists.
 */
function appendTriangle(positions, normals, vertices, normal) {
  for (const [x, y, z] of vertices) {
    positions.push(x, y, z);
    normals.push(normal[0], normal[1], normal[2]);
  }
}

/**
 * Build a centred, extruded CPC mesh using the hand-authored letter grids.
 * @param {{word: string, depth: number}} settings - Word and positive depth in world units.
 * @returns {{positions: Float32Array, normals: Float32Array, vertexCount: number}}
 * Front/back faces use unindexed counterclockwise triangles; exposed grid edges
 * create side walls, including the inner walls of enclosed letter openings.
 * Throws for a missing word or a non-positive/non-finite depth.
 */
export function buildLogoMesh(settings) {
  if (!settings || typeof settings.word !== "string") {
    throw new TypeError("buildLogoMesh requires a settings.word string.");
  }
  if (!Number.isFinite(settings.depth) || settings.depth <= 0) {
    throw new RangeError("Mesh depth must be a finite positive number.");
  }

  const flatTriangles = getWordTriangles(settings.word);
  const boundaryEdges = getWordBoundaryEdges(settings.word);
  const positions = [];
  const normals = [];
  const frontZ = settings.depth / 2;
  const backZ = -settings.depth / 2;

  // The 2D triangles face +Z at the front; reverse their order at the back.
  for (let index = 0; index < flatTriangles.length; index += 3) {
    const first = flatTriangles[index];
    const second = flatTriangles[index + 1];
    const third = flatTriangles[index + 2];

    appendTriangle(positions, normals, [
      [first[0], first[1], frontZ],
      [second[0], second[1], frontZ],
      [third[0], third[1], frontZ]
    ], [0, 0, 1]);

    appendTriangle(positions, normals, [
      [third[0], third[1], backZ],
      [second[0], second[1], backZ],
      [first[0], first[1], backZ]
    ], [0, 0, -1]);
  }

  // Each exposed 2D edge becomes a four-sided wall split into two triangles.
  for (const [[startX, startY], [endX, endY]] of boundaryEdges) {
    const edgeX = endX - startX;
    const edgeY = endY - startY;
    const edgeLength = Math.hypot(edgeX, edgeY);
    // Boundary edges run counterclockwise, so their outward direction is right.
    const sideNormal = [edgeY / edgeLength, -edgeX / edgeLength, 0];

    const startFront = [startX, startY, frontZ];
    const startBack = [startX, startY, backZ];
    const endFront = [endX, endY, frontZ];
    const endBack = [endX, endY, backZ];

    appendTriangle(positions, normals,
      [startFront, startBack, endBack], sideNormal);
    appendTriangle(positions, normals,
      [startFront, endBack, endFront], sideNormal);
  }

  const vertexCount = positions.length / 3;
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    vertexCount
  };
}
