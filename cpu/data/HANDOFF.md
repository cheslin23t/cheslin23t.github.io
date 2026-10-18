# CPU animation handoff

This file carries the CPU facts and animation brief into another chat. Read it together with [`cpu_animation_data.json`](cpu_animation_data.json) before explaining, drawing, or animating the machine. Treat both files as the source of truth. The hardware facts were supplied from physical tests; the visualization must not fill gaps by inventing behavior.

## Ready-to-use request for another chat

> Read `docs/CPU_ANIMATION_HANDOFF.md` and `docs/cpu_animation_data.json`. Create an engaging, technically faithful animation that explains this custom Minecraft redstone CPU. Use the included `165 + 60` program and its exact words, addresses, register values, and NOP gaps. Show the six-bit program counter visiting the ROM slots, the two LDI operations, then `ADD R3, R2, R1`, ending with R1=165, R2=60, R3=225. Show the instruction fields and bit-reversed register nibbles accurately. Keep the animation at an explanatory behavior level: physical microsteps, reset behavior, internal ALU wiring, flags, branch behavior, and I/O are not verified. Label the timeline as an illustrative run beginning at PC 0; do not depict a HALT. Explain that the PC continues and eventually wraps, so the operator must stop the clock. Include a concise hardware-limits panel for R0/R15, 27-instruction safe capacity, reserved tail, broken DEC, and the 60→56 / 61→57 fetch aliases. Distinguish verified facts from unknowns in the visual language. Keep all content offline; do not connect to Minecraft or place blocks.

## Verified machine facts

- Data is 8 bits, unsigned, with arithmetic wrapping modulo 256.
- Instructions are 16 bits. The ROM contains 64 words and the program counter is 6 bits.
- The native repaired clock advances every 146 game ticks. At 20 TPS this is 7.3 seconds per instruction address. Use that timing for address-to-address pacing; no finer-grained execution timing is established here.
- R0 reads as zero in tested operand operations. A write to R0 does not change a physical register. Use it only as a zero source.
- R1–R14 are usable general registers. R15 can retain loaded data, but both operand ports currently read it incorrectly as zero. Do not use or allocate R15.
- There is no verified HALT, branch behavior, general RAM load/store, stack, CALL/RET, input/output instruction, or usable flags interface.
- `output(name)` is only a compiler declaration to preserve and report a register. It does not make the hardware perform I/O.

## Instruction set

The supported opcodes are:

| Hex | Instruction | Semantics |
| --- | --- | --- |
| 0 | NOP | No operation |
| 1 | ADD | `dest = (lhs + rhs) & 255` |
| 2 | SUB | `dest = (lhs - rhs) & 255` |
| 3 | AND | `dest = lhs & rhs` |
| 4 | NAND | `dest = ~(lhs & rhs) & 255` |
| 5 | OR | `dest = lhs | rhs` |
| 6 | XOR | `dest = lhs ^ rhs` |
| 7 | NOR | `dest = ~(lhs | rhs) & 255` |
| 8 | XNOR | `dest = ~(lhs ^ rhs) & 255` |
| 9 | INC | `dest = (src + 1) & 255` |
| B | LDI | Load an 8-bit immediate into a register |

DEC (`A`) is known broken and must not be presented as working. Branch (`C`) has unverified semantics. Opcodes `D`–`F` are unspecified. Do not add instructions to the animation.

For binary instructions, the assembly order is `OP destination, lhs, rhs`. The physical A operand is JSON/assembly `lhs`; physical B is `rhs`. Thus `SUB R3, R2, R1` computes R2−R1. The machine word prints most-significant bit first.

## Exact instruction encoding

Each 4-bit register number is reversed independently. For register number `n`, `reverse4(n)` reverses its four bits.

- Ordinary register operation: bits 0–3 opcode; bits 4–7 reversed destination; bits 8–11 reversed physical B / `rhs`; bits 12–15 reversed physical A / `lhs`.
- LDI: bits 0–3 are `0xB`; bits 4–7 are reversed destination; bits 8–15 are the immediate byte without reversal.
- INC: bits 0–3 are `0x9`; bits 4–7 are reversed destination; bits 8–11 are reversed source on physical B; bits 12–15 are zero (physical A is R0).
- NOP is exactly `0x0000`. Do not reverse the full 16-bit word.

Golden words:

| Assembly | Hex | Printed binary |
| --- | --- | --- |
| `NOP` | `0000` | `0000000000000000` |
| `LDI R1, 165` | `A58B` | `1010010110001011` |
| `LDI R2, 60` | `3C4B` | `0011110001001011` |
| `ADD R3, R2, R1` | `48C1` | `0100100011000001` |
| `ADD R3, R1, R2` | `84C1` | `1000010011000001` |
| `SUB R3, R2, R1` | `48C2` | `0100100011000010` |
| `INC R3, R1` | `08C9` | `0000100011001001` |

## Safe ROM layout and timing for the demo

The safe layout starts with NOP at address 0, places each logical instruction at the next odd address (1, 3, 5, …), and leaves a NOP after each one. All other words are NOP. Only 27 logical instructions fit: logical instruction 27 is at address 53; 54 is its padding and addresses 55–63 remain zero. The compiler reserves 56–63 because defective address 60 fetches 56 and address 61 fetches 57. Never depict a useful instruction in the reserved tail.

The included demo is the physically tested sequence:

```text
LDI R1, 165
LDI R2, 60
ADD R3, R2, R1
```

Its safe ROM starts as follows:

| PC | Word | Binary | Displayed instruction | Effect |
| ---: | ---: | --- | --- | --- |
| 0 | `0000` | `0000000000000000` | NOP | Initial illustrative slot |
| 1 | `A58B` | `1010010110001011` | LDI R1, 165 | R1 becomes 165 (`0xA5`) |
| 2 | `0000` | `0000000000000000` | NOP | Padding |
| 3 | `3C4B` | `0011110001001011` | LDI R2, 60 | R2 becomes 60 (`0x3C`) |
| 4 | `0000` | `0000000000000000` | NOP | Padding |
| 5 | `48C1` | `0100100011000001` | ADD R3, R2, R1 | R3 becomes 225 (`0xE1`) |
| 6 | `0000` | `0000000000000000` | NOP | Trailing padding |
| 7–63 | `0000` | all zero | NOP | Remaining ROM padding |

The result is 60+165=225. Begin the story at PC 0 as an explicit demo assumption; reset/startup behavior was not specified. The physical clock continues through the ROM, wraps from address 63 to 0, and repeats. There is no HALT. Tell the viewer that the clock must be stopped externally.

## Known defects and unknowns to show honestly

- DEC produces incorrect results.
- R15 operand reads fail.
- ROM address 60 fetches address 56; address 61 fetches address 57.
- Conditional branch behavior and overflow semantics are unverified.
- Back-to-back instructions and destination/source overlap are not fully certified. The software compiler inserts NOP gaps and conservatively rejects destination/source overlap. This is a compiler policy; do not claim every overlapping sequence is physically broken.
- There is no verified output instruction. Reported register values are observable in the explanation/host-side demo, not a CPU display or output port.
- A host-side reference interpreter executes logical instructions once for software checking. That is not hardware HALT behavior or proof of physical execution.

Do not depict or claim a stack, RAM interface, CALL/RET, working branches, flags, inputs, outputs, or automatic program stop. The animation may use a clearly labeled conceptual ROM → instruction → register/operation → register result story, but must not assert unverified internal wiring or cycle-by-cycle microarchitecture.

## Optional physical ROM surface

The software can produce data-only coordinates; it performs no Minecraft connection or block placement. For ROM address `a` and numeric word bit `i` (0–15):

```text
x = 286 - 2 * (a % 16)
y = 86 - 4 * (a // 16)
z = 30 + 2 * i
```

A one bit maps to `minecraft:redstone_wall_torch[facing=west]`; a zero maps to `minecraft:air`. Physical bit 0 is the rightmost character of the printed word. If the animation visualizes the torch ROM, reflect this reversed screen-to-bit orientation.

## Project helpers

The adjacent project contains the offline compiler and example artifacts. From the repository root:

```sh
python3 -m redcpu compile examples/example.py --format listing
python3 -m redcpu compile examples/example.py --format binary
python3 -m unittest discover -s tests -v
```

The data file in this directory contains a machine-readable version of the CPU facts and demo checkpoints for an animation tool or future agent.
