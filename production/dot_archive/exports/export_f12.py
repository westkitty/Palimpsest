"""Derive the Living F12 set from the exact reviewed Q4 Blender original.

blender -b <Q4 extracted F12/Palimpsest_F12_The_Unfinished_Peace.blend> -t 2 \
  -P production/dot_archive/exports/export_f12.py -- <output-dir>
"""
import bpy
from pathlib import Path
import hashlib
import sys

SOURCE_SHA='7b5ee828f289889bf274589897042b093de194ce099fb738c3e06b7344ec5377'
if hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()!=SOURCE_SHA:
    raise SystemExit('Input must be the reviewed F12 Q4 master.')
out=Path(sys.argv[sys.argv.index('--')+1])
out.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene

# Remove geometry and print, not just visibility. The separate closing
# pop-out is exclusively owned by the Living Book, not this asset.
explicit_remove={
    'Distinct institutional closing inset','Pressed band around official imprint',
    'Institutional imprint caption','Exact closing slogan',
}
closed=bpy.data.objects['Closed heading drawing author']
closed.name='C public closed file identifier'
closed.data.body='SYRIN 4'
for ob in list(bpy.data.objects):
    if ob.type in {'CAMERA','LIGHT'} or ob.name in explicit_remove or ob.name=='Reading desk' or (
        ('kail' in ob.name.lower()) or
        (ob.type=='FONT' and ('kail' in ob.data.body.lower() or
        'last known surviving initiate' in ob.data.body.lower() or
        'your fate is in our hands' in ob.data.body.lower())) or
        (ob.name.startswith('Stationery entry tick') and ob.location.y<0)
    ):
        bpy.data.objects.remove(ob,do_unlink=True)
crease=bpy.data.objects['C · archival leaf crease pivot']
crease.name='C__ArchivalCrease'
crease.animation_data.action.name='C__ArchivalCrease'
bpy.data.objects['C rising tab'].name='TouchTab_C'
bpy.data.objects['C single physical archival cardstock leaf'].name='TouchSurface_C'
bpy.data.objects['C bonded stationary hinge pin'].name='C__FixedOriginalPin'
bpy.data.objects['C interior record stationery'].name='C__PublicSyrinRecord'
bpy.data.objects['B / abstract stationary diagram card'].name='TouchTab_B'
# The portable asset retains each of the two real card bodies and ink. The
# historically independent A logic stays a reversible physical comparison.
for sem,direction in [('I',-1),('II',1)]:
    def only(name): return bpy.data.objects[name]
    card=only('Separate stationary source claim '+sem)
    labels=[n for n in bpy.data.objects if n.type=='FONT' and n.name.split('.')[0]=='Source claim line '+sem]
    if len(labels)!=2:
        raise RuntimeError(f'Missing authored F12 claim ink: {sem}')
    pivot=bpy.data.objects.new('A__Claim'+sem,None)
    scene.collection.objects.link(pivot)
    pivot.parent=card.parent
    for part in [card,*labels]: part.parent=pivot # both parents have the same untouched identity transform
    card.name='TouchTab_A_'+sem
    for f in range(1,85):
        ratio=max(0,min(1,(f-1)/27))
        t=ratio*ratio*(3-2*ratio)
        pivot.location=(direction*.215*t,0,.023*t)
        pivot.keyframe_insert('location',frame=f)
    pivot.animation_data.action.name=pivot.name
horizons=[n for n in bpy.data.objects if n.name.startswith('Signed but not joined')]
if len(horizons)!=6:
    raise RuntimeError('F12 must retain exactly six separated horizon leaves')
for i,n in enumerate(sorted(horizons,key=lambda ob:(ob.location.x,ob.location.y)),1):
    n.name=f'F12__SignedNotJoinedLeaf{i:02}'
fontpath=Path('/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf')
if not fontpath.is_file(): fontpath=next(iter(Path('/usr/share/fonts').glob('**/LiberationSerif-Regular.ttf')),None)
if fontpath:
    font=bpy.data.fonts.load(str(fontpath),check_existing=True)
    for obj in scene.objects:
        if obj.type=='FONT': obj.data.font=font
for obj in scene.objects:
    if obj.type=='FONT':
        b=obj.data.body.lower()
        if any(k in b for k in ('kail','last known surviving initiate','your fate is in our hands','closing imprint')):
            raise RuntimeError(f'Forbidden F12 body: {b}')
scene.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(out/'palimpsest-f12.glb'),export_format='GLB',
    export_animation_mode='SCENE',export_frame_range=True,export_force_sampling=True,
    export_cameras=False,export_lights=False,export_extras=False,export_apply=True,export_normals=True)
