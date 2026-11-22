"""F02 candidate: pinned Palimpsest inherited forms, Blender 4.3.
Run in a clean process: blender -b -t 2 -P build_f02.py.
Only captures and the blend beside this script are written.
"""
import bpy, math, random, sys
from mathutils import Vector, Euler
from pathlib import Path
from math import sin, cos, pi, sqrt
D=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
s=bpy.context.scene
s.render.engine='CYCLES'
s.cycles.samples=20; s.cycles.use_denoising=False; s.cycles.max_bounces=4
s.render.threads_mode='FIXED'; s.render.threads=2
s.render.resolution_x=1200; s.render.resolution_y=780; s.render.resolution_percentage=100
s.view_settings.view_transform='AgX'
s.view_settings.exposure=-.33
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB'
s.render.fps=24;s.frame_start=1;s.frame_end=120
bpy.context.preferences.filepaths.save_version=0
s.world=bpy.data.worlds.new('Night study studio');s.world.use_nodes=True
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.18,.22,.27,1)
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.25

def coll(n):
 c=bpy.data.collections.new(n); s.collection.children.link(c); return c
BOOK=coll('00 | Black-stock spread and controls')
A=coll('01 | A · First stellar points')
B=coll('02 | B · Clusters')
C=coll('03 | C · Galaxy paper loom')
Z=coll('04 | Zentrum · landmark, not literal center')
G=coll('05 | Digital Geode · author geometry translation')
H=coll('06 | Inspection-only testimony [render disabled]')
S=coll('07 | Cameras and lights')
z0=.11

def bind(o,c):
 for prev in list(o.users_collection):prev.objects.unlink(o)
 c.objects.link(o)
 return o

def mat(n,col,rough=.83,grain=0,metal=0,em=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*col,1);m.use_nodes=True
 ns=m.node_tree.nodes;ls=m.node_tree.links; p=ns.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*col,1);p.inputs['Roughness'].default_value=rough
 p.inputs['Metallic'].default_value=metal
 if em:
  p.inputs['Emission Color'].default_value=(*col,1);p.inputs['Emission Strength'].default_value=em
 if grain:
  tex=ns.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=110;tex.inputs['Detail'].default_value=2.0
  bu=ns.new('ShaderNodeBump');bu.inputs['Strength'].default_value=grain;bu.inputs['Distance'].default_value=.027
  ls.new(tex.outputs['Fac'],bu.inputs['Height']);ls.new(bu.outputs['Normal'],p.inputs['Normal'])
 return m
stock=mat('BLACK STOCK · black pigment through all faces and cut edges',(.005,.006,.008),.82,.18)
charcoal=mat('BLACK STOCK · facing compressed black fiber',(.010,.012,.015),.89,.12)
black=mat('BLACK STOCK · recessed folded support',(.004,.005,.007),.87,.12)
cloth=mat('Charcoal woven cover',(.039,.048,.057),.94,.25)
gold=mat('Warm printed registration ink, not structural stock',(.50,.32,.13),.69)
bronze=mat('Existing hinge fasteners · dark bronze',(.27,.14,.054),.54,0,.32)
bone=mat('Existing warm paper-toned stellar print ink',(.79,.73,.57),.74)
aqua=mat('Azure ink on face of black material, not at cut edge',(.09,.52,.64),.72,0,0,.14)
cool=mat('Cool pale printed highlights',(.42,.65,.69),.73)
faint=mat('Dim guide print',(.070,.104,.125),.85)
dim=mat('Edge score · ink very light application',(.064,.080,.092),.85)
desk=mat('Desk · subdued brown-charcoal',(.017,.013,.012),.9,.14)
slate=mat('Geode existing slate blue crystalline paper',(.069,.10,.15),.62,.12,.05)
slaterim=mat('Geode crystal plane highlights',(.115,.182,.24),.56,.06,.12)
indigo=mat('NiAlBu existing midnight indigo',(.049,.073,.14),.69,.12,0,.03)
copper=mat('NiAlBu existing copper-orange rings',(.71,.30,.088),.42,0,.43,.06)
cyan=mat('NiAlBu cyan fissure and cranium plume',(.10,.73,.89),.62,0,0,.4)

def empty(n,c,loc=(0,0,0),p=None):
 o=bpy.data.objects.new(n,None);c.objects.link(o);o.parent=p;o.location=loc;return o

def mesh(n,vs,faces,m,c,p=None,th=0):
 d=bpy.data.meshes.new(n);d.from_pydata(vs,[],faces);d.update()
 o=bpy.data.objects.new(n,d);c.objects.link(o);o.parent=p
 if m:o.data.materials.append(m)
 if th:
  a=o.modifiers.new('Black stock thickness · both faces and cut edges','SOLIDIFY')
  a.thickness=th;a.offset=0;a.material_offset=0;a.material_offset_rim=0
 return o

def poly(n,coords,m,c,p=None,th=.022):
 return mesh(n,coords,[tuple(range(len(coords)))],m,c,p,th)

def box(n,xyz,dims,m,c,p=None,bev=.009):
 x,y,z=(u/2 for u in dims)
 vs=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
 o=mesh(n,vs,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m,c,p)
 o.location=xyz
 if bev:
  b=o.modifiers.new('Fine physical edge roundoff','BEVEL');b.width=min(bev,min(dims)*.25);b.segments=2
 return o

def line(n,coords,r,m,c,p=None):
 v=bpy.data.curves.new(n,'CURVE');v.dimensions='3D';v.resolution_u=1;v.bevel_depth=r;v.bevel_resolution=1
 g=v.splines.new('POLY');g.points.add(len(coords)-1)
 for q,a in zip(g.points,coords):q.co=(*a,1)
 o=bpy.data.objects.new(n,v);c.objects.link(o);o.parent=p;o.data.materials.append(m);return o

def txt(n,l,xyz,size,m,c,p=None,align='CENTER',rot=(0,0,0)):
 cu=bpy.data.curves.new(n,'FONT');cu.body=l;cu.size=size;cu.align_x=align;cu.space_character=1.15
 o=bpy.data.objects.new(n,cu);c.objects.link(o);o.parent=p;o.location=xyz;o.rotation_euler=rot;o.data.materials.append(m);return o

def cyl(n,xyz,r1,r2,h,m,c,p=None,nseg=8,angle=0):
 vs=[(r*cos(angle+2*pi*i/nseg),r*sin(angle+2*pi*i/nseg),z) for r,z in ((r1,-h/2),(r2,h/2)) for i in range(nseg)]
 fs=[tuple(range(nseg-1,-1,-1)),tuple(range(nseg,nseg*2))]+[(i,(i+1)%nseg,(i+1)%nseg+nseg,i+nseg) for i in range(nseg)]
 o=mesh(n,vs,fs,m,c,p);o.location=xyz;return o

def terr(n,x,y,c):
 for j,(w,d,h) in enumerate([(1.93,.88,.045),(1.79,.78,.045),(1.65,.70,.045)]):
  box(n+' black cut-edge tier',(x,y,.08+j*.045),(w,d,h),stock,c)
 return .204

def ellipse(cx,cy,z,rx,ry,n=72):
 return [(cx+rx*cos(i*2*pi/n),cy+ry*sin(i*2*pi/n),z) for i in range(n+1)]

# Visible pre-existing book; imprint begins with starless leaf.
box('Desk', (0,0,-.40),(200,200,.16),desk,BOOK,bev=0)
for q in [-1,1]:
 x=q*2.33
 box('Black book board',(x,0,-.22),(4.70,5.02,.20),cloth,BOOK)
 for j in range(10):
  box('Individually stacked dyed-black page',(x,0,-.108+j*.016),(4.56+j*.008,4.80+j*.006,.011),stock if j%3 else charcoal,BOOK,bev=.002)
 box('Matte black working leaf',(x,0,.079),(4.594,4.92,.067),stock,BOOK)
 for i in range(3):
  for y in [-2.28,2.28]:
   line('Inset rule printed on black page',[(x-2.06,y+i*.045,.116),(x+2.06,y+i*.045,.116)],.006,gold if i==0 else faint,BOOK)
 for x1 in [x-2.07,x+2.07]:
  line('Outer scored rule',[(x1,-2.28,.117),(x1,2.38,.117)],.005,gold,BOOK)
line('Book gutter sewn cloth ridge',[(0,-2.47,.111),(0,2.49,.111)],.040,cloth,BOOK)
for i in range(14):
 y=-2.25+i*.35
 line('Gutter saddle stitch',[(-.08,y,.12),(0,y+.03,.148),(.08,y,.12)],.008,gold,BOOK)
txt('Folio number','F02',(-4.22,-2.15,.12),.14,gold,BOOK,align='LEFT')
txt('Folio title · left','THE ALL',(-.80,-1.88,.122),.25,bone,BOOK)
txt('Folio title · right','UNFOLDS',(.86,-1.88,.122),.25,bone,BOOK)
for x,slot in [(-2.74,'A'),(0,'B'),(2.74,'C')]:
 box('Black paper pull tab '+slot,(x,-2.33,.139),(.66,.43,.045),black,BOOK)
 for y in [-2.47,-2.21]:
  line('Pull-tab score '+slot,[(x-.25,y,.168),(x+.25,y,.168)],.008,gold,BOOK)
 txt('Pull-tab letter '+slot,slot,(x,-2.39,.168),.126,bone,BOOK)
# Unnamed source laminae signify function only, not named new species or a live character tableau.
for i,x in enumerate([-1.06,0,1.06]):
 box('Pre-existing source lamina · abstract editorial function',(x,-1.08,.127),(.50,.31,.027),black,BOOK)
 line('Lamina index incision',[(x-.16,-1.10,.147),(x+.16,-1.10,.147)],.008,gold,BOOK)
 txt('Lamina index',['I','II','III'][i],(x,-1.01,.144),.076,cool,BOOK)
 line('Fixed connection from pre-existing lamina',[(x,-.90,.119),(x,-.61,.12),(x*.62,-.33,.12),(x*.42,.06,.12)],.010,dim,BOOK)
# Rear scenic arch accent and black paper shelf with fixed bonded roots.
archpts=[(-4.14,2.22,.15),(-4.14,2.22,.95),(-3.48,2.22,1.21),(-2.44,2.22,1.36),(0,2.22,1.59),(2.44,2.22,1.36),(3.48,2.22,1.21),(4.14,2.22,.95),(4.14,2.22,.15)]
poly('Black die-cut rear framing arch',archpts,black,BOOK,th=.027)
line('Arched arch ink perimeter',[(-4.04,2.204,.24),(-4.04,2.204,.88),(-3.45,2.204,1.12),(-2.42,2.204,1.27),(0,2.204,1.51),(2.42,2.204,1.27),(3.45,2.204,1.12),(4.04,2.204,.88),(4.04,2.204,.24)],.010,dim,BOOK)
for i in range(9):
 x=(i-4)*.88
 box('Rear arch bond foot',(x,2.06,.16),(.17,.33,.055),stock,BOOK)
 line('Rear arch score',[(x,2.195,.28),(x,2.195,.58+.05*abs(i-4))],.009,gold,BOOK)

# Left landmark from previewV2, separate from center of construction.
level=terr('Zentrum',-2.75,-.55,Z)
for j,r in enumerate([.20,.34,.49]):
 z=level+.15+j*.046
 tip=.21*(j+1)
 line('Zentrum three orbital registration rings',[(-2.75+r*cos(i*2*pi/90),-.57+r*sin(i*2*pi/90)*cos(tip),z+r*sin(i*2*pi/90)*sin(tip)) for i in range(91)],.012,gold,Z)
for j,x in enumerate([-3.11,-2.75,-2.39]):
 box('Black folded ring support',(x,-.55,level+.072),(.05,.07,.147),black,Z)
txt('Zentrum landmark plaque','ZENTRUM',(-2.75,-.887,level+.013),.107,bone,Z)

# Source-coordinate adaptation. Convert THREE x/y/z to Blender x/-z/y;
# preview scale 1.32 retained as semantic baseline; a reading-theatre multiplier improves proof framing.
gz=terr('Digital Geode',2.75,-.57,G)
g=empty('Digital Geode · source open cutaway',G,(2.75,-.56,gz+.005))
g.scale=(1.84,1.84,1.84)
g['provenance']='src/engine/drakken/CharacterFigures.ts#L391-L546; pinned 86d6f4214af204dbbe347a04f7aa9e18f18b7876'
g['scope']='component and proportions adapted directly from source-authored geometry; no new canonical form'
def tj(x,y,z):return (x,-z,y)
cyl('Seven-sided geode base',tj(0,.032,0),.32,.27,.065,slate,G,g,7)
# Source rear-sided spire array, mirrored toward the rear to preserve the visible open cutaway reading camera.
for i in range(5):
 a=pi*.45+i/4*pi*1.1
 x=cos(a)*.22;y=sin(a)*.22
 h=.56+(.1 if i==2 else 0)
 p=cyl('Cutaway geode spire %s'%(i+1),(x,abs(y)+.045,h/2+.04),.11,.08,h,slate,G,g,5,i*.35)
 p.rotation_euler.y=-cos(a)*.08
 cyl('Crystal spire bevel point %s'%(i+1),(x,abs(y)+.045,h+.1),.082,0,.14,slaterim,G,g,5,i*.35)
for u in [-1,1]:
 coords=[(u*.24,-.04,.06),(u*.35,.036,.12),(u*.32,.020,.60),(u*.24,-.04,.68)]
 poly('Blue side crystal facet',coords,slaterim,G,g,.015)
f=empty('NiAlBu · living inverted captive',G,tj(0,.42,.075),g)
f.rotation_euler.y=pi
def tapered(n,points,rs,m,nseg=7):
 ps=[Vector(tj(*p)) for p in points];vs=[];faces=[]
 for i,(p,r) in enumerate(zip(ps,rs)):
  axis=(ps[min(len(ps)-1,i+1)]-ps[max(0,i-1)]).normalized()
  a=axis.cross(Vector((0,1,0))).normalized();b=axis.cross(a).normalized()
  vs.extend([tuple(p+r*(a*cos(j*2*pi/nseg)+b*sin(j*2*pi/nseg))) for j in range(nseg)])
  if i:faces.extend([(i*nseg+j,(i-1)*nseg+j,(i-1)*nseg+(j+1)%nseg,i*nseg+(j+1)%nseg) for j in range(nseg)])
 faces.extend([tuple(range(nseg-1,-1,-1)),tuple(range(len(vs)-nseg,len(vs)))])
 return mesh(n,vs,faces,m,G,f)
tapered('NiAlBu · legless tapered midnight-indigo form',[(0,.12,0),(0,0,0),(.015,-.14,-.02),(-.01,-.28,-.01)],[.072,.060,.036,.012],indigo,6)
box('NiAlBu · cyan spine / chest fissure',tj(0,.03,.065),(.015,.013,.17),cyan,G,f,bev=.004)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.056)
hd=bind(bpy.context.object,G);hd.name='NiAlBu · faceted head';hd.parent=f;hd.location=tj(0,.18,.01);hd.data.materials.append(indigo)
cyl('NiAlBu · cyan cranium plume',tj(0,.27,.01),.036,0,.14,cyan,G,f,5)
for side in [-1,1]:
 tapered('NiAlBu · branched coral antler',[(side*.045,.2,0),(side*.09,.27,0),(side*.08,.34,.02)],[.018,.013,.008],indigo,5)
 branch=cyl('NiAlBu · antler tine',tj(side*.11,.29,0),.011,0,.08,indigo,G,f,4)
 branch.rotation_euler.y=-side*.72
 tapered('NiAlBu · elongated arm',[(side*.07,.1,0),(side*.125,.03,.03),(side*.11,-.05,.06)],[.024,.021,.016],indigo,5)
 for j in [-1.5,-.5,.5,1.5]:
  claw=cyl('NiAlBu · narrow claw tip',tj(side*.11+j*.008,-.07,.065),.005,0,.034,cyan,G,f,3);claw.rotation_euler.x=pi
for ry,rx,rz,r in [(-.14,.25,.18,.095),(-.02,-.22,-.16,.135),(.09,.30,-.20,.145),(.20,-.18,.22,.12)]:
 q=line('NiAlBu · copper binding ring',ellipse(0,0,0,r,r,36),.0075,copper,G,f)
 q.rotation_euler=(rx,rz,0);q.location=tj(0,ry,0)
txt('Digital Geode landmark plaque','DIGITAL GEODE',(2.75,-.916,gz+.012),.101,bone,G)
# Exact hidden inscription, no ordinary camera or video disclosure.
H.hide_render=True;H.hide_viewport=True
secret=txt('INSIDE GEODE ONLY · pinned testimony','[Inspection text omitted]',(0,-.03,.26),.025,aqua,H,g,rot=(pi/2,0,0))
secret.hide_render=True
secret['visibility_contract']='Inside Digital Geode inspection AND proximity AND gaze; azure only; no public audio change; not rendered in this candidate.'

# Black folding loom. Three separate rigid card leaves pivot at glued rear
# root rails, with scored paper gussets that meet the parent and the moving cards.
rng=random.Random(28)
ctrl=[]
sequence = [(A,'A',-.07,.285,1.20,4.10,110,37,18,39),
            (B,'B',.16,.203,1.57,5.95,230,51,42,65),
            (C,'C',.30,.145,1.85,7.84,430,72,68,97)]
def paper_star_mesh(c,p,n,k,rrad,deep):
 vv=[];ff=[];mi=[]
 for i in range(n+round(n*.28)):
  f=(i+.5)/(n+round(n*.28))
  a=i%4*pi/2+f*11.72+k*.41
  rr=.15+sqrt(f)*rrad
  x=cos(a)*rr+rng.uniform(-.15,.15)
  y=-deep*.60+sin(a)*rr*.18+rng.uniform(-.095,.095)
  ztop=.047+rng.uniform(0,.09)*(k/3)
  r=(.010+.008*rng.random())*(1.8 if i%19==0 else 1)
  sy=.74+rng.uniform(-.17,.3)
  top=[(x-r,y,ztop),(x,y-r*sy,ztop),(x+r,y,ztop),(x,y+r*sy,ztop)]
  bot=[(q,w,e-.027) for q,w,e in top]
  aI=len(vv);vv+=bot+top
  fs=[(0,1,2,3),(4,5,6,7)]+[(j,(j+1)%4,(j+1)%4+4,j+4) for j in range(4)]
  for j,t in enumerate(fs):
   ff.append(tuple(aI+h for h in t));mi.append((2 if i<n else 1) if j==1 else 0)
 o=mesh('Die-cut points · cyan and bone ink on faces only',vv,ff,stock,c,p)
 o.data.materials.append(bone);o.data.materials.append(aqua)
 for q,i in zip(o.data.polygons,mi):q.material_index=i
 return o

for i,(collx,key,y,z,deep,w,n,angle,start,end) in enumerate(sequence,1):
 hook=empty('Fold '+key+' · physical book hinge',collx,(0,y,z));hook.scale.y=-1;ctrl.append(hook)
 hook['visible_state']=i;hook['stock']='Black faces and through-cut edges; color is printed ink only.'
 bw=w/2
 box('Bonded black root rail '+key,(0,y-.03,z-.026),(w+.10,.21,.057),black,BOOK)
 for hx in [-bw*.87,0,bw*.87]:
  b=cyl('Spine fastener '+key,(hx,y,z+.036),.029,.029,.020,bronze,BOOK,None,10)
  box('Bonded black fold tab '+key,(hx,0,.014),(.21,.26,.021),stock,collx,hook)
 # A coherent scored black card per stage. Narrow margins on the sides
 # and domed leading edge separate the nested leaf silhouettes.
 xy=[(-bw,0),(-bw,-deep*.62),(-bw*.89,-deep*.87),(-bw*.60,-deep*.98),(0,-deep*1.05),(bw*.60,-deep*.98),(bw*.89,-deep*.87),(bw,-deep*.62),(bw,0)]
 poly('Dyed-through black display leaf '+key,[(x,y,0) for x,y in xy],stock,collx,hook,.042)
 line('Marked edge registration '+key,[(x,yy,.026) for x,yy in xy[1:-1]],.009,dim,collx,hook)
 for j in [-1,1]:
  poly('Inward score flap '+key,[(j*bw,0,.002),(j*bw,-deep*.6,.002),(j*bw*.91,-deep*.72,.037),(j*bw*.91,-.15,.035)],black,collx,hook,.020)
  line('Fold-root score '+key,[(j*bw*.91,-.15,.040),(j*bw*.91,-deep*.72,.040)],.006,gold,collx,hook)
 rr=(w/2)*.77
 for j,e in enumerate([.49,.76,1]):
  cut=[]
  for l in range(83):
   a=.14+j*.41+l/82*5.28
   cut.append((rr*e*cos(a),-deep*.59+deep*(.12+j*.04)*sin(a),.038))
  line('Registration orbit ink '+key,cut,.008,gold if j!=0 else faint,collx,hook)
 paper_star_mesh(collx,hook,n,i,rr,deep)
 if key=='C':
  # Unlike source height-scaling stripes, these are black physical ribbon strips
  # with connected root regions and four authored editorial trails, not literal cosmic geography.
  for arm in range(4):
   ribbon=[];printline=[];path=[]
   for irow in range(75):
    t=irow/74
    a=arm*pi/2+t*pi*2.30+.22
    rad=.12+3.0*(t**.77)
    x=cos(a)*rad
    yy=-.35-.62*t+sin(a)*.54*sqrt(t)
    zz=.050+.14*t+.11*(sin(pi*t)**2)+.03*arm
    width=.026+.050*t
    ribbon.extend([(x,yy-width,zz),(x,yy+width,zz)])
    printline.append((x,yy-width*.56,zz+.021))
    path.append((x,yy,zz))
   faces=[(2*q,2*q+1,2*q+3,2*q+2) for q in range(74)]
   mesh('Black die-cut spiral strip %d'%(arm+1),ribbon,faces,charcoal,C,hook,.035)
   line('Printed ink face of spiral strip %d'%(arm+1),printline,.009,[cool,gold,aqua,bone][arm],C,hook)
   for idx in (0,17,39,57,71):
    x,yy,zz=path[idx]
    poly('Folded black ribbon support · glued to leaf',[(x-.034,yy,.019),(x+.044,yy,.019),(x+.027,yy,zz),(x-.034,yy,zz)],black,C,hook,.022)
    box('Spiral ribbon bond foot',(x,yy,.024),(.139,.114,.029),stock,C,hook)
 # Behind the face sheet, black paper V gusset corner triangles connect
 # two fixed foot points to one moving point on the original plate.
 # A Hook modifier pins that junction exactly to the corresponding card.
 for side in (-1,1):
  x=side*bw*.79
  anchor=[(x-.093,y-.30,z-.041),(x+.093,y-.30,z-.041),(x,y+.36,z)]
  cfg=mesh('Black gusset with moving plate joint '+key,anchor,[(0,1,2)],black,collx,th=.028)
  box('Gusset book bond tab '+key,(x,y-.31,z-.055),(.218,.20,.038),stock,BOOK)
  follower=empty('Gusset junction follows card '+key,collx,(x,-.36,0),hook)
  bpy.context.view_layer.update()
  pin=cfg.modifiers.new('Exact moving paper contact','HOOK');pin.object=follower
  pin.vertex_indices_set([2]);pin.matrix_inverse=follower.matrix_world.inverted()@cfg.matrix_world
  cfg.modifiers.move(1,0)
 for fr,th in [(1,0),(start,0),(end,math.radians(angle)),(120,math.radians(angle))]:
  hook.rotation_euler.x=th;hook.keyframe_insert('rotation_euler',frame=fr)
 # Print faces under the physical stack are not visible at the initial arrival.
 # Gate only stellar print faces, leaving card and mechanisms present at every frame.
 for o in list(hook.children):
  if o.name.startswith(('Die-cut points','Registration orbit ink','Printed ink face','Black die-cut spiral','Folded black ribbon support','Spiral ribbon bond foot')):
   for fr,hidden in [(1,True),(start+2,True),(start+3,False),(120,False)]:
    o.hide_render=hidden;o.hide_viewport=hidden
    o.keyframe_insert('hide_render',frame=fr);o.keyframe_insert('hide_viewport',frame=fr)
for name,fr in [('F02 / Arrival: starless',1),('A / First points',39),('B / Clusters',65),('C / Galaxy',97),('C / Settled review',110)]:
 s.timeline_markers.new(name,frame=fr)

def point(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
def area(n,pos,watts,size,color,target):
 d=bpy.data.lights.new(n,'AREA');d.energy=watts;d.shape='DISK';d.size=size;d.color=color
 o=bpy.data.objects.new(n,d);S.objects.link(o);o.location=pos;point(o,target)
area('Large soft tungsten key',(-4.2,-4.8,7.0),1700,5,(1,.87,.71),(0,0,.65))
area('Cool broad book fill',(4.8,-2.1,5.3),1200,5,(.72,.86,1),(0,.3,.65))
area('Raking back cut-edge light',(2.7,4.8,5.6),1900,3.25,(.86,.92,1),(0,1.25,.72))
area('Soft front printed card bounce',(-.6,-6,3),270,4,(.89,.92,1),(0,.1,0))
def camera(n,location,target,scale):
 d=bpy.data.cameras.new(n);d.type='ORTHO';d.ortho_scale=scale
 o=bpy.data.objects.new(n,d);S.objects.link(o);o.location=location;point(o,target);return o
cam=camera('Overview · matched frontal book composition',(.35,-12.3,9.45),(0,.24,.87),11.30)
geocam=camera('Geode detail · public exterior only',(4.1,-4.2,2.6),(2.75,-.56,.88),3.20)
hingecam=camera('Cut edges and bonded gussets',(-5.8,-2.6,3.3),(-.12,1.15,.78),7.7)
s.camera=cam
s['source_commit']='86d6f4214af204dbbe347a04f7aa9e18f18b7876'
s['status']='SEPARATE CANDIDATE ONLY · does not alter source, repository, Drive, reader, narration or WebGL internals'
s['materials_contract']='Paper newly assembled here and after F02 has black pigment through the stock; blue and cream points are printed surface markings.'
s['chronology']='The All assembled from pre-existing inputs. Starsilk was not made from nothing. Past Wordstreamer and NiAlBu direct input, no new cosmological assertion or implied survival of Wordstreamer.'
s['secret_contract']='Narrator never reacts to discovery; no audio in candidate. Hidden collection not displayed by the edit or any render.'
s.frame_set(110)
s.render.filepath=str(D/'F02_04_Galaxy.png')
bpy.ops.wm.save_as_mainfile(filepath=str(D/'Palimpsest_F02_The_All_Unfolds.blend'))
if '--build-only' not in sys.argv:
 for nm,fr,cc in [('F02_01_Starless',1,cam),('F02_02_First_Points',39,cam),('F02_03_Clusters',65,cam),('F02_04_Galaxy',110,cam),('F02_05_Black_Stock_And_Hinges',110,hingecam),('F02_06_Digital_Geode_Public',110,geocam)]:
  s.camera=cc;s.frame_set(fr)
  s.render.filepath=str(D/(nm+'.png'));bpy.ops.render.render(write_still=True)
