import bpy,math,pathlib
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(P/'versions/tdn_rebuild_002_architecture.blend'))
# Remove study walls which concealed the lateral facade; replace with narrower structural fins.
for o in list(bpy.data.objects):
 if o.name.startswith('Structural fin'):o.dimensions.y=1.2
# Rounded slab outline, independent of slab thickness (a standard bevel cannot create this).
def rounded(w,d,h,r):
 pts=[]
 for cx,cy,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
  for i in range(9):
   a=math.radians(start+i*90/8);pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
 n=len(pts);v=[(x,y,z) for z in [-h/2,h/2] for x,y in pts];f=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 me=bpy.data.meshes.new('Rounded balcony concrete');me.from_pydata(v,[],f);me.update();return me
for o in list(bpy.data.objects):
 if '_floor_' in o.name and '_interior_' not in o.name and o.type=='MESH':
  w,d,h=o.dimensions;ma=o.data.materials[0];o.data=rounded(w+.8,d+.8,h,1.4);o.data.materials.append(ma)
  for m in list(o.modifiers):o.modifiers.remove(m)
# Stronger ground contact and less texture noise at architectural scale.
for m in bpy.data.materials:
 if m.use_nodes:
  for n in m.node_tree.nodes:
   if n.type=='BUMP':n.inputs['Strength'].default_value=.07;n.inputs['Distance'].default_value=.008
s=bpy.context.scene;s.cycles.use_denoising=False;s.cycles.samples=128;s.cycles.max_bounces=8;s.cycles.transmission_bounces=8;s.render.resolution_percentage=100
s.camera.location=(110,-260,96);s.camera.rotation_euler=(Vector((-1,0,73))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.lens=45
s.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.6
s.render.filepath=str(P/'renders/architecture_003_study.png')
s['production_status']='Architectural study 003, facade visibility and rounded slabs corrected. Environment pending.'
bpy.ops.wm.save_as_mainfile(filepath=str(P/'versions/tdn_rebuild_003_architecture.blend'),compress=True)
bpy.ops.render.render(write_still=True)
