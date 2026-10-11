/**
 * Fabric: an FPGA with its lid off, a quad flat package on gull-wing leads with
 * a bare die on top, ruled into a 7 × 7 grid of logic tiles. The pointer is
 * projected onto the die and claims a square region of the fabric around it,
 * the way a placement block does: tiles rise by their square distance to it,
 * each on its own spring. At rest a placed module and a carry chain already
 * stand on the die. Tiles above half height take the bright stroke. The slider
 * is the region's radius, in tiles.
 *
 * The pattern: a continuous field. Springs, a falloff by distance, and a hit
 * test on the plane of the die, which never moves.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, unproj, spring, stepS,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const N = 7, CELL = 11, FOOT = 8.4, HMAX = 26, DH = (N * CELL) / 2 + 4, BH = 54;
const BZ0 = 1.2, BZ1 = 5.2, DZ = 6.6, LEADS = 7, LP = 12, LW = 4, LL = 10, LZ = 1.2;

/** The share of full height at u radii from the pointer: 1 → .31 at 42% → .09 at the edge and beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;

/** The rest pose: a placed module of uneven fill, a carry chain beside it, the rest of the fabric idle. */
function rest(i, j) {
  if (i === 2 && j === 4) return 13.5;
  if (i >= 1 && i <= 3 && j >= 3 && j <= 5) return 6 + ((i * 3 + j * 5) % 4) * 1.4;
  if (i === 5 && j <= 4) return 2.6 + j * 0.5;
  return 1.1;
}

/** The leads along one side: s picks the side, as the axis (0 = x, 1 = y) and the sign of its outward normal. */
function side(axis, sign) {
  const out = [];
  for (let k = 0; k < LEADS; k++) {
    const t = (k - (LEADS - 1) / 2) * LP, a = sign > 0 ? BH + 0.4 : -BH - 0.4 - LL, b = a + LL;
    out.push(axis === 0 ? rings(a, t - LW / 2, b, t + LW / 2, 0.9, 0.5) : rings(t - LW / 2, a, t + LW / 2, b, 0.9, 0.5));
  }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.9);
  const E = BH + LL + 1;
  fit(C, [[-E, -E, 0], [E, E, 0], [E, -E, 0], [-E, E, 0], [-DH, -DH, DZ + HMAX]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value * CELL, over = null;

  const g = mk("g", {}, svg);
  const lead = (r) => put(solid(g), prism(P, front, r[0], r[1], 0, LZ));
  // far leads, the body and the die, then the near leads: back to front
  side(0, -1).concat(side(1, -1)).forEach(lead);
  const [br, bi] = rings(-BH, -BH, BH, BH, 4, 2);
  put(solid(g), prism(P, front, br, bi, BZ0, BZ1));
  side(0, 1).concat(side(1, 1)).forEach(lead);
  const [dr, di] = rings(-DH, -DH, DH, DH, 2.5, 1.2);
  put(solid(g), prism(P, front, dr, di, BZ1, DZ));
  // pin 1: a dimple moulded into the body's corner
  place(flatDot(g, C, 1.6, "dot m"), P(-BH + 7, BH - 7, BZ1));

  // Tiles, diagonal by diagonal from the back corner, so appending is painting back to front.
  const tiles = [];
  for (let s = 0; s <= 2 * (N - 1); s++) for (let i = 0; i < N; i++) {
    const j = s - i;
    if (j < 0 || j >= N) continue;
    const cx = (i - (N - 1) / 2) * CELL, cy = (j - (N - 1) / 2) * CELL;
    const [ring, inner] = rings(cx - FOOT / 2, cy - FOOT / 2, cx + FOOT / 2, cy + FOOT / 2, 1.8, 0.8);
    const h0 = rest(i, j);
    tiles.push({ i, j, cx, cy, h0, ring, inner, sp: spring(h0, { eps: 0.04 }), el: solid(g), drawn: NaN });
  }

  // A tile whose spring hasn't moved keeps its paths: most are still on most frames.
  function draw(t) {
    const h = Math.max(0.6, t.sp.x);
    if (h === t.drawn) return;
    t.drawn = h;
    put(t.el, prism(P, front, t.ring, t.inner, DZ, DZ + h));
    t.el.sil.classList.toggle("hi", h > HMAX * 0.5);
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const t of tiles) { if (stepS(t.sp, dt)) m = true; draw(t); }
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    for (const t of tiles) {
      if (!over) { t.sp.t = t.h0; continue; }
      const u = Math.max(Math.abs(t.cx - over[0]), Math.abs(t.cy - over[1])) / R;
      t.sp.t = clamp(HMAX * falloff(u), 0.6, HMAX);
    }
    if (over) {
      const i = clamp(Math.floor(over[0] / CELL + N / 2), 0, N - 1), j = clamp(Math.floor(over[1] / CELL + N / 2), 0, N - 1);
      read.textContent = `clb ${i}·${j}`;
    } else read.textContent = "rest";
    B.wake();
  }

  /** The pointer on the die's plane; off the die by more than a tile, it counts as gone. */
  const onDie = (p) => {
    const w = unproj(C, p[0], p[1], DZ);
    return Math.max(Math.abs(w[0]), Math.abs(w[1])) <= DH + CELL ? w : null;
  };
  bag.add(pointer(stage, {
    move: (p) => { over = onDie(p); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v * CELL; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "fabric",
  means: "An FPGA with its lid off: the pointer claims a square region of logic tiles, and they rise less the farther they sit from it.",
  rules: [1, 3, 5, 9],
  range: [1.4, 3, 4.4],
  tour: [[160, 170], [200, 123], [280, 180], null],
  mount,
});
