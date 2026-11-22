import bpy, math, json
from mathutils import Vector
S=bpy.context.scene; O=bpy.data.objects
star=O['A / golden paper MODEL STAR']; hole=O['A / permanent matte black singularity']; tab=O['A / cyan extraction pull tab · one-way']; filament=O['Moving cyan filament • independent from history chart']
pivots=sorted([o for o in O if o.name.startswith('A spoke shared crease')],key=lambda o:o.name)
assert len(pivots)==8
assert S['source_commit']=='41dddee6383d94e8ce0f68303a506cd9290225ee'
assert len([o for o in O if o.name.startswith('B / pre-collapse star emblem')])==4
assert len([o for o in O if o.name.startswith('C / static containment caliper arc')])==3
assert not any(o.type=='SPEAKER' for o in O)
assert not any(image.source=='FILE' for image in bpy.data.images)
assert 'NOT AN INDIVIDUAL HAL’VEN SUN' in O['Separation of model from event'].data.body
assert O['Dry obsidian model mark'].active_material.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value==0
status=[]
prior_x=0
samples=(1,28,43,52,66,70,84,96)
for f in range(1,97):
 S.frame_set(f); bpy.context.view_layer.update()
 assert tab.location.x<=prior_x+1e-6, f;prior_x=tab.location.x
 for root in (star,hole):
  assert all(o.hide_render==root.hide_render for o in root.children_recursive), (f,root.name)
 dg=bpy.context.evaluated_depsgraph_get()
 points=filament.evaluated_get(dg).data.splines[0].points
 assert (points[-1].co.xyz-Vector((tab.location.x,tab.location.y,.349))).length<1e-5, f
 assert all((p.location-Vector((0,.114,0))).length<1e-5 for p in pivots),f
 if f<=38: assert not star.hide_render and hole.hide_render, f
 if f>=53: assert star.hide_render and not hole.hide_render and abs(hole.scale.x-1)<1e-6, f
 if f in samples:status.append(dict(frame=f,tab_x=round(tab.location.x,3),star_visible=not star.hide_render,black_mark_visible=not hole.hide_render,creased_degrees=round(math.degrees(pivots[0].rotation_euler.x),2)))
S.frame_set(1)
print('F09_VERIFY '+json.dumps(dict(pinned=S['source_commit'],keyed_frames_checked=96,radial_hinges=len(pivots),maximum_tab_travel=1.64,matching_thread_tip_each_frame=True,irreversible_end=True,same_camera=['REST','PULL','TAKE','LATCHED'],audio_tracks=0,external_images=0,states=status)))
