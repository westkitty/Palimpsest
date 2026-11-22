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
from mathutils import Matrix
S.render.resolution_x=1120;S.render.resolution_y=770
S.cycles.samples=22;S.view_settings.look='AgX - Medium High Contrast'
coal=mat('Dry black paper • unprinted aperture',(.005,.006,.009))
brass=mat('Warm crease print',(.52,.33,.154),.65)
ochre=mat('Amber stock front',(.72,.366,.055),.79)
honey=mat('Warm gold scored edge',(.95,.65,.245),.73)
copper=mat('Ochre shadow fold',(.43,.194,.039))
blue=mat('Cyan filament dyed fibre',(.028,.59,.72),.53,emit=((.017,.24,.32),.22))
dull=mat('Hairline cyan etching',(.025,.28,.33),.70)
vellum=mat('Pale ivory docket',(.77,.687,.56))
charcoal=mat('Pale graphite marks on cream',(.065,.082,.096))
desk=mat('Cool dark reading table',(.048,.066,.082))
stock=mat('Black-dyed through cardstock',(.018,.021,.028))
rim=mat('Pressed ink-blue board',(.038,.062,.087))
oxblood=mat('Faded crimson registration block',(.19,.046,.048),.87)
book=obj('F09 / Editable bound reading spread')
box('Reading desk',(0,0,-.29),(200,200,.30),desk,bev=False)
box('Fabric bound case',(0,0,-.105),(8.19,4.94,.26),rim,book,True)
for side in [-1,1]:
 for i in range(6):
  box('Layered page stack',(side*1.99,0,.032+i*.018),(3.94-i*.01,4.75-i*.012,.021),stock if i%2 else night,book,True)
 box('Upper black-dyed fold page',(side*2,0,.162),(3.89,4.71,.057),stock,book,True)
 rect('Pressed hairline border',side*2,0,3.61,4.43,.194,brass,book)
box('Bound central hinge',(0,0,.116),(.081,4.75,.062),rim,book,True)
for k in range(17):box('Visible saddle binding',(0,-2.22+k*.277,.158),(.056,.082,.024),brass,book)
# Midnight paper theatre, deliberately unprinted and starless behind mechanism.
for j,(y,h,m) in enumerate([(2.04,1.65,coal),(1.94,1.37,rim),(1.82,1.09,night)]):
 for side in [-1,1]:
  x=side*(2.36+j*.14)
  pro=obj('Backing card bonded to leaf '+str(j),p=book);pro.location=(x,y,.202);pro.rotation_euler.x=math.radians(79-j*5)
  plate('Deconstructed aperture shoulder', [(-1.39,0),(1.39,0),(1.39,h*.87),(.89,h),(.34,h*.92),(-.23,h*.77),(-.91,h*.55),(-1.39,h*.54)],0,m,pro,.040)
  polyline('Incised terraced edge',[(-1.27,.055,.027),(1.27,.055,.027)],.010,brass,pro)
  for k in [-1.08,.89]:box('Bonding foot',(x+k,y-.08,.207),(.24,.30,.043),rim,book,True)
# Big title and paper marginal ruling.
label('Folio code','FOLIO  IX',-3.50,-1.45,.205,.120,honey,book,'LEFT')
label('Published title',"THE HAL’VEN HELIOCIDE",-3.50,-1.81,.208,.259,ink,book,'LEFT')
label('Separation of model from event','MODEL STAR  /  NOT AN INDIVIDUAL HAL’VEN SUN',-3.50,-2.097,.204,.075,brass,book,'LEFT')
for j in range(5):
 box('Printer ornamental block',(2.36+j*.23,-2.08,.205),(.083,.099,.017),oxblood if j%2 else rim,book,True)
# A: deep aperture plus raised gimbal die-cut die, armillary structure stays when star goes dark.
sx,sy,sz=-1.95,.42,.94
for i,r in enumerate([1.25,1.12,.99]):
 disc('Slate die-cut mounting board',sx,sy,r,.211+.031*i,[rim,brass,coal][i],book,N=12,th=.04)
circle('Hairline border around black mounting socket',sx,sy,.299,.94,brass,book,.008)
for i in range(20):
 a=2*pi*i/20
 polyline('Printed dial graduation',[(sx+.82*cos(a),sy+.82*sin(a),.306),(sx+.89*cos(a),sy+.89*sin(a),.306)],.009,brass,book)
arm=obj('A / armillary enclosure • stationary',p=book);arm.location=(sx,sy,sz)
for j,(r,angle) in enumerate([(.91,36),(.80,65),(.715,113)]):
 a=obj('Bonded gimbal ring '+str(j),p=arm);a.rotation_euler=(math.radians(angle),0,j*.51)
 circle('Exposed brass lamination cut',0,0,0,r,brass,a,.023)
 circle('Fine inner lamination',0,0,.014,r-.037,honey,a,.008)
for x in (-.85,.85):
 box('Gimbal bridge buttress',(sx+x,sy,.48),(.18,.28,.45),rim,book,True)
 polyline('Gimbal pin scored brace',[(sx+x,sy-.085,.325),(sx+x,sy-.085,.755),(sx+x*.87,sy-.085,.81)],.020,brass,book)
# Star made from eight independently hinged scored folded card points. Each
# base remains on the common backing circle as the spokes fold toward its hub.
star=obj('A / golden paper MODEL STAR',p=arm);star.rotation_euler=(math.radians(64),0,math.radians(-14))
star_hinges=[]
for j in range(8):
 a=pi*j/4
 orient=obj('Stationary radial star attachment %02d'%j,p=star);orient.rotation_euler.z=a
 pivot=obj('A spoke shared crease %02d'%j,p=orient);pivot.location.y=.114
 star_hinges.append(pivot)
 length=.658 if j%2==0 else .49
 verts=[(-.155,0,0),(0,0,.047),(.155,0,0),(0,length,.021),(0,length*.46,.105)]
 left=mesh('Left panel of scored gold point',verts,[(0,1,4),(0,4,3)],ochre if j%2 else honey,pivot)
 right=mesh('Right panel of scored gold point',verts,[(1,2,4),(2,3,4)],copper if j%2 else ochre,pivot)
 for o in (left,right):
  so=o.modifiers.new('Rigid coloured card edge','SOLIDIFY');so.thickness=.021;so.offset=0
 polyline('Bright raised paper crease',[(0,0,.058),(0,length*.46,.117),(0,length,.034)],.009,honey,pivot)
disc('Gold die backing hub',0,0,.164,.012,ochre,star,18,.043)
bh=obj('A / permanent matte black singularity',p=arm)
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,radius=.276)
hole=bpy.context.object;hole.name='Dry obsidian model mark';hole.parent=bh;hole.location=(0,0,0);hole.data.materials.append(coal)
thin=obj('A / flat cyan accretion hairline',p=bh);thin.rotation_euler=(math.radians(14),math.radians(-14),math.radians(25))
circle('Restrained accretion hairline',0,0,0,.379,dull,thin,.011)
circle('Hairline brighter ink offset',0,0,.002,.362,blue,thin,.006)
# Actual pull-tab rides on bonded rails. Cyan strip's proximal point follows the
# state continuously; after disconnect the strip remains threaded to the tab.
track_y=-.91
for l in [-.139,.139]:
 box('Cardboard pull-tab receiver rail',(-1.76,track_y+l,.267),(2.99,.075,.085),rim,book,True)
 polyline('Pressed brass guide seam',[(-3.21,track_y+l,.312),(-.28,track_y+l,.312)],.006,brass,book)
for x in [-3.23,-.28]:
 box('Fixed endstop',(x,track_y,.264),(.104,.38,.086),brass,book,True)
tab=obj('A / cyan extraction pull tab · one-way',p=book);tab.location=(-.96,track_y,.31)
plate('Polygonal lockable pull grip',[(-.28,-.172),(.25,-.172),(.39,0),(.25,.172),(-.28,.172),(-.36,0)],0,blue,tab,.066)
circle('Cut-and-embroidered pull ring',.075,0,.049,.090,coal,tab,.019)
label('Physical control label','A',-.126,0,.046,.112,coal,tab)
filament=polyline('Moving cyan filament • independent from history chart',[(sx,sy,sz),(-1.57,.0,.64),(-1.31,-.40,.39),(-.96,track_y,.35)],.027,blue,book)
plaque=box('Pressed black model-label backing',(-2.84,1.55,.232),(1.65,.27,.039),rim,book,True)
label('Nonhistorical separation label','MODEL STAR',-2.84,1.55,.259,.141,ink,book)
label('Named mechanism','A  /  MODEL STAR FILAMENT',-1.81,-1.195,.204,.097,honey,book)
# B: static schematic mounted on a raised paper gate. C guide overlays beneath.
chart=obj('B / four-star source schematic • static context',p=book)
chart.location=(1.99,.70,.235);chart.rotation_euler.x=math.radians(34)
plate('Scored crimson folded chart board',[(-1.63,-.55),(1.63,-.55),(1.63,.62),(1.43,.91),(-1.52,.91),(-1.63,.70)],0,oxblood,chart,.056)
rect('Chart inner line',0,.11,2.94,1.16,.034,brass,chart)
for d in (-1.35,1.35):
 box('Raised chart mounting rail',(1.99+d,.69,.259),(.195,.88,.10),rim,book,True)
 polyline('Folded chart triangular support',[(1.99+d,.32,.267),(1.99+d,1.315,.583),(1.99+d,1.315,.267),(1.99+d,.32,.267)],.049,rim,book)
for j in range(4):
 x=-1.06+j*.70
 outer=disc('B / sourced schematic cradle no. '+str(j+1),x,.06,.241,.041,rim,chart,N=12,th=.044)
 circle('B / rings from existing four-star bar',x,.06,.075,.180,brass,chart,.009)
 coords=[]
 for k in range(16):
  a=2*pi*k/16;r=.137 if k%2==0 else .073;coords.append((x+r*cos(a),.06+r*sin(a)))
 plate('B / pre-collapse star emblem '+str(j+1),coords,.082,ochre,chart,.034)
label('Chart title','HAL’VEN  /  SCHEMATIC',0,.63,.039,.175,ink,chart)
label('Not population or star count','B   /   CLUSTER-WAVE TEACHING PLATE',0,.369,.040,.077,honey,chart)
# C source containment calipers as subdued, entirely static linework.
for r in [.37,.69,1.00]:
 pts=[(2.00+r*cos(pi*.20+pi*1.22*i/65),-.66+r*.54*sin(pi*.20+pi*1.22*i/65),.208) for i in range(66)]
 polyline('C / static containment caliper arc',pts,.009,brass,book)
for x in [1.02,2.98]:
 polyline('C / sensing slot axial guide',[(x,-1.13,.214),(x,-.61,.214),(x+.14,-.61,.214)],.011,dull,book)
label('C diagram caption','C  /  CONTAINMENT',2,-1.392,.204,.096,brass,book)
# One-way keyed rehearsal. Moving tab stretches line first; a short physical
# fold is followed by a latched black state with no return state on timeline.
def ease(t):
 t=min(1,max(0,t));return t*t*(3-2*t)
def vis(o,y):
 o.hide_render=not y
 o.hide_viewport=not y
def flist(o):return [o,*o.children_recursive]
spline=filament.data.splines[0]
S.frame_start=1;S.frame_end=96
for f in range(1,97):
 p=ease((f-9)/40)
 collapse=ease((f-38)/12)
 for j,piv in enumerate(star_hinges):
  piv.rotation_euler.x=math.radians(102)*collapse;key(piv,'rotation_euler',f)
 tab.location.x=-.96-1.64*p;key(tab,'location',f)
 for x in flist(star):
  vis(x,f<=48);key(x,'hide_render',f);key(x,'hide_viewport',f)
 for x in flist(bh):
  vis(x,f>=44);key(x,'hide_render',f);key(x,'hide_viewport',f)
 bh.scale=(max(.01,collapse),)*3;key(bh,'scale',f)
 # The taut fiber peels back toward the track rather than becoming a laser.
 withdraw=ease((f-37)/16)
 vv=[(sx+.49*withdraw,sy-1.15*withdraw,sz-.59*withdraw),(-1.57-.56*p,-.02-.77*withdraw,.64-.29*withdraw),(-1.31-.87*p,-.40-.48*withdraw,.39-.025*withdraw),(tab.location.x,track_y,.349)]
 for i,pnt in enumerate(spline.points):pnt.co=(*vv[i],1);pnt.keyframe_insert('co',frame=f)
for name,f in [('REST / visible gold cut-card star',1),('PULL / taut cyan thread',28),('TAKE / scored folds close inward',43),('LATCHED / black singularity',70),('HOLD / does not reset',96)]:
 S.timeline_markers.new(name,frame=f)
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,target,power,size,color):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
 o=obj(name,d);o.location=loc;aim(o,target)
area('Key • amber large softbox',(-3,-4,6),(0,0,.35),650,5.5,(1,.76,.54))
area('Reading fill',(4,-1,5),(0,0,.35),430,4.5,(.65,.83,1))
area('Cold edge card light',(0,3.3,4),(0,0,.55),410,4.0,(.51,.75,1))
def camera(name,loc,target,size):
 d=bpy.data.cameras.new(name);d.type='ORTHO';d.ortho_scale=size
 o=obj(name,d);o.location=loc;aim(o,target);return o
wide=camera('01 / Matched whole folio',(3.5,-8.65,9.2),(0,.12,.41),10.46)
close=camera('02 / Matched mechanism close',(-.09,-6.42,5.25),(-1.88,.24,.47),4.06)
S.camera=wide
S['source_commit']='41dddee6383d94e8ce0f68303a506cd9290225ee'
S['slot_A']='Explicitly nonhistorical Model Star. Once extracted, never restored in this rehearsal.'
S['slot_B_C']='Nonanimated, source-grounded historical diagram and containment context only.'
S['source_approval']='Private candidate, no runtime, voice, historical or canon edits.'
S.render.image_settings.file_format='PNG'
S.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Palimpsest_F09_The_HalVen_Heliocide.blend'))
if '--render' in sys.argv:
 for fn,f,c in [('F09_01_Model_Star',1,wide),('F09_02_Filament_Pull',28,wide),('F09_03_Fold_Close',43,wide),('F09_04_Latched_Absence',70,wide),('F09_05_Hero_Aperture',70,close),('F09_06_Star_Detail_Before',1,close)]:
  S.camera=c;S.frame_set(f);S.render.filepath=str(P/(fn+'.png'));bpy.ops.render.render(write_still=True)
