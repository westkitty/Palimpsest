"""Matched four story states and two detail rehearsals rendered from saved file."""
import bpy,sys
from pathlib import Path
D=Path(__file__).resolve().parent;s=bpy.context.scene
p='--preview' in sys.argv
views=[('F08_04_Hero',153,'F08 aligned'),('F08_01_Arrival',1,'F08 aligned'),('F08_02_Gate_Cutaway',44,'F08 aligned'),('F08_03_Broken_Assumption',88,'F08 aligned'),('F08_05_Twenty_Worlds',153,'F08 foldout'),('F08_06_Shield_Detail',88,'F08 shield')]
if p: views=[views[i] for i in (0,1,4,5)]
for n,f,cam in views:
 s.camera=next(q for q in bpy.data.objects if q.type=='CAMERA' and q.name.startswith(cam));s.frame_set(f)
 s.render.resolution_percentage=50 if p else (100 if n in ('F08_04_Hero','F08_05_Twenty_Worlds','F08_06_Shield_Detail') else 86)
 s.cycles.samples=5 if p else (15 if n=='F08_04_Hero' else 10)
 s.render.filepath=str((D/'evidence' if p else D)/(n+'.png'));bpy.ops.render.render(write_still=True)
