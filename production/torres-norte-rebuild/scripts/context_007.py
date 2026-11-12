import bpy,math,pathlib,random
from mathutils import Vector,noise
P=pathlib.Path(__file__).resolve().parents[1];random.seed(106)
bpy.ops.wm.open_mainfile(filepath=str(P/'versions/tdn_rebuild_006_park.blend'))
src=(P/'scripts/build_architecture.py').read_text();exec(src[src.index('def mat('):src.index('# Relative dimensions')]);c=bpy.data.collections['ENVIRONMENT'];pod=bpy.data.collections['PODIUM']
soil=mat('Urban ground',(.14,.16,.11),.95);box('Continuous urban terrain',(0,400,-.8),(5000,5000,.5),soil,c)
# Professional modular facades: real window recesses and manufacturer texture maps.
names=['wall_window_centered_large_01','window_centered_large_01','wall_window_centered_double_01','window_centered_double_01','cornice_standard_standard_01']
with bpy.data.libraries.load(str(P/'assets/modular_urban_apartments_facade/modular_urban_apartments_facade.blend')) as (a,b):b.objects=names
templates={o.name.split('.')[0]:o for o in b.objects if o}
def inst(name,loc,angle):
 o=templates[name].copy();o.data=templates[name].data;c.objects.link(o);o.location=loc;o.rotation_euler=(0,0,angle);return o
sites=[(x,y) for y in [75,145,220,300,400] for x in [-250,-170,-100,0,100,180,260] if not (y==75 and abs(x)<60)]
for idx,(cx,cy) in enumerate(sites):
 nx=random.randint(4,8);ny=random.randint(4,7);levels=random.randint(3,15);w=nx*3;d=ny*3;h=levels*3
 box('Neighbour interior mass',(cx,cy,h/2),(w-.4,d-.4,h),stone,c)
 for side in range(4):
  count=nx if side%2==0 else ny;angle=side*math.pi/2
  for z in range(levels):
   for j in range(count):
    u=-count*1.5+j*3
    if side==0:loc=(cx+u,cy-d/2,z*3)
    elif side==1:loc=(cx+w/2,cy+u,z*3)
    elif side==2:loc=(cx-u,cy+d/2,z*3)
    else:loc=(cx-w/2,cy-u,z*3)
    typ='large' if (idx+j)%3 else 'double'
    for prefix in ['wall_window_centered_','window_centered_']:inst(prefix+typ+'_01',loc,angle)
 box('Neighbour roof parapet',(cx,cy,h+.18),(w+.3,d+.3,.36),slab,c,bevel=.08)
 box('Roof equipment',(cx+2,cy-2,h+1.5),(w*.35,d*.4,2.7),stone,c,bevel=.1)
# Hills are contextual art direction, not a geographically surveyed reconstruction.
mountainmat=mat('Mountain vegetation rock',(.12,.17,.13),.94)
for layer in range(3):
 v=[];faces=[];N=100;M=24
 for j in range(M):
  for i in range(N):
   x=-2000+i*4000/(N-1);y=650+layer*380+j*45
   ridge=140+layer*65+95*math.sin(x*.003+layer)+noise.fractal(Vector((x*.002,y*.002,layer)),1,2,5)*100
   z=max(-.5,ridge*math.sin(math.pi*j/(M-1))**.7);v.append((x,y,z))
 for j in range(M-1):
  for i in range(N-1):a=j*N+i;faces.append((a,a+1,a+N+1,a+N))
 me=bpy.data.meshes.new('Natural ridge');me.from_pydata(v,[],faces);o=bpy.data.objects.new('Mountain layer',me);c.objects.link(o);me.materials.append(mountainmat)
 for f in me.polygons:f.use_smooth=True
# Amenity layout is editable and explicitly provisional pending a verified roof plan.
amen=bpy.data.collections.new('PODIUM_AMENITIES_PROVISIONAL');pod.children.link(amen);amen['validation']='Pool/court/playground confirmed by user; exact dimensions and placement require scan/plan validation.'
blue=mat('Pool ceramic',(.07,.32,.43),.22);water=mat('Pool water',(.6,.85,.9),.08,0,.95);court=mat('Sports surface',(.11,.32,.28),.78)
box('Pool basin',(-2,0,12.75),(9,17,.35),blue,amen,bevel=.2);box('Pool surface',(-2,0,12.98),(8.5,16.5,.025),water,amen)
box('Court',(0,12,12.65),(12,8,.08),court,amen)
for x in [-5.7,5.7]:box('Court sidelines',(x,12,12.7),(.06,7.5,.02),slab,amen)
for y in [8.3,12,15.7]:box('Court markings',(0,y,12.7),(11.4,.06,.02),slab,amen)
box('Playground reserved surface',(-28,-14,12.65),(10,5,.08),mat('Playground rubber',(.38,.23,.12),.9),amen)
# Preserve playground as reserved area until a suitable play-equipment asset is sourced.
for im in bpy.data.images:
 if im.source=='FILE' and not im.packed_file and im.filepath:
  q=pathlib.Path(bpy.path.abspath(im.filepath))
  if not q.exists():
   hits=list((P/'assets').rglob(q.name))
   if hits:im.filepath=str(hits[0]);im.reload()
s=bpy.context.scene;s.cycles.samples=64;s.render.filepath=str(P/'renders/context_007_study.png');s['production_status']='Context and provisional amenity study 007, not final';bpy.ops.file.make_paths_relative();bpy.ops.wm.save_as_mainfile(filepath=str(P/'versions/tdn_rebuild_007_context.blend'),compress=True);bpy.ops.render.render(write_still=True)
