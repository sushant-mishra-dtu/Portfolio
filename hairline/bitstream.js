/**
 * Bitstream: a UART line, a copper trace that runs away from the viewer, from
 * a via into the receive lead of a quad flat package. The serial frames ride
 * it without stopping: a low start bit, eight data bits least significant
 * first, a high stop bit, and two idle slots between frames. A 1 is a tall
 * block, a 0 a short one; blocks rise out of the via and sink into the lead.
 * Hovering the line slows the stream on a spring so a frame can be read, and
 * the frame under the pointer takes the bright edge; at rest the receive lead
 * has it. The slider is the baud rate, in slots per second.
 *
 * The pattern: dilate time. One spring on the rate, an ambient loop that
 * sleeps offscreen and holds still under reduced motion, and a hit test on the
 * ground plane, read against the stream's position, not against what is drawn.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, unproj, spring, stepS,
  flatDot, mk, place, pointer, put, reducedMotion, register, disposer, solid,
} = HL;

// The line runs along u, from the via (u = 0, nearest the viewer) to the lead (u = L); world y = L - u.
const L = 220, PITCH = 8, BX = 5.6, BY = 9, HI = 8.5, LO = 2.4, TZ = 0.8, SLOW = 0.1, FRAME = 12;
const MSG = [0x53, 0x55, 0x53, 0x48, 0x41, 0x4e, 0x54]; // the line carries a name
const CH = 30, G = L + 10, BZ0 = 1.2, BZ1 = 5.2, LEADS = 5, LP = 11, LW = 4, LL = 10, LZ = 1;

/** Slot g of the stream: 1, 0, or null for an idle gap between frames. */
function bit(g) {
  const f = Math.floor(g / FRAME), k = g - f * FRAME, byte = MSG[((f % MSG.length) + MSG.length) % MSG.length];
  return k === 0 ? 0 : k <= 8 ? (byte >> (k - 1)) & 1 : k === 9 ? 1 : null;
}

/** A footprint on the line, from u0 to u1 along it and v0 to v1 across it. */
const onTrace = (u0, u1, v0, v1, r, b) => rings(v0, L - u1, v1, L - u0, r, b);

/** The leads along one side of the package (axis 0 = x, 1 = y; sign of the outward normal), as [ring, inner]. */
function side(axis, sign) {
  const out = [], y0 = -G - 2 * CH + L, y1 = y0 + 2 * CH;
  for (let k = 0; k < LEADS; k++) {
    const t = (k - (LEADS - 1) / 2) * LP;
    if (axis === 1) {
      const a = sign < 0 ? y0 - 0.4 - LL : y1 + 0.4;
      out.push(rings(t - LW / 2, a, t + LW / 2, a + LL, 0.9, 0.5));
    } else {
      const a = sign < 0 ? -CH - 0.4 - LL : CH + 0.4, c = (y0 + y1) / 2 + t;
      out.push(rings(a, c - LW / 2, a + LL, c + LW / 2, 0.9, 0.5));
    }
  }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let baud = value;
  const C = Cam(45, 0.5, 1.3);
  const yF = -G - 2 * CH + L - LL;
  fit(C, [[-CH - LL, yF, 0], [CH + LL, yF, 0], [CH + LL, -G + L, 0], [-8, L + 8, 0], [8, L + 8, 0], [0, -G + L, HI]], 200, 166);
  const P = proj(C), front = facing(C);
  const at = (u, v, z) => P(v, L - u, z);

  const g = mk("g", {}, svg);
  const [tr, ti] = onTrace(-6, L + 11, -BY / 2 - 2, BY / 2 + 2, 3, 1.2);
  put(solid(g), prism(P, front, tr, ti, 0, TZ));

  // the package, far leads first, then the body and the near leads; the middle near lead is RX
  const lead = (r) => { const el = solid(g); put(el, prism(P, front, r[0], r[1], 0, LZ)); return el; };
  side(1, -1).concat(side(0, -1)).forEach(lead);
  const [br, bi] = rings(-CH, L - G - 2 * CH, CH, L - G, 4, 2);
  put(solid(g), prism(P, front, br, bi, BZ0, BZ1));
  const near = side(1, 1).map(lead);
  side(0, 1).forEach(lead);
  const rx = near[(LEADS - 1) / 2];
  place(flatDot(g, C, 1.6, "dot m"), P(-CH + 7, L - G - 7, BZ1));
  // the via the line comes up through: a plated ring with its drill
  place(flatDot(g, C, 4, "dot off"), at(-1, 0, TZ));
  place(flatDot(g, C, 1.5, "dot m"), at(-1, 0, TZ));

  // The slots, far to near: DOM slot r always sits at the same rank along the line, so the paint order never changes.
  const M = Math.floor(L / PITCH) + 2, slots = [];
  for (let r = 0; r < M; r++) slots.push({ el: solid(g), drawn: "" });

  let pos = 4000 * PITCH, over = null, pick = null;
  const rate = spring(1);

  /** The height a slot's block stands at u along the line: it rises out of the via and sinks into the lead. */
  const height = (b, u) => (b === null ? 0 : (b ? HI : LO) * clamp(Math.min(u / 10, (L - u) / 12), 0, 1));

  function draw() {
    const top = Math.floor(pos / PITCH), frac = pos - top * PITCH;
    slots.forEach((s, r) => {
      const n = M - 1 - r, gi = top - n, u = frac + n * PITCH, h = height(bit(gi), u);
      const key = h < 0.2 ? "" : u.toFixed(2) + "," + h.toFixed(2);
      s.el.sil.classList.toggle("hi", !!key && pick !== null && Math.floor(gi / FRAME) === pick);
      if (key === s.drawn) return;
      s.drawn = key;
      if (!key) { put(s.el, { sil: "", crease: "" }); return; }
      const [ring, inner] = onTrace(u - BX / 2, u + BX / 2, -BY / 2, BY / 2, 1.4, 0.7);
      put(s.el, prism(P, front, ring, inner, TZ, TZ + h));
    });
    rx.sil.classList.toggle("hi", pick === null);
  }

  /** The frame under the pointer, from the stream's position: a gap belongs to the nearer frame. */
  function choose() {
    if (!over) { pick = null; read.textContent = "rest"; return; }
    const gi = Math.round((pos - over[0]) / PITCH), f = Math.floor((gi + 1) / FRAME);
    pick = f;
    const byte = MSG[((f % MSG.length) + MSG.length) % MSG.length];
    read.textContent = "0x" + byte.toString(16).toUpperCase() + " · " + String.fromCharCode(byte);
  }

  const B = register(stage, (dt) => {
    if (reducedMotion()) { choose(); draw(); return false; }
    stepS(rate, dt);
    pos += baud * PITCH * rate.x * dt;
    choose(); draw();
    return true;
  });
  bag.add(B.unregister);

  /** The pointer on the ground, as [u, v] on the line when it falls on the trace, from the via to the lead. */
  const onLine = (p) => {
    const w = unproj(C, p[0], p[1], 0), u = L - w[1];
    return u >= 0 && u <= L && Math.abs(w[0]) <= BY + 4 ? [u, w[0]] : null;
  };
  bag.add(pointer(stage, {
    move: (p) => { over = onLine(p); rate.t = over ? SLOW : 1; choose(); B.wake(); },
    leave: () => { over = null; rate.t = 1; choose(); B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { baud = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "bitstream",
  means: "A UART line into a chip: serial frames ride it without stopping, and hovering slows the stream so a byte can be read.",
  rules: [1, 4, 7, 8],
  range: [3, 7, 14],
  tour: [[106, 212], [170, 180], [226, 153], null],
  mount,
});
