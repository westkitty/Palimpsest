"""F11 candidate: pinned Palimpsest inherited forms, Blender 4.3.
Run in a clean process: blender -b -t 2 -P build_f11.py.
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
s.cycles.samples=12; s.cycles.use_denoising=False; s.cycles.max_bounces=7;s.cycles.transmission_bounces=6
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

BOOK=coll('00 · Ash-crater spread and permanent folded geology')
A=coll('01 · A · One living loam vessel and lens collar lift')
B=coll('02 · B · Printed Macro-use comparison turntable')
C=coll('03 · C · Attributed archival confrontation')
M=coll('04 · Marcel procedural source interpretation')
T=coll('05 · Codec and Shard-god procedural silhouettes')
S=coll('06 · Cameras and paper-light studio')
black=mat('Black-through cardstock',(.012,.012,.013),.91,.12)
navy=mat('Paper charcoal black',(.027,.032,.036),.92,.12)
slate=mat('Weathered blue-slate layered paper',(.078,.097,.105),.87,.12)
bone=mat('Cream register and parchment',(.79,.716,.548),.86,.09)
bronze=mat('Muted brass, cut and glued',(.49,.318,.118),.50,.09,.37)
amber=mat('Golden brass highlights',(.66,.442,.180),.47,.10,.26)
cyan=mat('Azure symbolic pigment only',(.057,.419,.519),.49,.08,.1,.06)
glint=mat('Cyan shard highlights',(.16,.61,.76),.47,.07,.08,.11)
face=mat('Codec painted bearded face',(.61,.36,.27),.86,.10)
hair=mat('Earth black hair',(.062,.040,.026),.87,.10)
cape=mat('Folded dark crimson cape',(.114,.021,.022),.87,.10)
armor=mat('Crimson armor card',(.30,.042,.037),.71,.09,.13)
shade=mat('Dry dusty slate table',(.042,.041,.038),.89,.14)
ash0=mat('Level 3 remnant dry ash strata 0',(.092,.081,.067),.97,.22)
ash1=mat('Level 3 remnant dry ash strata 1',(.166,.146,.114),.97,.29)
ash2=mat('Level 3 remnant dry ash strata 2',(.214,.191,.152),.96,.20)
ash3=mat('Level 3 remnant dry ash shale',(.071,.060,.052),.98,.29)
goldrock=mat('Ochre dry fixed fault surface, not soil',(.29,.228,.147),.97,.26)
mvest=mat('Marcel dark olive vest, fabric only',(.086,.143,.074),.89,.14)
mpants=mat('Marcel cropped charcoal-olive cloth only',(.045,.064,.045),.91,.09)
skin=mat('Marcel warm olive toned paper skin',(.58,.35,.203),.87,.13)
wood=mat('Marcel plain unlit natural wood and cuffs',(.204,.096,.046),.88,.15)
soil=mat('EXHIBIT ONLY · contained dark living loam',(.065,.035,.020),.98,.25)
wheat=mat('EXHIBIT ONLY · one wheat spikelet series',(.82,.53,.097),.80,.12)
blades=mat('EXHIBIT ONLY · subtle olive wheat blade',(.30,.425,.086),.85,.08)
glass=mat('Glass sleeve · actual optical transmission',(.93,.98,1.0),.095,0,0)
gbsdf=glass.node_tree.nodes['Principled BSDF'];gbsdf.inputs['Transmission Weight'].default_value=1.;gbsdf.inputs['IOR'].default_value=1.42
# Archival reading glass: direct-clear path blended with the real spectral edge response
# through both finite-thickness walls. This is an editorial optical shader, not an absent sleeve.
gn=glass.node_tree.nodes; gl=glass.node_tree.links
trans=gn.new('ShaderNodeBsdfTransparent');trans.inputs['Color'].default_value=(.986,.994,1,1)
mx_nodes=gn.new('ShaderNodeMixShader');mx_nodes.inputs[0].default_value=.66
gl.new(gbsdf.outputs['BSDF'],mx_nodes.inputs[1]);gl.new(trans.outputs['BSDF'],mx_nodes.inputs[2]);gl.new(mx_nodes.outputs['Shader'],gn.get('Material Output').inputs['Surface'])
rb=[armor,amber,ash3]
def note(n,l,x,y,sz,m=bone,p=None,c=BOOK,z=.134):return htxt(n,l,x,y,z,sz,m,c,p)

# One bound book, framed bare strata and controlled paper palette.
box('Dry matte presentation table',(0,0,-.425),(100,100,.172),shade,S,bev=0)
for side in (-1,1):
 x=side*2.58
 box('Charcoal linen-covered book board',(x,0,-.216),(5.20,5.70,.217),navy,BOOK)
 for j in range(9):
  box('Exposed cut-through book ply',(x,0,-.094+j*.018),(5.05+j*.012,5.50+j*.010,.012),black if j%3 else navy,BOOK,bev=.002)
 box('Black working folio leaf',(x,0,.083),(5.13,5.58,.080),black,BOOK)
 for y in (-2.598,2.63):
  line('Fine bronze register over black folio',[(x-2.37,y,.126),(x+2.37,y,.126)],.007,bronze,BOOK)
 for xx in (x-2.37,x+2.37):
  line('Book side pin-register rule',[(xx,-2.598,.127),(xx,2.63,.127)],.006,bronze,BOOK)
line('Stitched binding gather',[(0,-2.78,.118),(0,2.79,.118)],.041,navy,BOOK)
for j in range(15):
 y=-2.49+j*.355;line('Visible binding saddle stitch',[(-.075,y,.131),(0,y+.037,.155),(.075,y,.131)],.008,bronze,BOOK)
note('Folio number','F11',-4.70,-2.44,.151)
note('Book title','THE FIRST DIRT',-2.74,-2.22,.247)
note('Barren remnant context','31 DAYS POST-WAR  /  NACREOUS VI LEVEL 3',2.78,-2.42,.156)
for x,ch in [(-1.70,'A'),(0,'B'),(1.69,'C')]:
 box('Scored paper page pull '+ch,(x,-2.655,.143),(.64,.304,.076),navy,BOOK)
 note('Physical tab register '+ch,ch,x,-2.72,.166,z=.189)
ry=.46
for j,(r1,r2,h,z,m) in enumerate([(3.53,3.49,.082,.174,ash3),(3.44,3.31,.069,.249,ash0),(3.19,3.13,.054,.300,ash2),(2.65,2.58,.037,.341,ash1)]):
 o=cyl('Ash crater dry bed cross section layer '+str(j),(0,ry,z),r1,r2,h,m,BOOK,nseg=(18,21,19,17)[j],angle=j*.14)
 for v in o.data.vertices:v.co.y*=.575
# Permanent crust cross sections: three receding quiet horizons and nine fractured shear wedges, none organic.
crest=[.77,.91,1.12,.91,.75,.85,1.14,.80,.73,.95,1.13,.90,.77]
for j,(y,m) in enumerate([(2.39,ash3),(2.24,ash0),(2.07,ash1)]):
 h=1.62-j*.30;w=4.78-j*.13
 peak=[(-w+2*w*i/12,y,.139+v*h) for i,v in enumerate(crest)]
 poly('Inscribed barren horizon layer '+str(j),[(-w,y,.153)]+peak+[(w,y,.153)],m,BOOK,th=.055)
 line('Dry die-cut ridge edge score',[(x,y-.032,z-.059) for x,y,z in peak],.010,ash3,BOOK)
 for x in (-4.10,-2.12,2.08,4.12):
  box('Horizon backing root', (x,y,.160),(.217,.281,.068),ash3,BOOK)
  poly('Scored board foot bracket',[(x,y,.159),(x,y+.23,.159),(x,y,.386)],m,BOOK,th=.045)
fxx=(-3.84,-2.95,-2.08,-1.19,-.28,.63,1.50,2.44,3.38)
for i,x in enumerate(fxx):
 y=1.72+(i%3)*.063;w=.70+(i%3)*.15;h=.36+(i%4)*.20;z=.359 if abs(x)<3.10 else .17
 verts=[(x-w*.5,y,z),(x-w*.54,y,z+h*.45),(x-w*.28,y,z+h*.75),(x+w*.10,y,z+h),(x+w*.21,y,z+h*.53),(x+w*.53,y,z+h*.23),(x+w*.54,y,z)]
 poly('F11 permanent mountain trauma paper cross-section '+str(i+1),verts,[ash0,ash2,ash3][i%3],BOOK,th=.092)
 for j in range(3):
  dy=.06+j*.065
  line('F11 fixed geological shear registration rule',[(x-w*.43,y-.052,z+dy),(x-w*.11,y-.052,z+dy+h*.08),(x+w*.30,y-.052,z+dy+h*.13)],.010,[ash3,goldrock,ash0][j],BOOK)
 # Folded grip at base and restrained replacement shadows.
 box('Barren raised paper stratum bond',(x,y,.165),(.43,.16,.063),ash3,BOOK)
for i in range(41):
 x=rng.uniform(-3.5,3.4);y=rng.uniform(-1.12,1.55)
 if abs(x)<1.65 and abs(y)<.9:continue
 if .25<x<2.95 and -.1<y<1.32:continue
 r=rng.uniform(.027,.098);z=.374 if abs(x)<2.9 and -1.2<y<1.50 else .142
 ob=iso('Sterile ash shard, no soil',(x,y,z),(r,r*.66,r*.68),[ash3,ash0,ash2,goldrock][i%4],BOOK,div=1)
 ob.rotation_euler[2]=i*.93

# Marcel grounded directly on the floor. Source silhouette, not a new likeness claim.
m=empty('Marcel · sourced paper silhouette',M,(-2.22,.58,.348))
m['source']='CharacterFigures.ts buildMarcelFigure';m.rotation_euler[2]=rr(-12)
for x in (-.112,.112):
 cyl('Marcel cropped dark trousers',(x,.005,.410),.094,.088,.440,mpants,M,m,nseg=6)
 cyl('Marcel natural boot cuff',(x,-.019,.129),.088,.078,.248,wood,M,m,nseg=6)
 iso('Marcel anchored leather boot toe',(x,-.073,.068),(.090,.115,.071),wood,M,m,2)
belt=cyl('Marcel waist sash',(0,0,.660),.167,.163,.123,wood,M,m,nseg=7)
belt.scale.y=.72
torso=cyl('Marcel narrow cream V-neck undershirt',(0,-.007,.928),.152,.181,.439,bone,M,m,nseg=7)
torso.scale.y=.62
for side in (-1,1):
 poly('Marcel folded sleeveless olive lapel',[(side*.026,-.122,.694),(side*.157,-.116,.686),(side*.181,-.093,1.162),(side*.053,-.122,1.167),(side*.025,-.132,1.022)],mvest,M,m,th=.055)
 line('Marcel plain bare paper arm',[(side*.171,-.009,1.112),(side*.223,-.019,.900),(side*.235,-.080,.714)],.056,skin,M,m)
 placed=iso('Marcel plain leather wrist cuff',(side*.237,-.071,.752),(.063,.065,.054),wood,M,m,1)
 iso('Marcel paper closed hand',(side*.241,-.086,.697),(.057,.060,.060),skin,M,m,1)
iso('Marcel youthful faceted face',(0,-.016,1.359),(.122,.115,.153),skin,M,m)
iso('Marcel dark tousled widow cap',(0,.005,1.436),(.134,.122,.089),hair,M,m)
poly('Marcel widow peak silhouette',[(-.084,-.109,1.464),(.090,-.104,1.475),(-.007,-.126,1.367)],hair,M,m,th=.021)
for j in range(4):
 x=(j-1.5)*.051
 poly('Marcel simple paper hair notch',[(x-.025,-.047,1.445),(x+.032,.019,1.551-abs(j-1)*.010),(x+.053,.050,1.449)],hair,M,m,.019)
line('Marcel plain wood shepherd crook, no emission',[(.30,-.087,.014),(.30,-.087,.699),(.30,-.087,1.406),(.276,-.087,1.511),(.204,-.087,1.550),(.155,-.087,1.510),(.145,-.087,1.439)],.024,wood,M,m)
note('Marcel only character label','MARCEL',-2.54,-.953,.148,z=.369)

# Folio-authored Shard-god; planar elongated digitigrade posture, crystalline obsidian, one sweeping tail.
t=empty('Tiger · posed planar documentary emblem',T,(2.42,.77,.349))
t.scale=(.82,)*3;t.rotation_euler[2]=rr(13)
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
note('Central emblem label','SHARD-GOD',2.39,-.75,.148,z=.369)

# Source Codec is the addressee; left-chest sunburst is camera-right.
kx=.732;ky=.894
k=empty('Codec · grounded source paper silhouette',T,(kx,ky,.349))
k.scale=(1.10,)*3;k.rotation_euler[2]=rr(-11)
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
note('Grounded Codec label','CODEC',.71,-.75,.148,z=.369)


# A · One contained foil-backed specimen, on a fixed-travel scissors lift and collar guide.
# Four crossed struts maintain the same length; end trucks slide as the platform rises.
lx=-.64;ly=.204;base=.412;L=.472
box('Loam exhibit bonded cradle plate',(lx,ly,.375),(.85,.63,.045),ash3,A)
for y in (ly-.130,ly+.130):
 box('Loam lower rails with physical slots',(lx,y,base-.017),(.65,.070,.06),bronze,A)
 for side in (-1,1):box('Lower rail scored flange',(lx,y+.044*side,base+.010),(.633,.020,.029),bronze,A)
lift=empty('A · moving tray attached to loam specimen',A,(lx,ly,base+.10))
deck=box('Moving loam carrier deck',(0,0,.017),(.658,.407,.048),navy,A,lift)
for y in (-.130,.130):
 box('Loam lifted tray mating rail',(0,y,-.014),(.621,.072,.034),bronze,A,lift)
cyl('Loam cylinder brass mounting saucer',(0,0,.059),.227,.198,.061,bronze,A,lift,nseg=16)
arms=[];trucks=[]
for side in (-1,1):
 y=ly+side*.133
 for sig in (-1,1):
  yy=y+sig*.028
  arm=box('Loam lift fixed-length paper scissor strut',(lx,yy,base), (L+.049,.039,.052),bronze if sig<0 else amber,A)
  arms.append((sig,arm))
  lo=cyl('Loam sliding lower pin truck',(lx,yy,base),.026,.026,.065,bronze,A,nseg=10);lo.rotation_euler[0]=pi/2
  hi=cyl('Loam sliding upper pin truck',(lx,yy,base+.1),.026,.026,.065,bronze,A,nseg=10);hi.rotation_euler[0]=pi/2
  trucks.append((sig,lo,hi))
 piv=cyl('Loam central scissor shared joint',(lx,y,base+.05),.039,.039,.120,ash3,A,nseg=11);piv.rotation_euler[0]=pi/2
 keys(piv,'location',2,[(f,base+(.102+.294*(lambda u:u*u*(3-2*u))(min(1,max(0,(f-17)/26))))*.5) for f in range(1,45)])
for f in range(1,45):
 u=min(1,max(0,(f-17)/26));h=.102+.294*u*u*(3-2*u);dx=sqrt(L*L-h*h)
 lift.location.z=base+h;lift.keyframe_insert('location',index=2,frame=f)
 for sig,arm in arms:
  arm.location.z=base+h/2;arm.rotation_euler[1]=-sig*math.atan2(h,dx)
  arm.keyframe_insert('location',index=2,frame=f);arm.keyframe_insert('rotation_euler',index=1,frame=f)
 for sig,lo,hi in trucks:
  lo.location.x=lx-sig*dx*.5;hi.location.x=lx+sig*dx*.5;hi.location.z=base+h
  lo.keyframe_insert('location',index=0,frame=f);hi.keyframe_insert('location',index=0,frame=f);hi.keyframe_insert('location',index=2,frame=f)
# Thin closed optical wall: inner and outer cylindrical surfaces and closed annuli at their ends.
sample=empty('Only living exhibit: glass loam cylinder and its contents',A,(0,0,.085),lift);sample['contract']='Forearm-sized display, only living botanical specimen and soil contained inside'
R=.164;tr=.009;Z0=.015;Z1=.546;N=32
vertices=[(rad*cos(2*pi*i/N),rad*sin(2*pi*i/N),z) for rad,z in [(R,Z0),(R,Z1),(R-tr,Z0),(R-tr,Z1)] for i in range(N)]
faces=[]
for i in range(N):
 k=(i+1)%N
 faces.extend([(i,k,N+k,N+i),(N+i,N+k,3*N+k,3*N+i),(3*N+i,3*N+k,2*N+k,2*N+i),(2*N+i,2*N+k,k,i)])
sleeve=mesh('One clear sealed glass sleeve (finite thickness)',vertices,faces,glass,A,sample)
for p in sleeve.data.polygons:p.use_smooth=p.index%4 in (0,2)
cyl('Glass base brass cap',(0,0,.020),.184,.183,.044,bronze,A,sample,nseg=18)
cyl('Glass upper slim sealing cap',(0,0,.539),.181,.177,.036,bronze,A,sample,nseg=18)
circle('Thin warm top cap highlight',(0,0,.561),.153,.153,amber,A,sample,th=.008)
loam=cyl('Only dark living loam, enclosed',(0,0,.078),.145,.145,.101,soil,A,sample,nseg=21)
for i in range(10):
 a=i*2.4;r=.020+(.112*i/10)
 iso('Contained loam clump',(r*cos(a),r*sin(a),.128),(.022,.025,.015),soil,A,sample,1)
st=empty('One wheat organism · contained botanical card',A,(0,0,.128),sample)
line('Only wheat stalk centerline',[(0,0,0),(.005,0,.107),(.012,.003,.218),(.011,.003,.346)],.007,wheat,A,st)
poly('Contained botanical leaf, never exterior moss',[(.004,0,.081),(.058,-.006,.125),(.080,-.004,.186),(.032,-.002,.162),(.009,0,.121)],blades,A,st,th=.003)
for j in range(5):
 u=(-1)**j
 grain=iso('Attached grain of the same living stalk',(.013+u*.018,.003,.249+.018*j),(.017,.014,.026),wheat,A,st,2)
 grain.rotation_euler[1]=rr(22*u)
 for sign in (1,-1):
  line('Short attached wheat awn',[(.012+u*.019,.005,.254+j*.018),(.012+u*.022+sign*.009,.006,.283+j*.019)],.0022,wheat,A,st)
# Thin, separate movable inspection collar and two rear guides riding on the carrier, not floating.
for x in (-.210,.210):
 box('Collar guide socket',(x,.058,.117),(.060,.061,.073),navy,A,lift)
 cyl('Continuous optical collar guide post',(x,.058,.386),.015,.015,.508,bronze,A,lift,nseg=9)
lens=empty('A · guided brass inspection lens collar',A,(0,0,.219),lift)
circle('Movable brass optical collar frame',(0,0,0),.209,.209,bronze,A,lens,th=.015)
for x in (-.21,.21):
 cyl('Inspection collar guide bushing',(x,.058,0),.028,.028,.037,amber,A,lens,nseg=10)
 box('Inspection collar sliding guide arm',(x,.023,0),(.030,.090,.027),bronze,A,lens)
keys(lens,'location',2,[(1,.219),(18,.219),(43,.586),(180,.586)])
# Neutral source label held on existing paper, not on landscape.
box('Specimen print plaque',(lx,-.536,.331),(2.32,.31,.062),ash3,A)
note('A life is contained','ONE FOREARM-SIZED VESSEL',lx,-.606,.117,bone,c=A,z=.365)

# B · non-operational editorial symbols: a quarter-scale brass turntable reverses 180 degrees.
mx=3.90;my=.78
for j in range(3):cyl('B · fixed archive turntable base',(mx,my,.168+j*.066),.678-j*.056,.668-j*.056,.059,[navy,slate,ash0][j],B,nseg=18)
rot=empty('B · reversible Macro comparison platter axis',B,(mx,my,.34))
cyl('B cut-brass comparison platter',(0,0,.020),.546,.546,.063,bronze,B,rot,nseg=24)
circle('Fine turntable register ring',(0,0,.054),.470,.470,ash3,B,rot,th=.009)
for j in range(18):
 a=j*pi/9;o=box('B raised paper index tooth',(.521*cos(a),.521*sin(a),.045),(.095,.068,.057),amber,B,rot)
 o.rotation_euler[2]=a
# The two analytic paper symbols are not functional devices and never interact with the specimen mechanically.
old=empty('B red abstract destructive function marker',B,(0,-.258,.058),rot)
new=empty('B azure paper life-preservation arrangement marker',B,(0,.258,.058),rot)
cyl('B macro red paper foot',(0,0,.065),.150,.145,.12,ash3,B,old,nseg=7)
for side in (-1,1):
 poly('B jagged silhouette of abstract wartime function',[(side*.141,-.049,.04),(side*.059,-.05,.221),(side*.153,-.048,.406),(side*.030,-.031,.368),(side*.010,-.031,.211),(side*.073,-.048,.04)],armor,B,old,.042)
iso('B crimson evidence facet',(0,0,.181),(.075,.070,.106),armor,B,old,1)
cyl('B azure preservation catalog footing',(0,0,.058),.161,.142,.105,ash3,B,new,nseg=7)
iso('B blue faceted preservation emblem',(0,0,.224),(.100,.095,.174),cyan,B,new,1)
for j,r in enumerate([.161,.142,.174]):circle('B printed life-preserving arrangement brass/azure ring',(0,0,.141+j*.067),r,r,bronze if j!=1 else cyan,B,new,th=.015)
keys(rot,'rotation_euler',2,[(1,0),(59,0),(84,pi),(180,pi)])
box('B physical exhibit label backing',(mx,my-.783,.168),(1.66,.425,.072),ash3,B)
note('Graphical comparison label','MACRO COMPARE',mx,my-.777,.146,bone,c=B,z=.207)
v0=note('B active before wording','WARTIME USE',mx,my-.92,.101,amber,c=B,z=.207)
v1=note('B active after wording','LIFE PRESERVATION',mx,my-.92,.101,cyan,c=B,z=.207)
vis(v0,[(1,1),(70,1),(71,0),(180,0)]);vis(v1,[(1,0),(70,0),(71,1),(180,1)])

# C · folded archival leaf; exact attributed quotation transcribed from public F11 record.
qx=.72;qy=-1.63
p=empty('C physical quote leaf hinge axis',C,(qx,qy,.218))
box('Standing archival cream paper leaf',(0,.013,.424),(4.33,.061,.82),bone,C,p)
line('Fine embossed archival frame',[(-2.024,-.023,.091),(-2.024,-.023,.751),(2.024,-.023,.751),(2.024,-.023,.091)],.008,bronze,C,p)
for x in (qx-1.64,qx+1.64):
 box('Quote leaf bonded foot',(x,qy,.197),(.36,.47,.050),ash3,C)
 pin=cyl('Quote leaf static spine pin',(x,qy,.218),.036,.036,.163,bronze,C,nseg=10);pin.rotation_euler[1]=pi/2
 box('Quote leaf scored moving attachment',(x-qx,0,.127),(.145,.053,.236),ash1,C,p)
keys(p,'rotation_euler',0,[(1,rr(-83)),(108,rr(-83)),(140,rr(-22)),(180,rr(-22))])
q=[]
q.append(vtxt('C attributed speaker and addressee','THE SHARD-GOD TO CODEC',0,-.023,.579,.131,ash3,C,p))
q.append(vtxt('C exact quote line 1','"Your private discomfort with the shape of survival',0,-.024,.392,.139,ash3,C,p))
q.append(vtxt('C exact quote line 2','is not a license to revise the settlement."',0,-.024,.226,.139,ash3,C,p))
for o in q:vis(o,[(1,0),(126,0),(127,1),(180,1)])
lid=note('C prior paper tab legend','C / ATTRIBUTED RECORD',qx,qy+.37,.121,ash3,c=C,z=.306)
vis(lid,[(1,1),(114,1),(115,0),(180,0)])

# Camera and subdued postwar palette. A small natural brightening focuses attention on glass.
def point(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
def area(n,loc,target,energy,size,color):
 d=bpy.data.lights.new(n,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=color
 o=bpy.data.objects.new(n,d);S.objects.link(o);o.location=loc;point(o,target)
area('Afternoon warm paper key',(-4.8,-5.1,7.30),(-1,0,.55),1750,5.8,(1,.82,.64))
area('Soft ash-blue paper fill',(4.8,-2.75,6.3),(0,0,.56),1450,6.0,(.76,.86,1))
area('Barren ridge raking light',(0,5.1,6.2),(0,1.44,.60),1950,5.1,(.91,.91,1))
area('Local glass sheen warm softbox',(-.20,-1.85,3.5),(-.63,.20,.80),150,1.3,(1,.88,.64))
area('Legible pale quote bounce',(2,-5.7,3.1),(0,-1.13,.34),293,4.4,(.96,.94,.88))
def cam(n,loc,target,sc):
 d=bpy.data.cameras.new(n);d.type='ORTHO';d.ortho_scale=sc
 o=bpy.data.objects.new(n,d);S.objects.link(o);o.location=loc;point(o,target);return o
hero=cam('F11 overview',(.68,-13.2,10.30),(0,.18,.82),11.95)
loamcam=cam('F11 loam proof',(-1.46,-4.48,2.70),(-.65,.19,.85),2.45)
quote=cam('F11 quotation proof',(.95,-6.45,3.9),(.72,-1.38,.615),5.10)
s.camera=hero
for n,f in [('Arrival · barren Level 3',1),('A · lift and inspect one contained loam vessel',46),('B · turn Macro comparison to life-preservation',89),('C · attributed confrontation opens',154)]:
 s.timeline_markers.new(n,frame=f)
s['source_commit']='86d6f4214af204dbbe347a04f7aa9e18f18b7876'
s['canon_contract']='31 days post-war. Level 3 Nacreous VI remains completely barren outside one transparent forearm-sized cylinder; one life-preserving example is not planetary recovery.'
s['status']='SEPARATE BLENDER CANDIDATE ONLY. No write to authenticated source, Drive, archival public program or narration.'
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(D/'Palimpsest_F11_The_First_Dirt.blend'))
