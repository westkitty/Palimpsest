import bpy,sys
from pathlib import Path
D=Path(__file__).resolve().parent;s=bpy.context.scene
test='--preview' in sys.argv
views=[('F11_04_Hero',154,'F11 overview'),('F11_05_Loam_Detail',46,'F11 loam proof'),('F11_01_Arrival',1,'F11 overview'),('F11_02_Lifted_Loam',46,'F11 overview'),('F11_03_Reassigned_Macro',89,'F11 overview'),('F11_06_Attributed_Quotation',154,'F11 quotation proof')]
if test:views=[views[i] for i in (0,1,2,5)]
for n,f,cam in views:
 s.camera=next(q for q in bpy.data.objects if q.type=='CAMERA' and q.name.startswith(cam));s.frame_set(f)
 s.render.resolution_percentage=50 if test else (100 if n.startswith(('F11_04','F11_05','F11_06')) else 86)
 s.cycles.samples=5 if test else (15 if n.startswith(('F11_04','F11_05')) else 10)
 s.render.filepath=str((D/'evidence' if test else D)/(n+'.png'));bpy.ops.render.render(write_still=True)
