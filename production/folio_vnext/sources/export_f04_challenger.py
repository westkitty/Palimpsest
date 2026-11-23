"""Open the reviewed F04 candidate, author separate motions on a new copy, export public mesh."""
import bpy, math, sys
from mathutils import Vector
from pathlib import Path
out=Path(sys.argv[sys.argv.index('--')+1])
out.mkdir(exist_ok=True,parents=True)
s=bpy.context.scene
def material(n,c,metal=0.,emission=0.):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True
 x=m.node_tree.nodes.get('Principled BSDF')
 x.inputs['Base Color'].default_value=(*c,1);x.inputs['Roughness'].default_value=.78;x.inputs['Metallic'].default_value=metal
 x.inputs['Emission Color'].default_value=(*c,1);x.inputs['Emission Strength'].default_value=emission
 return m
def box(n,m,where,size,parent=None):
 bpy.ops.mesh.primitive_cube_add(size=1)
 o=bpy.context.object;o.name=n;o.parent=parent;o.location=where;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(m)
 return o
def empty(n,loc=(0,0,0)):
 o=bpy.data.objects.new(n,None);s.collection.objects.link(o);o.location=loc;return o
def text(n,t,location,size,mat):
 d=bpy.data.curves.new(n,'FONT');d.body=t;d.size=size;d.align_x='CENTER';d.align_y='CENTER';d.materials.append(mat)
 o=bpy.data.objects.new(n,d);s.collection.objects.link(o);o.location=location;return o
def rail(n,a,b,w,mat):
 a=Vector(a);b=Vector(b)
 o=box(n,mat,(a+b)*.5,(w,w,(b-a).length))
 o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def ease(x):
 t=max(0,min(1,x));return t*t*(3-2*t)
charcoal=material('F04-cut-edge-charcoal',(.024,.041,.040))
deep=material('F04-ink-evergreen',(.033,.127,.090))
plaster=material('F04-cut-paper-paperwhite',(.77,.65,.40))
edge=material('F04-letterpress-gold',(.68,.39,.131),.18)
black=material('F04-matte-closed-aperture',(.055,.076,.063))
shell=material('F04-anonymous-world-grey-green',(.16,.26,.19))
warm=material('F04-saffron-printed-backlight',(.93,.59,.149),.02,.34)
titles=material('F04-ink-on-tab',(.040,.048,.038))
for o in list(bpy.data.objects):
 if o.name.startswith(('Codec source','B • Codec editorial model')):
  bpy.data.objects.remove(o,do_unlink=True)
# Preserve real A colony and C six-link candidate. Raise A's moving axle
# inside two physically mounted guide tracks before turning the tall city.
pivot=next(o for o in bpy.data.objects if o.name.startswith('A • representative colony'))
pivot.name='A__ColonyCardAndLift'
axle=next(o for o in bpy.data.objects if o.name.startswith('A mechanically pinned axle'))
axle.parent=pivot;axle.location=(0,0,0)
for x in (-2.24,-.68):
 for y in (.191,.289):
  box('F04 paired upright guide cheek',edge,(x,y,.464),(.057,.034,.686))
 box('F04 guide head clip',charcoal,(x,.240,.814),(.098,.135,.037))
 box('F04 guide substrate foot',deep,(x,.240,.102),(.132,.174,.065))
# A small open spine/slide-rail station replaces the rejected actor.
# Five lamps are schematic teaching detents, not an asserted world count.
arrows=sorted([o for o in bpy.data.objects if o.name.startswith('B • counter-Macro printed arrow')], key=lambda o:o.location.y)
for i,o in enumerate(arrows):o.name='B__RouteSlider%02d'%(i+1)
box('F04 Expansion assembly graphite bed',charcoal,(0,.66,.096),(1.24,1.00,.062))
box('F04 Expansion raised vellum badge',deep,(0,1.065,.270),(1.30,.045,.316))
label=text('F04 route public heading','EXPANSION', (0,1.034,.354),.097,plaster)
label.rotation_euler.x=math.pi/2
box('F04 Expansion forward paper stratum',deep,(0,.912,.145),(1.28,.32,.079))
pts=[(-.521,.765,.238),(-.260,.838,.321),(0,.747,.275),(.260,.835,.347),(.521,.760,.257)]
for i in range(4): rail('F04 printed route connective',pts[i],pts[i+1],.012,edge)
# Visible perforated echo strip: actual gaps in the cardstock web.
REGISTER_Y=-.80
box('F04 perforated register bonded to leaf',black,(0,REGISTER_Y,.097),(1.214,.176,.056))
for y in (REGISTER_Y-.074,REGISTER_Y+.074):
 box('F04 uninterrupted inked rail beside apertures',edge,(0,y,.133),(1.206,.035,.020))
for i in range(6):
 box('F04 die-cut stock between wells',charcoal,((i-2.5)*.225,REGISTER_Y,.134),(.075,.111,.022))
for i,(x,y,z) in enumerate(pts):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.115,location=(x,y,z))
 o=bpy.context.object;o.name=f'F04 dark faceted planetary marker {i+1}';o.data.materials.append(shell)
 bpy.ops.mesh.primitive_torus_add(major_segments=20,minor_segments=5,major_radius=.126,minor_radius=.012,location=(x,y+.028,z),rotation=(math.pi/2,0,0))
 o=bpy.context.object;o.name=f'F04 die-cut meridian registration {i+1}';o.data.materials.append(edge)
 box('F04 marker page stem',deep,(x,y,z*.5),(.037,.043,z))
 bulb=empty(f'B__Lamp{(i+1):02d}',(x,y-.009,z))
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.116)
 o=bpy.context.object;o.name='F04 laminated amber planet lamp';o.parent=bulb;o.location=(0,0,.0015);o.data.materials.append(warm)
 echo=empty(f'B__Echo{(i+1):02d}',((i-2)*.225,REGISTER_Y,.146))
 box('F04 selected amber register aperture',warm,(0,0,0),(.144,.077,.012),echo)
 for fr in range(1,67):
  f=ease((fr-(4+i*7))/3.5)
  for enc in (bulb,echo):
   enc.scale=(.003+.997*f,)*3;enc.keyframe_insert('scale',frame=fr,group='B • expansion')
for i,o in enumerate(arrows):
 for fr in range(1,67):
  o.location.x=-.22+.45*ease((fr-(3+i*3))/21)
  o.keyframe_insert('location',frame=fr,group='B • route translation')
# Physical touch objects are part of the author's mesh, not runtime substitutes.
for slot,x in zip('ABC',(-1.96,0.,1.96)):
 grip=box('TouchTab_'+slot,plaster,(x,-1.957,.10),(.72,.25,.065))
 box('F04 dark mounting slot '+slot,charcoal,(x,-1.862,.084),(.86,.136,.072))
 text('F04 pull tab letter '+slot,slot,(x,-2.000,.135),.115,titles)
# The actual chosen candidate C strip is retained; re-label in runtime ABI,
# preserving all sampled keyed positions of its six leaf joints.
for i,o in enumerate(sorted([n for n in bpy.data.objects if n.name.startswith('C hinge • leaflet')],key=lambda n:n.name)):
 o.name='C__Leaf%02d'%(i+1)
for fr in range(1,67):
 # Lift before turning to clear maximum city height and lowered paper ridge.
 pivot.location.z=.31+.49*ease((fr-1)/10.)
 pivot.rotation_euler.x=math.pi*ease((fr-10)/21.)
 pivot.keyframe_insert('location',frame=fr,group='A • lift')
 pivot.keyframe_insert('rotation_euler',frame=fr,group='A • flip')
# Rename human-facing collection containing the tracked rails, not sensitive source.
for c in bpy.data.collections:
 if c.name.startswith('02 •'): c.name='02 • Expansion rails and independent teaching fixtures'
s['Scope']='Living Book F04 only; no Codec. Editable candidate geometry; independent A colony, B route lights, C verification fold.'
s['A']='Frames 1–31 real lift-and-turn clearing the page.'
s['B']='Frames 1–38 keep a growing set of anonymous teaching lights; readers can pause.'
s['C']='Existing candidate six crease linkages (frames 1–28 opening).'
s.frame_set(1)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Palimpsest_F04_Challenger.blend'))
# Public runtime export excludes studio, no supplemental private items are exported.
for o in list(bpy.data.objects):
 if o.type in {'LIGHT','CAMERA'} or any(c.name.startswith('04 •') for c in o.users_collection):
  bpy.data.objects.remove(o,do_unlink=True)
for c in bpy.data.curves:
 if isinstance(c,bpy.types.TextCurve) and c.font.name!='Bfont':
  font=next(iter(sorted(Path('/usr/share/fonts/truetype').glob('**/LiberationSerif-Regular.ttf'))),None)
  if font:c.font=bpy.data.fonts.load(str(font),check_existing=True)
s.render.fps=24;s.frame_start=1;s.frame_end=66;s.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(out/'palimpsest-f04.glb'),export_format='GLB',
 export_animation_mode='SCENE',export_frame_range=True,export_force_sampling=True,
 export_cameras=False,export_lights=False,export_extras=False,export_normals=True)
