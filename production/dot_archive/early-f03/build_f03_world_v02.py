import bpy, math, sys
from mathutils import Vector, Matrix
from math import sin,cos,pi,sqrt
from pathlib import Path
out=Path(__file__).parent
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.samples=36; sc.cycles.use_denoising=False
sc.render.threads_mode='FIXED'; sc.render.threads=8
sc.world.color=(.12,.12,.12)
sc.view_settings.view_transform='AgX'
sc.render.resolution_percentage=100; sc.render.resolution_x=900; sc.render.resolution_y=650
sc.render.fps=15; bpy.context.preferences.filepaths.save_version=0
def mat(name,c,rough=.82,grain=False):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
 n=m.node_tree.nodes; l=m.node_tree.links; b=n.get('Principled BSDF');b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=rough
 if grain:
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=155;tex.inputs['Detail'].default_value=2
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.21;bump.inputs['Distance'].default_value=.022
  l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],b.inputs['Normal'])
 return m
stock=mat('Black dyed-through cardstock',(.014,.018,.029),grain=True)
back=mat('Cover • charcoal bookcloth',(.06,.071,.09),grain=True)
paper=mat('Indigo paper • cut edges retain pigment',(.095,.132,.23),grain=True)
paper2=mat('Slate blue paper • opposite face',(.138,.188,.309),grain=True)
paper3=mat('Folded landscape • indigo',(.057,.083,.159),grain=True)
cyan=mat('Printed teal ink, not emission',(.075,.58,.60))
ink=mat('Warm printed gold',(.64,.393,.135))
globe_a=mat('World • blue-violet dyed stock',(.099,.148,.285),grain=True)
globe_b=mat('World • ash-teal dyed stock',(.063,.242,.266),grain=True)
globe_c=mat('World • pale slate facet',(.256,.301,.40),grain=True)
globe_d=mat('World • ink-violet facet',(.19,.116,.265),grain=True)
cream=mat('Cream registration ink',(.75,.73,.62))
dark=mat('Desk • muted warm charcoal',(.086,.067,.060),grain=True)
def box(n,xyz,s,m,p=None):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=n;o.parent=p;o.location=xyz;o.dimensions=s
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 b=o.modifiers.new('Soft paper edge','BEVEL');b.width=min(s)*.19;b.segments=2
 return o
def mesh(n,vs,fs,m,p=None,th=.012):
 d=bpy.data.meshes.new(n);d.from_pydata(vs,[],fs);d.update();o=bpy.data.objects.new(n,d);sc.collection.objects.link(o);o.parent=p;o.data.materials.append(m)
 if th:
  s=o.modifiers.new('Card thickness','SOLIDIFY');s.thickness=th;s.offset=0
 return o
def empty(n):
 o=bpy.data.objects.new(n,None);sc.collection.objects.link(o);return o
def poly(n,xy,z,m,p,th=.012):
 return mesh(n,[(x,y,z) for x,y in xy],[list(range(len(xy)))],m,p,th)
def text(n,body,xyz,size,m,p=None):
 d=bpy.data.curves.new(n,'FONT');d.body=body;d.size=size;d.space_character=1.22
 o=bpy.data.objects.new(n,d);sc.collection.objects.link(o);o.parent=p;o.location=xyz;o.data.materials.append(m);return o
def line(n,points,w,m,p):
 c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.resolution_u=1;c.bevel_depth=w;c.bevel_resolution=1
 s=c.splines.new('POLY');s.points.add(len(points)-1)
 for v,x in zip(s.points,points):v.co=(*x,1)
 o=bpy.data.objects.new(n,c);sc.collection.objects.link(o);o.parent=p;o.data.materials.append(m);return o
def disc(n,center,r,m,p,nseg=48):
 x,y,z=center;return poly(n,[(x+r*cos(2*pi*i/nseg),y+r*sin(2*pi*i/nseg)) for i in range(nseg)],z,m,p)
def register(n,x,y,z,s,p):
 line(n+' • split-ring mark',[(x+s*cos(2*pi*k/32),y+s*sin(2*pi*k/32),z) for k in range(3,30)],.013,cyan,p)
 line(n+' • index tick',[(x+s*.6,y,z),(x+s*1.35,y,z)],.014,cyan,p)
left,right=empty('Left leaf • rotates at spine'),empty('Right leaf • fixed at spine')
cover=empty('Closed face • dies and title')
for p,x in [(left,-1.34),(right,1.34)]:
 box('Paper leaf', (x,0,-.021),(2.66,3.46,.042),stock,p)
 box('Book board', (x,0,-.093),(2.75,3.60,.11),back,p)
 for j in range(4):
  box('Visible black paper edge', (x,0,-.042-j*.009),(2.69-j*.006,3.49,.004),paper3 if j%2 else stock,p)
# cover on the back of the rotating left leaf, normal flips toward the viewer at close
box('Folios • cover label panel',(-1.30,0,.001),(1.96,1.15,.014),paper3,cover)
text('Cover title','PALIMPSEST',(-2.12,.14,.014),.25,cream,cover)
text('Cover subtitle','F03   /   FOLD STUDY',(-2.10,-.22,.014),.112,ink,cover)
line('Cover rule',[(-2.10,.044,.02),(-.48,.044,.02)],.011,ink,cover)
# spread labels and trace
for p,x,h1,h2 in [(left,-2.42,'WorldsVault','01  /  SOURCE TEMPLATE'),(right,.22,'NOTEBOOK PROGRAM','02  /  TURN THE PAPER DIE')]:
 text(h1,h1,(x,-1.27,.005),.185,cream,p)
 text(h2,h2,(x,-1.49,.006),.086,ink,p)
 line('Page rule',[(x,-1.34,.008),(x+1.92,-1.34,.008)],.006,ink,p)
# paper template with keyed notch; the same mark on lifted cut cardstock
tx,ty=-1.85,.35
poly('WorldsVault • bound sleeve',[(tx-.51,ty-.64),(tx+.54,ty-.64),(tx+.54,ty+.67),(tx-.51,ty+.67)],.025,paper3,left)
template=empty('Template • pull-tab')
template.parent=left
poly('Template • scored stock',[(-.37,-.38),(.39,-.38),(.39,.38),(.1,.38),(.03,.25),(-.12,.38),(-.37,.38)],.047,paper2,template)
box('Template pull tab',(0,-.52,.052),(.43,.33,.026),ink,template)
register('Source registration',0,.01,.06,.14,template)
line('Template fold',[(-.29,-.13,.057),(.29,-.13,.057)],.007,paper3,template)
# shallow rotary paper die, flourishes are ink
wheel=empty('Notebook • rotating cardstock wheel');wheel.parent=right;wheel.location=(1.84,.20,.053)
disc('Wheel • die-cut outer', (0,0,0),.52,paper,wheel,18)
disc('Wheel • overlay', (0,0,.016),.43,paper3,wheel)
for i in range(12):
 a=i*2*pi/12;r=.38
 line('Wheel printed radials',[(.29*cos(a),.29*sin(a),.033),(r*cos(a),r*sin(a),.033)],.012,ink,wheel)
register('Wheel index',0,0,.034,.18,wheel)
for p,s in [(left,-1),(right,1)]:
 line('Printed path from fold to mechanism',[(s*1.58,-.38,.015),(s*1.40,-.56,.015),(s*.91,-.56,.015)],.010,cyan,p)
L=1.36; d=1.02
for leaf,hinge_x,side in [(left,-d,-1),(right,d,1)]:
 for y in [-.38,.38]:
  box('Bonded tab • anchored on page',(hinge_x+side*.058,y,.018),(.12,.18,.018),ink,leaf)

lwing,rwing=empty('Left V-fold panel • hinged to leaf and shared ridge'),empty('Right V-fold panel • hinged to leaf and shared ridge')
# planar panel skins; continuous length L pivot to pivot
for p,col in [(lwing,paper),(rwing,paper2)]:
 poly('Main die-cut panel',[(0,-.53),(.20,-.66),(.46,-.59),(.61,-.71),(.86,-.63),(L,-.49),(L,.52),(1.04,.66),(.84,.61),(.63,.72),(.36,.65),(0,.52)],0,col,p,.014)
 for off in [-1,1]:
  # visibly scored asymmetrical ridges cut from separately folded glued backing
  yy=.25*off
  mesh('Folded shade band',[(.10,yy-.12,.014),(.40,yy-.09,.027),(.62,yy+.04,.055),(.90,yy-.06,.025),(L-.09,yy+.1,.016),(.86,yy+.19,.014),(.43,yy+.16,.014)],[(0,1,6),(1,2,6),(2,5,6),(2,3,5),(3,4,5)],paper3,p,.009)
  line('Scored ink line',[(.1,yy-.12,.014),(.4,yy-.09,.029),(.62,yy+.04,.058),(.90,yy-.06,.028)],.007,ink,p)
 if p==lwing: register('Output registration',.68,0,.023,.17,p)
 hinge=0 if p==lwing else L
 for y in [-.38,.38]:
  box('Fold root tab',(hinge,y,0),(.11,.19,.018),ink,p)

def driver(obj,path,index,expression):
 d=obj.driver_add(path,index).driver
 d.type='SCRIPTED'
 v=d.variables.new();v.name='w';v.type='SINGLE_PROP';v.targets[0].id=wheel;v.targets[0].data_path='rotation_euler[2]'
 d.expression=expression
# A scored two-leaf globe glued to the moving right panel. Each half folds
# out of the same printed circle and rotates around its straight paper crease.
tray=empty('03 • World output, mounted to V-fold');tray.parent=rwing;tray.location=(.66,.025,.026)
camFollower=empty('Die follower • visible proof of wheel linkage')
camFollower.parent=right;camFollower.location=(1.23,.20,.037)
box('Die follower • toothed paper strip',(-.15,0,0),(.43,.17,.018),paper2,camFollower)
for x in [-.30,-.19,-.08,.03]:
 box('Rack tooth',(x,.089,0),(.045,.065,.017),ink,camFollower)
driver(camFollower,'location',0,'1.23+0.17*w')
for yy in [-.40,.40]:
 box('Scored card spine • folded over output hinge',(0,yy,.009),(.15,.13,.018),ink,tray)
# Printed ring is only an ink mark in the pre-variation state.
line('Flat output register',[(.496*cos(i*2*pi/64),.496*sin(i*2*pi/64),.005) for i in range(65)],.008,ink,tray)
line('Shared globe valley crease',[(0,-.471,.020),(0,.471,.020)],.009,ink,tray)
# geometric topography cut from small colored segments, not a smooth 3D sphere.
for side in [-1,1]:
 h=empty(('Western' if side<0 else 'Eastern')+' world panel • driven by Notebook wheel')
 h.parent=tray;h.location=(0,0,.024)
 angles=[-pi/2+i*pi/12 for i in range(13)]
 shape=[(side*.451*cos(a),.474*sin(a)) for a in angles]
 poly('Notched hemisphere • flat die-cut paper',shape,0,globe_a if side<0 else globe_b,h,.019)
 center=(side*.072,-.07,.015)
 cols=[globe_b,globe_c,globe_a,globe_d,globe_a,globe_c,globe_b,globe_d,globe_c,globe_b,globe_a,globe_c]
 for i in range(12):
  (x0,y0),(x1,y1)=shape[i],shape[i+1]
  poly('Printed tectonic zone',[(center[0],center[1]),(x0*.95,y0*.95),(x1*.95,y1*.95)],.016,cols[(i+(3 if side<0 else 0))%len(cols)],h,0)
 for yy in [-.24,.06,.25]:
  span=sqrt(max(.025,1-(yy/.47)**2))
  line('Score-aligned contour',[(0,yy,.022),(side*.16,yy+.045,.024),(side*.30*span,yy-.023,.024),(side*.405*span,yy+.007,.022)],.009,globe_d,h)
 # Identical registration curve halves; the source circle reappears split at the crease.
 arc=[(side*.187*cos(a),.187*sin(a),.027) for a in angles]
 line('Inherited teal ring',arc,.015,cyan,h)
 if side>0: line('Inherited index tick',[(.13,0,.027),(.256,0,.027)],.013,cyan,h)
 driver(h,'rotation_euler',1,('0.85' if side>0 else '-0.53')+'*w')
# A small printed title reads from the camera when the book is open.
text('Output credit','03  /  VARIANT',(.215,-.54,.025),.083,cream,rwing)
# geometric animation
def plane(obj,xaxis,origin,fr):
 x=Vector(xaxis).normalized();y=Vector((0,1,0));z=x.cross(y)
 q=Matrix((x,y,z)).transposed().to_quaternion()
 if obj.get('qset') and q.dot(obj.rotation_quaternion)<0: q.negate()
 obj['qset']=True;obj.rotation_mode='QUATERNION';obj.rotation_quaternion=q;obj.location=origin
 obj.keyframe_insert('rotation_quaternion',frame=fr);obj.keyframe_insert('location',frame=fr)
def sm(a):return a*a*(3-2*a)
def rig(fr,theta):
 th=math.radians(theta);f=pi/2-th
 def v(x,z):return Vector((cos(f)*x+sin(f)*z,0,-sin(f)*x+cos(f)*z))
 origin=Vector((0,0,.19))
 Xl=v(sin(th),-cos(th)); Xr=v(sin(th),cos(th))
 plane(left,Xl,origin,fr);plane(right,Xr,origin,fr)
 # Paint artwork on the moving cover's exterior, not on a floating overlay.
 cx=-Xl
 exterior=cx.cross(Vector((0,1,0)))
 plane(cover,cx,origin+cx*2.70+exterior*.153,fr)
 a=origin+v(-d*sin(th),d*cos(th));b=origin+v(d*sin(th),d*cos(th))
 ridge=origin+v(0,d*cos(th)+sqrt(L*L-d*d*sin(th)**2))
 plane(lwing,ridge-a,a,fr);plane(rwing,b-ridge,ridge,fr)
 assert abs((ridge-a).length-L)<1e-6 and abs((ridge-b).length-L)<1e-6

 def ramp(a,b): return sm(min(1,max(0,(step-a)/(b-a))))
 t=ramp(.02,.30)
 template.location=(tx,ty-.23*t,0);template.keyframe_insert('location',frame=fr)
 wheel.rotation_euler.z=-1.15*ramp(.34,1);wheel.keyframe_insert('rotation_euler',frame=fr)
# First open the book. After a hold, the template slides, the wheel turns,
# and the wheel's actual driven axis unfolds the scored globe panels.
sc.frame_start=1;sc.frame_end=108
for fr in range(1,109):
 t=0 if fr<=3 else sm((fr-3)/18) if fr<21 else 1 if fr<=92 else 1-sm((fr-92)/14) if fr<106 else 0
 step=0 if fr<24 else (fr-24)/41 if fr<65 else 1 if fr<=75 else 1-(fr-75)/16 if fr<91 else 0
 rig(fr,4+86*t)
# desk and camera
line('Cloth spine at page hinge',[(0,-1.79,.154),(0,1.79,.154)],.042,back,None)
box('Worktable',(0,0,-.185),(200,200,.2),dark)
def point(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
def area(n,loc,power,size,col,target=(0,0,0)):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=n;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=col;point(o,target)
area('Warm raking paper light',(-3,-3,6),900,4.0,(1,.84,.65))
area('Cool fill',(4,-.8,4),560,4.5,(.68,.82,1))
area('Back edge',(.1,4,5),850,3.0,(.90,.93,1))
bpy.ops.object.camera_add(location=(4.3,-8.7,8.9));cam=bpy.context.object;cam.name='Tablet reading angle';cam.data.type='ORTHO';cam.data.ortho_scale=8.4;point(cam,(.05,0,.74));sc.camera=cam
sc.frame_set(68)
sc.render.image_settings.file_format='PNG'
sc.cycles.max_bounces=4
sc.cycles.diffuse_bounces=2
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Palimpsest_F03_World_Reveal_v02.blend'))
for n,f in [('01-template',35),('02-wheel-engages',52),('03-world-unfolds',68)]:
 sc.frame_set(f);sc.render.filepath=str(out/(n+'.png'));bpy.ops.render.render(write_still=True)

sc.render.resolution_percentage=72
sc.cycles.samples=9
sc.render.filepath=str(out/'frames'/'f03_')
sc.frame_step=2
bpy.ops.render.render(animation=True)
