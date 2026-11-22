import bpy, math
from mathutils import Vector
s=bpy.context.scene
a=[bpy.data.objects[f'A cardstock fold hinge {i+1:02d}'] for i in range(12)]
dies=[bpy.data.objects[f'A real die-cut crease leaf {i:02d}'] for i in range(12)]
base=[o.parent.matrix_world.translation.copy() for o in a]
st=[o for o in bpy.data.objects if 'ONLY inhabited-sky mark' in o.name]
assert len(st)==1 and st[0].data.materials[0].node_tree.nodes['Emission'].inputs[0].default_value[:3] == (0.,0.,0.)
assert len([o for o in bpy.data.objects if o.name.startswith('One single central void core')])==1
assert len([o for o in bpy.data.objects if o.name.startswith('B cottage layered blank paper cut')])==4
assert not any('starfield' in o.name.lower() or 'sky grid' in o.name.lower() or 'lattice' in o.name.lower() for o in bpy.data.objects)
assert [o.data.body for o in bpy.data.objects if o.type=='FONT' and 'STRICTLY PROHIBITED' in o.data.body]==['HELIOCIDE STUDY STRICTLY PROHIBITED']
ash=[p for p in bpy.data.objects if p.name.startswith('Ash-colour rear paper register')]
yash=min((o.matrix_world @ v.co).y for o in ash for v in o.data.vertices)
for f in (1,7,15,19,27,35,47,58,66):
 s.frame_set(f)
 for i,(h,ob) in enumerate(zip(a,dies)):
  assert ((h.matrix_world.translation)-base[i]).length<2e-6
  if f in (1,66):assert abs(h.rotation_euler.x)<2e-6
  if f==35:assert abs(h.rotation_euler.x+math.pi/2)<2e-6
  for vert in ob.data.vertices:
   x,y,z=ob.matrix_world@vert.co
   # Prove adjacent sectors never overlap at sampled poses.
   phi=math.atan2(y-.61,x+1.33)-i*math.pi/6
   phi=math.atan2(math.sin(phi),math.cos(phi))
   assert abs(phi)<math.pi/12-.006
   assert y<yash-.024
assert not any(i.source not in ('GENERATED','VIEWER') and not i.packed_file for i in bpy.data.images)
print('PASS F10 reopened: 12 static tangent axes, non-overlapping tapered panels across nine poses, static pitch-black core/streak, four cottages, no external images.')
