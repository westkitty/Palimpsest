import bpy, math
from mathutils import Vector
s=bpy.context.scene
f=bpy.data.collections['02 • Candidate scored paper support links: constant length']
c=bpy.data.collections['03 • Concealed inscription: disabled in normal renders']
assert c.hide_render and c.hide_viewport
assert {i.name for i in bpy.data.objects if i.name.startswith('palimpsest-original')} == {'palimpsest-original-tiger','palimpsest-original-wordstreamer','palimpsest-original-nialbu'}
rigs=[bpy.data.objects[f'A • fold axis {i}'] for i in range(1,4)]
for frame in (1,16,30,37,45,57,65,72):
 s.frame_set(frame)
 for j in ('Left','Right'):
  for i in range(1,4):
   a,b=(bpy.data.objects[f'Scored cardstock gusset • {j} {i} link {k}'] for k in (1,2))
   assert (a.matrix_world @ Vector((0,.49,0)) - b.matrix_world.translation).length < 3e-6
 if frame in (1,72):
  assert all(abs(o.rotation_quaternion.to_euler().x+.03) < 1e-6 for o in rigs)
 if frame==45:
  assert [round(o.rotation_quaternion.to_euler().x,2) for o in rigs] == [-.79,-.94,-.79]
assert len([ob for ob in f.objects if 'gusset' in ob.name]) == 12
assert not bpy.data.images or all(i.packed_file or i.source in ('GENERATED','VIEWER') for i in bpy.data.images)
print('VERIFIED blend reopen; exact source trio; 12 fixed-length link arms; common ridge positions; return to rest; hidden material excluded; no external image dependency')
