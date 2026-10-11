/**
 * Wafer: a diced silicon wafer on a vacuum chuck. The die under the pointer is
 * pushed up by the ejector, and the tape tents its neighbours up less and less
 * with distance, staggered outwards from it on the 700ms lift curve. The wafer
 * keeps its flat, a bare rim where no die fits, and ink dots on the dies that
 * failed probe. At rest one die is mid-pick. The slider is the tent's reach,
 * in die pitches.
 *
 * The pattern: one of many, with a falloff. Tweens, a stagger by distance, and
 * a hit test on the plane of the resting die tops, which never moves.
 */
const {
  Cam, circ, clamp, facing, fit, hull, open, poly, prism, proj, ringAt, rings, run, unproj,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const NG = 12, PITCH = 13, DIE = 11, RW = 72, FD = 64, RC = 78, CH = 8;
const WT = 1.6, DT = 1.8, TOP = WT + DT, LIFT = 15, STEP = 45, EDGE = 3;
const REST = [7, 3], REST_LIFT = 0.72;

/** Cell k's centre on one axis. */
const mid = (k) => (k - NG / 2 + 0.5) * PITCH;

/** The wafer's outline at radius R with its flat at v = F, the two corners filleted by rf, as ring samples. */
function wafer(R, F, rf) {
  const uc = Math.sqrt((R - rf) ** 2 - (F - rf) ** 2), ph = Math.atan2(F - rf, uc), out = [];
  const arc = (cu, cv, r, a0, a1, m, last = true) => {
    for (let s = 0; s < m + (last ? 1 : 0); s++) {
      const a = a0 + ((a1 - a0) * s) / m;
      out.push({ u: cu + r * Math.cos(a), v: cv + r * Math.sin(a), nu: Math.cos(a), nv: Math.sin(a) });
    }
  };
  // round the back from the left fillet to the right one, then the right fillet, the flat, the left fillet
  arc(0, 0, R, -Math.PI - ph, ph, 88, false);
  arc(uc, F - rf, rf, ph, Math.PI / 2, 5);
  for (let s = 1; s < 6; s++) out.push({ u: uc - (2 * uc * s) / 6, v: F, nu: 0, nv: 1 });
  arc(-uc, F - rf, rf, Math.PI / 2, Math.PI - ph, 5, false);
  return out;
}

/** The share of full lift d pitches from the pushed die, for a tent of reach w; nothing below a third of a unit. */
const tent = (d, w) => {
  const f = Math.exp(-((d / w) ** 2));
  return f * LIFT < 0.35 ? 0 : f;
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;

  // Fitted to the chuck below and to the whole wafer at full lift, so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.9);
  const edge = circ(RC, 24).map((q) => [q.u, q.v, -CH]).concat(circ(RW, 24).map((q) => [q.u, q.v, TOP + LIFT]));
  fit(C, edge, 200, 170);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, circ(RC, 128), circ(RC - 2.2, 128), -CH, 0));
  // the chuck's vacuum groove, showing in the margin past the wafer's flat
  mk("path", { d: open(ringAt(P, run(circ(RC - 4.5, 128), (q) => q.v > FD + 2), 0)), class: "nf lo" }, g);
  const wo = wafer(RW, FD, 8), wi = wafer(RW - 1.4, FD - 1.4, 6.6);
  put(solid(g), { sil: poly(hull(ringAt(P, wo, 0).concat(ringAt(P, wo, WT)))), crease: open(ringAt(P, run(wi, front), WT)) });

  // Dies that fit inside the edge exclusion, appended by ascending x + y: back to front.
  const dies = [], byCell = new Map();
  for (let s = 0; s <= 2 * (NG - 1); s++) for (let i = 0; i < NG; i++) {
    const j = s - i;
    if (j < 0 || j >= NG) continue;
    const cx = mid(i), cy = mid(j), h = DIE / 2;
    const fits = [[-h, -h], [h, -h], [h, h], [-h, h]].every(([a, b]) => Math.hypot(cx + a, cy + b) < RW - EDGE && cy + b < FD - EDGE);
    if (!fits) continue;
    const [ring, inner] = rings(cx - h, cy - h, cx + h, cy + h, 1.8, 0.9);
    const el = solid(g);
    // ink: the dies that failed probe, a handful on the outer rows
    const ink = Math.hypot(cx, cy) > 44 && (i * 5 + j * 3) % 7 === 0 ? flatDot(el.g, C, 1.3, "dot off") : null;
    const d = { i, j, cx, cy, ring, inner, el, ink, z: tween(0), drawn: NaN };
    dies.push(d); byCell.set(i + "," + j, d);
  }

  function draw(d, z) {
    if (z === d.drawn) return;
    d.drawn = z;
    put(d.el, prism(P, front, d.ring, d.inner, WT + z, TOP + z));
    if (d.ink) place(d.ink, P(d.cx, d.cy, TOP + z));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const d of dies) { draw(d, tval(d.z, now)); if (!tdone(d.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  const rest = byCell.get(REST.join(","));
  let act = null;
  /** Pushes die a up (null returns to the rest pick); the stagger spreads out from the die pushed, or the one let go. */
  function setActive(a, force) {
    if (a === act && !force) return;
    const now = performance.now(), src = a || act || rest, pushed = a || rest, k = a ? 1 : REST_LIFT;
    act = a;
    for (const d of dies) {
      const dist = Math.hypot(d.i - pushed.i, d.j - pushed.j), lag = Math.hypot(d.i - src.i, d.j - src.j);
      tset(d.z, clamp(LIFT * k * tent(dist, reach), 0, LIFT), now, lag * STEP);
      d.el.sil.classList.toggle("hi", d === pushed);
    }
    read.textContent = a ? `die ${a.i}·${a.j}` : "rest";
    B.wake();
  }

  /** The die whose cell holds the pointer, on the plane of the resting die tops; null off the dies. */
  function hit([x, y]) {
    const [wx, wy] = unproj(C, x, y, TOP);
    const i = Math.floor(wx / PITCH + NG / 2), j = Math.floor(wy / PITCH + NG / 2);
    return byCell.get(i + "," + j) || null;
  }

  setActive(null, true);
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { reach = v; setActive(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "wafer",
  means: "A diced wafer on a chuck: the die under the pointer is pushed up, and its neighbours rise less the farther they are.",
  rules: [1, 2, 3, 5],
  range: [0.6, 1.5, 2.3],
  tour: [[200, 161], [113, 135], [130, 196], null],
  mount,
});
