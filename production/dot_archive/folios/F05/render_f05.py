import bpy, sys
from pathlib import Path
D=Path(__file__).resolve().parent
s=bpy.context.scene
test='--preview' in sys.argv
if test:
 s.render.resolution_percentage=50;s.cycles.samples=6
views=[
 ('F05_01_Arrival',1,'F05 overview'),
 ('F05_02_Orbital_Ring',38,'F05 overview'),
 ('F05_03_B1_Input',65,'F05 overview'),
 ('F05_04_B2_Conversion',85,'F05 overview'),
 ('F05_05_B3_Extrusion',105,'F05 overview'),
 ('F05_06_B4_Cutaway',126,'F05 cutaway'),
 ('F05_07_Hero',159,'F05 overview'),
 ('F05_08_Doctrine_and_Record',159,'F05 evidence'),
]
if test: views=[views[i] for i in (0,2,5,6,7)]
else: views=[views[i] for i in (6,0,5,7,1,2,3,4)]
for n,f,prefix in views:
 s.camera=next(o for o in bpy.data.objects if o.type=='CAMERA' and o.name.startswith(prefix))
 s.frame_set(f)
 if not test:
  s.render.resolution_percentage=100 if n in ('F05_07_Hero','F05_06_B4_Cutaway','F05_08_Doctrine_and_Record') else 86
  s.cycles.samples=16 if n=='F05_07_Hero' else 10
 s.render.filepath=str((D/'evidence' if test else D)/(n+'.png'))
 bpy.ops.render.render(write_still=True)
