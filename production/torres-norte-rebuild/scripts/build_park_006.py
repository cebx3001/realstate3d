import bpy,math,pathlib,random
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];random.seed(73)
bpy.ops.wm.open_mainfile(filepath=str(P/'versions/tdn_rebuild_005_architecture.blend'))
source=(P/'scripts/build_architecture.py').read_text();exec(source[source.index('def mat('):source.index('# Relative dimensions')])
c=bpy.data.collections['ENVIRONMENT']
grass=mat('Park grass soil',(.065,.105,.025),.95);pathmat=mat('Warm aggregate paths',(.34,.28,.19),.85);water=mat('Lake water',(.19,.31,.28),.12,0,.92)
box('Park extension',(0,-180,-.5),(900,280,.4),grass,c)
# Defined pedestrian network: loop around lake, connected to both street crossings.
def ribbon(name,pts,width,material,z=.02):
 v=[]
 for i,p in enumerate(pts):
  tangent=Vector(pts[min(i+1,len(pts)-1)])-Vector(pts[max(0,i-1)]);tangent.normalize();n=Vector((-tangent.y,tangent.x))*width/2
  v.extend([(p[0]+n.x,p[1]+n.y,z),(p[0]-n.x,p[1]-n.y,z)])
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(pts)-1)]);ob=bpy.data.objects.new(name,me);c.objects.link(ob);me.materials.append(material)
pts=[(-30+46*math.cos(t*math.tau/120),-128+26*math.sin(t*math.tau/120)) for t in range(121)];ribbon('Lake promenade',pts,4,pathmat)
for x in [-65,65]:ribbon('Crossing-to-park connection',[(x,-62),(x,-86),(x*.7,-110),(x*.6,-154),(x,-210)],4,pathmat)
# Lake basin and rim are actual geometry, in the park rather than projected into the image.
verts=[(-30,-128,-.08)]+[(-30+35*math.cos(t*math.tau/120),-128+16*math.sin(t*math.tau/120),-.08) for t in range(120)];me=bpy.data.meshes.new('Lake surface');me.from_pydata(verts,[],[(0,i+1,(i+1)%120+1) for i in range(120)]);o=bpy.data.objects.new('Park lake',me);c.objects.link(o);me.materials.append(water)
for x in [-65,65]:
 box('Connected cross street',(x,60,-.24),(16,220,.25),bpy.data.materials['Dry weathered asphalt'],c)
 for j in range(10):box('Pedestrian crossing',(x-6+j*1.3,-49,-.1),(.7,20,.03),slab,c)
for x in [-75,-55,55,75]:box('Sidewalk',(x,40,-.05),(3,240,.2),pathmat,c)
# Professional CC0 tree meshes, shared across instances; no synthetic tree proxies.
for asset,objname,amount in [('jacaranda_tree','jacaranda_tree_LOD1',35),('tree_small_02','tree_small_02_LOD1',55),('island_tree_02','island_tree_02_LOD1',30)]:
 with bpy.data.libraries.load(str(P/'assets'/asset/(asset+'.blend')),link=False) as (src,dst):dst.objects=[objname]
 base=dst.objects[0];c.objects.link(base);bpy.context.view_layer.update();height=max(base.dimensions.z,.1);print('TREE',asset,height,len(base.data.vertices),flush=True)
 for i in range(amount):
  o=base if i==0 else base.copy()
  if i:o.data=base.data;c.objects.link(o)
  x=random.uniform(-220,220);y=random.uniform(-230,-68)
  if ((x+30)/53)**2+((y+128)/33)**2<1:y-=75
  if abs(abs(x)-65)<7:x+=15
  o.location=(x,y,-.22);scale=random.uniform(9,18)/height;o.scale=(scale,scale,scale);o.rotation_euler.z=random.random()*math.tau
# Fix texture paths from original supplier directories.
for im in bpy.data.images:
 if im.source=='FILE' and im.filepath and not im.packed_file:
  pp=pathlib.Path(bpy.path.abspath(im.filepath))
  if not pp.exists():
   hits=list((P/'assets').rglob(pp.name))
   if hits:im.filepath=str(hits[0]);im.reload()
# Physically aligned sun and sky. Fixed golden-hour study.
s=bpy.context.scene;s.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.45
sun=bpy.data.objects['Golden hour sun'];sun.rotation_euler=(math.radians(76),0,math.radians(-65));sun.data.energy=3.2;sun.data.color=(1,.76,.48)
s.camera.location=(145,-310,132);s.camera.rotation_euler=(Vector((0,-10,60))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.lens=40;s.render.resolution_x=1400;s.render.resolution_y=900;s.cycles.samples=64;s.render.filepath=str(P/'renders/park_006_study.png');s['production_status']='Park integration study, city and landscape still incomplete';bpy.ops.file.make_paths_relative();bpy.ops.wm.save_as_mainfile(filepath=str(P/'versions/tdn_rebuild_006_park.blend'),compress=True);bpy.ops.render.render(write_still=True)
