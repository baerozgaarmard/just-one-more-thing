"""Blender product-shot scene for Just One More Thing.

Run from the repository root:

    blender --background --python blender/render_product_shots.py

Outputs:
    public/images/ledger-3d-hero.png  (1600 x 1200)
    docs/social-preview-raw.png       (1200 x 630, before text overlay)

Design intent: a physical paper ledger brought to life — a bound scope
document, floating change-request cards, an ember creep-meter bar and the
product's asterisk badge. Palette and materials match DESIGN.md exactly:
paper, ink, one ember accent, with the muted bucket colours used sparingly.
No gradients in the UI sense, no neon, no generic "AI 3D" glossiness:
matte paper, soft studio light, honest shadows.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERO_OUT = os.path.join(ROOT, "public", "images", "ledger-3d-hero.png")
SOCIAL_OUT = os.path.join(ROOT, "docs", "social-preview-raw.png")
BLEND_OUT = os.path.join(ROOT, "blender", "ledger-product-shot.blend")

# ---------------------------------------------------------------- palette
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def rgba(hex_str, alpha=1.0):
    h = hex_str.lstrip("#")
    vals = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    return tuple(srgb_to_linear(v) for v in vals) + (alpha,)

PAPER = "#FAF7F1"
SURFACE = "#FFFFFF"
INK = "#1C1917"
INK_2 = "#57534E"
LINE = "#D6CDB8"
EMBER = "#BC3F12"
EMBER_SOFT = "#F6CDBB"
GREEN = "#2F6B3A"
AMBER = "#C98A1B"
BLUE = "#2C4A7C"
GREY = "#E9E2D2"

# ---------------------------------------------------------------- helpers
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.cameras, bpy.data.lights):
        pass  # orphan purge below handles the rest
    bpy.ops.outliner.orphans_purge(do_recursive=True)

def material(name, hex_color, roughness=0.7, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba(hex_color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat

MAT = {}

def rounded_box(name, loc, dims, mat, bevel=0.04, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = obj.modifiers.new("soft edges", "BEVEL")
    mod.width = min(bevel, min(dims) * 0.45)
    mod.segments = 4
    if mat:
        obj.data.materials.append(mat)
    return obj

def bar(name, loc, length, mat, angle_deg, width=0.16, height=0.05):
    """A thin UI 'text line' bar lying flat, rotated in plan view."""
    return rounded_box(
        name, loc, (length, width, height), mat, bevel=height * 0.45,
        rot=(0, 0, math.radians(angle_deg)),
    )

def pill(name, loc, length, mat):
    return rounded_box(name, loc, (length, 0.24, 0.055), mat, bevel=0.027)

def asterisk_badge(cx, cy, z, size=1.05):
    """Ink rounded square with a raised white asterisk made of three bars."""
    rounded_box("badge", (cx, cy, z), (size, size, 0.12), MAT["ink"], bevel=0.14)
    bar_len = size * 0.62
    for i, ang in enumerate((90, 30, 150)):
        b = rounded_box(
            f"badge-bar-{i}", (cx, cy, z + 0.085),
            (bar_len, size * 0.13, 0.07), MAT["white"], bevel=0.035,
            rot=(0, 0, math.radians(ang)),
        )
        b.rotation_euler = (0, 0, math.radians(ang))

def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

# ---------------------------------------------------------------- scene
def build_scene():
    clear_scene()
    MAT.update({
        "paper": material("Paper", PAPER, roughness=0.95),
        "white": material("Surface white", SURFACE, roughness=0.5),
        "page": material("Page", "#FFFDF8", roughness=0.85),
        "ink": material("Ink", INK, roughness=0.45),
        "ink2": material("Ink 2", INK_2, roughness=0.6),
        "line": material("Line", LINE, roughness=0.8),
        "ember": material("Ember", EMBER, roughness=0.38),
        "ember_soft": material("Ember soft", EMBER_SOFT, roughness=0.7),
        "green": material("Green", GREEN, roughness=0.5),
        "amber": material("Amber", AMBER, roughness=0.5),
        "blue": material("Blue", BLUE, roughness=0.5),
        "grey": material("Grey", GREY, roughness=0.85),
    })

    scene = bpy.context.scene

    # Ground — a sheet of paper the size of the world.
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "paper ground"
    ground.data.materials.append(MAT["paper"])

    # ---- The ledger: a bound scope document, slightly turned -------------
    ledger = rounded_box("ledger cover", (0, 0.1, 0.16), (6.6, 4.6, 0.3), MAT["ink"], bevel=0.09, rot=(0, 0, math.radians(-4)))
    # page block peeking out on two sides
    rounded_box("page block", (0.09, 0.02, 0.36), (6.35, 4.35, 0.16), MAT["page"], bevel=0.05, rot=(0, 0, math.radians(-4)))
    # top sheet (the working page)
    top_z = 0.47
    rounded_box("top sheet", (0.02, 0.05, top_z), (6.2, 4.2, 0.05), MAT["white"], bevel=0.03, rot=(0, 0, math.radians(-4)))

    # All top-sheet details are placed in the sheet's rotated frame by hand:
    # a -4 degree rotation about the centre; small offsets keep it believable.
    # Header row on the sheet
    asterisk_badge(-2.25, 1.55, top_z + 0.05, size=0.92)
    bar("title bar 1", (-0.95, 1.72, top_z + 0.045), 2.5, MAT["ink"], -4, width=0.24, height=0.055)
    bar("title bar 2", (-1.15, 1.38, top_z + 0.045), 1.7, MAT["line"], -4, width=0.15, height=0.05)

    # Ledger rows: three ruled lines with a pill and an amount bar each
    row_specs = [
        (0.72, MAT["ember"], MAT["ember"], 1.05),
        (0.02, MAT["green"], MAT["green"], 0.72),
        (-0.68, MAT["blue"], MAT["blue"], 0.88),
    ]
    for i, (y, accent, pill_mat, amt_len) in enumerate(row_specs):
        bar(f"row {i} rule", (0, y + 0.33, top_z + 0.032), 5.7, MAT["line"], -4, width=0.025, height=0.03)
        bar(f"row {i} text", (-1.55, y, top_z + 0.045), 2.6, MAT["ink2"], -4, width=0.15, height=0.05)
        pill(f"row {i} pill", (1.05, y, top_z + 0.05), 0.72, pill_mat)
        bar(f"row {i} amount", (2.15, y, top_z + 0.045), amt_len, MAT["ink"], -4, width=0.16, height=0.05)

    # Creep meter along the bottom of the sheet: grey track, ember fill, knob
    bar("meter track", (0, -1.42, top_z + 0.04), 5.3, MAT["grey"], -4, width=0.17, height=0.05)
    bar("meter fill", (-1.05, -1.42, top_z + 0.055), 3.2, MAT["ember"], -4, width=0.17, height=0.055)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(0.58, -1.47, top_z + 0.1))
    knob = bpy.context.active_object
    knob.name = "meter knob"
    knob.data.materials.append(MAT["ink"])

    # ---- Floating change-request cards ----------------------------------
    def request_card(name, loc, rot, accent, pill_mat):
        card = rounded_box(name, loc, (2.5, 1.55, 0.09), MAT["white"], bevel=0.06, rot=rot)
        cx, cy, cz = loc
        th = rot[2]
        def place(dx, dy):
            return (cx + dx * math.cos(th) - dy * math.sin(th),
                    cy + dx * math.sin(th) + dy * math.cos(th))
        px, py = place(-0.72, 0.42)
        pill(name + " pill", (px, py, cz + 0.075), 0.85, pill_mat)
        lx, ly = place(-0.05, -0.02)
        bar(name + " line 1", (lx, ly, cz + 0.07), 2.0, MAT["ink2"], math.degrees(th), width=0.13, height=0.045)
        lx, ly = place(-0.35, -0.38)
        bar(name + " line 2", (lx, ly, cz + 0.07), 1.4, MAT["line"], math.degrees(th), width=0.13, height=0.045)
        dx, dy = place(0.98, 0.42)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.085, location=(dx, dy, cz + 0.08))
        dot = bpy.context.active_object
        dot.name = name + " dot"
        dot.data.materials.append(accent)
        return card

    request_card("card extra", (3.15, 1.2, 1.05), (math.radians(-5), math.radians(4), math.radians(-12)), MAT["ember"], MAT["ember"])
    request_card("card approved", (-3.25, -0.95, 0.85), (math.radians(5), math.radians(-3), math.radians(10)), MAT["green"], MAT["green"])
    request_card("card clarify", (2.8, -1.75, 0.45), (math.radians(-3), math.radians(5), math.radians(6)), MAT["amber"], MAT["amber"])

    # ---- Lighting: one big soft key, a cool fill, a warm rim -------------
    bpy.ops.object.light_add(type="AREA", location=(-5, -3, 9))
    key = bpy.context.active_object
    key.name = "key light"
    key.data.energy = 1350
    key.data.use_contact_shadow = True
    key.data.contact_shadow_distance = 0.5
    key.data.shape = "DISK"
    key.data.size = 7
    look_at(key, (0, 0, 0))

    bpy.ops.object.light_add(type="AREA", location=(7, 2, 4.5))
    fill = bpy.context.active_object
    fill.name = "fill light"
    fill.data.energy = 110
    fill.data.shape = "DISK"
    fill.data.size = 6
    look_at(fill, (0, 0, 0.3))

    bpy.ops.object.light_add(type="AREA", location=(1.5, 6.5, 5.5))
    rim = bpy.context.active_object
    rim.name = "rim light"
    rim.data.energy = 300
    rim.data.shape = "DISK"
    rim.data.size = 5
    look_at(rim, (0, 0, 0.2))

    world = bpy.data.worlds["World"]
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = rgba(PAPER)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.22

    # ---- Camera ----------------------------------------------------------
    bpy.ops.object.camera_add(location=(6.1, -7.1, 5.1))
    cam = bpy.context.active_object
    cam.name = "product camera"
    cam.data.lens = 50
    look_at(cam, (0.1, 0.1, 0.25))
    scene.camera = cam

    # ---- Render settings -------------------------------------------------
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 64
    scene.eevee.use_soft_shadows = True
    scene.eevee.shadow_cube_size = "2048"
    scene.eevee.shadow_cascade_size = "2048"
    scene.eevee.use_gtao = True
    scene.eevee.gtao_factor = 1.0
    scene.eevee.use_bloom = False
    scene.render.film_transparent = False
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "Medium High Contrast"
    except Exception:
        pass
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.resolution_percentage = 100

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
    return scene, cam

def render_to(scene, path, w, h):
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED {path} ({w}x{h})")

def main():
    scene, _cam = build_scene()
    if os.environ.get("JOMT_TEST"):
        render_to(scene, "/tmp/jomt-test.png", 480, 360)
        return
    os.makedirs(os.path.dirname(HERO_OUT), exist_ok=True)
    os.makedirs(os.path.dirname(SOCIAL_OUT), exist_ok=True)
    render_to(scene, HERO_OUT, 1600, 1200)
    render_to(scene, SOCIAL_OUT, 1200, 630)

if __name__ == "__main__":
    main()
