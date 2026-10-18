"use strict";
// Physical geometry comes exclusively from the parsed Sponge schematic.
// The simplified shapes show block placement, not a redstone simulation.
(() => {
  const canvas = document.querySelector("#build-canvas");
  const status = document.querySelector("#build-status");
  const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
  const fallback = document.querySelector("#build-fallback");
  if (!gl) {
    status.textContent = "3D is unavailable in this browser.";
    fallback.hidden = false;
    canvas.hidden = true;
    document.querySelector(".model-fallback").hidden = false;
    document.querySelector("#hero-build").hidden = true;
    document.querySelector(".hero-fallback").hidden = false;
    document.querySelector(".viewer-loading").hidden = true;
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
      `attribute vec3 position; attribute vec3 color; attribute float region; uniform mat4 matrix; uniform float selected; uniform float highlightPass; varying vec3 vColor; varying float vChosen; void main(){ float chosen=1.0-step(0.1,abs(region-selected)); float all=1.0-step(0.1,selected); vChosen=chosen; vColor=mix(color*.32,mix(color,vec3(.40,.90,.97),.62),chosen); vColor=mix(vColor,color,all); gl_Position=matrix*vec4(position,1.0); }`,
    ),
  );
  gl.attachShader(
    program,
    shader(
      gl.FRAGMENT_SHADER,
      `precision mediump float; varying vec3 vColor; varying float vChosen; uniform float highlightPass; void main(){ if(highlightPass>0.5 && vChosen<0.5) discard; gl_FragColor=vec4(vColor,1.0); }`,
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
      return hex(power === 0 ? "#722b2b" : "#df4c39");
    }
    if (short.includes("torch")) return hex("#eea574");
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
  const views = {
    whole: {
      center: [45, 21, 32],
      yaw: 2.25,
      pitch: 0.56,
      size: 48,
      region: 0,
      label: "Complete physical build · original saved ROM",
    },
    clock: {
      center: [46, 9, 13],
      yaw: -0.65,
      pitch: 0.35,
      size: 22,
      region: 1,
      label: "PC · 6 confirmed state repeaters",
    },
    rom: {
      center: [15, 8, 49],
      yaw: -0.85,
      pitch: 0.55,
      size: 33,
      region: 2,
      label: "ROM programming cells · documented coordinates",
    },
    encoding: {
      center: [64, 26, 57],
      yaw: 2.0,
      pitch: 0.55,
      size: 31,
      region: 3,
      label: "Operation-label neighborhood · signs from the build",
    },
    registers: {
      center: [75, 32, 43],
      yaw: 1.25,
      pitch: 0.46,
      size: 29,
      region: 4,
      label: "Register banks · 240 confirmed storage repeaters",
    },
    operation: {
      center: [51, 32, 27],
      yaw: 2.8,
      pitch: 0.4,
      size: 27,
      region: 5,
      label: "ALU · 8 confirmed output repeaters",
    },
  };
  let view = { ...views.whole, center: [...views.whole.center] },
    goal = { ...views.whole },
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
    gl.uniformMatrix4fv(uniform, false, multiply(ortho, look));
    gl.uniform1f(selected, goal.region);
    gl.uniform1f(highlightPass, 0);
    gl.drawArrays(gl.TRIANGLES, 0, vertices);
    if (goal.region !== 0) {
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(highlightPass, 1);
      gl.drawArrays(gl.TRIANGLES, 0, vertices);
      gl.uniform1f(highlightPass, 0);
    }
    if (lineVertices) {
      gl.uniform1f(highlightPass, 1);
      gl.drawArrays(gl.LINES, vertices, lineVertices);
      gl.uniform1f(highlightPass, 0);
    }
    const hero = document.querySelector("#hero-build");
    if (currentChapter === "whole" && hero) {
      hero.width = w;
      hero.height = h;
      hero.getContext("2d").drawImage(canvas, 0, 0);
    }
    if (distance > 0.03) frame = requestAnimationFrame(draw);
  }
  function requestDraw() {
    if (frame === null) frame = requestAnimationFrame(draw);
  }
  function focus(id) {
    if (!views[id]) id = "whole";
    currentChapter = id;
    goal = { ...views[id], center: [...views[id].center] };
    status.textContent = goal.label;
    lastFrame = performance.now();
    requestDraw();
  }
  window.focusCpuBuild = focus;
  document
    .querySelector("#restore-view")
    .addEventListener("click", () => focus(currentChapter));
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
    requestDraw();
  });
  const release = () => {
    pointer = null;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener(
    "wheel",
    (e) => {
      if (document.activeElement !== canvas) return;
      e.preventDefault();
      goal.size = Math.max(
        12,
        Math.min(100, goal.size * Math.exp(e.deltaY * 0.0015)),
      );
      requestDraw();
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
    if (["+", "="].includes(e.key)) goal.size = Math.max(12, goal.size * 0.85);
    if (["-", "_"].includes(e.key)) goal.size = Math.min(100, goal.size / 0.85);
    requestDraw();
  });
  addEventListener("resize", requestDraw);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    ready = false;
    status.textContent = "3D graphics paused. Reload to restore the view.";
    fallback.hidden = false;
  });
  fetch("./data/build.json")
    .then((r) => {
      if (!r.ok) throw Error("Build data unavailable");
      return r.json();
    })
    .then((data) => {
      const positions = [],
        colors = [],
        regions = [];
      const names = data.palette;
      const solid = (name) =>
        !/wire|repeater|comparator|torch|sign|lever|button/.test(name);
      const occupancy = new Set(
        data.blocks
          .filter((b) => solid(names[b[3]]))
          .map((b) => `${b[0]},${b[1]},${b[2]}`),
      );
      function regionFor(x, y, z, name) {
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
        if (x === 41 && z === 15 && y >= 7 && y <= 17 && y % 2 === 1) return 1;
        if (x >= 62 && x <= 90 && x % 2 === 0 && [39, 47].includes(z)) {
          const r = (x - 60) / 2;
          const bit = (y - 22 - (r % 2 === 0 ? 1 : 0)) / 2;
          if (Number.isInteger(bit) && bit >= 0 && bit < 8) return 4;
        }
        if (x >= 51 && x <= 79 && y >= 23 && y <= 29 && z >= 55) return 3;
        if (x === 52 && z === 18 && y >= 22 && y <= 36 && y % 2 === 0) return 5;
        return 6;
      }
      function box(x, y, z, sx, sy, sz, color, region, full) {
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
            occupancy.has(
              `${Math.floor(x) + n[0]},${Math.floor(y) + n[1]},${Math.floor(z) + n[2]}`,
            )
          )
            continue;
          for (const i of [0, 1, 2, 0, 2, 3]) {
            const v = faceCorners[f][i];
            positions.push(x + v[0] * sx, y + v[1] * sy, z + v[2] * sz);
            colors.push(...color.map((c) => c * faces[f]));
            regions.push(region);
          }
        }
      }
      for (const [x, y, z, p] of data.blocks) {
        const name = names[p],
          color = typeColor(name),
          region = regionFor(x, y, z, name);
        let sx = 0.97,
          sy = 0.97,
          sz = 0.97,
          ox = 0.015,
          oy = 0,
          oz = 0.015;
        if (name.includes("redstone_wire")) {
          sx = 0.84;
          sy = 0.035;
          sz = 0.84;
          ox = oz = 0.08;
        } else if (/repeater|comparator/.test(name)) {
          sy = 0.14;
        } else if (/wall_torch/.test(name)) {
          sx = 0.18;
          sy = 0.55;
          sz = 0.18;
          ox = name.includes("facing=west")
            ? 0.75
            : name.includes("facing=east")
              ? 0.07
              : 0.41;
          oz = name.includes("facing=north")
            ? 0.75
            : name.includes("facing=south")
              ? 0.07
              : 0.41;
          oy = 0.15;
        } else if (/redstone_torch/.test(name)) {
          sx = sz = 0.18;
          sy = 0.65;
          ox = oz = 0.41;
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
        box(x + ox, y + oy, z + oz, sx, sy, sz, color, region, solid(name));
        if (/repeater|comparator/.test(name))
          for (const offset of [0.25, 0.68])
            box(
              x + 0.4,
              y + 0.14,
              z + offset,
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
        { region: 2, min: [0, 2, 34], max: [30, 14, 64] },
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
          }
      }
      lineVertices = regions.length - vertices;
      for (const [name, values, size] of [
        ["position", positions, 3],
        ["color", colors, 3],
        ["region", regions, 1],
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
      document.querySelector("#restore-view").disabled = false;
      canvas.dataset.blocks = String(data.blocks.length);
      canvas.dataset.ready = "true";
      focus(currentChapter);
      document.querySelector(".viewer-loading").hidden = true;
    })
    .catch((error) => {
      status.textContent = "The physical model could not load.";
      fallback.hidden = false;
      document.querySelector(".model-fallback").hidden = false;
      document.querySelector(".viewer-loading").hidden = true;
      console.error(error);
    });
})();
