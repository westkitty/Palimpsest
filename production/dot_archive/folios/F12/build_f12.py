import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
from math import sin,cos,pi
P=Path(__file__).resolve().parent
S=bpy.context.scene
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
S.render.engine='CYCLES';S.cycles.use_denoising=False;S.cycles.samples=20;S.cycles.max_bounces=4;S.cycles.diffuse_bounces=2
S.render.threads_mode='FIXED';S.render.threads=3
S.render.resolution_x=1040;S.render.resolution_y=720;S.render.resolution_percentage=100;S.render.fps=18
S.view_settings.view_transform='AgX';S.world.use_nodes=True
bg=S.world.node_tree.nodes['Background'];bg.inputs[0].default_value=(.10,.12,.17,1);bg.inputs[1].default_value=.24
def mat(n,c,rough=.87,g=True,emit=None):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True
 p=m.node_tree.nodes;b=p['Principled BSDF'];l=m.node_tree.links
 b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=rough
 if emit:
  b.inputs['Emission Color'].default_value=(*emit[0],1);b.inputs['Emission Strength'].default_value=emit[1]
 if g:
  t=p.new('ShaderNodeTexNoise');t.inputs['Scale'].default_value=160;t.inputs['Detail'].default_value=2
  q=p.new('ShaderNodeBump');q.inputs['Strength'].default_value=.17;q.inputs['Distance'].default_value=.008
  l.new(t.outputs['Fac'],q.inputs['Height']);l.new(q.outputs['Normal'],b.inputs['Normal'])
 return m
stock=mat('Dyed-through black cardstock',(.018,.022,.032))
ink=mat('Printed soft ivory',(.74,.66,.51),g=False)
gold=mat('Pigmented brass paper foil',(.54,.34,.13),.54)
rust=mat('Dark crimson fiber',(.21,.043,.035))
red=mat('Cut oxblood cardstock',(.36,.082,.067))
slate=mat('Layered war slate paper',(.09,.104,.139))
night=mat('Blue charcoal endpaper',(.041,.051,.071))
deep=mat('Storm horizon charcoal',(.036,.043,.062))
rust2=mat('Rust scenic card',(.10,.033,.035))
desk=mat('Desk',(.060,.061,.071))
def obj(n,data=None,p=None):
 o=bpy.data.objects.new(n,data);S.collection.objects.link(o);o.parent=p;return o
def mesh(n,verts,faces,m,p=None):
 me=bpy.data.meshes.new(n);me.from_pydata(verts,[],faces);me.update()
 o=obj(n,me,p);o.data.materials.append(m);return o
def plate(n,xy,z,m,p=None,th=.025):
 o=mesh(n,[(x,y,z) for x,y in xy],[list(range(len(xy)))],m,p)
 if th:
  sm=o.modifiers.new('Paper thickness through the cut','SOLIDIFY');sm.thickness=th;sm.offset=0
 return o
def box(n,loc,dim,m,p=None,bev=False):
 x,y,z=(d/2 for d in dim)
 o=mesh(n,[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m,p);o.location=loc
 if bev:
  b=o.modifiers.new('Compressed card corners','BEVEL');b.width=min(dim)*.20;b.segments=2
 return o
def polyline(n,points,r,m,p=None):
 d=bpy.data.curves.new(n,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=1
 sp=d.splines.new('POLY');sp.points.add(len(points)-1)
 for pt,v in zip(sp.points,points):pt.co=(*v,1)
 o=obj(n,d,p);d.materials.append(m);return o
def circle(n,x,y,z,r,mat,p=None,width=.008):
 return polyline(n,[(x+r*cos(k*2*pi/80),y+r*sin(k*2*pi/80),z) for k in range(81)],width,mat,p)
def label(n,t,x,y,z,sz,m,p=None,align='CENTER'):
 d=bpy.data.curves.new(n,'FONT');d.body=t;d.size=sz;d.align_x=align;d.align_y='CENTER';d.space_character=1.13
 o=obj(n,d,p);o.location=(x,y,z);d.materials.append(m);return o
def rect(n,x,y,w,h,z,m,p=None):
 return polyline(n,[(x-w/2,y-h/2,z),(x+w/2,y-h/2,z),(x+w/2,y+h/2,z),(x-w/2,y+h/2,z),(x-w/2,y-h/2,z)],.0055,m,p)
def disc(n,x,y,r,z,m,p=None,N=64,th=.032):
 return plate(n,[(x+r*cos(k*2*pi/N),y+r*sin(k*2*pi/N)) for k in range(N)],z,m,p,th)
def key(o,prop,f):o.keyframe_insert(prop,frame=f)
S.render.resolution_x=1120;S.render.resolution_y=770
S.cycles.samples=24;S.view_settings.look='AgX - Medium High Contrast'
stock=mat('Black-dyed through cardstock',(.022,.024,.029))
cover=mat('Blue-black cover bookcloth',(.045,.077,.106))
coal=mat('Night pressed bookboard',(.029,.037,.057))
slate=mat('Post-war printed slate',(.080,.127,.178))
storm=mat('Dim blue of the registry shadow',(.102,.148,.188))
steel=mat('Muted azure paper bleed',(.085,.213,.275),.80)
azure=mat('Azure registration ink',(.123,.319,.388),.78)
husk=mat('Smoked paper beside mustard',(.339,.298,.213),.85)
wheat=mat('Wheat-gold foil',(.58,.42,.190),.67)
gold=mat('Light gold scored card edge',(.79,.615,.325),.73)
vellum=mat('Pale ivory archival folder',(.739,.653,.495))
pale=mat('Printed cream document stock',(.807,.749,.611))
ivory=mat('Ceremonial print',(.90,.85,.76),g=False)
charcoal=mat('Graphite letterpress on cream',(.036,.045,.057),g=False)
madder=mat('Restrained muted red archival index',(.260,.079,.071))
desk=mat('Blue gray oak reading table',(.051,.070,.090))
book=obj('F12 • Fixed editable review spread')
box('Reading desk',(0,0,-.31),(150,150,.30),desk)
box('Fabric bound book case',(0,0,-.106),(8.31,5.01,.27),cover,book,True)
for side in (-1,1):
 for i in range(6):
  box('Pressed page edge',(side*2.05,0,.029+i*.018),(4.00-i*.012,4.81-i*.013,.021),stock if i%2 else coal,book,True)
 box('Dyed-through black page',(side*2.04,0,.163),(3.98,4.75,.059),stock,book,True)
 rect('Impressed book page ruling',side*2.04,0,3.68,4.46,.195,wheat,book)
box('Central binding saddle',(0,0,.112),(.080,4.81,.067),coal,book,True)
for k in range(17):box('Thread sewn along gutter',(0,-2.21+k*.275,.155),(.062,.075,.025),wheat,book,True)
# Broken horizon, source's leaves do not meet: clear central gap at every layer.
for side in (-1,1):
 for i,(y,z,h,m) in enumerate([(2.12,.204,1.41,coal),(2.02,.207,1.19,slate),(1.88,.213,.92,storm)]):
  apex=side*(2.10+i*.09);g=obj('Signed but not joined • separate horizon leaf',p=book);g.location=(apex,y,z);g.rotation_euler.x=math.radians(80-i*6)
  pts=[(-1.55,0),(1.55,0),(1.55,.52*h),(1.22,.66*h),(.86,.79*h),(.47,.88*h),(-.08,h),(-.56,.90*h),(-1.05,.69*h),(-1.55,.60*h)]
  if side==1:pts=[(-x,v) for x,v in pts[::-1]]
  plate('No bridge across the gutter • cut & printed card',pts,0,m,g,.037)
  polyline('Backing sheet printed registration band',[(-1.45,.04,.024),(1.45,.04,.024)],.008,wheat,g)
  box('Stock footer left',(apex-.98,y-.065,.211),(.24,.30,.040),cover,book,True)
  box('Stock footer right',(apex+.98,y-.065,.211),(.24,.30,.040),cover,book,True)
# Small dawn disc only on page left, supported by a cut paper strut.
rise=obj('Dawn-slate archival theatrical border, not literal geography',p=book);rise.location=(-2.55,1.89,.251);rise.rotation_euler.x=math.radians(79)
disk=[(.31*cos(i*pi/32),.82+.31*sin(i*pi/32)) for i in range(64)]
plate('Muted dawn paper circle',disk,.034,gold,rise,.023)
box('Dawn disc paper support',(0,.395,.021),(.040,.79,.038),husk,rise)
# Left page: take the manifest's rhetorical separated claims, static in this candidate.
label('Spread ordinal','FOLIO XII  /  POST-WAR RECORD',-3.64,1.13,.206,.100,gold,book,'LEFT')
label('Spread title','THE UNFINISHED',-3.65,.865,.207,.312,ivory,book,'LEFT')
label('Spread title second line','PEACE',-3.65,.458,.207,.380,ivory,book,'LEFT')
polyline('Gold archival heading rule',[(-3.64,.18,.209),(-.49,.18,.209)],.006,wheat,book)
label('Context origin','A  /  EDITORIAL SEPARATION',-3.64,-.032,.207,.098,gold,book,'LEFT')
for x,back,t1,t2,im,sem in [(-2.86,pale,'CONTAINMENT','ACHIEVED',charcoal,'I'),(-1.29,slate,'HARM NOT','ENDED',ivory,'II')]:
 box('Separate stationary source claim '+sem,(x,-.588,.238),(1.43,.55,.072),back,book,True)
 label('Source claim line '+sem,t1,x,-.512,.282,.104,im,book)
 label('Source claim line '+sem,t2,x,-.677,.282,.126,im,book)
 box('Raised dovetail guide of sorted claims',(x,-.91,.219),(1.59,.048,.037),cover,book,True)
# B abstract, no recipe, procedure, measurements, materials or driven circuit.
box('B / abstract stationary diagram card',(-2.04,-1.49,.237),(3.23,.68,.070),coal,book,True)
for n in range(3):
 circle('Static isolated mono-print ring',-3.23,-1.48,.281,.08+.046*n,azure,book,.012)
box('Crimson printer dash',(-3.23,-1.48,.281),(.078,.048,.010),madder,book)
label('B static annotation','B  /  SYMBOLIC STARSILK STUDY',-2.94,-1.423,.279,.102,ivory,book,'LEFT')
label('B motion not depicted','CONTEXT PLATE',-2.94,-1.605,.278,.086,gold,book,'LEFT')
label('Binding footing','ADMINISTRATION  /  ILLUSTRATED HISTORY OF THE ALL',-3.64,-2.02,.207,.072,wheat,book,'LEFT')
# C final archive: recessed interior and bright mat below the lifted single
# cardstock cover. Cover rotates as a single object on an unchanged spine pin.
cx=2.00; hy=1.07; pz=.377
box('C broad bonded archival pocket footing',(cx,-.33,.225),(3.38,3.07,.060),rim if 'rim' in globals() else cover,book,True)
box('C thick wheat archival pocket',(cx,-.406,.275),(3.15,2.84,.066),wheat,book,True)
box('C interior black printed docket backer',(cx,-.395,.313),(3.00,2.70,.043),slate,book,True)
rect('C recessed perimeter',cx,-.385,2.94,2.63,.339,husk,book)
# The record is not a hidden maker inscription: it is plainly named, accessible via public flap.
box('C interior record stationery',(cx,-.05,.343),(2.71,1.67,.027),pale,book,True)
label('Public archive heading','SYRIN 4 GENOCIDE RECORD',cx,.593,.363,.152,charcoal,book)
polyline('Archive register line',[(.78,.435,.365),(3.22,.435,.365)],.006,husk,book)
entries=[(.273,'SYRIN 4','DESTRUCTION RECORDED'),(-.180,'KAIL','LAST KNOWN SURVIVING INITIATE')]
for y,title,desc in entries:
 box('Stationery entry tick',(.83,y,.367),(.048,.138,.012),madder,book,True)
 label('Archive entry • '+title,title,.939,y+.016,.365,.108,charcoal,book,'LEFT')
 label('Archive recorded status '+title,desc,.939,y-.130,.366,.088,charcoal,book,'LEFT')
label('Do not infer an exact count or day','EXACT DATE AND CASUALTY COUNT UNRECORDED',cx,-.659,.365,.073,husk,book)
# Closing imprint has its own frame, palette and header; distinct from the record.
box('Distinct institutional closing inset',(cx,-1.26,.347),(2.71,.54,.036),cover,book,True)
rect('Pressed band around official imprint',cx,-1.262,2.56,.413,.372,wheat,book)
label('Institutional imprint caption','ADMINISTRATION  /  CLOSING IMPRINT',cx,-1.156,.374,.077,gold,book)
label('Exact closing slogan','Your fate is in our hands.',cx,-1.371,.375,.131,ivory,book)
# Cut-cover opens toward the rear and reveals the paper beneath.
hinge=obj('C · archival leaf crease pivot',p=book);hinge.location=(cx,hy,pz)
w=3.04;L=2.91
plate('C single physical archival cardstock leaf',[(-w/2+.075,-L),(w/2-.075,-L),(w/2,-L+.080),(w/2,0),(-w/2,0),(-w/2,-L+.08)],0,vellum,hinge,.040)
rect('C archival cover letterpress perimeter',0,-1.435,2.77,2.57,.023,husk,hinge)
for y in (-.71,-1.96):polyline('C facade horizontal printed rule',[(-1.18,y,.025),(1.18,y,.025)],.006,wheat,hinge)
label('Soft identifying entry','FINAL ARCHIVAL LEAF',0,-.49,.027,.165,charcoal,hinge)
label('Closed heading file taxonomy','POSTWAR FILE',0,-1.60,.027,.166,charcoal,hinge)
label('Closed heading drawing author','SYRIN 4  /  KAIL',0,-1.80,.025,.100,charcoal,hinge)
for r in (.16,.29,.37):circle('Sewn file closure emblem',0,-1.22,.026,r,husk,hinge,.009)
for q in (-1,1):polyline('Closure symbol stops at divided line',[(q*.05,-1.22,.036),(q*.29,-1.22,.036)],.009,azure,hinge)
box('C rising tab',(0,-L-.038,.010),(.64,.20,.059),steel,hinge,True)
label('Visible physical lift tab','C  /  LIFT',0,-L-.046,.045,.112,ivory,hinge)
# Draw dots beneath the cover as letterpress on its reverse side, not a secret.
pill=box('Reverse-side printed folio plaque',(0,-1.56,-.026),(2.23,.33,.013),husk,hinge,True)
backlabel=label('Reverse-side printed title','FINAL ARCHIVAL LEAF',0,-1.56,-.036,.126,ivory,hinge)
backlabel.rotation_euler.x=math.pi
polyline('C paper-side visible hinge crease',[(-1.52,-.018,.026),(1.52,-.018,.026)],.012,gold,hinge)
polyline('C bonded stationary hinge pin',[(cx-1.54,hy,pz),(cx+1.54,hy,pz)],.021,wheat,book)
for x in (cx-1.36,cx+1.36):
 box('Crease pin fixed anchorage',(x,hy+.045,pz-.055),(.17,.19,.14),slate,book,True)
# 0° -> 105° -> held. Keyframes do not animate the fixed annotations or court record.
def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
S.frame_start=1; S.frame_end=84
for f in range(1,85):
 a=ease((f-7)/43)
 hinge.rotation_euler.x=-math.radians(105)*a;key(hinge,'rotation_euler',f)
for title,f in [('01 / Sealed institutional folder',1),('02 / The attached leaf turns',25),('03 / Public archive and closing imprint',67)]:
 S.timeline_markers.new(title,frame=f)
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def area(n,p,t,power,size,c):
 d=bpy.data.lights.new(n,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=c
 o=obj(n,d);o.location=p;aim(o,t)
area('Warm offscreen reading key',(-3,-4.5,7),(0,0,.36),790,6,(1,.80,.60))
area('Muted blue book edge fill',(5,-3.5,5),(0,0,.43),505,4.5,(.59,.78,1))
area('Paper rear light',(-1,4.4,5),(0,0,.55),470,4.0,(.67,.82,1))
def camera(n,p,t,size):
 d=bpy.data.cameras.new(n);d.type='ORTHO';d.ortho_scale=size
 o=obj(n,d);o.location=p;aim(o,t);return o
wide=camera('01 / Matched review camera',(-2.7,-8.6,9.8),(0,.15,.77),11.16)
close=camera('02 / Archival reading proof',(2.36,-5.3,7.0),(2.0,-.29,.54),4.24)
S.camera=wide
S['source_commit']='41dddee6383d94e8ce0f68303a506cd9290225ee'
S['scope']='C archival flap mechanism; stationary A and symbolic B. Public record and distinct closing imprint. No narration, canon edits, or hidden maker testimony.'
S.render.image_settings.file_format='PNG'
S.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Palimpsest_F12_The_Unfinished_Peace.blend'))
if '--render' in sys.argv:
 for fn,f,c in [('F12_01_Sealed',1,wide),('F12_02_Crease',25,wide),('F12_03_Hero_Unsealed',67,wide),('F12_04_Record_Detail',67,close)]:
  if '--only-open' in sys.argv and f==1: continue
  S.camera=c;S.frame_set(f);S.render.filepath=str(P/(fn+'.png'));bpy.ops.render.render(write_still=True)
