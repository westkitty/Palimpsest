"""Derive F06 browser geometry from the reviewed Q2 polished .blend; never modify input.

blender -b <Q2 extracted F06/Palimpsest_F06_The_Long_Attrition.blend> -t 2 \
  -P production/dot_archive/exports/export_f06.py -- <output-dir>
"""
import bpy
from pathlib import Path
import hashlib
import sys

SOURCE_SHA = 'd7f3e965566c6d2097e87293ed94092b5915d9dfc86ac6658ed411339b9b3e32'
if hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest() != SOURCE_SHA:
    raise SystemExit('Input must be the polished F06 reviewed .blend, not another revision.')
out = Path(sys.argv[sys.argv.index('--')+1])
out.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
source = {
    'A • Chronology wheel': 'A__ChronologyWheel',
    'B • DRAXIS specimen cradle': 'B__SpecimenCradle',
    **{f'C • Z-pleat {i:02d}': f'C__LedgerLeaf{i:02d}' for i in range(1, 7)},
    'Empty archival cell.003': 'C__BlankCasualtyCell',
    'Bonded pull-grip': 'TouchTab_C_Pull',
    'Die-cut teeth, four documented spans': 'TouchTab_A_Wheel',
    'Stage plate': 'TouchTab_B_Cradle',
}
for old, new in source.items():
    obj = bpy.data.objects.get(old)
    if not obj:
        raise RuntimeError(f'Missing reviewed object: {old}')
    obj.name = new
    if obj.animation_data and obj.animation_data.action:
        obj.animation_data.action.name = new

# The two proof specimen instances recreate just the first two of seven Living
# choices. Retain the authored plate and its seat, and mount the existing
# repository's actual source-catalogued specimens on that named seat instead.
for obj in list(bpy.data.objects):
    if obj.type in {'CAMERA','LIGHT'} or obj.name == 'Worktable' or obj.name.startswith(
        ('F06 runtime authored specimen ', 'Plate 003 runtime mesh ', 'Plate 004 runtime mesh ', 'Registry label ')
    ):
        bpy.data.objects.remove(obj, do_unlink=True)
seat = bpy.data.objects.new('B__SourceSpecimenSeat', None)
scene.collection.objects.link(seat)
seat.parent = bpy.data.objects['B__SpecimenCradle']
seat.location = (0,0,.085)
era = bpy.data.objects.new('C__LiveEraInkAnchor',None)
scene.collection.objects.link(era)
era.parent = bpy.data.objects['C__LedgerLeaf01']
era.location = (0,-.35,.033)
# The contemporary paper instrument, not a new historical data record.
index = bpy.data.objects.new('A__LiveEraSlipAnchor',None)
scene.collection.objects.link(index)
index.parent = bpy.data.objects['A__ChronologyWheel'].parent
index.location = (-1.23,-1.60,.212)
reg = bpy.data.objects.new('B__LiveSpecimenNameAnchor',None)
scene.collection.objects.link(reg)
reg.parent = seat.parent.parent
reg.location = (0,-1.25,.25)
# Font curves are exported as the source's physical ink geometry.
fontpath = Path('/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf')
if not fontpath.is_file():
    fontpath = next(iter(Path('/usr/share/fonts').glob('**/LiberationSerif-Regular.ttf')),None)
if fontpath:
    font = bpy.data.fonts.load(str(fontpath),check_existing=True)
    for obj in scene.objects:
        if obj.type == 'FONT':
            obj.data.font = font
scene.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(out/'palimpsest-f06.glb'), export_format='GLB',
    export_animation_mode='SCENE',export_frame_range=True,export_force_sampling=True,
    export_cameras=False,export_lights=False,export_extras=False,export_apply=True,export_normals=True)
