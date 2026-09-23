# Football graphics continuation — motion integration

## Existing baseline
Three.js r160, WebGL, single-file playable practice game. Previous unfinished work included one original code-authored GLB athlete, 20-bone rig, three mesh LODs, ten animation clips, 22 independent player skeletons, original uniforms, PBR equipment, turf, stadium, post-processing, cameras, tackles and scoring. Checkpoint committed before further edits.

## Changes this turn
- Fixed pre-snap/live/windup football attachment to follow the visible rig hand instead of the hidden fallback rig.
- Added two derived lateral shuffle clips; transitions between locomotion clips retain gait phase.
- Offset initial gait phase per athlete so players do not move in lockstep.
- Layered catch arm poses over continuing running legs.
- Added bounded two-joint hand targeting as the ball approaches, without moving gameplay roots.
- Cached arm poses and released expired animation actions; reset clears lingering catch/fade state.
- Updated the asset registry to describe the asset actually used.

Player geometry, body types, uniforms, field, stadium, lighting, camera and post-processing remain as in the checkpoint. No new Higgsfield assets or generation calls this turn. No assets rejected this turn; existing athlete reused. No extra generation credits spent by this turn.

## Files
Modified: dist/index.html, tests/regression.cjs, asset-manifest.json.
Added: GRAPHICS-REPORT.md.
Earlier uncommitted athlete files and source scripts are preserved in the checkpoint.

## Verification
Automated suite passes: all 15 playbook/receiver combinations; catching and continued carrying; interceptions/deflections; QB movement and illegal-pass guard; tackles and spots; downs, first downs, touchdowns, extra points and two-point conversions; clocks; independent skeletons; LOD selection; replay pose restoration; graphics presets. Added checks for visible-hand attachment, lateral clip differences, gait continuity, fade cleanup, running catches, convergent hand targeting and reset cleanup.

## Performance
Before and after this continuation, medium-preset pre-snap scene inventory: 426 mesh/material submissions, 483,052 triangles, approximately 64.2 MiB estimated uncompressed texture storage. These counts include visible scene objects before renderer frustum culling and exclude extra shadow/post passes; they are not measured GPU draw calls or VRAM. This change adds no mesh or texture cost. Actual desktop FPS and GPU time were not measured. The static project has no compatible supervised browser preview here; rendered browser appearance and 60 FPS remain unverified.

## Remaining work
The athlete is an original code-authored asset with visibly simplified anatomy and equipment. It is not AAA quality or a generatively produced realistic scan. Catch correction is bounded procedural targeting, not a complete anatomical IK solver. Directional clips are derived from the existing run gait, not production source animations. Prioritize a higher-quality athlete and authored/motion-captured locomotion, throws, catches and tackles; then desktop visual review and hardware profiling before raising geometry or effects budgets. Test shoulder/elbow appearance during high catches and extreme cuts. Maintain Three.js real-time gameplay and the existing collision/scoring authority.

## Player asset intake continuation

The live loader now supports explicitly selected named-action imports alongside the existing legacy timeline. It rejects missing/duplicate clips and unmapped material regions, preserves imported texture maps when recoloring uniforms, caches per-team materials, uses a declared asset height, retains authored clip durations and rescales throw/tackle playback to gameplay timing. Named root-position tracks have planar travel removed on cloned clips. Production strafe clips take precedence over derived fallback clips.

The legacy code-authored mesh remains integrated. No new realistic GLB or rig was created. Automated tests pass, including new named-clip validation, texture preservation/caching and non-one-second throw timing. Browser/GPU performance remains unmeasured.

Two Higgsfield Soul image jobs completed but failed the branding/pose acceptance checks; one Higgsfield GPT Image request was refused by the plan before a job was submitted. A built-in image edit produced a corrected, unbranded A-pose reference now awaiting user review. See assets/player-upgrade for provenance and review. No Meshy jobs were submitted: credentials are absent and the approved-image/spend gate has not been crossed. These limitations block the new mesh, not the tested loader preparation.
