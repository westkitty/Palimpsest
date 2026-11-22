import bpy, sys
from pathlib import Path
s=bpy.context.scene
out=Path(sys.argv[sys.argv.index('--')+1])
source_names=[]
for i,o in enumerate(list(bpy.data.objects)):
 if o.type in {'LIGHT','CAMERA'} or any(c.name.startswith('05 |') for c in o.users_collection):
  bpy.data.objects.remove(o,do_unlink=True);continue
 a=o.animation_data
 if a and a.action:
  # Strip unsupported visibility keys after recognizing exact nodes; the
  # runtime owns those discrete states, and this bakes the original transforms.
  channel=next((ch for ch in ('A','B','C') if o.name.startswith(ch+' ·')),None)
  if o.name.startswith(('B aperture','Cutaway red slurry cursor','Documented material passage marker','Mechanism staged number')): channel='B'
  if o.name.startswith(('Fallenstar Prime','Opaque rim shard')):channel='A'
  source_names.append((o.name,channel))
  if not channel:raise RuntimeError('Unclassified '+o.name)
  o.name=channel+'__'+o.name
# Use the approved public Liberation Serif substitute for mesh letterforms.
for c in bpy.data.curves:
 if isinstance(c,bpy.types.TextCurve) and c.font.name!='Bfont':
  default=bpy.data.fonts.get('Liberation Serif Regular')
  if not default:default=bpy.data.fonts.load('/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',check_existing=True)
  c.font=default
for f in [1,180,1]:
 s.frame_set(f)
 for o in bpy.data.objects:
  o.hide_viewport=False;o.hide_render=False;o.hide_set(False)
s.frame_start=1;s.frame_end=180
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',
 export_animation_mode='SCENE',export_frame_range=True,export_force_sampling=True,
 export_cameras=False,export_lights=False,export_extras=False,export_normals=True)
print(source_names)
