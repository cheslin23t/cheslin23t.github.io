; Fixed-point line from (0,0) to (8,3). Q4: 16 counts per pixel.
; R2/R7 alternate accumulated height, starting at 8 for rounding.
; R1/R6 alternate X. R3=6, R5=240; R4 holds Y*16.
; Eight unrolled iterations; plot committed R4 outputs with their X values.
; Program addresses start at 1.

01: LDI R1, 0            ; 008B
02: LDI R2, 8            ; 084B
03: LDI R3, 6            ; 06CB
04: LDI R5, 240          ; F0AB
05: INC R6, R1           ; 0869
06: ADD R7, R2, R3       ; 4CE1
07: AND R4, R7, R5       ; EA23
08: INC R1, R6           ; 0689
09: ADD R2, R7, R3       ; EC41
10: AND R4, R2, R5       ; 4A23
11: INC R6, R1           ; 0869
12: ADD R7, R2, R3       ; 4CE1
13: AND R4, R7, R5       ; EA23
14: INC R1, R6           ; 0689
15: ADD R2, R7, R3       ; EC41
16: AND R4, R2, R5       ; 4A23
17: INC R6, R1           ; 0869
18: ADD R7, R2, R3       ; 4CE1
19: AND R4, R7, R5       ; EA23
20: INC R1, R6           ; 0689
21: ADD R2, R7, R3       ; EC41
22: AND R4, R2, R5       ; 4A23
23: INC R6, R1           ; 0869
24: ADD R7, R2, R3       ; 4CE1
25: AND R4, R7, R5       ; EA23
26: INC R1, R6           ; 0689
27: ADD R2, R7, R3       ; EC41
28: AND R4, R2, R5       ; 4A23
