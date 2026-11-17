#!/usr/bin/env python3
"""
Build full Pediatric ColorA–ColorT set at Adult Color finish.

Preserves Adult path topology (in-place numeric rewrite). Applies a
tooth-specific primary warp (not one generic transform). Side-matched Adult
sources keep left/right and upper/lower orientation consistent with Adult.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PED = ROOT / "pediatric"
ADULT = ROOT / "color"
CONTACT = PED / "preview-contact-sheet.html"

OW, OH = 700.0, 1500.0
CW, CH = 780.0, 780.0

# letter -> (kind, adult_stem, description, adult_label, approx_note)
# Adult stems are side-matched Universal permanent teeth used as style donors.
TEETH: dict[str, tuple[str, str, str, str, str]] = {
    # Upper right
    "A": (
        "second_molar",
        "Color03",
        "Upper right 2nd primary molar",
        "Adult Tooth3 (2nd molar)",
        "Primary 2nd-molar crown is wider/shorter than permanent; groove map inherits Adult molar topology.",
    ),
    "B": (
        "first_molar",
        "Color04",
        "Upper right 1st primary molar",
        "Adult Tooth4 (1st premolar donor)",
        "No true Adult primary-1st-molar analogue — premolar donor warped toward primary 1st-molar bulk. Confirm cusp count.",
    ),
    "C": (
        "canine",
        "Color06",
        "Upper right primary canine",
        "Adult Tooth6 (canine)",
        "Primary canine is shorter with broader cervix; cusp sharpness is approximate.",
    ),
    "D": (
        "lateral",
        "Color07",
        "Upper right primary lateral incisor",
        "Adult Tooth7 (lateral)",
        "Primary lateral is narrower than central; mamelon/edge detail inherited from Adult.",
    ),
    "E": (
        "central",
        "Color08",
        "Upper right primary central incisor",
        "Adult Tooth8 (central)",
        "Primary central is more bulbous with a shorter root; optional edge-detail review.",
    ),
    # Upper left
    "F": (
        "central",
        "Color09",
        "Upper left primary central incisor",
        "Adult Tooth9 (central)",
        "Mirror of E lineage; optional edge-detail review.",
    ),
    "G": (
        "lateral",
        "Color10",
        "Upper left primary lateral incisor",
        "Adult Tooth10 (lateral)",
        "Mirror of D lineage; mamelon/edge detail inherited.",
    ),
    "H": (
        "canine",
        "Color11",
        "Upper left primary canine",
        "Adult Tooth11 (canine)",
        "Mirror of C lineage; cusp sharpness approximate.",
    ),
    "I": (
        "first_molar",
        "Color12",
        "Upper left 1st primary molar",
        "Adult Tooth12 (1st premolar donor)",
        "Premolar donor warped to primary 1st-molar bulk. Confirm cusp count vs maxillary primary 1st molar.",
    ),
    "J": (
        "second_molar",
        "Color14",
        "Upper left 2nd primary molar",
        "Adult Tooth14 (1st molar)",
        "Uses Adult 1st-molar donor for left-side 2nd-primary mass; groove topology is permanent-derived.",
    ),
    # Lower left
    "K": (
        "second_molar",
        "Color19",
        "Lower left 2nd primary molar",
        "Adult Tooth19 (2nd molar)",
        "Lower orientation from Adult crop. Primary mandibular 2nd-molar proportions are approximate.",
    ),
    "L": (
        "first_molar",
        "Color20",
        "Lower left 1st primary molar",
        "Adult Tooth20 (1st premolar donor)",
        "Premolar donor → primary 1st molar. Mandibular primary 1st-molar cusp pattern needs review.",
    ),
    "M": (
        "canine",
        "Color22",
        "Lower left primary canine",
        "Adult Tooth22 (canine)",
        "Lower canine; primary cervix/cusp proportions approximate.",
    ),
    "N": (
        "lateral",
        "Color23",
        "Lower left primary lateral incisor",
        "Adult Tooth23 (lateral)",
        "Lower lateral; edge detail inherited from Adult.",
    ),
    "O": (
        "central",
        "Color24",
        "Lower left primary central incisor",
        "Adult Tooth24 (central)",
        "Lower central; bulbous primary proportions approximate.",
    ),
    # Lower right
    "P": (
        "central",
        "Color25",
        "Lower right primary central incisor",
        "Adult Tooth25 (central)",
        "Mirror of O lineage.",
    ),
    "Q": (
        "lateral",
        "Color26",
        "Lower right primary lateral incisor",
        "Adult Tooth26 (lateral)",
        "Mirror of N lineage.",
    ),
    "R": (
        "canine",
        "Color27",
        "Lower right primary canine",
        "Adult Tooth27 (canine)",
        "Mirror of M lineage; cusp sharpness approximate.",
    ),
    "S": (
        "first_molar",
        "Color28",
        "Lower right 1st primary molar",
        "Adult Tooth28 (1st premolar donor)",
        "Premolar donor → primary 1st molar. Confirm mandibular cusp layout.",
    ),
    "T": (
        "second_molar",
        "Color30",
        "Lower right 2nd primary molar",
        "Adult Tooth30 (1st molar)",
        "Adult 1st-molar donor for right-side 2nd-primary mass; groove map permanent-derived.",
    ),
}


def fmt(n: float) -> str:
    r = round(n, 3)
    if abs(r - round(r)) < 1e-6:
        return str(int(round(r)))
    return f"{r:.3f}".rstrip("0").rstrip(".")


def parse_viewbox(svg: str) -> tuple[float, float, float, float]:
    m = re.search(r'viewBox="([^"]+)"', svg)
    if not m:
        raise ValueError("missing viewBox")
    a = [float(x) for x in m.group(1).replace(",", " ").split()]
    return a[0], a[1], a[2], a[3]


def warp_primary(
    x: float,
    y: float,
    kind: str,
    bb: tuple[float, float, float, float],
) -> tuple[float, float]:
    """Tooth-class-specific primary deformation (distinct per kind)."""
    minx, miny, maxx, maxy = bb
    w = max(maxx - minx, 1e-6)
    h = max(maxy - miny, 1e-6)
    cx = 0.5 * (minx + maxx)
    ny = (y - miny) / h  # 0..1 along Adult crop axis

    if kind == "second_molar":
        # Broad bulbous crown, modest root shortening.
        scale_x = 0.94 + 0.24 * max(0.0, (ny - 0.40) / 0.60) ** 0.72
        if ny < 0.42:
            scale_x *= 0.92
        y2 = miny + h * (0.012 + ny * 0.958)
        x2 = cx + (x - cx) * scale_x
    elif kind == "first_molar":
        # Distinct from 2nd: less overall width, stronger mid-crown bulge,
        # more compact occlusal (primary 1st molar character).
        scale_x = 0.90 + 0.28 * max(0.0, (ny - 0.38) / 0.62) ** 0.85
        if ny < 0.40:
            scale_x *= 0.88
        if ny > 0.82:
            scale_x *= 0.97  # slightly tighter occlusal rim
        y2 = miny + h * (0.02 + ny * 0.94)
        x2 = cx + (x - cx) * scale_x
    elif kind == "canine":
        scale_x = 0.96
        if 0.45 < ny < 0.72:
            scale_x = 1.09  # broad primary cervix
        if ny > 0.78:
            scale_x = 0.88 + 0.1 * (1.0 - (ny - 0.78) / 0.22)
        y2 = miny + h * (0.02 + ny * 0.95)
        x2 = cx + (x - cx) * scale_x
    elif kind == "lateral":
        # Narrower than central, mild bulb.
        scale_x = 0.90 if ny < 0.55 else (0.96 + 0.12 * ((ny - 0.55) / 0.45) ** 0.9)
        y2 = miny + h * (0.025 + ny * 0.94)
        if ny > 0.9:
            y2 = miny + h * (0.025 + 0.9 * 0.94 + (ny - 0.9) * 0.5)
        x2 = cx + (x - cx) * scale_x
    else:  # central
        scale_x = 0.95 if ny < 0.55 else (1.0 + 0.18 * ((ny - 0.55) / 0.45) ** 0.85)
        y2 = miny + h * (0.03 + ny * 0.93)
        if ny > 0.9:
            y2 = miny + h * (0.03 + 0.9 * 0.93 + (ny - 0.9) * 0.55)
        x2 = cx + (x - cx) * scale_x
    return x2, y2


def fit_to_canvas(
    pts: list[tuple[float, float]],
    tw: float,
    th: float,
    pad: float,
) -> list[tuple[float, float]]:
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    bw, bh = max(maxx - minx, 1e-6), max(maxy - miny, 1e-6)
    s = min((tw - 2 * pad) / bw, (th - 2 * pad) / bh)
    ox = pad + ((tw - 2 * pad) - bw * s) * 0.5
    oy = pad + ((th - 2 * pad) - bh * s) * 0.5
    return [(ox + (x - minx) * s, oy + (y - miny) * s) for x, y in pts]


def rewrite_svg(
    src_svg: str,
    label: str,
    view: str,
    kind: str,
    tw: float,
    th: float,
    pad: float,
) -> str:
    vx, vy, vw, vh = parse_viewbox(src_svg)
    bb = (vx, vy, vx + vw, vy + vh)

    raw_pairs: list[tuple[float, float]] = []
    for d in re.findall(r'\bd="([^"]+)"', src_svg):
        nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?", d)]
        raw_pairs.extend((nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2))

    warped = [warp_primary(x, y, kind, bb) for x, y in raw_pairs]
    fitted = fit_to_canvas(warped, tw, th, pad)
    it = iter(fitted)

    def repl_d(match: re.Match) -> str:
        d = match.group(1)
        tokens = re.split(r"(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)", d)
        out: list[str] = []
        i = 0
        while i < len(tokens):
            tok = tokens[i]
            if re.fullmatch(r"-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?", tok or ""):
                x, y = next(it)
                out.append(fmt(x))
                i += 1
                while i < len(tokens) and not re.fullmatch(
                    r"-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?", tokens[i] or ""
                ):
                    out.append(tokens[i])
                    i += 1
                if i >= len(tokens):
                    break
                out.append(fmt(y))
                i += 1
                continue
            out.append(tok)
            i += 1
        return f'd="{"".join(out)}"'

    body = re.sub(r'\bd="([^"]+)"', repl_d, src_svg)
    body = re.sub(
        r"<svg\b[^>]*>",
        (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {int(tw)} {int(th)}" '
            f'width="{int(tw)}" height="{int(th)}" data-tooth-view="{view}" '
            f'data-tooth-label="{label}" fill-rule="evenodd" clip-rule="evenodd">'
        ),
        body,
        count=1,
    )
    # Normalize rare Adult fills to the shared palette keys used elsewhere.
    body = body.replace('fill="#040404"', 'fill="#000000"')
    body = body.replace('fill="#ffffff"', 'fill="#fefefe"')
    body = body.replace('fill="#FFFFFF"', 'fill="#fefefe"')
    if not body.lstrip().startswith("<?xml"):
        body = '<?xml version="1.0" encoding="UTF-8"?>\n' + body
    return body


def priority(kind: str) -> str:
    if kind in ("first_molar", "second_molar"):
        return "high"
    if kind == "canine":
        return "medium"
    return "low"


def write_contact_sheet() -> None:
    cards = []
    for letter, (kind, adult, desc, adult_label, note) in TEETH.items():
        edge = "needs-review" if priority(kind) in ("high", "medium") else "optional-review"
        cards.append(
            f"""
            <article class="card {edge}">
              <header>
                <strong>Tooth{letter}</strong>
                <span>{desc}</span>
              </header>
              <div class="pair">
                <div>
                  <div class="col-label">Pediatric</div>
                  <div class="views">
                    <figure><img src="Color{letter}.outer.svg" alt="Tooth{letter} outer" /><figcaption>outer</figcaption></figure>
                    <figure><img src="Color{letter}.occlusal.svg" alt="Tooth{letter} occlusal" /><figcaption>occlusal</figcaption></figure>
                  </div>
                </div>
                <div>
                  <div class="col-label">Adult ref — {adult_label}</div>
                  <div class="views">
                    <figure><img src="../color/{adult}.outer.svg" alt="{adult} outer" /><figcaption>outer</figcaption></figure>
                    <figure><img src="../color/{adult}.occlusal.svg" alt="{adult} occlusal" /><figcaption>occlusal</figcaption></figure>
                  </div>
                </div>
              </div>
              <p class="note"><em>Review ({priority(kind)}):</em> {note}</p>
            </article>
            """
        )

    high = [f"Tooth{L}" for L, (k, *_) in TEETH.items() if priority(k) == "high"]
    med = [f"Tooth{L}" for L, (k, *_) in TEETH.items() if priority(k) == "medium"]
    low = [f"Tooth{L}" for L, (k, *_) in TEETH.items() if priority(k) == "low"]

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Pediatric Color Assets — Full Contact Sheet</title>
  <style>
    :root {{ --bg:#f3efe6; --ink:#2a2824; --line:#d6d0c4; --warn:#8a4b12; --ok:#3d5a3d; }}
    * {{ box-sizing:border-box; }}
    body {{
      margin:0; padding:28px; color:var(--ink);
      font-family:"Segoe UI","Helvetica Neue",sans-serif;
      background:radial-gradient(circle at 10% 0%,#fff8ea,transparent 40%), var(--bg);
    }}
    h1 {{ margin:0 0 8px; font-size:1.5rem; }}
    .lede {{ max-width:78ch; margin:0 0 14px; line-height:1.45; color:#555; }}
    .legend {{ display:flex; gap:12px; flex-wrap:wrap; margin-bottom:18px; font-size:0.9rem; }}
    .pill {{ border:1px solid var(--line); border-radius:999px; padding:4px 12px; background:#fff; }}
    .pill.warn {{ border-color:#d7a36a; color:var(--warn); }}
    .pill.ok {{ border-color:#9cbc9c; color:var(--ok); }}
    .grid {{ display:grid; grid-template-columns:1fr; gap:16px; }}
    .card {{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px; }}
    .card.needs-review {{ box-shadow: inset 3px 0 0 #d0893b; }}
    .card.optional-review {{ box-shadow: inset 3px 0 0 #7aa67a; }}
    header {{ display:flex; flex-direction:column; gap:2px; margin-bottom:10px; }}
    header strong {{ font-size:1.05rem; }}
    header span {{ font-size:0.82rem; color:#666; }}
    .pair {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
    .col-label {{ font-size:0.78rem; color:#666; margin-bottom:6px; }}
    .views {{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }}
    figure {{ margin:0; text-align:center; background:#faf7f1; border-radius:8px; padding:8px; border:1px solid #eee8dc; }}
    img {{ width:100%; height:170px; object-fit:contain; display:block; }}
    figcaption {{ margin-top:4px; font-size:0.7rem; letter-spacing:0.05em; text-transform:uppercase; color:#777; }}
    .note {{ margin:10px 0 0; font-size:0.78rem; line-height:1.35; color:#555; }}
    .summary {{ margin-top:24px; padding:16px; background:#fff; border:1px solid var(--line); border-radius:12px; max-width:960px; }}
    .summary h2 {{ margin:0 0 8px; font-size:1.1rem; }}
    .summary ul {{ margin:0; padding-left:18px; }}
    .summary li {{ margin:4px 0; }}
    code {{ background:#f0ebe2; padding:1px 5px; border-radius:4px; }}
    @media (max-width:900px) {{ .pair {{ grid-template-columns:1fr; }} }}
  </style>
</head>
<body>
  <h1>Pediatric Color Assets — Full Contact Sheet</h1>
  <p class="lede">
    All 20 primary teeth (<code>ToothA</code>–<code>ToothT</code>) at Adult Color finish:
    same outline/enamel/dentin treatment, with tooth-class-specific primary warps and
    side-matched Adult donors. Pediatric and Adult shown at the same display size.
  </p>
  <div class="legend">
    <span class="pill warn">Amber — anatomical review recommended</span>
    <span class="pill ok">Green — optional / low-risk review</span>
  </div>
  <div class="grid">
    {''.join(cards)}
  </div>
  <section class="summary">
    <h2>Remaining anatomical approximations</h2>
    <ul>
      <li><strong>High:</strong> {', '.join(high)} —
        molar donors are permanent molars/premolars; primary cusp counts and groove maps are approximate.
        First-molar assets (B, I, L, S) especially need clinician review because Adult premolars were used as donors.</li>
      <li><strong>Medium:</strong> {', '.join(med)} —
        primary canine cervix/cusp proportions are warped from permanent canines.</li>
      <li><strong>Low / optional:</strong> {', '.join(low)} —
        primary incisor bulb/short-root warps; edge detail still follows Adult path topology.</li>
    </ul>
  </section>
</body>
</html>
"""
    CONTACT.write_text(html, encoding="utf-8")
    print("wrote", CONTACT)


def main() -> None:
    PED.mkdir(parents=True, exist_ok=True)
    for letter, (kind, adult, *_rest) in TEETH.items():
        outer_src = (ADULT / f"{adult}.outer.svg").read_text(encoding="utf-8")
        occl_src = (ADULT / f"{adult}.occlusal.svg").read_text(encoding="utf-8")
        outer = rewrite_svg(outer_src, f"Tooth{letter}", "outer", kind, OW, OH, pad=12)
        occl = rewrite_svg(occl_src, f"Tooth{letter}", "occlusal", kind, CW, CH, pad=18)
        (PED / f"Color{letter}.outer.svg").write_text(outer, encoding="utf-8")
        (PED / f"Color{letter}.occlusal.svg").write_text(occl, encoding="utf-8")
        print(f"Tooth{letter} <- {adult} ({kind})")
    write_contact_sheet()
    # Remove older sample-only preview if present (superseded by full sheet).
    old = PED / "preview-sample-vs-adult.html"
    if old.exists():
        old.unlink()
        print("removed", old.name)


if __name__ == "__main__":
    main()
