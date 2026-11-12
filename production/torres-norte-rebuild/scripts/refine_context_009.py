import bpy,pathlib,random,math
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];random.seed(91);bpy.ops.wm.open_mainfile(filepath=str(P/'versions/tdn_rebuild_008_context.blend'))
c=bpy.data.collections['ENVIRONMENT'];city=[]
for o in list(c.objects):
 if any(o.name.startswith(k) for k in ['Neighbour','Roof equipment','wall_window_','window_centered_']):
  o.location.x*=.7;o.location.y*=.75;city.append(o)
 if o.name.startswith('Mountain layer'):
  o.location.y+=800;o.scale.z=.5
  sub=o.modifiers.new('Smooth distant terrain','SUBSURF');sub.levels=1;sub.render_levels=1
# Existing detailed city cluster repeated only in distant background, with varied orientation and height.
citycol=bpy.data.collections.new('DETAILED_CITY_CLUSTER')
for o in city:citycol.objects.link(o)
for k,(x,y,ang) in enumerate([(-360,120,.1),(360,120,-.1),(-180,440,.2),(180,440,-.2),(0,850,.07),(-500,650,.2),(500,650,-.1)]):
 ob=bpy.data.objects.new('Distant city cluster',None);ob.instance_type='COLLECTION';ob.instance_collection=citycol;c.objects.link(ob);ob.location=(x,y,0);ob.rotation_euler.z=ang;ob.scale=(1,1,random.uniform(.7,1.4))
# Material tint varies by building-scale position, retaining supplier texture detail.
for ma in list(bpy.data.materials):
 if not ma.use_nodes:continue
 for bs in [n for n in ma.node_tree.nodes if n.type=='BSDF_PRINCIPLED']:
  if any('brick' in n.name.lower() or 'wall' in n.name.lower() for n in ma.node_tree.nodes) or 'wall' in ma.name.lower():
   bs.inputs['Roughness'].default_value=.72
# Dense park canopy, grouped outside paths and the lake.
trees=[o for o in c.objects if o.type=='MESH' and any(o.name.startswith(k) for k in ['jacaranda_tree_LOD1','tree_small_02_LOD1','island_tree_02_LOD1'])]
for i in range(180):
 src=random.choice(trees);o=src.copy();o.data=src.data;c.objects.link(o);x=random.uniform(-180,180);y=random.uniform(-215,-70)
 if ((x+30)/54)**2+((y+128)/34)**2<1:y-=80
 if abs(abs(x)-65)<8:x+=18
 o.location=(x,y,-.2);o.rotation_euler.z=random.random()*math.tau
# Physical aerial perspective in a bounded volume.
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,500,200));v=bpy.context.object;v.name='Aerial haze';v.scale=(5000,5000,1200);m=bpy.data.materials.new('Subtle atmospheric scattering');m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');sc=n.new('ShaderNodeVolumeScatter');sc.inputs['Density'].default_value=.00028;sc.inputs['Anisotropy'].default_value=.2;m.node_tree.links.new(sc.outputs[0],out.inputs['Volume']);v.data.materials.append(m)
s=bpy.context.scene;s.cycles.volume_bounces=1;s.cycles.samples=48;s.render.filepath=str(P/'renders/context_009_study.png');s['production_status']='Context iteration 009: density, aerial perspective and landscape adjustment; not final';bpy.ops.wm.save_as_mainfile(filepath=str(P/'versions/tdn_rebuild_009_context.blend'),compress=True);bpy.ops.render.render(write_still=True)
