import bpy, math
from mathutils import Vector
scene=bpy.context.scene
panels=[bpy.data.objects[f'C hinge • leaflet {i:02d}'] for i in range(1,7)]
assert all(round(p['Length'],3)==.24 for p in panels)
assert bpy.data.objects.get('B • Codec editorial model, exact source mesh')
assert sorted([o.data.body for o in bpy.data.objects if o.name.startswith('C exact lesson label')])==['ACT','OBSERVE','PULL','RECORD','VERIFY']
for f in (1,8,17,28,35,45,52,59,66):
 scene.frame_set(f)
 for a,b in zip(panels,panels[1:]):
  for x in (-.54,.54):
   assert ((a.matrix_world @ Vector((x,-.24,0)))-(b.matrix_world @ Vector((x,0,0)))).length<4e-6
 for i,p in enumerate(panels): assert p.rotation_euler.x * (-1 if i%2==0 else 1) > 0
 if f in (1,66):assert abs(panels[0].rotation_euler.x+1.0168)<2e-6
 if f==35:assert abs(panels[0].rotation_euler.x+.16)<2e-6
assert not any(i.source not in ('GENERATED','VIEWER') and not i.packed_file for i in bpy.data.images)
assert not any(o.type=='FONT' and ('murder' in o.data.body.lower() or 'casualt' in o.data.body.lower()) for o in bpy.data.objects)
print('PASS F04 .blend reopened; six 0.24 folds, two matched endpoints per living crease, rest/open/reset levels, exact four manifest terms, source-derived Codec and no dependency gaps')
