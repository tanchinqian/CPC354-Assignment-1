# CPC354 Assignment 1

An intentionally unfinished **raw WebGL skeleton** for the CPC 3D word-logo ident.
The HTML page opens, the JavaScript modules connect, and the contracts are defined.
The canvas remains blank: no letter mesh, shader program, animation or functional
control binding has been implemented. This repository does not contain the earlier
complete prototype.

## Run the scaffold

From this folder, run `python -m http.server 8765 --bind 127.0.0.1`, then open
`http://127.0.0.1:8765`. A local server is needed for browser ES module imports.
There is no npm installation, framework, bundler or external graphics dependency.

## Four-way ownership

| Member | Primary files | Deliverable to implement |
| --- | --- | --- |
| Tan Chin Qian | `src/geometry.js` | Manually defined CPC triangles, extrusion and normals. |
| Tan Jia Hong | `src/animation.js` | Required stage order, time-based transforms and playback actions. |
| Yap Han Lim | `index.html`, `styles.css`, `src/ui.js` | Parameter validation, input events and the control interface. |
| Goo Yong Shen | `src/renderer.js`, `src/main.js` | WebGL setup, shaders, matrix transforms, drawing and integration. |

Every function has an owner, purpose and TODO guidance. Read
[`docs/INTERFACES.md`](docs/INTERFACES.md) together before implementing a module.
Each member should also explain their own module in the report and individual
video. Research, report review and integration checks are shared work.

## How the modules fit together

1. UI produces complete validated settings and playback actions.
2. Main passes settings to geometry, and actions/time to animation.
3. Geometry returns mesh arrays; animation returns a pose.
4. Renderer consumes those values and draws to the canvas.

Geometry never touches the DOM. Animation never issues WebGL calls. UI never
generates geometry. Only main coordinates modules. Discuss contract changes with
the affected teammate before changing names, units or array layouts.

## Assignment authority

The user-supplied `ASSIGNMENT 1.pdf` is the primary specification. The grading
rubric and two senior submissions are supporting references. Older gasket
features do not replace the required 3D word-logo task. No senior code was copied
into this repository. The group approved raw WebGL instead of Common utilities.

See [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) for the required sequence and
deliverables, and [`docs/AI_DISCLOSURE.md`](docs/AI_DISCLOSURE.md) for scaffold provenance.
