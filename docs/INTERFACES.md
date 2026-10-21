# Module interfaces

These are integration agreements for the approved skeleton, not finished algorithms.

## Settings

`{ word: "CPC", depth: number, speed: number, color: "#RRGGBB" }`

Depth is a positive world-unit value; speed is a positive time multiplier.
The initial values and HTML input limits are provisional scaffold values. The
brief specifies the controllable parameters, without prescribing these ranges.
UI must reject invalid values before publishing settings to main.

## Mesh from geometry

`{ positions: Float32Array, normals: Float32Array, vertexCount: number }`

Use unindexed triangles, counterclockwise outward winding, three coordinates per
vertex, and one outward normal per vertex. Both arrays have `vertexCount * 3`
entries. Centre the complete word around the origin. Empty arrays mean geometry
is unfinished; renderer must handle them without a failed draw.

## Pose from animation

`{ yaw: number, scale: number, translation: [x, y, z] }`

Yaw is in radians, scale is uniform, translation is in world units. The reset
pose has yaw 0, scale 1 and translation [0, 0, 0]. Required turns are relative to
that original pose. Main supplies elapsed time in seconds; animation applies
the speed multiplier exactly once. Animation owns phase progress, not rendering.

## Events from UI

`onSettingsChange(settings)` receives the complete validated settings object.
`onAction(action)` receives `"start"`, `"stop"` or `"reset"`.
`bindControls(...)` returns a cleanup function for the installed listeners.
Main coordinates changes: depth updates rebuild the mesh; colours update drawing
settings; speed changes go to animation. Restart/reset behaviour is implemented
by animation, with the interface reflecting the resulting state.

## Integration order

First confirm the static mesh can be uploaded and drawn. Then connect the pose
to the renderer. Next bind controls, followed by the animation loop and resizing.
Goo coordinates integration; all owners help diagnose their module's behaviour.
