"""Port the reviewed F07 Blender fold with three separately sampled native slots."""
import bpy, math, sys
from pathlib import Path
out=Path(sys.argv[sys.argv.index('--')+1]);out.mkdir(parents=True,exist_ok=True)
s=bpy.context.scene;s.frame_set(1)
def empty(n,loc):
 o=bpy.data.objects.new(n,None);s.collection.objects.link(o);o.location=loc;return o
def box(n,mat,loc,size):
 bpy.ops.mesh.primitive_cube_add(size=1)
 o=bpy.context.object;o.name=n;o.location=loc;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(mat);return o
def text(n,value,loc,size,mat):
 d=bpy.data.curves.new(n,'FONT');d.body=value;d.size=size;d.align_x='CENTER';d.align_y='CENTER';d.materials.append(mat)
 o=bpy.data.objects.new(n,d);s.collection.objects.link(o);o.location=loc;return o
def reparent(o, parent):
 m=o.matrix_world.copy();o.parent=parent;o.matrix_world=m
def smooth(t):
 k=max(0.,min(1.,t));return k*k*(3-2*k)
def mat(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True
 b=m.node_tree.nodes.get('Principled BSDF')
 b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=.80
 return m
# Keep the approved candidate membrane, print geometry and keyed hinge exactly.
hinge=next(o for o in bpy.data.objects if o.name.startswith('A • rear hinge'))
hinge.name='A__PlanHinge'
membrane=bpy.data.objects['Real A paper membrane'];membrane.name='F07_PlanVellum'
m=mat('F07 visible warm vellum substrate',(.62,.44,.28))
m.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.44
m.diffuse_color=(.62,.44,.28,.44)
m.surface_render_method='BLENDED';m.use_backface_culling=False
membrane.data.materials[0]=m
# A fixed support and a native keyed rise reuse the exact source qualitative card.
outcome=empty('B__OutcomeRise',(2.292,-.21,.105))
bpy.context.view_layer.update()
for o in list(bpy.data.objects):
 if o.name.startswith('B fixed outcome plate'):reparent(o,outcome)
gold=bpy.data.materials['Dull saffron registration metal']
black=bpy.data.materials['Paper • black dyed through, cut edges also black']
plaster=mat('F07 pressed cream reader tab',(.73,.60,.40))
ink=mat('F07 tab editorial ink',(.038,.023,.028))
for x in (1.856,2.728):
 box('F07 raised cost guide post',gold,(x,-.066,.198),(.033,.056,.260))
 clip=box('F07 moving guide shoe',black,(x,-.085,.116),(.071,.13,.045))
 reparent(clip,outcome)
# Original candidate wheels, arm, and pointer stay literal geometry on their true axis.
origin=(-1.8,-.51,.114)
gear=empty('C__SupplyGear',origin);arm=empty('C__SupplyArm',origin)
bpy.context.view_layer.update()
for o in list(bpy.data.objects):
 if o.name.startswith(('C fixed caliper wheel','C gear tooth')):reparent(o,gear)
 if o.name.startswith(('C fixed brass supply arm','C pinned supply end')):reparent(o,arm)
for f in range(1,67):
 u=smooth((f-3)/28)
 outcome.location.z=.105+(.28/1.51)*u
 outcome.keyframe_insert('location',frame=f)
 for o,t in [(arm,-.45),(gear,-.90)]:
  o.rotation_euler.z=t*u;o.keyframe_insert('rotation_euler',frame=f)
for slot,x in zip('ABC',(-1.96,0.,1.96)):
 box('TouchTab_'+slot,plaster,(x,-1.957,.101),(.72,.25,.065))
 box('F07 front stock tab attachment '+slot,black,(x,-1.860,.087),(.84,.15,.070))
 text('F07 letterpress '+slot,slot,(x,-2.000,.137),.113,ink)
s['Revision scope']='Living Book F07 only. A plan, B cost, C supply, no new lore or private testimony.'
s.render.fps=24;s.frame_start=1;s.frame_end=66;s.frame_set(1)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Palimpsest_F07_Challenger.blend'))
for o in list(bpy.data.objects):
 if o.type in {'LIGHT','CAMERA'} or any(c.name.startswith('04 •') for c in o.users_collection):
  bpy.data.objects.remove(o,do_unlink=True)
for c in bpy.data.curves:
 if isinstance(c,bpy.types.TextCurve) and c.font.name!='Bfont':
  font=next(iter(sorted(Path('/usr/share/fonts/truetype').glob('**/LiberationSerif-Regular.ttf'))),None)
  if font:c.font=bpy.data.fonts.load(str(font),check_existing=True)
bpy.ops.export_scene.gltf(filepath=str(out/'palimpsest-f07.glb'),export_format='GLB',
 export_animation_mode='SCENE',export_frame_range=True,export_force_sampling=True,
 export_cameras=False,export_lights=False,export_extras=False,export_normals=True)
