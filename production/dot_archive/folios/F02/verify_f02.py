"""Open the candidate fresh and test choreography, material, and exact fold contacts."""
import bpy, math, hashlib, json
from mathutils import Vector
s=bpy.context.scene
markers={m.name:m.frame for m in s.timeline_markers}
objs=bpy.data.objects
p=[o for o in objs if o.name.startswith('Die-cut points')]
p.sort(key=lambda o:o.parent.name)
assert len(p)==3, [o.name for o in p]
sp=[o for o in objs if o.name.startswith('Black die-cut spiral strip')]
assert len(sp)==4
checked=[]
for fr,flags,count in [(1,(False,False,False),0),(39,(True,False,False),0),(65,(True,True,False),0),(110,(True,True,True),4)]:
 s.frame_set(fr)
 out=tuple(not o.hide_render for o in p)
 assert out==flags,(fr,out)
 assert sum(not o.hide_render for o in sp)==count,(fr,count)
 checked.append({'frame':fr,'points_clusters_galaxy':out,'visible_spiral_strips':count})
cards=[o for o in objs if o.name.startswith('Dyed-through black display leaf')]
assert len(cards)==3
for o in cards:
 assert len(o.data.materials)==1 and o.active_material.name.startswith('BLACK STOCK')
 thick=o.modifiers[0];assert thick.type=='SOLIDIFY' and thick.material_offset_rim==0 and thick.material_offset==0
paper_print=[sum(poly.material_index>0 for poly in o.data.polygons) for o in p]
assert paper_print==[141,294,550],paper_print
pins=[o for o in objs if o.name.startswith('Black gusset with moving plate joint')]
assert len(pins)==6
for o in pins:
 solid=next(m for m in o.modifiers if m.type=='SOLIDIFY')
 solid.show_viewport=False
errors=[]
for f in (1,18,19,24,34,39,42,51,65,68,84,96,97,110):
 s.frame_set(f); dep=bpy.context.evaluated_depsgraph_get()
 for o in pins:
  e=o.evaluated_get(dep)
  m=e.to_mesh()
  target=next(mod.object for mod in o.modifiers if mod.type=='HOOK')
  errors.append((e.matrix_world@m.vertices[2].co-target.matrix_world.translation).length)
  e.to_mesh_clear()
assert max(errors)<1e-5,max(errors)
g=next(o for o in objs if o.name.startswith('NiAlBu · living inverted'))
assert abs(g.rotation_euler.y-math.pi)<1e-5
assert len([o for o in objs if o.name.startswith('NiAlBu · copper binding ring')])==4
assert len([o for o in objs if o.name.startswith('Cutaway geode spire')])==5
secret=next(o for o in objs if o.name.startswith('INSIDE GEODE ONLY'))
assert secret.hide_render and secret.users_collection[0].hide_render
assert secret.data.body=='[Inspection text omitted]'
assert not s.sequence_editor or not list(s.sequence_editor.sequences_all)
assert s.camera.name.startswith('Overview')
print('F02_VERIFY '+json.dumps({'markers':markers,'sequence':checked,'new_stock_faces_and_rim':'same black material index','inked_points_by_layer':paper_print,'maximum_gusset_attachment_error_in_Blender_units':max(errors),'gusset_samples':len(errors),'ni_al_bu':'inverted; four rings; cyan markers; five geode spires','testimony':'exact; render disabled','audio_tracks':0,'cameras':[o.name for o in objs if o.type=='CAMERA'],'source_commit':s.get('source_commit')},ensure_ascii=False))
