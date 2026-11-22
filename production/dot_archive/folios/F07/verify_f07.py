import bpy, math
from mathutils import Vector
s=bpy.context.scene
h=bpy.data.objects['A • rear hinge · Pharos plan overlay']
v=bpy.data.objects['Real A paper membrane']
assert v.parent==h and len(v.data.vertices)==4
assert round(max(x.co.x for x in v.data.vertices)-min(x.co.x for x in v.data.vertices),2)==2.58
assert round(max(x.co.y for x in v.data.vertices)-min(x.co.y for x in v.data.vertices),2)==1.44
assert len([o for o in bpy.data.objects if o.name.startswith('F07 broken campaign scenic silhouette')])==8
expected=Vector((0,1,.393))
records=[o for o in bpy.data.objects if o.type=='FONT']
assert any('UNKNOWN TOTALS' in o.data.body for o in records)
assert any('NOT TO SCALE' in o.data.body for o in records)
assert len([o for o in records if 'YEAR 121' in o.data.body])==1
for f in (1,7,12,18,26,36,48,56,66):
 s.frame_set(f)
 assert (h.matrix_world.translation-expected).length<1e-6
 if f in (1,66):assert abs(h.rotation_euler.x)<1e-6
 if f==36:assert abs(h.rotation_euler.x+.76)<1e-6
 a=h.matrix_world@Vector((-1.22,0,0));b=h.matrix_world@Vector((1.22,0,0))
 assert (a-Vector((-1.22,1,.393))).length<1e-6 and (b-Vector((1.22,1,.393))).length<1e-6
 z=min((v.matrix_world @ p.co).z for p in v.data.vertices)
 assert z>.392
 ridge=[p for p in bpy.data.objects if p.name.startswith('Stepped fortress ridge relief')]
 assert all(max((o.matrix_world @ ve.co).z for ve in o.data.vertices)<z-.01 for o in ridge)
 assert max((bpy.data.objects['Embossed ruby tactical node at source planar coordinates'].matrix_world@p.co).z for p in bpy.data.objects['Embossed ruby tactical node at source planar coordinates'].data.vertices)<z-.062
assert not any(i.source not in ('GENERATED','VIEWER') and not i.packed_file for i in bpy.data.images)
print('PASS F07 Blender reopen. Four sheet vertices, real linked hinge, exact angular limits, nine sampled fixed-axis checks, ≥0.01 clearance, historical disclaimers and no external images.')
