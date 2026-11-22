"""F08 candidate: pinned Palimpsest inherited forms, Blender 4.3.
Run in a clean process: blender -b -t 2 -P build_f08.py.
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
s.cycles.samples=12; s.cycles.use_denoising=False; s.cycles.max_bounces=4
s.render.threads_mode='FIXED'; s.render.threads=2
s.render.resolution_x=1200; s.render.resolution_y=780; s.render.resolution_percentage=100
s.view_settings.view_transform='AgX'
s.view_settings.exposure=-.33
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB'
s.render.fps=24;s.frame_start=1;s.frame_end=180
bpy.context.preferences.filepaths.save_version=0
s.world=bpy.data.worlds.new('Night study studio');s.world.use_nodes=True
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.18,.22,.27,1)
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.25

def coll(n):
 c=bpy.data.collections.new(n); s.collection.children.link(c); return c
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

rr=math.radians
rng=random.Random(16)
def iso(n,p,dimensions,m,c,par=None,div=2):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=div,radius=1)
 o=bpy.context.object;o.name=n;bind(o,c);o.parent=par;o.location=p
 for v in o.data.vertices:
  for idx in range(3):v.co[idx]*=dimensions[idx]
 o.data.materials.append(m);return o
def keys(o,d,index,pairs):
 for f,v in pairs:
  getattr(o,d)[index]=v;o.keyframe_insert(d,index=index,frame=f)
def vis(o,pairs):
 for f,v in pairs:
  o.hide_render=not v;o.hide_viewport=not v
  o.keyframe_insert('hide_render',frame=f);o.keyframe_insert('hide_viewport',frame=f)
def circle(n,loc,rx,rz,m,c,p=None,vertical=False,th=.019):
 x,y,z=loc; ps=[]
 for i in range(57):
  a=i*2*pi/56;ps.append((x+rx*cos(a),y if vertical else y+rz*sin(a),z+rz*sin(a) if vertical else z))
 return line(n,ps,th,m,c,p)
def ring(n,p,loc,R,h,w,a0,ap,N,c):
 rand=random.Random(18); vs=[]; fs=[];closed=abs(ap-2*pi)<.01
 for i in range(N if closed else N+1):
  a=a0+ap*i/N;delta=rand.uniform(-w*.16,w*.16)
  for j in range(8):
   b=j*2*pi/8; rad=R+delta+w*cos(b)*(1+rand.uniform(-.15,.15))
   vs.append((rad*cos(a),rad*sin(a),h*sin(b)*(1+rand.uniform(-.12,.12))))
 for i in range(N):
  nxt=((i+1)%N if closed else i+1)*8
  for j in range(8):q=(j+1)%8;fs.append((i*8+j,i*8+q,nxt+q,nxt+j))
 if not closed:fs.extend([tuple(range(7,-1,-1)),tuple(N*8+j for j in range(8))])
 o=mesh(n,vs,fs,rb[0],c,p);o.location=loc
 for m in rb[1:]:o.data.materials.append(m)
 for f in o.data.polygons:f.material_index=rand.choices([0,1,2],[.70,.17,.13])[0]
 return o
def htxt(n,l,x,y,z,sz,m,c,p=None):return txt(n,l,(x,y,z),sz,m,c,p)
def vtxt(n,l,x,y,z,sz,m,c,p=None):return txt(n,l,(x,y,z),sz,m,c,p,rot=(pi/2,0,0))

BOOK=coll('00 · Pocket-bound folio and five nested die-cut portal reliefs')
A=coll('01 · A · Gate shield opening and taught cyan breach')
B=coll('02 · B · Whole gold assumption or fractured red profile')
C=coll('03 · C · Directional four-leaf, 20-world accordion')
T=coll('04 · Paper emblem of Tiger and the Codec witness')
S=coll('05 · Cameras and light')
red=mat('Opaque crimson glass and iron ring',(.122,.015,.016),.52,.12,.12)
red2=mat('Crimson interruption register',(.43,.053,.045),.63,.10,.11)
black=mat('Black-through cardstock',(.010,.012,.016),.9,.11)
navy=mat('Deep indigo paper',(.023,.035,.052),.85,.11)
slate=mat('Blue slate die-cut shell',(.053,.088,.126),.83,.11)
blue=mat('Raked medium blue paper register',(.102,.176,.222),.84,.14)
bone=mat('Warm engraved document ink',(.78,.67,.52),.8,.09)
bronze=mat('Aged brass-paper glaze',(.48,.285,.108),.56,.07,.24)
amber=mat('Documentary gold assumption print',(.69,.431,.153),.6,.07,.23)
cyan=mat('Azure ink, no interactive emission',(.068,.54,.70),.43,.10,.05,.10)
glint=mat('Cyan crystalline highlight',(.18,.68,.80),.46,.09,.07,.16)
face=mat('Codec warm painted paper skin',(.61,.36,.26),.83,.08)
hair=mat('Codec charcoal brown hair and beard',(.083,.048,.034),.84,.09)
cape=mat('Codec folded dark crimson cape',(.13,.022,.028),.85,.10)
armor=mat('Codec crimson illustrated armor',(.27,.038,.041),.69,.07,.09)
shade=mat('Slate-charcoal paper surroundings',(.032,.033,.044),.87,.12)
rb=[red,red2,mat('Blackened iron flecks',(.060,.014,.017),.65,.08,.20)]
# Reverse reused closed face winding to outward before use (every ring is volume).
from collections import Counter
def closed_ring(n,par,loc,R,h,w,a0=0,ap=2*pi,N=30,c=C):
 o=ring(n,par,loc,R,h,w,a0,ap,N,c)
 for poly in o.data.polygons:poly.flip()
 o.data.update()
 return o

# Leather-like arts board, separate cut-through leaves and stitch line.
box('Quiet slate craft desk',(0,0,-.39),(120,120,.12),shade,S,bev=0)
for q in (-1,1):
 x=q*2.58
 box('Cover wrap',(x,0,-.206),(5.21,5.62,.207),navy,BOOK)
 for j in range(9):box('Black cut-through page ply',(x,0,-.092+j*.018),(5.04+j*.009,5.41+j*.009,.012),black if j%3 else navy,BOOK,bev=.002)
 box('Bound technical leaf',(x,0,.082),(5.12,5.52,.077),black,BOOK)
 for y in (-2.57,2.56):
  line('Fine printed inboard pin register',[(x-2.38,y,.125),(x+2.38,y,.125)],.007,bronze,BOOK)
 for xx in (x-2.38,x+2.38):line('Side edge register',[(xx,-2.57,.126),(xx,2.56,.126)],.006,bronze,BOOK)
line('Saddle stitch binding',( (0,-2.75,.120),(0,2.77,.120)),.038,navy,BOOK)
for j in range(16):
 y=-2.45+j*.329;line('Visible saddle stitch',[(-.080,y,.129),(0,y+.04,.151),(.079,y,.129)],.009,bronze,BOOK)
def note(n,l,x,y,sz,m=bone,p=None,c=BOOK,z=.134):return htxt(n,l,x,y,z,sz,m,c,p)
note('Folio identifier','F08',-4.65,-2.44,.16)
note('Title','THE AUREAL GATE',-2.65,-2.19,.238)
note('Date stamp','YEAR 170',-2.65,-2.42,.138,bronze)
note('Right station','TWENTY CONQUERED WORLDS',3.10,-2.18,.177)
note('No geographical mapping','SCHEMATIC / NOT A MAP',3.10,-2.43,.120,bronze)
for x,ch in [(-1.35,'A'),(0,'B'),(2.25,'C')]:
 box('Hinged book tab '+ch,(x,-2.63,.144),(.69,.30,.075),navy,BOOK)
 note('Tab printed slot '+ch,ch,x,-2.67,.158,z=.190)
# Source-informed nested clear apertures, five separate cuttings on pinned feet.
gx=-1.93; gy=.42
def archband(n,x,y,z,w,H,t,m,c,p=None):
 N=42;outer=[(-w/2,y,z),(-w/2,y,z+H*.60)]
 inner=[(-w/2+t,y,z),(-w/2+t,y,z+H*.60-t)]
 for k in range(1,N):
  u=k/N; v=sin(pi*u)**.86
  outer.append((w*(u-.5),y,z+H*(.60+.40*v)))
  inner.append(((w-2*t)*(u-.5),y,z+H*(.60+.40*v)-t))
 outer.extend([(w/2,y,z+H*.60),(w/2,y,z)])
 inner.extend([(w/2-t,y,z+H*.60-t),(w/2-t,y,z)])
 q=len(outer)
 o=mesh(n,outer+inner,[(k,k+1,k+1+q,k+q) for k in range(q-1)],m,c,p,th=.074);o.location.x=x;return o
for i in range(5):
 x=gx;y=1.08+i*.235;w=5.23-i*.448;H=2.69+i*.093;z=.167;t=.153
 archband('Editorial negative-space gate cut '+str(i+1),x,y,z,w,H,t,[slate,bronze,blue,bronze,navy][i],BOOK)
 for side in (-1,1):
  xx=x+side*(w/2-t*.54)
  box('Nested relief glued bond foot',(xx,y,.164),(.27,.31,.065),navy,BOOK)
  poly('Folded nested relief supported score',[(xx,y,.17),(xx,y+.19,.17),(xx,y,.426)],slate,BOOK,th=.040)
# Low secondary right theatre screen behind accordion; one smooth slope, not a location.
for j in range(2):
 y=1.79+j*.22
 poly('Quiet right backcloth silhouette',[(.82,y,.139),(.82,y,.82+j*.19),(2.14,y,1.37+j*.25),(3.68,y,1.19+j*.28),(4.75,y,.84+j*.20),(4.75,y,.139)],[navy,slate][j],BOOK,th=.046)

# A fixed ground terrace, carved paper jambs and actual rotating shutters.
for j in range(3):
 box('Grounded stepped obsidian dais',(gx,gy,.169+j*.052),(3.56-j*.14,2.05-j*.14,.052),[navy,slate,black][j],A)
for side in (-1,1):
 x=gx+side*1.19
 box('Gate carved upright',(x,.56,1.37),(.259,.303,2.19),black,A)
 for dx in (-.065,0,.065):
  box('Paper fluting bonded on broad gate face',(x+dx,.387,1.37),(.021,.060,1.91),blue,A)
 for z in (.365,2.38):box('Pillar shoe and bronze cap',(x,.538,z),(.363,.389,.106),bronze,A)
poly('Actual gate stepped lintel',[(gx-1.376,.455,2.407),(gx-1.376,.455,2.59),(gx,.455,2.75),(gx+1.376,.455,2.59),(gx+1.376,.455,2.407)],slate,A,th=.195)
box('Lintel bronze trim',(gx,.324,2.451),(2.803,.070,.043),bronze,A)
doors=[]
for side in (-1,1):
 x=gx+side*1.16;w=1.128; sig=-side;y=-.148;z=.31
 d=empty('A · '+('left' if side<0 else 'right')+' gate-shield hinge',A,(x,y,z));doors.append(d)
 box('Opaque lower shield plate',(sig*w/2,0,.368),(w,.073,.738),slate,A,d)
 for i in range(3):
  box('Scored lowering shield nap register',(sig*w/2,-.046,.26+i*.10),(w-.16,.023,.015),blue,A,d)
 for zz in (.05,.718,1.278):
  box('Shield crossrail bridging clear grille',(sig*w/2,-.014,zz),(w,.074,.062),bronze,A,d)
 for xx in (.045,w*.50,w-.045):box('Shield brass grille stile with true open slits',(sig*xx,-.016,1.002),(.047,.074,.602),bronze,A,d)
 for zz in (.23,.95):
  cyl('Static paper hinge knuckle',(x,y,z+zz),.058,.056,.146,bronze,A,nseg=9)
  box('Stationary jamb plate anchoring hinge to platform',(x,y+.148,z+zz),(.176,.31,.078),navy,A)
  box('Moving shield hinge strap',(sig*.114,0,zz),(.239,.074,.083),bronze,A,d)
 cyl('Physical vertical shield pin',(x,y,z+.618),.027,.027,1.344,amber,A,nseg=9)
 keys(d,'rotation_euler',2,[(1,-sig*rr(11.5)),(16,-sig*rr(11.5)),(40,-sig*rr(87.1)),(180,-sig*rr(87.1))])
# Four beveled cyan folded paper elements, hanging from visible side mounts; not luminous weapons simulation.
for i,((x0,y0,z0),(x1,y1,z1)) in enumerate([
 ((gx-1.05,.05,1.24),(gx+1.04,.58,1.33)),
 ((gx-1.08,.77,1.44),(gx+.95,.018,1.15)),
 ((gx-.76,.94,1.08),(gx+.77,-.042,1.45)),
 ((gx-.81,-.023,1.40),(gx+.87,.892,1.08))
]):
 pts=[(x0,y0,z0),((x0+x1)*.5,(y0+y1)*.5,(z0+z1)*.5+.039),(x1,y1,z1)]
 ribbon=line('Cyan paper Starsilk diagonal '+str(i+1),pts,.019 if i<2 else .011,cyan,A)
 vis(ribbon,[(1,0),(29,0),(30,1),(180,1)])
 for point_ in ((x0,y0,z0),(x1,y1,z1)):
  xx,yy,zz=point_
  post=box('Cyan teaching ribbon supported free-standing folded tab',(xx,yy,(.32+zz)/2),(.039,.045,zz-.32),navy,A)
  vis(post,[(1,0),(29,0),(30,1),(180,1)])
  peg=iso('Azure paper ribbon bonded tip',point_,(.036,.036,.036),bronze,A,div=1)
  vis(peg,[(1,0),(29,0),(30,1),(180,1)])
note('A source interpretation','A / WEAPONIZED STARSILK',gx,-1.17,.162,bronze)

# Folio-authored Shard-god; planar elongated digitigrade posture, crystalline obsidian, one sweeping tail.
t=empty('Tiger · posed planar documentary emblem',T,(gx,.506,.309))
t['source']='CharacterFigures.ts buildShardGodFigure; latest user face constraint overrides depicted white teeth'
iso('Shard-God broad faceted chest',(0,0,1.20),(.344,.171,.395),black,T,t)
iso('Shard-God dark narrow basin',(0,.035,.807),(.218,.152,.231),navy,T,t)
iso('Angular short crystalline neck',(0,-.015,1.507),(.146,.146,.252),black,T,t)
for side in (-1,1):
 x=side
 iso('Dark crystalline shoulder ballast',(.282*x,.001,1.380),(.155,.154,.181),navy,T,t)
 line('Shard-God angular obsidian upper arm',[(x*.282,.002,1.391),(x*.382,-.043,1.108),(x*.420,-.12,.936)],.113,black,T,t)
 iso('Shard-God slab forearm',(.416*x,-.101,1.015),(.095,.101,.213),navy,T,t)
 iso('Shard-God obsidian claw-hand',(.424*x,-.160,.826),(.084,.083,.124),black,T,t)
 line('Digitigrade contour of obsidian leg',[(x*.140,.037,.80),(x*.202,-.103,.521),(x*.176,.065,.321),(x*.217,-.093,.120)],.114,black,T,t)
 iso('Paper digitigrade front paw',(.214*x,-.103,.10),(.132,.162,.083),navy,T,t)
 line('Cyan shard fissure shoulder',[(x*.106,-.141,1.300),(x*.288,-.152,1.449),(x*.375,-.121,1.370),(x*.414,-.148,1.184)],.013,cyan,T,t)
 line('Cyan branch outer hind leg',[(x*.16,-.125,.730),(x*.22,-.182,.571),(x*.24,-.166,.455)],.013,cyan,T,t)
 line('Cyan fissure claw crease',[(x*.438,-.231,.967),(x*.456,-.235,.853)],.011,cyan,T,t)
 # Silhouette points folded through depth, not protruding human anatomy.
 for j in range(3):
  xx=x*(.115+j*.071)
  z=1.54-j*.055
  poly('Swept icy dorsal shoulder wedge',[(xx,.105,z-.13),(xx+x*.13,.168,z+.355-j*.044),(xx+x*.10,.314,z+.034),(xx,.177,z-.12)],glint if j==0 else cyan,T,t,th=.044)
line('One sweeping tail through body silhouette',[(0,.15,.809),(-.25,.33,.585),(-.67,.40,.441),(-.915,.36,.604),(-1.02,.303,.79)],.070,navy,T,t)
for j in range(4):
 x=-.56-j*.13
 poly('Swept single tail crystalline crest',[(x,.357,.50+j*.065),(x-.085,.370,.64+j*.08),(x-.04,.426,.50+j*.065)],cyan,T,t,th=.029)
# Lifted not-quite-feline broad face, reduced central nose, pupil-less eyes and cyan negative-space grin.
iso('Broad facet crystalline skull',(0,-.097,1.748),(.199,.158,.166),black,T,t)
iso('Shallow wide planar face bevel, no projecting nose',(0,-.229,1.708),(.169,.043,.108),navy,T,t)
for side in (-1,1):
 x=side
 poly('Jaguar-shard crown silhouette point',[(x*.13,-.080,1.792),(x*.20,.050,1.987),(x*.058,.082,1.823)],black,T,t,th=.055)
 poly('Faint cyan upper crown facets',[(x*.086,.014,1.852),(x*.107,.149,2.049),(x*.024,.106,1.871)],cyan,T,t,th=.045)
 poly('Pupil-less cyan eye slit',[(x*.035,-.268,1.763),(x*.135,-.270,1.803),(x*.127,-.271,1.763),(x*.048,-.272,1.748)],glint,T,t,th=.012)
poly('Continuous cyan behind the mouth silhouette',[(-.132,-.277,1.718),(-.089,-.279,1.687),(0,-.281,1.679),(.092,-.279,1.688),(.132,-.277,1.720),(.090,-.278,1.664),(0,-.281,1.652),(-.092,-.278,1.664)],cyan,T,t,th=.018)
for j in range(5):
 x=.041*(j-2);z=1.689+abs(j-2)*.004
 poly('Obsidian edge notch interrupts cyan but is not a tooth',[(x-.017,-.294,z+.023),(x+.017,-.294,z+.026),(x+.001,-.294,z-.006)],black,T,t,th=.012)
line('Torso cyan split through angular obsidian plates',[(-.104,-.157,1.420),(-.045,-.172,1.321),(0,-.180,1.343),(.04,-.176,1.287),(.071,-.162,1.146)],.016,cyan,T,t)
line('Torso cyan branch',[(0,-.18,1.343),(.11,-.153,1.444),(.191,-.140,1.456)],.012,cyan,T,t)
note('Central emblem label','SHARD-GOD',gx,-.614,.15)

# Source Codec remains an evidenced observer, not participant; left-chest sunburst is camera-right.
kx=.119;ky=.751
for j in range(2):box('Independent Codec observation plinth',(kx,ky,.176+j*.072),(.84-j*.065,.78-j*.065,.067),[navy,slate][j],T)
k=empty('Codec · observer using Folio source silhouette',T,(kx,ky,.273))
k['source']='CharacterFigures.ts buildCodecFigure'
for x in (-.112,.112):
 box('Codec boots and crimson greaves',(x,-.039,.196),(.139,.164,.369),armor,T,k)
 iso('Codec armored charcoal thigh',(x,.008,.426),(.072,.078,.171),navy,T,k)
 iso('Codec crimson pauldron',(x*2.03,-.008,1.021),(.138,.101,.104),armor,T,k)
 line('Codec charcoal sleeve',[(x*2.02,0,1.027),(x*2.41,-.004,.844),(x*2.30,-.098,.661)],.076,shade,T,k)
 iso('Codec crimson gauntlet',(x*2.34,-.068,.726),(.072,.068,.130),armor,T,k)
iso('Codec stocky charcoal torso',(0,-.004,.825),(.243,.126,.290),shade,T,k)
poly('Codec diagonal crimson chest strap',[(-.157,-.131,.648),(-.075,-.136,.660),(.194,-.110,1.066),(.102,-.128,1.065)],armor,T,k,th=.022)
for j in range(6):
 u=-.29+j*.097;v=u+.101
 poly('Codec knee-length folded crimson cape',[(u,.070,.99),(v,.091,.99),(v*1.17,.205+j%2*.025,.395),(u*1.17,.230-j%2*.029,.395)],cape if j%2 else armor,T,k,th=.028)
iso('Codec human commissioned face',(0,-.006,1.185),(.117,.10,.153),face,T,k)
iso('Codec brow and hair silhouette',(0,.008,1.277),(.123,.11,.075),hair,T,k)
iso('Codec short full beard',(0,-.047,1.121),(.100,.077,.072),hair,T,k)
circle('Codec left-chest cyan sunburst roundel',(.083,-.141,.947),.062,.062,cyan,T,k,vertical=True,th=.013)
iso('Codec sunburst center',(.083,-.153,.945),(.035,.020,.035),glint,T,k,1)
for j in range(8):
 a=j*pi/4;line('Codec sunburst tick',[(.083+.023*cos(a),-.163,.945+.023*sin(a)),(.083+.063*cos(a),-.162,.945+.063*sin(a))],.007,glint,T,k)
note('Observer label','CODEC / WITNESS',.073,.175,.114)

# B whole teaching circle changes into an asymmetric 3-piece folded comparison;
# a broken crimson band around the emblem matches the in-scene fracture vocabulary.
bp=empty('B · paper assumption comparator assembly',B,(-.07,-1.405,.188));bp.rotation_euler[0]=rr(36)
box('Assumption comparator backing card',(0,0,.009),(1.50,1.15,.058),navy,B,bp)
round0=circle('B whole gold circle · earlier doctrine',(0,.090,.050),.442,.442,amber,B,bp,th=.026)
vis(round0,[(1,1),(68,1),(69,0),(180,0)])
for j,(start,span) in enumerate([(.12,1.90),(2.32,.80),(3.48,2.36)]):
 carrier=empty('B broken assumption arc folded support '+str(j),B,(0,.090,.057),bp)
 coords=[(.442*cos(start+span*q/32),.442*sin(start+span*q/32),.012) for q in range(33)]
 arc=line('B separated crimson interruption '+str(j),coords,.027,red2,B,carrier)
 vis(arc,[(1,0),(68,0),(69,1),(180,1)])
 keys(carrier,'location',0,[(1,0),(67,0),(85,[-.097,.092,.036][j]),(180,[-.097,.092,.036][j])])
 keys(carrier,'rotation_euler',1,[(1,0),(67,0),(85,rr([-15,12,-7][j])),(180,rr([-15,12,-7][j]))])
 for q in (3,29):
  x,y,z=coords[q];mount=box('Bonded B cut arc seat',(x,y,.011),(.076,.073,.029),bronze,B,carrier)
  vis(mount,[(1,0),(68,0),(69,1),(180,1)])
for j,(a,span) in enumerate([(.13,1.6),(2.02,1.2),(3.58,2.37)]):
 band=closed_ring('B low crimson fracture band fragment '+str(j),None,(gx,.506,1.151),.540,.019,.038,a,span,20,B)
 vis(band,[(1,0),(68,0),(69,1),(180,1)])
slide=box('B movable indication tab',(-.49,-.28,.077),(.19,.160,.066),bronze,B,bp)
box('B cut card slot guide',(0,-.28,.050),(1.121,.178,.040),black,B,bp)
keys(slide,'location',0,[(1,-.49),(65,-.49),(84,.49),(180,.49)])
l0=note('B imprint pre','ASSUMED IMMUNITY',0,-.461,.092,amber,bp,B,.054)
l1=note('B imprint post','VULNERABILITY SHOWN',0,-.461,.092,bone,bp,B,.054)
vis(l0,[(1,1),(68,1),(69,0),(180,0)]);vis(l1,[(1,0),(68,0),(69,1),(180,1)])

# C real serial hinges on an accordion leaf, the world count is not geographic.
# Parent folds use alternating signed Euler angles; every child's bond stays tangent to parent's far edge.
cw=.875;cy=-.06;cx=1.285;cz=.240
box('C bound origin tray',(2.97,cy,.159),(3.64,1.97,.061),navy,C)
box('Side-on scored anchor root',(cx,cy,.222),(.24,1.90,.056),slate,C)
prev=None
for j in range(4):
 p=empty('C physical accordion leaf '+str(j+1),C,(cx,cy,cz) if j==0 else (cw,0,0),prev)
 p['relationship']='Root attached to existing substrate' if j==0 else 'Share joint on right crease of preceding leaf'
 angle=-52 if j==0 else (104 if j%2 else -104)
 keys(p,'rotation_euler',1,[(1,rr(angle)),(103,rr(angle)),(141,0),(180,0)])
 box('Black laminated accordion card',(cw/2,0,0),(cw-.020,1.83,.053),[slate,navy,slate,navy][j],C,p)
 box('Visible scored spine crease',(cw,0,.011),(.045,1.75,.049),bronze,C,p)
 for v in (-.52,.54):box('Accordion shared paper hinge tab',(cw,v,.008),(.11,.161,.052),navy,C,p)
 line('Accordion upper frame ink',[(.054,.851,.030),(cw-.058,.851,.030)],.009,bronze,C,p)
 line('Accordion lower frame ink',[(.054,-.833,.030),(cw-.058,-.833,.030)],.009,bronze,C,p)
 for v in (-1,1):
  line('Lower-grade archival field coordinate rule',[(.069 if v<0 else cw-.070,-.803,.030),(.069 if v<0 else cw-.070,.83,.030)],.004,blue,C,p)
 for k,(xx,yy) in enumerate([(.255,.525),(.618,.525),(.255,.130),(.618,.130),(.436,-.260)]):
  i=j*5+k+1;r=.069+((i+1)%3)*.008
  body=cyl('C documented world %02d · blank obsidian medallion'%i,(xx,yy,.096),r,r*.97,.083,black,C,p,nseg=13)
  rim=closed_ring('C world %02d · opaque crimson Blood Ring'%i,p,(xx,yy,.104),r*1.408,.013,.019,0,2*pi,20,C)
  rim.rotation_euler[0]=rr(11+j*.8)
  box('World token paper bonding pad',(xx,yy,.047),(.133,.129,.032),navy,C,p)
 # The directional arrow stays general; spacing and disc positions have no geography.
 xa,xb=(.084,cw-.052);yy=-.613;zz=.031
 line('General Aureal Nebula retreat arrow segment',[(xa,yy,zz),(xb,yy,zz)],.010,amber,C,p)
 if j==3:
  line('General retreat directional arrowhead',[(xb-.102,yy-.073,zz),(xb,yy,zz),(xb-.102,yy+.073,zz)],.010,amber,C,p)
 prev=p
a=note('C broad direction legend','TOWARD AUREAL NEBULA',2.92,-1.218,.115,bone,c=C)
vis(a,[(1,0),(137,0),(138,1),(180,1)])

# Matched still camera plus C detail. Warm book light, cold paper crest and solid shadows.
def point(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
def light(n,loc,target,energy,size,color):
 d=bpy.data.lights.new(n,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=color
 o=bpy.data.objects.new(n,d);S.objects.link(o);o.location=loc;point(o,target)
light('Large warm raking key',(-5,-5,7.2),(-1,0,.50),1850,5.6,(1,.86,.70))
light('Cool broad paper fill',(5,-3.0,6.8),(0,0,.50),1500,5.8,(.76,.88,1))
light('Cold crest separation',(-.50,4.4,6.5),(-.8,.8,.7),1980,4.4,(.77,.88,1))
light('Soft text bounce',(.06,-6.3,3.1),(0,-1.3,.29),265,4.8,(.98,.94,.88))
def camera(n,loc,target,scale):
 d=bpy.data.cameras.new(n);d.type='ORTHO';d.ortho_scale=scale
 o=bpy.data.objects.new(n,d);S.objects.link(o);o.location=loc;point(o,target);return o
hero=camera('F08 aligned overview',(.78,-13,10.5),(0,.15,1.05),11.93)
detail=camera('F08 foldout count detail',(4.3,-6.0,8.5),(2.98,-.06,.27),4.55)
gate=camera('F08 shield gate detail',(-4.4,-7.3,5.1),(-1.75,.32,1.03),5.85)
s.camera=hero
for n,f in [('Arrival / assumed invulnerability',1),('A / gate shield cutaway',44),('B / broken assumption',88),('C / directional accordion and all twenty',153)]:
 s.timeline_markers.new(n,frame=f)
s['source_commit']='86d6f4214af204dbbe347a04f7aa9e18f18b7876'
s['status']='SEPARATE BLENDER CANDIDATE ONLY. Does not change source repository, Drive, narration, or public runtime.'
s['canon_contract']='Year 170 Aureal Gate. A is an editorial vulnerability diagram, not a fight reconstruction. B breaks institutional assumption, not invented physics. C count historical, placement and distances non-geographic.'
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(D/'Palimpsest_F08_The_Aureal_Gate.blend'))
