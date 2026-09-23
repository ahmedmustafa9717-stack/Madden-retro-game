# Apply after build-athlete.py in the same Blender scene.
import bpy
sock=bpy.data.materials.new('Socks');sock.use_nodes=True
node=sock.node_tree.nodes.get('Principled BSDF')
node.inputs['Base Color'].default_value=(.82,.87,.86,1)
node.inputs['Roughness'].default_value=.92
for obj in bpy.data.objects:
 if obj.type!='MESH':continue
 mesh=obj.data;mesh.materials.append(sock);sock_idx=len(mesh.materials)-1
 uv=mesh.uv_layers.new(name='FabricUV')
 for poly in mesh.polygons:
  material=mesh.materials[poly.material_index].name
  center=sum(mesh.vertices[v].co.z for v in poly.vertices)/len(poly.vertices)
  if material.startswith('Gloves') and .16<center<.5:poly.material_index=sock_idx
  for li in poly.loop_indices:
   co=mesh.vertices[mesh.loops[li].vertex_index].co
   uv.data[li].uv=(co.y*2 if abs(poly.normal.x)>.7 else co.x*2,co.z*2)
 mesh.update()
bpy.context.scene.frame_set(1)
