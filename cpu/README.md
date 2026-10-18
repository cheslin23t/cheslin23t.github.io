# CPU V2 standalone tour

Serve the repository root with `python3 -m http.server 8080`, then open `/cpu/`.
No package installation or remote runtime assets are required. The homepage is unchanged.
The route has `noindex, nofollow`; it is unlisted, not access-controlled.

## Physical source

`data/8bCPU-repaired-v1.schem` is the byte-for-byte physical export from
`cheslin23t/CPUV2-Compiler` commit `1851180869f97ff15ae081e659b1f57ea1209675`.
SHA-256: `7485daa252e126b7ca49d26235e1d47318c78b09fdf3d986da77560b7daac5c9`.

Regenerate browser geometry with the Python standard library:

```sh
python3 cpu/tools/export_schematic.py cpu/data/8bCPU-repaired-v1.schem cpu/data/build.json
```

The decoder asserts the source checksum, all palette references, 266,175 cells,
and 32,543 non-air blocks. All physical block positions and state names are
preserved in `build.json`. The WebGL renderer uses simplified block shapes,
Minecraft wool color identities, directional shading, and exact repeater landmarks.
It is not a textured Minecraft client or a redstone simulator. The original
saved ROM and power states are not changed to match the separate addition demo.

Camera framing and precise landmarks come from user-supplied repaired-schematic
coordinates recorded in `data/landmarks.json`. PC, ALU, and register region boxes
are approximate and inclusive. Highlighted repeater coordinates are exact and
were checked against the parsed blocks: 6 PC + 8 ALU + 240 register landmarks.
Highlighting is an explanatory overlay visible through other geometry, not power.
The instruction chapter visits the operation-label sign neighborhood because a
complete decoder ownership boundary has not been verified.

`data/build-overview.png` is a browser-rendered overview of this same model,
used as the no-WebGL fallback. Regenerate it after changing the physical source.
The conceptual SVG is not used as physical geometry.

## Interaction and accuracy

Document scrolling chooses camera focus. Chapter views share one orientation and fit the selected region to the viewport. Module close-up crops an approximate region; Whole build restores context. Projected labels mark exact coordinates, not module ownership. Named navigation links select chapters. Orbit and zoom sliders work without dragging. Drag horizontally to orbit; click/focus
then use the wheel to zoom. Keyboard arrows orbit, +/- zoom, Home restores the
chapter view, and Escape releases focus. Restore view also resets orbit/zoom.
Touch keeps vertical document scrolling available. Reduced motion removes easing.

The separate demo advances through the exact 64-word padded ROM, including NOPs,
fetch aliases, and wrap. Its Play control uses 7.3 seconds per address. Register
values are unknown until written. Restart only resets explanatory demo state.
There is no verified hardware HALT, general I/O, or full-machine reset. The PC-only synchronous reset was tested in the mapping work: assert reset, let it settle, then clock. It does not clear the register banks.
The behavioral brief is `data/HANDOFF.md`, paired with `data/cpu.json`. Its older statement that reset is entirely unknown is superseded by the PC-only mapping evidence above. `data/CPU_REPAIRS.md` supplies the repair and validation record. The page distinguishes the 240 storage repeaters (delay 1) from their 240 adjacent input repeaters (repaired to delay 2). Storage probe encoding is inverted; two banks hold mirrored copies, not twice the logical register count. The one-bit interactive example is a conceptual settled-state model, not redstone simulation.
