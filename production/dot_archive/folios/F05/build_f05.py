"""F05 candidate: pinned Palimpsest inherited forms, Blender 4.3.
Run in a clean process: blender -b -t 2 -P build_f05.py.
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
s.cycles.samples=14; s.cycles.use_denoising=False; s.cycles.max_bounces=4
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

BOOK=coll('00 | Book spread and editorial storm proscenium')
A=coll('01 | A · Before and after')
B=coll('02 | B · Four-stage folding cutaway')
RIG=coll('03 | Source DRAXIS 044 and 029 interpretations')
C=coll('04 | C · Doctrine and fact')
S=coll('05 | Cameras and studio')
stock=mat('Black-through paper stock',(.010,.008,.010),.90,.13)
ash=mat('War charcoal',(.031,.026,.035),.87,.11)
slate=mat('War slate card',(.105,.094,.110),.86,.13)
plum=mat('Storm plum',(.068,.025,.034),.89,.12)
rust=mat('Storm crimson',(.21,.064,.056),.85,.11)
dull=mat('Dark red stock',(.11,.036,.042),.90,.10)
cream=mat('Cream archival paper',(.74,.62,.44),.87,.09)
white=mat('Pale printed nomenclature',(.87,.77,.61),.9)
bronze=mat('Laid bronze card and pin register',(.45,.254,.098),.55,.09,.24)
copper=mat('Dark ochre bronze paper',(.32,.129,.050),.65,.08,.19)
cyan=mat('Cyan ink only on the 029 containment rings',(.068,.41,.50),.58,.06)
amber=mat('044 translucent amber flask represented as layered cardstock',(.56,.19,.029),.55,.10)
rb=[mat('Opaque vitrified mineral · '+n,col,.46,.08,.20) for n,col in [('crimson glass-iron',(.115,.013,.015)),('rough red fracture',(.245,.023,.023)),('dark iron facet',(.048,.009,.012))]]
sea=[mat('Before globe palette '+str(i),v,.76,.09) for i,v in enumerate([(.075,.23,.19),(.14,.30,.20),(.079,.16,.207),(.23,.34,.169)])]
scour=[mat('After globe palette '+str(i),v,.85,.09) for i,v in enumerate([(.13,.11,.103),(.207,.154,.139),(.114,.109,.128),(.218,.170,.133)])]
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
def htxt(n,l,x,y,z,sz,m=white,c=BOOK,p=None):return txt(n,l,(x,y,z),sz,m,c,p)
def vtxt(n,l,x,y,z,sz,m,c,p=None):return txt(n,l,(x,y,z),sz,m,c,p,rot=(pi/2,0,0))

# Open book and three editorial crest leaves. The middle carries a true orbit hole.
box('Quiet charcoal desk',(0,0,-.40),(150,150,.12),ash,S,bev=0)
for q in (-1,1):
 x=q*2.58
 box('Cloth-covered book board',(x,0,-.218),(5.2,5.66,.216),ash,BOOK)
 for j in range(9):box('Visible individually cut page ply',(x,0,-.094+j*.019),(5.05+.01*j,5.45+.01*j,.012),stock if j%3 else slate,BOOK,bev=.002)
 box('Working charcoal leaf',(x,0,.083),(5.12,5.51,.080),stock,BOOK)
 for y in (-2.54,2.55):
  line('Inset fine gold print',[(x-2.36,y,.127),(x+2.36,y,.127)],.008,bronze,BOOK)
 for xx in (x-2.36,x+2.36):line('Book outer pin register',[(xx,-2.54,.128),(xx,2.55,.128)],.007,bronze,BOOK)
line('Stitched binding fold',[(0,-2.73,.112),(0,2.76,.112)],.041,ash,BOOK)
for j in range(15):
 y=-2.44+j*.349;line('Gutter linen stitch',[(-.066,y,.135),(0,y+.04,.152),(.067,y,.135)],.009,bronze,BOOK)
htxt('Folio index','F05',-4.65,-2.43,.132,.14)
htxt('Title','THE STANDARD OF CONQUEST',0,-2.27,.132,.18)
htxt('Era stamp','YEAR 3 / FALLENSTAR PRIME',3.50,-2.46,.132,.145)
for x,ch in [(-3.2,'A'),(0,'B'),(3.2,'C')]:
 box('Hinged pull tab '+ch,(x,-2.62,.145),(.62,.33,.068),dull,BOOK)
 htxt('Slot index '+ch,ch,x,-2.67,.184,.165)
crest=[.87,1.02,1.29,1.55,1.67,1.74,1.79,1.74,1.67,1.55,1.29,1.02,.87]
for j,(y,matl) in enumerate([(2.34,plum),(2.17,dull),(2.00,rust)]):
 w=4.62-j*.15;k=1.15-j*.19
 ridge=[(-w+2*w*i/12,y,.14+h*k) for i,h in enumerate(crest)]
 if j==1:
  N=88;outer=[];inner=[];cz=.96
  for i in range(N):
   a=2*pi*i/N;dx,dz=cos(a),sin(a);L,H=0,8
   for _ in range(17):
    t=(L+H)/2;x=t*dx;z=cz+t*dz;u=(x+w)*6/w;ic=min(11,max(0,int(u)))
    top=.14+(crest[ic]+(crest[ic+1]-crest[ic])*(u-ic))*k
    if abs(x)<w and .14<z<top:L=t
    else:H=t
   outer.append((L*dx,y,cz+L*dz));inner.append((.46*dx,y,cz+.35*dz))
  mesh('True orbit aperture cut through storm lamina',outer+inner,[(i,(i+1)%N,N+(i+1)%N,N+i) for i in range(N)],matl,BOOK,th=.055)
 else:poly('Layered storm crest '+str(j),[(-w,y,.14)]+ridge+[(w,y,.14)],matl,BOOK,th=.047)
 line('Die-cut wear register',[(x,yy-.032,z-.045) for x,yy,z in ridge],.009,plum,BOOK)
 for x in (-4.2,-2.05,2.05,4.2):
  box('Glued storm board foot',(x,y,.157),(.26,.30,.059),ash,BOOK)
  poly('Folded storm board gusset',[(x,y,.15),(x,y+.24,.15),(x,y,.40)],matl,BOOK,th=.042)

# A · ring is real closed volume with rough matte opaque facets, never an aura.
px,py,pz=-3.25,.36,1.38
for j in range(3):box('Planet glued stepped plinth',(px,py,.182+j*.051),(2.70-j*.13,1.93-j*.14,.05),[slate,plum,ash][j],A)
cyl('Brass docking foot',(px,py,.341),.41,.36,.078,bronze,A,nseg=12)
cyl('Tapered brass planet stand',(px,py,.605),.126,.067,.50,copper,A,nseg=10)
g=iso('Fallenstar Prime · living surface',(px,py,pz),(.70,.70,.70),sea[0],A,div=3)
for m in sea[1:]+scour:g.data.materials.append(m)
for f in g.data.polygons:
 v=sum((g.data.vertices[i].co for i in f.vertices),Vector())/len(f.vertices)
 f.material_index=max(0,min(3,int((.51+.22*sin(v.x*8+v.z*5)+.2*cos(v.y*10-v.z*4))*4)))
after=g.copy();after.data=g.data.copy();A.objects.link(after);after.name='Fallenstar Prime · after conquest'
for f in after.data.polygons:f.material_index+=4
vis(g,[(1,1),(29,1),(30,0),(180,0)]);vis(after,[(1,0),(29,0),(30,1),(180,1)])
orb=empty('A · planet orbital comparison pivot',A,(px,py,pz));orb.rotation_euler=(rr(-7),rr(13),rr(14))
band=ring('A · PHYSICAL opaque crimson glass-iron Blood Ring',orb,(0,0,0),1.11,.061,.116,0,2*pi,64,A)
band['contract']='Opaque vitrified mineral, no emission, transparent halo or graphical aura'
vis(band,[(1,0),(20,0),(21,1),(180,1)])
for j in range(8):
 a=j*pi/4+.19;o=iso('Opaque rim shard',(1.29*cos(a),1.29*sin(a),.01),(.041,.043,.045),rb[1],A,orb,1)
 vis(o,[(1,0),(20,0),(21,1),(180,1)])
for fr,val in [(1,.04),(20,.04),(35,1),(180,1)]:orb.scale=(val,)*3;orb.keyframe_insert('scale',frame=fr)
keys(orb,'rotation_euler',2,[(1,rr(14)),(35,rr(14)),(180,rr(32))])
htxt('Station title','FALLENSTAR PRIME',px,-.81,.134,.19)
htxt('A slider instruction','BEFORE / AFTER',px,-1.08,.134,.115,bronze)
box('Actual slider channel',(px,-1.33,.154),(1.72,.22,.045),slate,A)
for j in (-1,1):box('Slider guide wall',(px,-1.33+j*.104,.181),(1.72,.039,.035),bronze,A)
lever=box('A · movable paper lever',(px-.60,-1.33,.208),(.23,.25,.070),rust,A)
keys(lever,'location',0,[(1,px-.60),(20,px-.60),(35,px+.60),(180,px+.60)])

# B · four indexed bays in source order, no graphic portrayal of inhabitants.
xs=(-.98,.53,2.03,3.53);ym=.55;zm=.338
labs=('INPUT','CONVERSION','EXTRUSION','ORBITAL RING');subs=('HARVEST','GOREVAULT 044','RINGTHROAT 029','VITRIFIED CRIMSON')
for j in range(3):box('Factory stepped technical bed',(1.28,.50,.180+j*.052),(6.24-j*.12,2.40-j*.11,.052),[slate,dull,ash][j],B)
for i,(x,title,sub) in enumerate(zip(xs,labs,subs),1):
 box('Recessed technical bay bed '+str(i),(x,.65,.332),(1.36,1.61,.064),slate,B)
 for side in (-1,1):box('Laminated machine retaining foot',(x+side*.625,.67,.375),(.045,1.56,.053),dull,B)
 box('Cream typed bay label',(x,-.40,.345),(1.30,.37,.058),cream,B)
 htxt('Bay heading '+str(i),str(i)+' · '+title,x,-.39,.378,.123,stock,B)
 htxt('Bay descriptor '+str(i),sub,x,-.51,.378,.092,rb[2],B)
p=empty('01 · Layered documentary feedstock sample',RIG,(xs[0],ym,zm))
for j in range(5):
 box('Cut feedstock strata',(0,0,.045+j*.052),(.75-j*.075,.52-j*.048,.043),[stock,slate,rust,amber,rb[2]][j],RIG,p)
for j in range(8):
 a=j*1.7;iso('Feedstock schematic shard',(.21*cos(a),.13*sin(a),.29+j%3*.025),(.036,.027,.032),[cream,rb[1],slate][j%3],RIG,p,1)
gv=empty('Gorevault 044 · source procedural silhouette',RIG,(xs[1],ym,zm))
gv['source']='DraxisModels.ts case 044'
for x in (-.29,.29):
 for y in (.018,.264):
  limb=box('044 rear crawler support',(x,y,.148),(.115,.130,.293),slate,RIG,gv);limb.rotation_euler[1]=rr(15 if x>0 else -15)
for x in (-.24,.24):
 line('044 heavy hooked forelimb',[(x*.73,-.17,.53),(x*1.38,-.35,.29),(x*1.31,-.50,.106)],.074,slate,RIG,gv)
 for dx in (-.033,.033):line('044 bone foreclaw',[(x*1.31+dx,-.48,.113),(x*1.29+dx,-.57,.052),(x*1.23+dx,-.62,.071)],.025,cream,RIG,gv)
for j in range(6):
 a,b=j*pi/6,(j+1)*pi/6
 poly('044 origami armored arch plane',[(.383*cos(t),y,.345+.382*sin(t)) for t,y in [(a,-.27),(a,.37),(b,.37),(b,-.27)]],[ash,slate,plum][j%3],RIG,gv,.040)
for j in range(4):
 y=-.181+j*.169;cyl('044 dorsal furnace silo',(0,y,.783),.056,.050,.139,slate,RIG,gv,nseg=7)
 cyl('044 cyan printed furnace lip',(0,y,.862),.057,.055,.025,cyan,RIG,gv,nseg=7)
for x in (-.151,.151):
 for y in (-.18,.04,.24):
  iso('044 reservoir flask',(x,y,.267),(.060,.064,.122),amber,RIG,gv)
  iso('044 crimson biomass insert',(x,y-.011,.238),(.040,.066,.053),rb[1],RIG,gv)
iso('044 angular armored scythe head',(0,-.334,.440),(.141,.171,.121),ash,RIG,gv)
rt=empty('Ringthroat 029 · source procedural silhouette',RIG,(xs[2],ym,zm))
rt['source']='DraxisModels.ts case 029'
for j in range(4):
 a=j*pi/2+pi/4;x,y=cos(a),sin(a)
 line('029 splayed bronze gantry leg',[(.13*x,.13*y,.39),(.27*x,.27*y,.23),(.407*x,.407*y,.027)],.050,bronze,RIG,rt)
 box('029 bonded gantry foot',(.407*x,.407*y,.027),(.124,.127,.046),ash,RIG,rt)
iso('029 red-black pressure belly',(0,0,.411),(.184,.186,.193),rb[1],RIG,rt)
for j in range(6):
 a=j*pi/3;box('029 vertical pressure cage rib',(.17*cos(a),.17*sin(a),.389),(.029,.031,.342),ash,RIG,rt)
cyl('029 layered paper column neck',(0,0,.655),.141,.095,.319,slate,RIG,rt)
cyl('029 flared bronze nozzle',(0,0,.868),.099,.213,.119,copper,RIG,rt,nseg=10)
cyl('029 opaque extruding mineral column',(0,0,.960),.070,.106,.218,rb[1],RIG,rt,nseg=9)
for j,rad in enumerate((.209,.224,.196)):
 circle('029 cyan containment ring, machine only',(0,0,.937+j*.054),rad,rad,cyan,RIG,rt,th=.012)
for a,b in zip(xs,xs[1:]):
 box('Physical crimson transfer conduit',((a+b)/2,.839,.477),(b-a,.063,.068),rb[2],RIG)
 for x in (a+.46,b-.46):box('Copper pipe saddle',(x,.839,.452),(.099,.150,.151),copper,RIG)
pulse=box('Cutaway red slurry cursor',(1.0,.840,.521),(.12,.070,.064),rb[1],RIG)
keys(pulse,'location',0,[(1,1.0),(71,1.0),(98,1.56),(180,1.56)])
sp=empty('04 · Solid ring cross-section display',RIG,(xs[3],.56,.680));sp.rotation_euler=(rr(72),0,rr(24))
ring('B4 · Opaque extruded slag arc',sp,(0,0,0),.358,.043,.063,.16,pi*1.46,36,RIG)
for x in (xs[3]-.25,xs[3]+.26):box('B4 ring sample footing',(x,.60,.453),(.077,.155,.235),slate,RIG)

# Two brass paper-lattice inspection leaves. Real empty slits and open views, not a fake alpha image.
# Rim turns with each hinge; stationary rails and bushings remain fixed to the deck.
leaves=[]
for i,side in enumerate((1,-1)):
 x=-1.61 if side==1 else 4.16;y=-.19;z=.383;w=2.865;h=.54
 d=empty('B · '+('left' if side==1 else 'right')+' slotted inspection door pivot',B,(x,y,z));leaves.append(d)
 ext=empty('B · coupled bi-fold return leaf',B,(side*w/2,0,0),d)
 for half in (d,ext):
  for pos in (.030,w/2-.030):
   box('Bronze frame leaf vertical stile',(side*pos,0,h/2),(.058,.060,h),bronze,B,half)
  for hh in (.025,h-.025,.224):
   box('Bronze frame cross rail',(side*w/4,0,hh),(w/2,.061,.049 if hh!=.224 else .030),bronze,B,half)
  for j in range(4):
   xx=side*(.145+j*.350)
   box('Narrow cut-paper fret leaf, unfilled gaps',(xx,0,h*.51),(.032,.034,h-.08),copper,B,half)
 cyl('Door second fold pin on moving return joint',(side*w/2,0,h*.5),.025,.025,h+.04,bronze,B,d,nseg=10)
 keys(ext,'rotation_euler',2,[(1,0),(44,0),(61,side*rr(-149)),(180,side*rr(-149))])
 for zz in (.105,.375):
  cyl('Stationary brass inspection hinge knuckle',(x,y,z+zz),.050,.049,.113,bronze,B,nseg=10)
  box('Door hinge joint saddle',(x,.01,z+zz),(.085,.35,.080),ash,B)
 cyl('Continuous physical hinge pin',(x,y,z+.273),.024,.024,.645,copper,B,nseg=10)
 box('Standing door pillar bonded to factory bed',(x,.082,.611),(.107,.160,.48),ash,B)
 box('Standing pillar registration foot',(x,.082,.365),(.265,.317,.071),rust,B)
 for zz in (.17,.369):
  box('Moving scored hinge strap',(side*.10,0,zz),(.19,.067,.068),copper,B,d)
 keys(d,'rotation_euler',2,[(1,side*rr(-14)),(42,side*rr(-14)),(61,side*rr(-93)),(180,side*rr(-93))])
# 4 physical die-cut instructional shutters; each rises on a fixed glued hinge at its own step.
folds=[]
for j,x in enumerate(xs):
 p=empty('B aperture %d · rotating punched board'%(j+1),B,(x,1.15,.376));folds.append(p)
 W=.62;H=.792;cz=.47;N=52
 out=[];ins=[]
 for k in range(N):
  a=k*2*pi/N;dx,dz=cos(a),sin(a)
  t=min(W/max(abs(dx),1e-7),((H-cz) if dz>0 else cz)/max(abs(dz),1e-7))
  out.append((dx*t,.021,cz+dz*t));ins.append((dx*(.235+j*.017),.021,cz+dz*(.218+j*.015)))
 mesh('Exterior frame B%d · through-cut circular aperture'%(j+1),out+ins,[(k,(k+1)%N,N+(k+1)%N,N+k) for k in range(N)],dull,B,p,th=.056)
 circle('Brass inlay on inside cut shoulder',(0,-.014,cz),.250+j*.017,.232+j*.015,bronze,B,p,vertical=True,th=.012)
 mark=box('Documented material passage marker '+str(j+1),(0,-.035,.124),(.45,.050,.119),cream,B,p)
 txtmark=vtxt('Mechanism staged number '+str(j+1),'0'+str(j+1),(0),-.063,.076,.139,stock,B,p)
 for ob in (mark,txtmark):vis(ob,[(1,0),(52+j*20,0),(53+j*20,1),(180,1)])
 line('Small scored print over aperture',[(-.43,-.014,.705),(.43,-.014,.705)],.008,bronze,B,p)
 for dx in (-.46,.46):
  box('Foot of B%d fixed stage aperture'%(j+1),(x+dx,1.21,.354),(.19,.240,.074),ash,B)
  pin=cyl('B%d fold cylinder tangent axis'%(j+1),(x+dx,1.15,.376),.042,.042,.189,copper,B,nseg=9);pin.rotation_euler[1]=pi/2
  # Attachment faces at both ends remain coincident throughout rotation by sharing pivot.
  box('Scored hinge leaf strap',(dx,0,.126),(.113,.038,.228),rust,B,p)
 b=51+j*20
 keys(p,'rotation_euler',0,[(1,rr(-80)),(b,rr(-80)),(b+13,rr(0)),(180,rr(0))])
# C · attribution separate from factual history. Authored 3D panel keeps both records in view;
# manifest’s contrast is implemented by moving the two paired real paper leaves to review position.
cards=[]
for idx,(x,m,ink,heading,lines) in enumerate([
 (-1.11,dull,white,'DRAKKEN DOCTRINAL INSCRIPTION',('"Your sky is built from your dead."',)),
 (2.23,cream,stock,'FACTUAL RECORD / YEAR 3',('Harvested people and matter became feedstock.', 'Extruded into a vitrified crimson ring.'))
]):
 y=-1.98;z=.175
 p=empty('C · '+('attributed quotation' if idx==0 else 'archive record')+' paper fold',C,(x,y,z));cards.append(p)
 box('Paper plaque laminated face',(0,.017,.40),(3.07,.051,.77),m,C,p)
 line('Evidence plaque printed inset line',[(-1.43,-.020,.12),(-1.43,-.020,.71),(1.43,-.020,.71),(1.43,-.020,.12)],.009,bronze if idx==0 else copper,C,p)
 vtxt('C exact attribution title '+str(idx),heading,0,-.016,.523,.124,ink,C,p)
 for j,l in enumerate(lines):vtxt('C documentary line '+str(idx)+'.'+str(j),l,0,-.016,.327-j*.116,.112 if idx else .131,ink,C,p)
 for xx in (x-1.22,x+1.22):
  box('Evidence plaque glued foot',(xx,y,.147),(.25,.28,.056),ash,C)
  pin=cyl('C physical hinge pin',(xx,y,z),.039,.039,.11,bronze,C,nseg=9);pin.rotation_euler[1]=pi/2
 keys(p,'rotation_euler',0,[(1,rr(-81)),(132,rr(-81)),(155,rr(-26)),(180,rr(-26))])

# Rich top fill and raking edge sheen, no glowing orbital elements.
def point(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
def light(n,loc,target,energy,size,color):
 d=bpy.data.lights.new(n,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=color
 o=bpy.data.objects.new(n,d);S.objects.link(o);o.location=loc;point(o,target)
light('Diffused tungsten key',(-4.7,-4.1,7.1),(0,.1,.46),1750,5.6,(1,.84,.68))
light('Cool paper fill',(5.25,-3.45,6.1),(0,.1,.55),1550,5.3,(.74,.85,1))
light('Raking crimson cut-edge backlight',(0,5.1,6.5),(0,1.6,.65),2140,4.4,(1,.76,.65))
light('Gentle readable plaque bounce',(0,-6.0,3.1),(0,-1.24,.28),340,4.5,(1,.95,.85))
def camera(n,loc,target,scale):
 d=bpy.data.cameras.new(n);d.type='ORTHO';d.ortho_scale=scale
 o=bpy.data.objects.new(n,d);S.objects.link(o);o.location=loc;point(o,target);return o
hero=camera('F05 overview · aligned review',(0.78,-12.9,9.8),(0,.22,.72),11.9)
det=camera('F05 cutaway · physical hinge detail',(4.6,-6.8,5.6),(1.25,.55,.85),7.35)
evid=camera('F05 evidence · contrast C',(.12,-7.2,4.3),(.55,-1.78,.49),6.88)
s.camera=hero
for n,f in [('Arrival · no ring',1),('A · solid ring after',38),('B1 · input',65),('B2 · conversion',85),('B3 · extrusion',105),('B4 · solid ring sample',126),('C · doctrine versus record',159)]:
 s.timeline_markers.new(n,frame=f)
s['source_commit']='86d6f4214af204dbbe347a04f7aa9e18f18b7876'
s['authored_contract']='F05 Year 3; opaque physical ring; four numbered manufacturing stages; clearly attributed doctrine vs documented process; no graphic violence, public marginalia or audio.'
s['status']='SEPARATE BLENDER CANDIDATE ONLY; does not replace live assets or scenes'
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(D/'Palimpsest_F05_The_Standard_of_Conquest.blend'))
