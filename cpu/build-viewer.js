import { wireBoxes, torchPoint } from "./block-geometry.mjs?v=20261030-review1";
("use strict");
// Physical geometry comes exclusively from the parsed Sponge schematic.
// The simplified shapes show block placement, not a redstone simulation.
(() => {
  const canvas = document.querySelector("#build-canvas");

  const status = document.querySelector("#build-status");
  const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
  const fallback = document.querySelector("#build-fallback");
  function showFallback(message) {
    status.textContent = message;
    fallback.hidden = false;
    canvas.hidden = true;
    document.querySelector(".model-fallback").hidden = false;

    document.querySelector(".viewer-loading").hidden = true;
    document.querySelector("#landmark-labels").replaceChildren();
    document.querySelector("#view-badge").textContent =
      "Static overview · all modules";
    document
      .querySelectorAll(".view-modes button, .view-controls input")
      .forEach((el) => (el.disabled = true));
  }
  if (!gl) {
    showFallback(
      "3D is unavailable. The overview and module explanations remain available.",
    );
    return;
  }
  const shader = (type, source) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw Error(gl.getShaderInfoLog(s));
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(
    program,
    shader(
      gl.VERTEX_SHADER,
      `attribute vec3 position; attribute vec3 color; attribute vec3 blockCoord; attribute float region; attribute float naturalMaterial; uniform vec4 probes[16]; uniform mat4 matrix; uniform float selected; varying vec3 vColor; varying vec3 vPosition; varying float vChosen; varying vec3 vBlock; varying float vNatural; void main(){ float chosen=1.0-step(0.1,abs(region-selected)); float showAll=1.0-step(0.1,selected); vChosen=chosen; vPosition=position; vBlock=blockCoord; vNatural=naturalMaterial; vColor=mix(color*.85,mix(color,vec3(.13,.46,.65),.65),chosen); vColor=mix(vColor,color,showAll); for(int i=0;i<16;i++){if(probes[i].w>=0.0 && all(lessThan(abs(blockCoord-probes[i].xyz),vec3(.1)))){ vChosen=1.0; vColor=probes[i].w>.5 ? vec3(.90,.24,.12) : vec3(.35,.40,.45); }} if(naturalMaterial>.5) vColor=color; gl_Position=matrix*vec4(position,1.0); }`,
    ),
  );
  gl.attachShader(
    program,
    shader(
      gl.FRAGMENT_SHADER,
      `precision highp float; uniform sampler2D signalMap; uniform sampler2D romMap; uniform float romProgram; uniform float physicalEnabled; varying float vNatural; varying vec3 vColor; varying vec3 vPosition; varying float vChosen; varying vec3 vBlock; uniform float highlightPass; uniform float cropped; uniform float ghostPass; uniform vec3 cropMin; uniform vec3 cropMax; void main(){ bool romCell=vBlock.x>=0.0 && vBlock.x<=30.0 && mod(vBlock.x,2.0)<.1 && vBlock.y>=2.0 && vBlock.y<=14.0 && mod(vBlock.y-2.0,4.0)<.1 && vBlock.z>=34.0 && vBlock.z<=64.0 && mod(vBlock.z,2.0)<.1; if(romCell){float address=(30.0-vBlock.x)/2.0+16.0*(14.0-vBlock.y)/4.0;float bit=(vBlock.z-34.0)/2.0;if(texture2D(romMap,vec2((bit+.5)/16.0,(address+64.0*romProgram+.5)/128.0)).r<.5) discard;} float index=vBlock.x+91.0*(vBlock.z+65.0*vBlock.y); vec4 measured=texture2D(signalMap,vec2((mod(index,512.0)+.5)/512.0,(floor(index/512.0)+.5)/520.0)); vec3 actual=vColor; if(physicalEnabled>.5 && measured.r>0.0 && vNatural<.5){ float power=max(0.0,measured.r*255.0-1.0)/15.0; actual=mix(vec3(.28,.12,.10),vec3(1.0,.25,.06),power); } bool outside=any(lessThan(vBlock,cropMin)) || any(greaterThan(vBlock,cropMax)); if(ghostPass>0.5){ if(!outside) discard; gl_FragColor=vec4(actual,.075); return; } if(cropped>0.5 && (any(lessThan(vBlock,cropMin)) || any(greaterThan(vBlock,cropMax)))) discard; if(highlightPass>0.5 && vChosen<0.5) discard; gl_FragColor=vec4(actual,1.0); }`,
    ),
  );
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw Error("Could not initialize CPU renderer");
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  const uniform = gl.getUniformLocation(program, "matrix"),
    selected = gl.getUniformLocation(program, "selected"),
    highlightPass = gl.getUniformLocation(program, "highlightPass");
  const cropMin = gl.getUniformLocation(program, "cropMin"),
    cropMax = gl.getUniformLocation(program, "cropMax"),
    cropped = gl.getUniformLocation(program, "cropped");
  const ghostPass = gl.getUniformLocation(program, "ghostPass");
  const probeUniform = gl.getUniformLocation(program, "probes[0]");
  const physicalEnabled = gl.getUniformLocation(program, "physicalEnabled");
  const signalTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, signalTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const signalPixels = new Uint8Array(512 * 520);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    512,
    520,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    signalPixels,
  );
  let physicalTick = -1;
  let physicalData = null;
  let captures = null;
  let physicalSource = "addition";
  const romProgram = gl.getUniformLocation(program, "romProgram");
  window.setCpuProgram = (line = false) => {
    gl.uniform1f(romProgram, line ? 1 : 0);
    canvas.dataset.program = line ? "line" : "addition";
    requestDraw();
  };
  window.setCpuPhysicalTick = (tick, source = "addition") => {
    if (captures && source !== physicalSource) {
      physicalSource = source;
      physicalData = captures[source];
      physicalTick = -1;
    }
    if (!physicalData) return;
    if (tick !== physicalTick) {
      // Initial values plus deltas support deterministic forward and backward seeking.
      if (tick < physicalTick || physicalTick < 0) {
        signalPixels.fill(0);
        physicalData.positions.forEach(([x, y, z], i) => {
          signalPixels[x + 91 * (z + 65 * y)] = physicalData.initial[i] + 1;
        });
        physicalTick = 0;
      }
      for (let t = physicalTick + 1; t <= tick; t++) {
        const changes = physicalData.changes[t];
        for (let j = 0; j < changes.length; j += 2) {
          const [x, y, z] = physicalData.positions[changes[j]];
          signalPixels[x + 91 * (z + 65 * y)] = changes[j + 1] + 1;
        }
      }
      physicalTick = tick;
      gl.bindTexture(gl.TEXTURE_2D, signalTexture);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        512,
        520,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        signalPixels,
      );
    }
    gl.uniform1f(physicalEnabled, 1);
    canvas.dataset.physicalTick = String(tick);
    requestDraw();
  };
  let probeValues = new Float32Array(64);
  for (let i = 0; i < 16; i++) probeValues[4 * i + 3] = -1;
  window.setCpuProbes = (probes = []) => {
    gl.uniform1f(physicalEnabled, 0);
    delete canvas.dataset.physicalTick;
    probeValues = new Float32Array(64);
    for (let i = 0; i < 16; i++) probeValues[4 * i + 3] = -1;
    probes
      .slice(0, 16)
      .forEach((p, i) => probeValues.set([...p.position, p.on ? 1 : 0], i * 4));
    requestDraw();
  };
  const faceCorners = [
    [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
    [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  ];
  const faces = [1, 0.69, 0.83, 0.62, 0.76, 0.45];
  const paletteColors = {
    air: "#000000",
    black: "#272c36",
    gray: "#626d7b",
    light_gray: "#a0a9b1",
    white: "#d5dee0",
    cyan: "#327c8b",
    light_blue: "#6098bd",
    blue: "#3b4f9f",
    purple: "#765ba4",
    magenta: "#ab638f",
    orange: "#d39557",
    yellow: "#d6c472",
    lime: "#88ab58",
    redstone_block: "#a73f3e",
    redstone_lamp: "#a88652",
    barrel: "#a28b65",
    target: "#b38a75",
    quartz_block: "#e2e3df",
    glass: "#89b6c6",
    tinted_glass: "#584f65",
  };
  const hex = (s) => [
    parseInt(s.slice(1, 3), 16) / 255,
    parseInt(s.slice(3, 5), 16) / 255,
    parseInt(s.slice(5, 7), 16) / 255,
  ];
  function typeColor(name) {
    const short = name.replace("minecraft:", "").split("[")[0];
    if (short === "redstone_wire") {
      const power = Number(name.match(/power=(\d+)/)?.[1] || 0);
      return hex("#7b6c68");
    }
    if (short.includes("torch")) return hex("#8d7865");
    if (short === "comparator" || short === "repeater") return hex("#d0b6b1");
    if (short.includes("sign")) return hex("#b79c73");
    if (short === "lever" || short === "stone_button") return hex("#bcc4cc");
    if (paletteColors[short]) return hex(paletteColors[short]);
    const wool = {
      white: "#e9ecec",
      light_gray: "#8e8e86",
      gray: "#3e4447",
      black: "#141519",
      cyan: "#158991",
      light_blue: "#3aafd9",
      blue: "#35399d",
      purple: "#792aac",
      magenta: "#bd44b3",
      orange: "#f07613",
      yellow: "#f8c527",
      lime: "#70b919",
    };
    if (short.endsWith("_wool"))
      return hex(wool[short.replace("_wool", "")] || "#a1aebc");
    for (const color of [
      "light_gray",
      "light_blue",
      "black",
      "gray",
      "white",
      "cyan",
      "blue",
      "purple",
      "magenta",
      "orange",
      "yellow",
      "lime",
    ])
      if (short.startsWith(color + "_")) return hex(paletteColors[color]);
    return hex("#a1aebc");
  }
  const multiply = (a, b) => {
    const r = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let row = 0; row < 4; row++)
        for (let k = 0; k < 4; k++)
          r[c * 4 + row] += a[k * 4 + row] * b[c * 4 + k];
    return r;
  };
  const normalize = (v) => {
    const l = Math.hypot(...v);
    return v.map((x) => x / l);
  };
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  // Region bounds are inclusive block coordinates, not netlist membership.
  // Every preset keeps the same azimuth; cuts reveal buried landmarks without spinning the CPU.
  const views = {
    whole: {
      bounds: [
        [0, 0, 0],
        [90, 44, 64],
      ],
      region: 0,
      label: "91 × 45 × 65 blocks",
      pins: [],
    },
    clock: {
      bounds: [
        [39, 0, 9],
        [53, 19, 17],
      ],
      region: 1,
      label: "PC · six state bits · approximate region",
      pins: [
        { p: [41.5, 7.5, 15.5], text: "PC bit 0 · weight 1" },
        { p: [41.5, 17.5, 15.5], text: "PC bit 5 · weight 32" },
      ],
    },
    rom: {
      bounds: [
        [0, 0, 32],
        [33, 16, 64],
      ],
      region: 2,
      label: "ROM · four layers × 16 words × 16 bits",
      pins: [
        { p: [30.5, 14.5, 34.5], text: "Address 0 · bit 0 cell" },
        { p: [0.5, 2.5, 64.5], text: "Address 63 · bit 15 cell" },
      ],
    },
    encoding: {
      bounds: [
        [48, 22, 52],
        [84, 36, 62],
      ],
      region: 3,
      label: "Decode · operation-sign neighborhood",
      pins: [
        { p: [55.5, 26.5, 60.5], text: "ADD · physical sign" },
        { p: [75.5, 26.5, 60.5], text: "LDI · physical sign" },
      ],
    },
    inverter: {
      yaw: 0.15,
      pitch: 0.85,
      bounds: [
        [59, 21, 42],
        [63, 22, 44],
      ],
      region: 7,
      label: "R1 input inverter · exact schematic crop",
      pins: [
        { p: [60.5, 22.08, 43.5], text: "Input wire" },
        { p: [62.16, 22.45, 43.5], text: "Wall torch · output" },
      ],
    },
    cell: {
      bounds: [
        [61, 21, 38],
        [63, 22, 44],
      ],
      region: 4,
      label: "R1 · bit 0 · data path and storage",
      pins: [
        { p: [62.5, 22.2, 39.5], text: "Storage · delay 1" },
        { p: [62.5, 22.2, 40.5], text: "Input repeater · delay 2" },
      ],
    },
    result: {
      bounds: [
        [65, 21, 38],
        [67, 22, 41],
      ],
      region: 4,
      label: "R3 · bit 0 · stored result",
      pins: [{ p: [66.5, 22.2, 39.5], text: "R3 storage · bit 0" }],
    },
    registers: {
      bounds: [
        [60, 20, 36],
        [90, 44, 50],
      ],
      region: 4,
      label: "Registers · 15 bytes stored twice · 240 one-bit cells",
      pins: [
        { p: [62.5, 22.5, 39.5], text: "R1 · bit 0 · bank 1" },
        { p: [62.5, 22.5, 47.5], text: "R1 · bit 0 · bank 2" },
      ],
    },
    operation: {
      bounds: [
        [44, 20, 18],
        [58, 44, 36],
      ],
      region: 5,
      label: "ALU · eight isolated output repeaters",
      pins: [
        { p: [52.5, 22.5, 18.5], text: "Output bit 0 · weight 1" },
        { p: [52.5, 36.5, 18.5], text: "Output bit 7 · weight 128" },
      ],
    },
  };
  views.memory = { ...views.cell, pins: [...views.cell.pins] };
  views.romword = {
    bounds: [
      [27, 13, 33],
      [29, 15, 64],
    ],
    region: 2,
    label: "ROM address 1 · A58B",
    pins: [
      { p: [28.8, 14.5, 34.5], text: "Bit 0 · 1" },
      { p: [28.8, 14.5, 64.5], text: "Bit 15 · 1" },
    ],
  };
  views.alucontrols = {
    bounds: [
      [42, 21, 18],
      [50, 27, 30],
    ],
    region: 8,
    label: "ALU control inputs",
    pins: [
      { p: [43.5, 24.2, 25.5], text: "Carry-in · CIN" },
      { p: [43.5, 25.2, 27.5], text: "Invert A · !A" },
    ],
  };
  views.flags = {
    bounds: [
      [50, 21, 15],
      [55, 39, 22],
    ],
    region: 5,
    label: "ALU zero-detection path",
    pins: [
      { p: [53.5, 36.4, 16.8], text: "Zero detector" },
      { p: [54.5, 38.07, 21.5], text: "Overflow-labelled path" },
    ],
  };
  const baseYaw = 2.25,
    basePitch = 0.5;
  let context = false;
  let ghost = false;
  let zoom = 1;
  function preset(id) {
    const bounds = (context ? views.whole : views[id]).bounds;
    const yaw = context ? baseYaw : (views[id].yaw ?? baseYaw);
    const pitch = context ? basePitch : (views[id].pitch ?? basePitch);
    return {
      ...views[id],
      center: bounds[0].map((v, i) => (v + bounds[1][i] + 1) / 2),
      yaw,
      pitch,
      size: fitHalf(
        bounds,
        yaw,
        pitch,
        canvas.clientWidth / Math.max(1, canvas.clientHeight),
      ),
    };
  }
  function fitHalf(bounds, yaw, pitch, aspect) {
    const z = [
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    ];
    const x = normalize(cross([0, 1, 0], z)),
      y = cross(z, x);
    const half = bounds[0].map((v, i) => (bounds[1][i] + 1 - v) / 2);
    const extent = (axis) =>
      half.reduce((sum, v, i) => sum + Math.abs(axis[i]) * v, 0);
    return Math.max(extent(y), extent(x) / aspect) * 1.12;
  }
  const pinLayer = document.querySelector("#landmark-labels");
  function setPins() {
    pinLayer.innerHTML = '<svg class="pin-leaders" aria-hidden="true"></svg>';
    const svg = pinLayer.firstChild;
    for (const pin of views[currentChapter].pins) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      const dot = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      dot.setAttribute("r", "4");
      svg.append(line, dot);
      const label = document.createElement("span");
      label.className = "landmark-pin";
      label.textContent = pin.text;
      pinLayer.append(label);
    }
  }
  window.setCpuPinLabels = (labels) => {
    views[currentChapter].pins.forEach((pin, i) => {
      if (labels[i]) pin.text = labels[i];
    });
    setPins();
    requestDraw();
  };
  function projectPins(matrix) {
    const width = canvas.clientWidth,
      height = canvas.clientHeight,
      occupied = [];
    views[currentChapter].pins.forEach((pin, i) => {
      const [x, y, z] = pin.p;
      const px =
        ((matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] + 1) *
          width) /
        2;
      const py =
        ((1 - matrix[1] * x - matrix[5] * y - matrix[9] * z - matrix[13]) *
          height) /
        2;
      const el = pinLayer.children[i + 1];
      if (!el) return;
      const line = pinLayer.firstChild.children[i * 2],
        dot = pinLayer.firstChild.children[i * 2 + 1];
      const visible = px > 5 && px < width - 5 && py > 5 && py < height - 5;
      el.hidden = !visible;
      line.style.display = dot.style.display = visible ? "" : "none";
      if (!visible) return;
      const ew = el.offsetWidth,
        eh = el.offsetHeight;
      const left = Math.max(
        10,
        Math.min(width - ew - 10, px < width / 2 ? px + 24 : px - ew - 24),
      );
      let top = Math.max(42, Math.min(height - eh - 10, py - eh - 28));
      for (const prev of occupied)
        if (
          left < prev.right + 8 &&
          left + ew > prev.left - 8 &&
          top < prev.bottom + 8 &&
          top + eh > prev.top - 8
        )
          top = Math.min(height - eh - 10, prev.bottom + 12);
      occupied.push({ left, right: left + ew, top, bottom: top + eh });
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      line.setAttribute("x1", px);
      line.setAttribute("y1", py);
      line.setAttribute("x2", Math.max(left, Math.min(left + ew, px)));
      line.setAttribute("y2", top + eh / 2);
      dot.setAttribute("cx", px);
      dot.setAttribute("cy", py);
    });
  }
  let view = preset("whole"),
    goal = preset("whole"),
    vertices = 0,
    lineVertices = 0,
    ready = false,
    frame = null;
  let currentChapter = "whole",
    lastFrame = performance.now();
  function draw() {
    frame = null;
    if (!ready) return;
    const rect = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr)),
      h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = performance.now();
    const factor = reduced
      ? 1
      : Math.min(1, 1 - Math.exp(-(now - lastFrame) / 170));
    lastFrame = now;
    let distance = 0;
    for (const key of ["yaw", "pitch", "size"]) {
      distance += Math.abs(goal[key] - view[key]);
      view[key] += (goal[key] - view[key]) * factor;
    }
    view.center = view.center.map((x, i) => {
      distance += Math.abs(goal.center[i] - x);
      return x + (goal.center[i] - x) * factor;
    });
    const eye = [
      Math.sin(view.yaw) * Math.cos(view.pitch) * 180 + view.center[0],
      Math.sin(view.pitch) * 180 + view.center[1],
      Math.cos(view.yaw) * Math.cos(view.pitch) * 180 + view.center[2],
    ];
    const z = normalize(eye.map((n, i) => n - view.center[i])),
      x = normalize(cross([0, 1, 0], z)),
      y = cross(z, x);
    const look = new Float32Array([
      x[0],
      y[0],
      z[0],
      0,
      x[1],
      y[1],
      z[1],
      0,
      x[2],
      y[2],
      z[2],
      0,
      -dot(x, eye),
      -dot(y, eye),
      -dot(z, eye),
      1,
    ]);
    const aspect = w / h,
      half = view.size;
    const ortho = new Float32Array([
      1 / (half * aspect),
      0,
      0,
      0,
      0,
      1 / half,
      0,
      0,
      0,
      0,
      -2 / 600,
      0,
      0,
      0,
      -1,
      1,
    ]);
    const matrix = multiply(ortho, look);
    gl.uniformMatrix4fv(uniform, false, matrix);
    gl.uniform1f(cropped, !context && currentChapter !== "whole" ? 1 : 0);
    gl.uniform3fv(cropMin, views[currentChapter].bounds[0]);
    gl.uniform3fv(cropMax, views[currentChapter].bounds[1]);
    projectPins(matrix);
    gl.uniform4fv(probeUniform, probeValues);
    gl.uniform1f(selected, goal.region);
    gl.uniform1f(highlightPass, 0);
    if (ghost && currentChapter !== "whole") {
      // A depth-tested silhouette avoids opacity accumulating across every layer.
      gl.uniform1f(ghostPass, 1);
      gl.colorMask(false, false, false, false);
      gl.drawArrays(gl.TRIANGLES, 0, vertices);
      gl.colorMask(true, true, true, true);
      gl.depthFunc(gl.EQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, vertices);
      gl.disable(gl.BLEND);
      gl.depthFunc(gl.LESS);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(ghostPass, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, vertices);
    if (goal.region !== 0) {
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(highlightPass, 1);
      gl.drawArrays(gl.TRIANGLES, 0, vertices);
      gl.uniform1f(highlightPass, 0);
    }
    if (
      lineVertices &&
      goal.region !== 0 &&
      ![
        "inverter",
        "cell",
        "memory",
        "result",
        "romword",
        "flags",
        "replayregister",
      ].includes(currentChapter)
    ) {
      gl.uniform1f(cropped, 0);
      gl.uniform1f(highlightPass, 1);
      gl.drawArrays(gl.LINES, vertices, lineVertices);
      gl.uniform1f(highlightPass, 0);
    }
    if (distance > 0.03) frame = requestAnimationFrame(draw);
  }
  function requestDraw() {
    if (frame === null) frame = requestAnimationFrame(draw);
  }
  function focus(id) {
    if (!views[id]) id = "whole";
    currentChapter = id;
    if (!ready) return;
    zoom = 1;
    goal = preset(id);
    // Take the shortest angular path after a manual orbit.
    view.yaw =
      goal.yaw +
      Math.atan2(Math.sin(view.yaw - goal.yaw), Math.cos(view.yaw - goal.yaw));
    document.querySelector("#orbit-angle").value = "0";
    document.querySelector("#view-zoom").value = "100";
    canvas.dataset.chapter = id;
    canvas.dataset.mode = context ? "context" : ghost ? "ghost" : "region";
    document.querySelector("#view-badge").textContent =
      ghost && id !== "whole"
        ? "X-ray · surrounding build faded"
        : id === "whole" || context
          ? "Complete build"
          : [
                "inverter",
                "cell",
                "memory",
                "result",
                "romword",
                "flags",
              ].includes(id)
            ? "Circuit cutaway · exact block positions"
            : "Module cutaway · approximate bounds";
    document
      .querySelector("#region-view")
      .setAttribute("aria-pressed", String(!context && !ghost));
    document
      .querySelector("#context-view")
      .setAttribute("aria-pressed", String(context));
    document
      .querySelector("#ghost-view")
      .setAttribute("aria-pressed", String(ghost));
    setPins();
    status.textContent = goal.label;
    lastFrame = performance.now();
    requestDraw();
  }
  window.focusCpuBuild = (id, preserveMode = false) => {
    if (!preserveMode) context = false;
    focus(id);
  };
  window.focusCpuController = (opcode) => {
    const x = 53 + 2 * opcode;
    const operation =
      { 1: "ADD", 3: "AND", 9: "INC", 11: "LDI" }[opcode] || "NOP";
    views.controller = {
      // Keep every controller column visible; only the operation label moves.
      bounds: views.encoding.bounds,
      region: 3,
      label: `Controller · ${operation} operation sign`,
      pins: [
        {
          p: [x + 0.5, 26.5, 60.5],
          text: `${operation} · opcode ${opcode.toString(16).toUpperCase()}`,
        },
      ],
    };
    focus("controller");
  };
  window.enableCpuXray = () => {
    ghost = true;
    context = false;
    focus(currentChapter);
  };
  window.focusCpuRegister = (r) => {
    const x = 60 + 2 * r,
      y = 22 + (r % 2 === 0 ? 1 : 0);
    views.replayregister = {
      bounds: [
        [x - 1, y - 1, 38],
        [x + 1, y + 15, 48],
      ],
      region: 4,
      label: `R${r} · eight bits · both storage banks`,
      pins: [
        { p: [x + 0.5, y + 0.3, 39.5], text: `R${r} · bit 0` },
        { p: [x + 0.5, y + 14.3, 39.5], text: `R${r} · bit 7` },
      ],
    };
    focus("replayregister");
  };
  window.inspectCpuCell = (register, bit, bank) => {
    const x = 60 + 2 * register,
      y = 22 + 2 * bit + (register % 2 === 0 ? 1 : 0),
      z = bank === 0 ? 39 : 47;
    views.cell.bounds = [
      [x - 1, y - 1, z - 1],
      [x + 1, y, z + (bank === 0 ? 2 : 1)],
    ];
    views.cell.pins = [
      {
        p: [x + 0.5, y + 0.2, z + 0.5],
        text: `R${register} · bit ${bit} · bank ${bank + 1}`,
      },
    ];
    views.cell.label = `R${register}, bit ${bit} · bank ${bank + 1}`;
    focus("cell");
  };
  document
    .querySelector("#restore-view")
    .addEventListener("click", () => focus(currentChapter));
  for (const [id, value] of [
    ["region-view", false],
    ["context-view", true],
  ]) {
    document.getElementById(id).addEventListener("click", () => {
      context = value;
      ghost = false;
      focus(currentChapter);
    });
  }
  document.querySelector("#ghost-view").addEventListener("click", () => {
    ghost = true;
    context = false;
    focus(currentChapter);
  });
  function refit() {
    const bounds = (context ? views.whole : views[currentChapter]).bounds;
    goal.size =
      fitHalf(
        bounds,
        goal.yaw,
        goal.pitch,
        canvas.clientWidth / Math.max(1, canvas.clientHeight),
      ) / zoom;
    requestDraw();
  }
  document.querySelector("#orbit-angle").addEventListener("input", (e) => {
    goal.yaw =
      (context ? baseYaw : (views[currentChapter].yaw ?? baseYaw)) +
      (Number(e.target.value) * Math.PI) / 180;
    refit();
  });
  document.querySelector("#view-zoom").addEventListener("input", (e) => {
    zoom = Number(e.target.value) / 100;
    refit();
  });
  function syncControls() {
    const originYaw = context
      ? baseYaw
      : (views[currentChapter].yaw ?? baseYaw);
    const angle = Math.atan2(
      Math.sin(goal.yaw - originYaw),
      Math.cos(goal.yaw - originYaw),
    );
    document.querySelector("#orbit-angle").value = String(
      (angle * 180) / Math.PI,
    );
    document.querySelector("#view-zoom").value = String(zoom * 100);
  }
  let pointer = null;
  canvas.addEventListener("pointerdown", (e) => {
    canvas.focus({ preventScroll: true });
    pointer = [e.clientX, e.clientY];
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointer) return;
    goal.yaw += (e.clientX - pointer[0]) * 0.008;
    goal.pitch = Math.max(
      0.12,
      Math.min(1.45, goal.pitch + (e.clientY - pointer[1]) * 0.005),
    );
    pointer = [e.clientX, e.clientY];
    syncControls();
    refit();
  });
  const release = () => {
    pointer = null;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom = Math.max(
        0.65,
        Math.min(
          6,
          zoom *
            Math.exp(
              -e.deltaY *
                (e.deltaMode === 1
                  ? 16
                  : e.deltaMode === 2
                    ? canvas.clientHeight
                    : 1) *
                0.0015,
            ),
        ),
      );
      syncControls();
      refit();
    },
    { passive: false },
  );
  canvas.addEventListener("keydown", (e) => {
    const keys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "+",
      "=",
      "-",
      "_",
      "Home",
      "Escape",
    ];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    if (e.key === "Escape") {
      canvas.blur();
      return;
    }
    if (e.key === "Home") {
      focus(currentChapter);
      return;
    }
    if (e.key === "ArrowLeft") goal.yaw -= 0.2;
    if (e.key === "ArrowRight") goal.yaw += 0.2;
    if (e.key === "ArrowUp") goal.pitch = Math.min(1.45, goal.pitch + 0.1);
    if (e.key === "ArrowDown") goal.pitch = Math.max(0.12, goal.pitch - 0.1);
    if (["+", "="].includes(e.key)) zoom = Math.min(6, zoom / 0.85);
    if (["-", "_"].includes(e.key)) zoom = Math.max(0.65, zoom * 0.85);
    syncControls();
    refit();
  });
  addEventListener("resize", refit);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    ready = false;
    showFallback("3D graphics paused. Reload to restore the interactive view.");
  });
  fetch("./data/build.json")
    .then((r) => {
      if (!r.ok) throw Error("Build data unavailable");
      return r.json();
    })
    .then(async (data) => {
      const record = await window.cpuRecording;
      physicalData = record.physical;
      captures = { addition: record.physical, line: record.linePhysical };
      const romPixels = new Uint8Array(16 * 128);
      [record.program, record.line.program].forEach((words, row) => {
        for (const [address, hex] of words)
          for (let bit = 0; bit < 16; bit++)
            romPixels[(row * 64 + address) * 16 + bit] =
              (parseInt(hex, 16) >> bit) & 1 ? 255 : 0;
      });
      const romTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, romTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        16,
        128,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        romPixels,
      );
      gl.uniform1i(gl.getUniformLocation(program, "romMap"), 1);
      gl.activeTexture(gl.TEXTURE0);
      const sourceCount = data.blocks.length;
      // Program only the documented ROM cells. No routing or supports are changed.
      const isRom = ([x, y, z]) =>
        x >= 0 &&
        x <= 30 &&
        x % 2 === 0 &&
        [2, 6, 10, 14].includes(y) &&
        z >= 34 &&
        z <= 64 &&
        z % 2 === 0;
      data.blocks = data.blocks.filter((b) => !isRom(b));
      let torch = data.palette.indexOf(
        "minecraft:redstone_wall_torch[facing=west,lit=true]",
      );
      if (torch < 0) {
        torch = data.palette.length;
        data.palette.push(
          "minecraft:redstone_wall_torch[facing=west,lit=true]",
        );
      }
      // Both programs use the exact same 1024 ROM positions. The ROM texture
      // selects actual installed torches for the active captured program.
      for (let address = 0; address < 64; address++)
        for (let bit = 0; bit < 16; bit++)
          data.blocks.push([
            30 - 2 * (address % 16),
            14 - 4 * Math.floor(address / 16),
            34 + 2 * bit,
            torch,
          ]);
      canvas.dataset.sourceBlocks = String(sourceCount);

      const positions = [],
        colors = [],
        blockCoords = [],
        regions = [],
        naturalMaterials = [];
      const names = data.palette;
      const solid = (name) =>
        !/wire|repeater|comparator|torch|sign|lever|button/.test(name);
      const occupancy = new Set(
        data.blocks
          .filter((b) => solid(names[b[3]]))
          .map((b) => `${b[0]},${b[1]},${b[2]}`),
      );
      function regionFor(x, y, z, name) {
        if (x === 43 && ((y === 24 && z === 25) || (y === 25 && z === 27)))
          return 8;
        if (y === 22 && z === 43 && [60, 61, 62].includes(x)) return 7;
        // ROM mask is the exact 1024-coordinate placement formula, in local coordinates.
        if (
          x >= 0 &&
          x <= 30 &&
          x % 2 === 0 &&
          [2, 6, 10, 14].includes(y) &&
          z >= 34 &&
          z <= 64 &&
          z % 2 === 0
        )
          return 2;
        if (
          name.startsWith("minecraft:repeater[") &&
          x === 41 &&
          z === 15 &&
          y >= 7 &&
          y <= 17 &&
          y % 2 === 1
        )
          return 1;
        if (
          name.startsWith("minecraft:repeater[") &&
          x >= 62 &&
          x <= 90 &&
          x % 2 === 0 &&
          [39, 47].includes(z)
        ) {
          const r = (x - 60) / 2;
          const bit = (y - 22 - (r % 2 === 0 ? 1 : 0)) / 2;
          if (Number.isInteger(bit) && bit >= 0 && bit < 8) return 4;
        }
        if (name.includes("sign") && x >= 53 && x <= 77 && y === 26 && z === 60)
          return 3;
        if (
          name.startsWith("minecraft:repeater[") &&
          x === 52 &&
          z === 18 &&
          y >= 22 &&
          y <= 36 &&
          y % 2 === 0
        )
          return 5;
        return 6;
      }
      function box(
        x,
        y,
        z,
        sx,
        sy,
        sz,
        color,
        region,
        full,
        transform = null,
        owner = null,
        naturalMaterial = 0,
      ) {
        const neighbors = [
          [0, 1, 0],
          [1, 0, 0],
          [0, 0, 1],
          [-1, 0, 0],
          [0, 0, -1],
          [0, -1, 0],
        ];
        for (let f = 0; f < 6; f++) {
          const n = neighbors[f];
          if (
            full &&
            !(x >= 39 && x <= 91 && y >= 20) &&
            occupancy.has(
              `${Math.floor(x) + n[0]},${Math.floor(y) + n[1]},${Math.floor(z) + n[2]}`,
            )
          )
            continue;
          for (const i of [0, 1, 2, 0, 2, 3]) {
            const v = faceCorners[f][i];
            const point = [x + v[0] * sx, y + v[1] * sy, z + v[2] * sz];
            positions.push(...(transform ? transform(point) : point));
            colors.push(...color.map((c) => c * faces[f]));
            regions.push(region);
            naturalMaterials.push(naturalMaterial);
            blockCoords.push(
              ...(owner || [Math.floor(x), Math.floor(y), Math.floor(z)]),
            );
          }
        }
      }
      const counts = {};
      for (const [x, y, z, p] of data.blocks) {
        const name = names[p],
          color = typeColor(name),
          region = regionFor(x, y, z, name);
        counts[region] = (counts[region] || 0) + 1;
        let sx = 0.97,
          sy = 0.97,
          sz = 0.97,
          ox = 0.015,
          oy = 0,
          oz = 0.015;
        if (name.includes("redstone_wire")) {
          for (const [dx, dy, dz, width, height, depth] of wireBoxes(name))
            box(
              x + dx,
              y + dy,
              z + dz,
              width,
              height,
              depth,
              hex("#a52c29"),
              region,
              false,
            );
          continue;
        } else if (/repeater|comparator/.test(name)) {
          sy = 0.14;
        } else if (/torch/.test(name)) {
          const transform = (point) =>
            torchPoint(point, name).map((v, i) => v + [x, y, z][i]);
          box(
            0.4375,
            0,
            0.4375,
            0.125,
            0.625,
            0.125,
            hex("#8b6845"),
            region,
            false,
            transform,
            [x, y, z],
            1,
          );
          box(
            0.40625,
            0.4375,
            0.40625,
            0.1875,
            0.1875,
            0.1875,
            hex(name.includes("lit=false") ? "#542b25" : "#ed3d22"),
            region,
            false,
            transform,
            [x, y, z],
          );
          if (!name.includes("lit=false"))
            box(
              0.4375,
              0.625,
              0.4375,
              0.125,
              0.025,
              0.125,
              hex("#ffc16b"),
              region,
              false,
              transform,
              [x, y, z],
            );
          continue;
        } else if (/wall_sign/.test(name)) {
          sy = 0.45;
          oy = 0.25;
          if (/facing=(north|south)/.test(name)) {
            sz = 0.08;
            oz = name.includes("facing=north") ? 0.9 : 0.02;
          } else {
            sx = 0.08;
            ox = name.includes("facing=west") ? 0.9 : 0.02;
          }
        } else if (/lever|button/.test(name)) {
          sx = sz = 0.35;
          sy = 0.3;
          ox = oz = 0.3;
        }
        box(
          x + ox,
          y + oy,
          z + oz,
          sx,
          sy,
          sz,
          color,
          region,
          solid(name),
          null,
          [x, y, z],
          /repeater|comparator/.test(name) ? 1 : 0,
        );
        if (/repeater|comparator/.test(name))
          for (const offset of [0.25, 0.68])
            box(
              x + (/facing=(east|west)/.test(name) ? offset : 0.4),
              y + 0.14,
              z + (/facing=(east|west)/.test(name) ? 0.4 : offset),
              0.14,
              0.2,
              0.14,
              hex("#da7465"),
              region,
              false,
            );
      }
      vertices = regions.length;
      const bounds = [
        { region: 1, min: [39, 0, 9], max: [53, 19, 17] },
        { region: 2, min: [0, 0, 32], max: [33, 16, 64] },
        { region: 3, min: [48, 22, 52], max: [84, 36, 62] },
        { region: 4, min: [60, 20, 36], max: [90, 44, 50] },
        { region: 5, min: [44, 20, 18], max: [58, 44, 36] },
      ];
      for (const b of bounds) {
        const lo = b.min.map((v) => v - 0.15),
          hi = b.max.map((v) => v + 1.15);
        const c = [
          [lo[0], lo[1], lo[2]],
          [hi[0], lo[1], lo[2]],
          [hi[0], hi[1], lo[2]],
          [lo[0], hi[1], lo[2]],
          [lo[0], lo[1], hi[2]],
          [hi[0], lo[1], hi[2]],
          [hi[0], hi[1], hi[2]],
          [lo[0], hi[1], hi[2]],
        ];
        for (const [a, z] of [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 0],
          [4, 5],
          [5, 6],
          [6, 7],
          [7, 4],
          [0, 4],
          [1, 5],
          [2, 6],
          [3, 7],
        ])
          for (const i of [a, z]) {
            positions.push(...c[i]);
            colors.push(0.3, 0.65, 0.7);
            regions.push(b.region);
            naturalMaterials.push(0);
            blockCoords.push(-999, -999, -999);
          }
      }
      lineVertices = regions.length - vertices;
      for (const [name, values, size] of [
        ["position", positions, 3],
        ["color", colors, 3],
        ["blockCoord", blockCoords, 3],
        ["region", regions, 1],
        ["naturalMaterial", naturalMaterials, 1],
      ]) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(values),
          gl.STATIC_DRAW,
        );
        const location = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
      }
      ready = true;
      document
        .querySelectorAll(".view-modes button, .view-controls input")
        .forEach((el) => (el.disabled = false));
      canvas.dataset.landmarks = JSON.stringify(counts);
      canvas.dataset.blocks = String(data.blocks.length);
      canvas.dataset.ready = "true";
      focus(currentChapter);
      document.querySelector(".viewer-loading").hidden = true;
      dispatchEvent(new Event("cpu-model-ready"));
    })
    .catch((error) => {
      showFallback(
        "The model could not load. A static overview is shown; reload to retry.",
      );
      console.error(error);
    });
})();
