import bpy,math,pathlib,random,json
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1];random.seed(184)
bpy.ops.wm.open_mainfile(filepath=str(P/'versions/tdn_rebuild_001_reference.blend'))
bpy.data.collections['REFERENCE_GAUSSIAN'].hide_render=True
for o in bpy.data.collections['REFERENCE_GAUSSIAN'].objects:o.hide_set(True)
def mat(n,c,rough=.5,metal=0,trans=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;b.inputs['Transmission Weight'].default_value=trans;b.inputs['IOR'].default_value=1.46
 if not trans and not metal:
  no=m.node_tree.nodes.new('ShaderNodeTexNoise');no.inputs['Scale'].default_value=38;bu=m.node_tree.nodes.new('ShaderNodeBump');bu.inputs['Strength'].default_value=.15;bu.inputs['Distance'].default_value=.025;m.node_tree.links.new(no.outputs['Fac'],bu.inputs['Height']);m.node_tree.links.new(bu.outputs['Normal'],b.inputs['Normal'])
 return m
stone=mat('Warm mineral render',(.53,.48,.40),.62);slab=mat('Limestone slab fascia',(.69,.65,.55),.48);metal=mat('Bronze anodised aluminium',(.15,.12,.085),.28,.8);glass=mat('Clear facade glass',(.94,.98,.97),.075,0,1);floor=mat('Interior oak',(.24,.14,.07),.47);dark=mat('Recessed joints',(.10,.09,.075),.7)
curtains=[mat('Linen_'+str(i),c,.87) for i,c in enumerate([(.50,.46,.37),(.68,.64,.53),(.33,.34,.30),(.75,.70,.61)])]
def box(n,loc,size,ma,collection,rot=0,bevel=0):
 x,y,z=[v/2 for v in size];verts=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
 mesh=bpy.data.meshes.new(n);mesh.from_pydata(verts,[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);mesh.update();o=bpy.data.objects.new(n,mesh);o.location=loc;o.rotation_euler.z=rot
 collection.objects.link(o);o.data.materials.append(ma)
 if bevel:
  b=o.modifiers.new('Real edge radius','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Corner normals','WEIGHTED_NORMAL')
 return o
# Relative dimensions fitted to recovered scan; all dimensions remain corrigible.
towers=[('TOWER_01',(-21,1),16.4,17.2,math.radians(42)),('TOWER_02',(16.4,1),17.8,19.4,math.radians(-4))]
for name,(cx,cy),w,d,angle in towers:
 def world(x,y,z):return (cx+x*math.cos(angle)-y*math.sin(angle),cy+x*math.sin(angle)+y*math.cos(angle),z)
 cols={s:bpy.data.collections[name+'_'+s] for s in ['STRUCTURE','FLOORS','FACADES','WINDOWS','BALCONIES','ROOF']}
 for level in range(39):
  z=12.8+3.23*level
  box(name+f'_floor_{level:02d}',world(0,0,z),(w,d,.25),slab,cols['FLOORS'],angle,.16)
  box(name+f'_interior_floor_{level:02d}',world(0,0,z+.20),(w-2.2,d-2.2,.12),floor,cols['FLOORS'],angle)
  # Four facade planes with physically recessed glazing, thin individual frames and room backs.
  for side in range(4):
   length=w if side%2==0 else d;count=5 if side%2==0 else 6
   def pt(u,v,h):
    if side==0:return world(u,-d/2+v,h)
    if side==1:return world(w/2-v,u,h)
    if side==2:return world(-u,d/2-v,h)
    return world(-w/2+v,-u,h)
   theta=angle+(side*math.pi/2)
   for j in range(count):
    u=-length/2+(j+.5)*length/count;bw=length/count-.18
    # Alternate opaque bays on service faces, retaining both towers' distinct facade rhythm.
    opaque=(side==2 and j in [0,1,3]) or (name=='TOWER_02' and side==1 and j%2==0)
    if opaque:
     box(f'{name}_wall_{level}_{side}_{j}',pt(u,.7,z+1.62),(bw,.22,3.0),stone,cols['FACADES'],theta,.025);continue
    box(f'{name}_glass_{level}_{side}_{j}',pt(u,.95,z+1.66),(bw,.025,2.74),glass,cols['WINDOWS'],theta)
    for du in [-bw/2,0,bw/2]:box('Aluminium mullion',pt(u+du,.92,z+1.66),(.065,.11,2.83),metal,cols['WINDOWS'],theta)
    for hh in [.28,3.04]:box('Window transom',pt(u,.92,z+hh),(bw,.11,.065),metal,cols['WINDOWS'],theta)
    box('Room back wall',pt(u,3.3,z+1.65),(bw,.12,2.8),stone,cols['FACADES'],theta)
    if random.random()<.72:box('Partly drawn linen',pt(u+random.uniform(-.5,.5),1.25,z+1.65),(bw*random.uniform(.18,.65),.035,2.7),random.choice(curtains),cols['WINDOWS'],theta)
    if side in [0,3]:
     box('Balcony glazed guard',pt(u,.09,z+.8),(bw,.025,1.1),glass,cols['BALCONIES'],theta)
     box('Balcony cap rail',pt(u,.09,z+1.36),(bw,.055,.045),metal,cols['BALCONIES'],theta)
  # Continuous structural fins articulated independently of glazing.
  for x in [-w/2+.35,w/2-.35]:box('Structural fin',world(x,0,z+1.6),(.35,d-2,3.23),stone,cols['STRUCTURE'],angle,.03)
 roof=12.8+39*3.23
 box(name+'_roof',world(0,0,roof),(w,d,.3),slab,cols['ROOF'],angle,.15)
 box(name+'_plantroom',world(-2,1,roof+2.2),(w*.52,d*.55,4.4),stone,cols['ROOF'],angle,.05)
# Active commercial podium and shops; initial architectural shell, furniture asset placement follows.
c=bpy.data.collections['PODIUM'];box('Retail ground',(-1,0,.3),(79,39,.6),slab,c,bevel=.3)
for z in [5.5,10.7,12.4]:box('Podium terrace',(-1,0,z),(77,37,.35),slab,c,bevel=.6)
for j,program in enumerate(['CAFE','BOOKSHOP','GALLERY','LOBBY','DESIGN']):
 x=-31+j*15
 box(program+'_back',(x,5,2.85),(14,.25,5),stone,c)
 box(program+'_glass',(x,-18,2.85),(14,.035,5),glass,c)
 for k in range(6):box(program+'_mullion',(x-7+k*2.8,-18,2.85),(.08,.15,5),metal,c)
 box(program+'_canopy',(x,-20,5.1),(14,5,.16),slab,c,bevel=.04)
 box(program+'_interior_floor',(x,-8,.65),(14,20,.15),floor,c)
 for k in [-1,1]:box(program+'_partywall',(x+k*7,-6,2.85),(.2,24,5),stone,c)
 data=bpy.data.lights.new(program+'_warm_area','AREA');data.energy=550;data.color=(1,.72,.43);data.shape='RECTANGLE';data.size=8;data.size_y=8;o=bpy.data.objects.new(data.name,data);c.objects.link(o);o.location=(x,-8,4.9)
env=bpy.data.collections['ENVIRONMENT'];pave=mat('Pale granite plaza',(.32,.31,.28),.7);asphalt=mat('Dry weathered asphalt',(.055,.06,.065),.85)
box('Continuous plaza',(0,-28,-.08),(105,18,.25),pave,env)
box('Through avenue',(0,-49,-.24),(1000,23,.25),asphalt,env)
box('Park ground',(0,-120,-.45),(700,115,.4),mat('Park soil',(.10,.14,.06),.95),env)
s=bpy.context.scene;s['production_status']='Architectural study 002: proportions and detail under validation; environment incomplete'
s.world.use_nodes=True;n=s.world.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputWorld');bg=n.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.38;tex=n.new('ShaderNodeTexEnvironment');tex.image=bpy.data.images.load(str(P/'assets/sky.hdr'));s.world.node_tree.links.new(tex.outputs['Color'],bg.inputs['Color']);s.world.node_tree.links.new(bg.outputs[0],out.inputs[0])
data=bpy.data.lights.new('Golden hour sun','SUN');data.energy=2.0;data.angle=math.radians(1.2);data.color=(1,.78,.54);o=bpy.data.objects.new(data.name,data);env.objects.link(o);o.rotation_euler=(math.radians(76.5),0,math.radians(-55))
s.camera.location=(160,-245,115);s.camera.rotation_euler=(Vector((0,0,69))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.lens=48
s.view_settings.view_transform='AgX';s.cycles.samples=24;s.cycles.use_denoising=True;s.render.resolution_x=1280;s.render.resolution_y=900;s.render.filepath=str(P/'renders/architecture_002_study.png')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'versions/tdn_rebuild_002_architecture.blend'),compress=True)
bpy.ops.render.render(write_still=True)
