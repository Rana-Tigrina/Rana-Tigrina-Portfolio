"""Tigrina, the bullfrog.   python tools/blender.py tools/models/frog.py

Builds the frog from metaballs (soft, organic), paints it with vertex colours
(olive back, pale belly, dark blotches), adds glowing eyes, then writes
public/models/frog.glb and a preview render next to this file.
"""
import os

import bmesh
import bpy
from mathutils import Vector, noise

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "public", "models", "frog.glb")

scene = bpy.context.scene
for o in list(scene.objects):  # factory startup: the default cube, light and camera
    bpy.data.objects.remove(o, do_unlink=True)

# --- the body, as blobs that melt into each other. (x is left/right, -y is forward, z is up)
BLOBS = [
    # centre                radius  stretch (x, y, z)
    ((0.00, 0.20, 0.50), 1.00, (0.80, 1.00, 0.55)),  # body
    ((0.00, 0.75, 0.42), 0.90, (0.70, 0.70, 0.50)),  # rump
    ((0.00, -0.62, 0.55), 0.90, (0.72, 0.66, 0.44)),  # head
    ((0.00, -1.05, 0.44), 0.70, (0.62, 0.50, 0.32)),  # snout
    ((0.00, -0.62, 0.26), 0.75, (0.62, 0.55, 0.36)),  # throat sac
]
for side in (-1, 1):
    BLOBS += [
        ((side * 0.36, -0.70, 0.80), 0.34, (1.0, 1.0, 1.0)),  # eye bump
        ((side * 0.78, 0.55, 0.32), 0.80, (0.50, 0.85, 0.42)),  # thigh
        ((side * 1.02, 0.10, 0.18), 0.60, (0.36, 0.95, 0.30)),  # shin
        ((side * 1.05, -0.42, 0.08), 0.55, (0.55, 0.75, 0.16)),  # hind foot
        ((side * 0.66, -0.62, 0.24), 0.50, (0.40, 0.42, 0.62)),  # arm
        ((side * 0.78, -0.92, 0.07), 0.48, (0.52, 0.52, 0.16)),  # hand
    ]

FAT = 1.55  # a metaball's surface sits at about half its radius, so the blobs are given extra to fuse
meta = bpy.data.metaballs.new("FrogMeta")
meta.resolution = meta.render_resolution = 0.05
meta.threshold = 0.6
for centre, radius, stretch in BLOBS:
    el = meta.elements.new(type="ELLIPSOID")
    el.co = centre
    el.radius = radius * FAT
    el.size_x, el.size_y, el.size_z = stretch
meta_obj = bpy.data.objects.new("FrogMeta", meta)
scene.collection.objects.link(meta_obj)
bpy.context.view_layer.update()

# --- turn the blobs into a real mesh
mesh = bpy.data.meshes.new_from_object(meta_obj.evaluated_get(bpy.context.evaluated_depsgraph_get()))
bpy.data.objects.remove(meta_obj, do_unlink=True)
frog = bpy.data.objects.new("Frog", mesh)
scene.collection.objects.link(frog)
for poly in mesh.polygons:
    poly.use_smooth = True

# --- paint: olive back, pale belly, dark blotches like a real Indian bullfrog
colours = mesh.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
back, belly, blotch = Vector((0.20, 0.27, 0.07)), Vector((0.62, 0.58, 0.33)), Vector((0.04, 0.06, 0.02))
for v in mesh.vertices:
    up = (v.normal.z + 1) / 2  # 0 facing down, 1 facing up
    c = belly.lerp(back, min(1, max(0, (up - 0.25) * 2.2)))
    spots = noise.noise(v.co * 3.2) * 0.5 + 0.5
    if spots > 0.58 and up > 0.5:
        c = c.lerp(blotch, min(1, (spots - 0.58) * 6))
    colours.data[v.index].color = (c.x, c.y, c.z, 1)

skin = bpy.data.materials.new("FrogSkin")
skin.use_nodes = True
bsdf = skin.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.35  # wet
attr = skin.node_tree.nodes.new("ShaderNodeVertexColor")
attr.layer_name = "Col"
skin.node_tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
mesh.materials.append(skin)


def material(name, colour, glow=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*colour, 1)
    b.inputs["Roughness"].default_value = 0.15
    if glow:
        b.inputs["Emission Color"].default_value = (*colour, 1)
        b.inputs["Emission Strength"].default_value = glow
    return m


def ball(name, at, size, mat):
    m = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1)
    bm.to_mesh(m)
    bm.free()
    for p in m.polygons:
        p.use_smooth = True
    m.materials.append(mat)
    o = bpy.data.objects.new(name, m)
    o.location, o.scale, o.parent = at, size, frog
    scene.collection.objects.link(o)


iris, pupil = material("FrogIris", (0.95, 0.55, 0.10), glow=2.5), material("FrogPupil", (0, 0, 0))
for side in (-1, 1):
    ball(f"Eye{side}", (side * 0.44, -0.74, 1.02), (0.2, 0.2, 0.2), iris)
    # a bullfrog's pupil is a horizontal slit
    ball(f"Pupil{side}", (side * 0.56, -0.84, 1.05), (0.09, 0.12, 0.04), pupil)

# --- export (glTF wants +Y up; the exporter converts)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True)

# --- a preview render, so the shape can be checked without opening Blender
cam = bpy.data.objects.new("PreviewCam", bpy.data.cameras.new("PreviewCam"))
cam.location = (3.4, -3.8, 2.4)
cam.rotation_euler = (Vector((0, -0.1, 0.45)) - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
sun = bpy.data.objects.new("PreviewSun", bpy.data.lights.new("PreviewSun", "SUN"))
sun.data.energy = 4
sun.rotation_euler = (0.7, 0.2, 0.6)
for o in (cam, sun):
    scene.collection.objects.link(o)
scene.camera = cam
scene.render.engine = "CYCLES"  # the one engine that always works without a window
scene.cycles.samples = 24
scene.render.resolution_x, scene.render.resolution_y = 720, 540
scene.render.filepath = os.path.join(HERE, "frog-preview.png")
bpy.ops.render.render(write_still=True)
print(f"frog: {len(mesh.vertices)} vertices")
