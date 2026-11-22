import bpy,math
from mathutils import Vector
s=bpy.context.scene
objs=bpy.data.objects
panels=[objs['C • Z-pleat %02d'%i] for i in range(1,7)]
wheel=objs['A • Chronology wheel']
ids={i:objs['F06 runtime authored specimen '+i] for i in ['003','004']}
names=['7–30','31–60','61–90','91–120']
assert all(objs.get('Documented range '+n) for n in names)
assert sum(o.name.startswith('Empty archival cell') for o in objs)==4
assert s.sequence_editor is None or all(x.type!='SOUND' for x in s.sequence_editor.sequences_all)
max_gap=0
ends=[]
for f in [1,18,42,54,66,83,101,111,130,142]:
 s.frame_set(f)
 for p,q in zip(panels,panels[1:]):
  end=p.matrix_world@Vector((0,-.47,0))
  start=q.matrix_world.translation
  max_gap=max(max_gap,(end-start).length)
 assert ids['003'].hide_render != ids['004'].hide_render
 assert (not ids['003'].hide_render)==(f<57)
 ends.append((f,(panels[-1].matrix_world@Vector((0,-.47,0))).y))
 assert (panels[-1].matrix_world@Vector((0,-.47,0))).z>.22
 if f==42: assert abs(wheel.rotation_euler.z+math.pi/2)<1e-5
assert max_gap<1e-6
assert (ends[0][1]-dict(ends)[111])>1.80
assert abs(ends[-1][1]-ends[0][1])<1e-6
print('PASS • 6 fixed-width panels, max crease gap',max_gap,'Blender units')
print('PASS • rest/open/refold:',ends[0],(111,dict(ends)[111]),ends[-1])
print('PASS • four documented ranges, exact source subjects 003 and 004, blank records, no audio')
