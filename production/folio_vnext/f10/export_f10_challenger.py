"""Export only approved F10 A-slot Blender geometry. Does not save/change the source file."""
import bpy, json, sys, hashlib
from pathlib import Path
s=bpy.context.scene
source=Path(bpy.data.filepath)
assert source.name=='Palimpsest_F10_Fold_Candidate.blend'
base=next(c for c in s.collection.children if c.name.startswith('03 • A • 12'))
static={
    'A graphite binding support':'F10_A_SUPPORT',
    'A slate die-cut top plate':'F10_A_DIE_CUT_PLATE',
    'One single central void core':'F10_A_RECEIVER_CORE',
    'A low wheat printed crease datum':'F10_A_PRINTED_OUTER_DATUM',
    'A printed darker inner datum':'F10_A_PRINTED_INNER_DATUM',
}
selected=set(base.objects)
for original,new in static.items():
    ob=bpy.data.objects[original];selected.add(ob);ob.name=new
for prefix,new in [('A fixed geometric base ','F10_A_AXIS_'),('A cardstock fold hinge ','F10_A_HINGE_'),('A real die-cut crease leaf ','F10_A_LEAF_')]:
    for ob in selected:
        if ob.name.startswith(prefix):
            index=int(ob.name[len(prefix):])
            # Donor geometry starts at 00 while the rooted axes start at 01.
            ob.name=new+f'{index+int(new=="F10_A_LEAF_"):02d}'
for ob in s.objects:ob.select_set(ob in selected)
s.frame_start=1;s.frame_end=35;s.frame_set(1)
destination=Path(sys.argv[-1]).resolve()
bpy.ops.export_scene.gltf(filepath=str(destination),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_force_sampling=True,export_frame_step=1,export_apply=True,export_cameras=False,
    export_lights=False,export_extras=False,export_yup=True)
print('F10_EXPORT',json.dumps({'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'selection':len(selected),'hinges':sum(o.name.startswith('F10_A_HINGE_') for o in selected),
    'from':1,'to':35,'fps':s.render.fps,'receiver':'F10_A_RECEIVER_CORE'}))
