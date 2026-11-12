import bpy,pathlib,math
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];bpy.ops.wm.open_mainfile(filepath=str(P/'versions/tdn_rebuild_007_context.blend'))
# Keep shared raw facade geometry for distant modules; copied modifiers were allocating per instance.
for o in bpy.data.collections['ENVIRONMENT'].objects:
 if any(o.name.startswith(x) for x in ['wall_window_','window_centered_']):
  for m in list(o.modifiers):o.modifiers.remove(m)
bpy.ops.import_scene.gltf(filepath=str(P/'assets/playground/playground.glb'))
objs=list(bpy.context.selected_objects);roots=[o for o in objs if o.parent not in objs]
for o in roots:o.location+=Vector((-28,-14,12.72))
for o in objs:
 for c in list(o.users_collection):c.objects.unlink(o)
 bpy.data.collections['PODIUM_AMENITIES_PROVISIONAL'].objects.link(o)
 if o.type=='MESH':
  mod=o.modifiers.new('Small rounded equipment edges','BEVEL');mod.width=.015;mod.segments=3
s=bpy.context.scene;s.render.use_simplify=True;s.cycles.texture_limit='1024';s.cycles.samples=48;s.render.resolution_percentage=75;s.render.filepath=str(P/'renders/context_008_study.png');s['production_status']='Context/amenities study 008; not final premium validation';bpy.ops.wm.save_as_mainfile(filepath=str(P/'versions/tdn_rebuild_008_context.blend'),compress=True);bpy.ops.render.render(write_still=True)
