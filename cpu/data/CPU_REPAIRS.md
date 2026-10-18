# CPU repair v1

17 October 2026 · Minecraft Java 1.21.7, vanilla redstone behavior on Fabric

The repairs are applied to the live CPU and saved as **8bCPU-repaired-v1.schem**. The original source schematic is unchanged. This is a verified partial repair, not a certification that the entire CPU works.

## Changes

| Circuit | Applied change | Purpose |
|---|---|---|
| Register inputs | All 240 data-input repeaters, covering 15 registers × 8 bits × 2 banks, changed from delay 1 to delay 2. | Keep data stable until the storage lock closes. Testing only bit 2 fixed the initial example but missed another bit's race. |
| AND enables | Moved both bus repeaters from world x=314 to x=313 at y=95/97, z=50; put dust at the old positions. | Allow AND's torches to inject into the buses while preserving signal regeneration. |
| AND microcode | Added the missing west-facing invert-A torch at (314,106,54). | Produce AND rather than the wrong intermediate ALU function. |
| PC operand gate | Added an isolated magenta wire/repeater route from the existing inverted branch signal to the bottom of the six-bit gate-control staircase. | Block operand offsets during ordinary instructions; allow the branch opcode to open the gate. |
| Clock | Added a cyan repeater detour in the existing feedback loop. | Increase the native instruction period from 44 to **146 game ticks**, or 7.3 seconds at 20 TPS. |
| ROM output lines | In all four layers and all 16 bit lanes, moved repeaters from local x=17/32 to x=15/31, leaving dust at their old sites. | Restore signal reach from the farthest ROM column, including addresses 15, 31, 47, and 63. |

All changes use ordinary Minecraft blocks. Scripts control tests and inspect results; they do not execute instructions or supply CPU results during program runs. The coordinate-by-coordinate changes are in `cpu-repair-manifest.json`.

## Verification

- **Original failing program:** LDI R1,165; NOP; LDI R2,60; NOP; ADD into R3. It now retains **R1=165, R2=60, R3=225 in both storage banks**, with sequential PC advances. Two normal-speed 20 TPS runs passed before the additional ROM repair; a third normal-speed run **passed on the final patch**.
- **Register retention:** All 15 destinations passed native LDI → NOP tests using distinct values `17 × register number`, with instruction fetch checked independently. An earlier all-ones test also passed, but is weaker evidence because identical values can conceal unintended writes.
- **AND and ALU:** AND passed seven isolated operand pairs. A native-clock program on the final hardware then passed ADD, SUB, AND, NAND, OR, XOR, NOR, XNOR, and INC using inputs 165 and 60. Both storage banks held the expected outputs after execution. SUB is interpreted as physical A minus physical B.
- **PC gate:** ADD with operands 5 and 7 computes 12 and advances PC from 0 to 1. All six gate blockers are on for ordinary instructions and off for opcode C. This verifies the gate connection, not conditional-branch semantics.
- **Clock:** Ten consecutive native advances were separated by exactly 146 game ticks.
- **ROM fetch:** Unique markers were programmed at all 64 addresses. **62/64 passed**, including the four far-column addresses fixed above. Addresses 60 and 61 remain incorrect.
- **Artifact integrity:** The final world is checked against the original schematic plus the patch manifest. The exported schematic is decoded and compared with every live block and block state; block entities are checked against the source, excluding runtime comparator output values and serialization metadata.

The mixed arithmetic program includes NOP gaps. Back-to-back instructions, every operand combination, and every destination/source overlap are not certified by these tests. Most broad tests use accelerated server ticks; the original failure is also retested at normal 20 TPS.

## Remaining faults and limits

- **DEC:** Still fails the earlier isolated arithmetic tests; no decrement repair is included.
- **R15 operand reads:** R15 now retains loaded data, but both operand ports still return zero when reading it. Retention and readback are separate circuits.
- **ROM addresses 60 and 61:** Still fetch the words from 56 and 57 respectively. The signal-reach repair does not repair this address-decoder fault.
- **Conditional branching and overflow:** Not functionally validated. The PC gate is no longer forced open for ordinary instructions, but this does not establish that branch conditions, targets, or flags work correctly.

Final integrity checks matched **32,543 non-air blocks** and preserved all **1,433 block entities**. The manifest contains 692 positions, including moves, timing edits, and supporting blocks. The exported dimensions are 91×45×65, with offset `(-84,-43,-43)`. The original download and lab source copy still have identical SHA-256 hashes.

