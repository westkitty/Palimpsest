"""PALIMPSEST X — F10, 12 physically articulated Siege Wall collar panels."""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
from math import sin, cos, pi
R=Path(__file__).resolve().parent
s=bpy.context.scene
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
s.render.engine='CYCLES';s.cycles.use_denoising=False;s.cycles.samples=26;s.cycles.max_bounces=4
s.render.threads_mode='FIXED';s.render.threads=3
s.render.resolution_x=1080;s.render.resolution_y=686;s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX'
s.world.use_nodes=True
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.065,.100,.128,1)
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.32
def coll(name):
 c=bpy.data.collections.new(name);s.collection.children.link(c);return c
base=coll('01 • Black stock after the All; source-grounded public plate')
codecC=coll('02 • Only one sky mark; sealed protocol context')
fold=coll('03 • A • 12 fixed axes and crenellated cardstock fins')
studio=coll('04 • Reading and binding inspection cameras')
def mat(n,c,rough=.85,grain=True,met=0,em=None,ems=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True
 nn=m.node_tree.nodes;l=m.node_tree.links;p=nn.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=met
 if em:p.inputs['Emission Color'].default_value=(*em,1);p.inputs['Emission Strength'].default_value=ems
 if grain:
  tex=nn.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=132;tex.inputs['Detail'].default_value=2.6
  coord=nn.new('ShaderNodeTexCoord');l.new(coord.outputs['Object'],tex.inputs['Vector'])
  bump=nn.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.2;bump.inputs['Distance'].default_value=.004
  l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
 return m
black=mat('Paper • black dyed through, cut edges also black',(.016,.022,.028),.86)
cloth=mat('Bookcloth • deep graphite weave',(.025,.041,.048),.91)
mid=mat('Warm graphite paper face',(.048,.065,.065))
light=mat('Paper face print • eggshell',(.67,.56,.38),.90)
dimprint=mat('Alternate paper face print • warm flax',(.41,.34,.218),.91)
localgreen=mat('Printed colony green',(.103,.26,.157))
forest=mat('Printed dark evergreen',(.057,.145,.111))
teal=mat('Teal foil and forest relief',(.069,.252,.221))
brass=mat('Dull saffron registration metal',(.47,.287,.095),.46,False,.38)
ochre=mat('Warm saffron letterpress',(.71,.441,.125),.79)
amber=mat('Low red archival ink',(.27,.052,.032))
navy=mat('Low-shine slate',(.044,.077,.086))
table=mat('Desk • quiet slate',(.028,.042,.060),.86)
noct=mat('Near-black letterpress',(.018,.027,.027))
def obj(n,data=None,p=None,c=base):
 o=bpy.data.objects.new(n,data);c.objects.link(o);o.parent=p;return o
def mesh(n,vs,fs,m,p=None,c=base):
 d=bpy.data.meshes.new(n);d.from_pydata(vs,[],fs);d.update()
 o=obj(n,d,p,c);o.data.materials.append(m);return o
def shell(n,m,loc,dim,p=None,c=base,be=.006):
 a,b,d=(x*.5 for x in dim)
 v=[(-a,-b,-d),(a,-b,-d),(a,b,-d),(-a,b,-d),(-a,-b,d),(a,-b,d),(a,b,d),(-a,b,d)]
 o=mesh(n,v,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m,p,c);o.location=loc
 if be:
  bv=o.modifiers.new('Soft pressed edge','BEVEL');bv.width=min(be,d*.85);bv.segments=2
 return o
serf=Path(__file__).resolve().parents[2] / 'licenses' / 'LiberationSerif-Regular.ttf'
font=bpy.data.fonts.load(str(serf)) if serf.exists() else None
if font:font.pack()
def text(n,string,loc,sz,m,p=None,c=base,center=True,rot=(0,0,0)):
 d=bpy.data.curves.new(n,'FONT');d.body=string;d.align_x='CENTER' if center else 'LEFT';d.align_y='CENTER';d.size=sz;d.space_character=1.12
 if font:d.font=font
 o=obj(n,d,p,c);o.location=loc;o.rotation_euler=rot;o.data.materials.append(m);return o
def plate(n,poly,dep,m,p=None,c=base):
 k=len(poly)
 o=mesh(n,[(x,y,zz) for zz in (0,dep) for x,y in poly],[tuple(reversed(range(k))),tuple(range(k,2*k))]+[(i,(i+1)%k,(i+1)%k+k,i+k) for i in range(k)],m,p,c);return o
def upright(n,outline,depth,m,origin):
 o=plate(n,outline,depth,m);o.rotation_euler.x=pi/2;o.location=origin;return o
def rule(n,loc,dim,m=ochre,p=None,c=base):return shell(n,m,loc,dim,p,c,0)
az=mat('Pigment on black paper • azure grey',(.089,.185,.268),.82)
darkaz=mat('Pigment on black paper • cloud ash',(.071,.115,.169),.90)
sky=mat('Single inhabited-horizon slate sky, no star field',(.174,.285,.402),.95)
silver=mat('Pigment on stiff cardstock • wheat-faded slate',(.284,.323,.330),.79)
trim=mat('Natural muted wheaten gold',(.475,.349,.165),.53,False,.24)
void=bpy.data.materials.new('Pitch black: no lit component, no highlights')
void.diffuse_color=(.001,.001,.001,1);void.use_nodes=True
nd=void.node_tree.nodes;ls=void.node_tree.links
n=nd.new('ShaderNodeEmission');n.inputs[0].default_value=(0,0,0,1);n.inputs[1].default_value=1
ls.new(n.outputs[0],nd.get('Material Output').inputs['Surface'])
def disk(n,x,y,z,r,dep,m,p=None,c=base,num=48):
 t=plate(n,[(r*cos(j*2*pi/num),r*sin(j*2*pi/num)) for j in range(num)],dep,m,p,c)
 t.location=(x,y,z);return t
def ln(n,pts,w,m,p=None,c=base):
 d=bpy.data.curves.new(n,'CURVE');d.dimensions='3D';d.resolution_u=1;d.bevel_depth=w;d.bevel_resolution=1
 z=d.splines.new('POLY');z.points.add(len(pts)-1)
 for q,co in zip(z.points,pts):q.co=(*co,1)
 o=obj(n,d,p,c);o.data.materials.append(m);return o
def poly_ring(n,x,y,z,outer,inner,m,c=base,N=48):
 v=[(x+r*cos(i*2*pi/N),y+r*sin(i*2*pi/N),z) for r in (outer,inner) for i in range(N)]
 f=[(i,(i+1)%N,N+(i+1)%N,N+i) for i in range(N)]
 o=mesh(n,v,f,m,c=c);mod=o.modifiers.new('Black-cut structural thickness','SOLIDIFY');mod.thickness=.010;return o
def flatcard(name,cx,cy,w,d,color,header,detail=''):
 shell(name+' • black bound stock',black,(cx,cy,.091),(w,d,.031),c=codecC)
 rule(name+' • archival surface ink',(cx,cy,.110),(w-.040,d-.032,.005),color,None,codecC)
 text(name+' • header',header,(cx,cy+(.031 if detail else 0),.117),.086,light,c=codecC)
 if detail:text(name+' • body',detail,(cx,cy-.051,.117),.062,ochre,c=codecC)
# True black cardstock core, after construction of the All. Muted pigment and
# short book-cloth strips are only surface treatments.
shell('Graphite sewn cloth cover',cloth,(0,0,-.19),(6.42,4.10,.153),be=.016)
for k in range(6):
 shell('Dyed-through fore-edge lamination %d'%k,black if k%2 else mid,(0,0,-.105+k*.015),(6.27-k*.007,3.97-k*.007,.011),be=.002)
for x in (-1.53,1.53):shell('Dark folio leaf',black,(x,.014,.013),(3.03,3.85,.087),be=.008)
rule('Black binding fold',(0,0,.056),(.060,3.83,.073),navy)
for i in range(14):rule('Spine register',(0,-1.78+i*.269,.101),(.028,.052,.005),trim)
for x in (-2.86,2.86):rule('Thin paper frame rule',(x,0,.066),(.012,3.63,.006),trim)
for y in (-1.80,1.81):rule('Thin paper frame rule',(0,y,.066),(5.72,.012,.006),trim)
# Very low ash/cardboard backdrop, no additional marks in the inhabited sky.
for i in range(3):
 edge=[(-2.76,0),(-2.76,.19),(-2.43,.27),(-1.91,.25),(-1.49,.31),(-.98,.23),(-.66,.29),(-.23,.25),(.18,.28),(.60,.25),(1.12,.28),(1.56,.19),(2.12,.20),(2.76,.25),(2.76,0)]
 upright('Ash-colour rear paper register',[ (x,z*(1-.11*i)) for x,z in edge],.031,(darkaz,navy,mid)[i],(0,1.76-.10*i,.087))
# A: closed-world schematic, 12 fins around one pitch black core.  Source
# runtime scales the collar's height. Here each rigid tapered physical leaf
# rotates around a fixed tangential scored axis and lands visibly flat.
X,Y=-1.33,.61
Z=.205;RAD=.84
disk('A graphite binding support',X,Y,.087,1.005,.049,navy,num=48)
disk('A slate die-cut top plate',X,Y,.139,.982,.039,mid,num=48)
disk('One single central void core',X,Y,.180,.621,.010,void,num=16)
poly_ring('A low wheat printed crease datum',X,Y,.187,.935,.895,trim,N=48)
poly_ring('A printed darker inner datum',X,Y,.192,.824,.820,shadow if 'shadow' in globals() else cloth,N=48)
hinges=[]
outline=[(-.208,0),(.208,0),(.186,-.082),(.158,-.172),(.113,-.303),(.086,-.420),(.077,-.474),(.053,-.474),(.053,-.515),(-.053,-.515),(-.053,-.474),(-.077,-.474),(-.086,-.420),(-.113,-.303),(-.158,-.172),(-.186,-.082)]
for i in range(12):
 a=2*pi*i/12; u=Vector((cos(a),sin(a),0)); t=Vector((sin(a),-cos(a),0)); zz=Vector((0,0,1))
 # Local +Y faces radially outward so -Y is the lowered center-facing panel.
 assert t.cross(u).dot(zz)>.999
 br=obj('A fixed geometric base %02d'%(i+1),c=fold);br.location=Vector((X,Y,Z))+RAD*u
 br.rotation_mode='QUATERNION';br.rotation_quaternion=Matrix((t,u,zz)).transposed().to_quaternion()
 piv=obj('A cardstock fold hinge %02d'%(i+1),p=br,c=fold);piv.empty_display_size=.12
 piv['Slot']='F10.A';piv['Bottom width']=.416;piv['Raised paper length']=.515
 hinges.append((br,piv))
 shell('A black glue-foot %02d'%i,navy,(0,.029,-.012),(.425,.096,.023),br,fold,be=.003)
 rule('A horizontal paper score %02d'%i,(0,0,.006),(.407,.011,.005),trim,br,fold)
 skin=plate('A real die-cut crease leaf %02d'%i,outline,.018,black,piv,fold)
 for j in range(2):
  a_=plate('A stripe of dark slate printed on the leaf %02d'% (i*2+j),
   [(-.153+j*.039,-.069),(-.108+j*.038,-.069),(-.044+j*.017,-.413),(-.068+j*.018,-.413)],.003,az if i%3 else silver,piv,fold)
  a_.location.z=.019
 rule('A wheat top edge marking %02d'%i,(0,-.485,.024),(.088,.012,.004),trim,piv,fold)
 # Crisp exposed score, painted on the cyan-free side of the moving cardstock.
 ln('Crease front registration %02d'%i,[(-.181,-.044,.022),(.181,-.044,.022)],.002,trim,piv,fold)
flatcard('A folio mount caption',X,-.537,2.03,.274,navy,'A   BOUNDARY DIAGRAM')
# B: static already-toggled inhabited-horizon view per source. Four anonymous
# paper cottages, low grounded hills, and exactly one unlit opaque black strip.
bx,by=1.365,.545
shell('B • graphite paper stage shoe',navy,(bx,by,.102),(2.28,1.66,.086),c=codecC)
shell('B • applied dusk paper wash',az,(bx,by,.151),(2.19,1.57,.025),c=codecC)
bd=shell('B • blank inhabited sky card',black,(bx,1.213,.657),(2.18,.073,1.04),c=codecC)
shell('B • blank sky ink plane, zero other marks',sky,(bx,1.169,.657),(2.10,.013,.987),c=codecC,be=.003)
mark=shell('B • ONLY inhabited-sky mark: pitch-black Siege Wall streak',void,(bx,1.153,.715),(2.102,.014,.158),c=codecC,be=0)
mark.rotation_euler.y=-.11;mark['Emissive/glow']='None. Pitch-black absorption silhouette.'
for j,(y,hmax) in enumerate([(1.05,.45),(.907,.325),(.73,.25)]):
 co=[(-1.04,0),(-1.04,.22),(-.82,hmax*.74),(-.57,hmax*.92),(-.39,hmax),(-.12,hmax*.7),(.15,hmax*.43),(.36,hmax*.65),(.64,hmax*.83),(.86,hmax*.52),(1.04,.18),(1.04,0)]
 upright('B • grounded stacked paper hills, below sky streak',co,.031,(darkaz,az,mid)[j],(bx,y,.166))
for i,x in enumerate([-.682,-.255,.212,.654]):
 hh=.148+(i%2)*.051
 cy=.42+(.122 if i%2 else 0)
 shell('B cottage layered blank paper cut %d'%(i+1),light,(bx+x,cy,.185+hh/2),(.205,.175,hh),c=codecC,be=.004)
 roof=plate('B cottage slate fold roof %d'%(i+1),[(-.136,0),(0,.115),(.136,0)],.213,navy,c=codecC)
 roof.rotation_euler.x=pi/2;roof.location=(bx+x,cy+.109,.183+hh)
 rule('Muted doorway printed on cottage %d'%(i+1),(bx+x+.02,cy-.089,.225),(.051,.007,.076),mid,None,codecC)
flatcard('B folio mount caption',bx,-.537,2.15,.285,navy,'B   INHABITED HORIZON','PITCH-BLACK STREAK')
# C: only public prohibition copy, static context, no technical description or hidden line.
flatcard('C fixed public decree',.018,-.861,2.45,.297,darkaz,'C   POSTWAR PROTOCOLS','HELIOCIDE STUDY STRICTLY PROHIBITED')
disk('C dark embossed archive seal',1.294,-.855,.113,.074,.022,trim,c=codecC,num=16)
# Approved public heading split around binding; no invented astronomy.
for x in (-1.29,1.29):rule('Printed title rule',(x,-1.142,.077),(1.51,.009,.006),trim)
text('Folio roman','X',(-2.52,-1.433,.077),.135,ochre)
text('Public title left','THE SIEGE WALL',(-1.29,-1.41,.076),.243,light)
text('Public title right','POSTWAR PROTOCOLS',(1.38,-1.41,.076),.199,light)
text('Public topic left','CONTAINED BOUNDARY',(-1.22,-1.693,.076),.104,ochre)
text('Public topic right','INHABITED HORIZON',(1.38,-1.693,.076),.104,ochre)
def sm(t):
 t=min(1,max(0,t));return t*t*(3-2*t)
s.frame_start=1;s.frame_end=66;s.render.fps=15
for f in range(1,67):
 # Causal order is a mechanical proof: adjacent hinges rise progressively,
 # not an assertion about construction, chronology or real structure.
 for i,(br,p) in enumerate(hinges):
  delay=(i%6)*.65
  u=sm((f-7-delay)/19)*(1-sm((f-44-delay)/16))
  p.rotation_euler.x=-pi/2*u;p.keyframe_insert('rotation_euler',frame=f)
for f,n in [(1,'Folded inward: negative space never changes'),(17,'Individual scores visible'),(35,'Twelve fins upright'),(52,'Refold'),(66,'Restored')]:s.timeline_markers.new(n,frame=f)
def aim(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
def cam(n,loc,t,ortho):
 d=bpy.data.cameras.new(n);d.type='ORTHO';d.ortho_scale=ortho;o=obj(n,d,c=studio);o.location=loc;aim(o,t);return o
def area(n,loc,t,size,en,c):
 d=bpy.data.lights.new(n,'AREA');d.shape='DISK';d.size=size;d.energy=en;d.color=c;o=obj(n,d,c=studio);o.location=loc;aim(o,t)
main=cam('01 • Matched world and boundary proof',(.78,-7.51,7.09),(0,.08,.22),7.35)
cam('02 • Alternate close-up bound collar',(-4.5,-5.20,4.20),(-1.11,.30,.30),4.55)
area('Wheat manuscript key',(-3.3,-4,7),(0,0,0),4.7,850,(1,.86,.70))
area('Shallow cool accent',(4,-.52,4.9),(1,.5,.31),3.5,660,(.66,.82,1))
area('Subtle steel paper rake',(-2.1,4.6,5.4),(0,.7,.2),4.3,560,(.76,.87,1))
shell('Desk',table,(0,0,-.35),(200,200,.14),None,studio,0)
s['Source pin']='41dddee6383d94e8ce0f68303a506cd9290225ee';s['Scope']='A paper mechanism alone. B one streak not schematic, C fixed public source line. No technical reconstruction or canon changes.'
s.camera=main;s.frame_set(35);s.render.filepath='//Palimpsest_F10_Hero.png'
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Palimpsest_F10_Fold_Candidate.blend'))
bpy.ops.render.render(write_still=True)
s.cycles.samples=12;s.render.resolution_percentage=80
for fn,f in [('F10_Before_Fold.png',1),('F10_Mid_Fold.png',19)]:
 s.frame_set(f);s.render.filepath=str(R/fn);bpy.ops.render.render(write_still=True)
if '--motion' in sys.argv:
 s.cycles.samples=6;s.render.resolution_percentage=50;s.frame_step=2
 (R/'frames').mkdir(exist_ok=True);s.render.filepath=str(R/'frames'/'f10_')
 bpy.ops.render.render(animation=True)
print('PASS F10 binding motion rendered')
