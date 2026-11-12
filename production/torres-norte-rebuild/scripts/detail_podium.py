import bpy,math,pathlib,random
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];random.seed(45)
bpy.ops.wm.open_mainfile(filepath=str(P/'versions/tdn_rebuild_003_architecture.blend'))
source=(P/'scripts/build_architecture.py').read_text();exec(source[source.index('def mat('):source.index('# Relative dimensions')])
c=bpy.data.collections['PODIUM']
for j in range(26):
 x=-37+j*2.9
 box('Upper retail glazing',(x,-17.5,8.05),(2.8,.03,4.4),glass,c)
 box('Upper retail mullion',(x-1.43,-17.5,8.05),(.07,.13,4.5),metal,c)
 box('Terrace glass guard',(x,-18.2,11.45),(2.8,.03,1.05),glass,c)
 box('Terrace cap rail',(x,-18.2,12.0),(2.8,.05,.045),metal,c)
 box('Recessed upper interior',(x,0,8.05),(2.8,.16,4.5),stone,c)
 if j%3==0:box('Podium support column',(x,-16,8.05),(.32,.45,4.7),stone,c,bevel=.035)
for y in [-14,-7,0,7,14]:
 for x in [-38,36]:box('Podium side support',(x,y,6.1),(.5,.5,12),stone,c,bevel=.03)
# Append complete reusable furniture assets, preserve original materials and photographic maps.
def asset(name):
 path=P/'assets'/name/(name+'.blend')
 with bpy.data.libraries.load(str(path),link=False) as (src,dst):dst.objects=src.objects
 objs=[o for o in dst.objects if o and o.type=='MESH' and 'LOD' not in o.name and 'geo' not in o.name.lower()]
 if not objs:objs=[o for o in dst.objects if o and o.type=='MESH' and 'LOD0' in o.name]
 coll=bpy.data.collections.new('ASSET_'+name)
 for o in objs:coll.objects.link(o)
 return coll,objs
for name,locations in [('outdoor_table_chair_set_01',[(-31,-12,.8),(-27,-7,.8),(-33,-25,.15)]),('modern_arm_chair_01',[(13,-10,.8),(17,-10,.8),(29,-10,.8)]),('modern_coffee_table_01',[(15,-12,.8),(28,-12,.8)])]:
 coll,objs=asset(name)
 for loc in locations:
  o=bpy.data.objects.new(name+'_instance',None);o.instance_type='COLLECTION';o.instance_collection=coll;c.objects.link(o);o.location=loc
# Native photogrammetric plants: each one grounded on terrace, no handmade shrub proxies.
with bpy.data.libraries.load(str(P/'assets/fern_02/fern_02.blend'),link=False) as (src,dst):dst.objects=['fern_02_a']
plant=dst.objects[0]
for i in range(46):
 x=-35+i*1.55;box('Raised planting bed',(x,-16.4,11.1),(1.5,1.6,.5),stone,c,bevel=.04)
 o=plant.copy();o.data=plant.data;c.objects.link(o);o.location=(x,-16.4,11.35);o.scale=(.65,.65,.65);o.rotation_euler.z=random.random()*6.28
for im in bpy.data.images:
 if im.source=='FILE' and im.filepath:
  path=pathlib.Path(bpy.path.abspath(im.filepath))
  if not path.exists():
   hits=list((P/'assets').rglob(path.name))
   if hits:im.filepath=str(hits[0]);im.reload()
s=bpy.context.scene;s['production_status']='Architecture 004 with upper commercial enclosure, structural supports, reusable furniture and terrace planting; city pending'
s.cycles.samples=96;s.render.filepath=str(P/'renders/architecture_004_study.png');bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(P/'versions/tdn_rebuild_004_architecture.blend'),compress=True)
bpy.ops.render.render(write_still=True)
