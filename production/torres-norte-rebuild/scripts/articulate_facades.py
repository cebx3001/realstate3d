import bpy,pathlib,math
P=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(P/'versions/tdn_rebuild_004_architecture.blend'))
source=(P/'scripts/build_architecture.py').read_text();exec(source[source.index('def mat('):source.index('# Relative dimensions')])
# Solid/window balance study: narrow punched windows, tall concrete piers, recessed balcony bays.
for name,cx,cy,w,d,angle,bays in [('TOWER_01',-21,1,16.4,17.2,math.radians(42),[0]),('TOWER_02',16.4,1,17.8,19.4,math.radians(-4),[0,1,2])]:
 c=bpy.data.collections[name+'_FACADES']
 def pt(x,y,z):return (cx+x*math.cos(angle)-y*math.sin(angle),cy+x*math.sin(angle)+y*math.cos(angle),z)
 for level in range(39):
  z=12.8+3.23*level
  for j in bays:
   u=-w/2+(j+.5)*w/5;bw=w/5-.1;opening=.95
   for dx in [-1,1]:box('Pier beside recessed opening',pt(u+dx*(opening+(bw-opening)/2)/2,-d/2+.72,z+1.61),((bw-opening)/2,.32,3.23),stone,c,angle,.025)
   box('Window sill wall',pt(u,-d/2+.72,z+.51),(opening,.32,1.02),stone,c,angle,.025)
   box('Window head wall',pt(u,-d/2+.72,z+2.93),(opening,.32,.60),stone,c,angle,.025)
# Restrained vertical facade blades distinguish tower profiles.
for x,y,h in [(7.0,-8.2,138),(24.7,-8.2,138)]:box('Tower02 vertical facade blade',(x,y,12.8+(h-12.8)/2),(.42,.85,h-12.8),slab,bpy.data.collections['TOWER_02_STRUCTURE'],math.radians(-4),.04)
s=bpy.context.scene;s.cycles.samples=96;s.render.filepath=str(P/'renders/architecture_005_study.png');s['production_status']='Facade solid-to-glass balance study 005, not final validated reconstruction';bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(P/'versions/tdn_rebuild_005_architecture.blend'),compress=True);bpy.ops.render.render(write_still=True)
