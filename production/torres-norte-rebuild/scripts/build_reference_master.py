import bpy,numpy as np,pathlib,json,math
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
root=bpy.data.collections.new('TORRES_DEL_NORTE');bpy.context.scene.collection.children.link(root)
def col(n,parent=root):
 c=bpy.data.collections.new(n);parent.children.link(c);return c
ref=col('REFERENCE_GAUSSIAN');arch=col('ARCHITECTURE')
for t in ['TOWER_01','TOWER_02']:
 c=col(t,arch)
 for n in ['STRUCTURE','FLOORS','FACADES','WINDOWS','BALCONIES','ROOF']:col(t+'_'+n,c)
col('PODIUM',arch)
for n in ['UNIT_GEOMETRY','MATERIALS','ENVIRONMENT','CAMERAS']:col(n)
a=np.load(P/'references/reference_points.npz');xyz=a['xyz'];rgb=a['rgb'];mesh=bpy.data.meshes.new('DecodedGaussian_LOD3_points');mesh.from_pydata(xyz.tolist(),[],[]);mesh.update();o=bpy.data.objects.new('OriginalScan_spatial_reference_NOT_architecture',mesh);ref.objects.link(o)
c=mesh.color_attributes.new(name='scan_color',type='FLOAT_COLOR',domain='POINT');rgba=np.column_stack([rgb,np.ones(len(rgb))]).astype(np.float32);c.data.foreach_set('color',rgba.ravel())
o['source']='GitHub commit 6f73fe50c4bc85989d7f915d62c6a162d881d240; SOG LOD3; opacity >50/255';o['coordinate_conversion']='(source.x,source.z,-source.y)';o['not_a_surface_reconstruction']=True
# Geometry Nodes makes reference points visible independently; source points remain editable.
m=bpy.data.materials.new('Scan color');m.use_nodes=True;nd=m.node_tree.nodes;nd.clear();att=nd.new('ShaderNodeAttribute');att.attribute_name='scan_color';em=nd.new('ShaderNodeEmission');out=nd.new('ShaderNodeOutputMaterial');m.node_tree.links.new(att.outputs['Color'],em.inputs['Color']);m.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
g=bpy.data.node_groups.new('Reference point display','GeometryNodeTree');g.interface.new_socket(name='Geometry',in_out='INPUT',socket_type='NodeSocketGeometry');g.interface.new_socket(name='Geometry',in_out='OUTPUT',socket_type='NodeSocketGeometry');n=g.nodes;i=n.new('NodeGroupInput');v=n.new('GeometryNodeMeshToPoints');v.inputs['Radius'].default_value=.07;sm=n.new('GeometryNodeSetMaterial');sm.inputs['Material'].default_value=m;out=n.new('NodeGroupOutput');g.links.new(i.outputs['Geometry'],v.inputs['Mesh']);g.links.new(v.outputs['Points'],sm.inputs['Geometry']);g.links.new(sm.outputs['Geometry'],out.inputs['Geometry']);mod=o.modifiers.new('Reference display','NODES');mod.node_group=g
s=bpy.context.scene;s.unit_settings.system='NONE';s['scale_status']='Relative units. Metres not verified.';s['production_status']='Recovered source checkpoint, architecture reconstruction not yet complete';s['full_animation_approved']=False
for id,pos,target,lens in [('FRONTAL',(2,300,82),(2,0,74),36),('COMMERCIAL',(-44,55,7.5),(2,8,8),34),('PARK',(-95,148,2.2),(0,0,65),20)]:
 d=bpy.data.cameras.new(id);c=bpy.data.objects.new(id,d);bpy.data.collections['CAMERAS'].objects.link(c);c.location=pos;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();d.lens=lens;d.clip_end=10000
s.camera=bpy.data.objects['FRONTAL'];s.render.engine='CYCLES';s.cycles.samples=16;s.render.resolution_x=1600;s.render.resolution_y=900;s.render.resolution_percentage=100;s.world=bpy.data.worlds.new('Neutral reference world');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.15,.15,1)
settings=json.loads((P/'references/settings.json').read_text())
for a in settings['annotations']:
 key=a.get('extras',{}).get('unit');
 if key not in ['17A','35B','28C']:continue
 o=bpy.data.objects.new('UNIT_'+key,None);bpy.data.collections['UNIT_GEOMETRY'].objects.link(o);o['source_position_json']=json.dumps(a['position']);o['transform_status']='Viewer-to-Blender transform pending verification; anchor intentionally unplaced';o['interior_id']={'17A':'inventory-47','35B':'inventory-48','28C':'inventory-50'}[key];o.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(P/'versions/tdn_rebuild_001_reference.blend'),compress=True)
