"""PALIMPSEST IV — F04 fold candidate, actual source-staged six-link logistics ledger."""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
from math import sin, cos, pi
R=Path(__file__).resolve().parent
s=bpy.context.scene
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
s.render.engine='CYCLES';s.cycles.use_denoising=False;s.cycles.samples=36;s.cycles.max_bounces=4
s.render.threads_mode='FIXED';s.render.threads=3
s.render.resolution_x=1100;s.render.resolution_y=704;s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX'
s.world.use_nodes=True
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.096,.126,.132,1)
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.32
def coll(name):
 c=bpy.data.collections.new(name);s.collection.children.link(c);return c
base=coll('01 • Black-stock book and anonymous documentary colony')
codecC=coll('02 • Source-authored Codec and three B rails')
fold=coll('03 • C • six connected cardstock panels with editorial printing')
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
table=mat('Desk • quiet slate',(.032,.047,.045),.86)
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
# Paper was born black; colored scenic areas are graphic inks over raised relief.
shell('Bound black cloth cover',cloth,(0,0,-.19),(6.45,4.12,.16),be=.014)
for k in range(6):
 shell('Visible black edge of sewn folio %d'%k,black if k%2 else mid,(0,0,-.105+k*.015),(6.27-k*.007,3.96-k*.007,.011),be=.002)
for x in (-1.54,1.54):
 shell('Left/right black paper surface',black,(x,.014,.013),(3.03,3.85,.087),be=.008)
rule('Folded dark-blue spine',(0,0,.057),(.060,3.83,.073),navy)
for i in range(14):
 rule('Bound spine registration tab',(0,-1.78+i*.269,.101),(.028,.052,.005),brass)
for x in (-2.87,2.87):
 rule('Border registration',(x,.01,.067),(.012,3.62,.004),brass)
for y in (-1.79,1.82):
 rule('Border horizontal',(0,y,.067),(5.74,.012,.004),brass)
# Familiar citadel silhouette, not a newly named site. Three scalloped, folded
# relief layers honor the F04 living scenic bands and the green atmospheric palette.
for k in range(3):
 y=1.70-k*.13
 outline=[(-2.76,0),(-2.76,.28+k*.06),(-2.34,.40+k*.07),(-1.78,.39+k*.047),(-1.44,.65+k*.063),(-1.28,.62+k*.086),(-1.12,.41+k*.052),(-.67,.48+k*.071),(-.49,.72+k*.10),(-.34,.76+k*.07),(-.28,.49+k*.08),(.11,.39+k*.025),(.47,.50+k*.037),(.59,.72+k*.07),(.77,.75+k*.085),(1.13,.46+k*.065),(1.62,.33+k*.065),(1.87,.45+k*.08),(2.03,.59+k*.069),(2.41,.36+k*.062),(2.76,.29+k*.043),(2.76,0)]
 upright('F04 citadel relief stock layer %02d'%k,outline,.037,(forest,navy,teal)[k],(0,y,.075))
 for j in range(7):
  x=(j-3)*.73
  o=shell('Folded skyline support foot',black,(x,y-.071,.100),(.14,.23,.055));o.rotation_euler.x=-.13
for j in range(7):
 x=(j-3)*.74
 o=shell('F04 documentary settlement fold tier',black,(x,1.23+(j%3)*.08,.140+(j%3)*.04),(.49,.275,.057));o.rotation_euler.x=.21 if j%2 else -.14
 tint=rule('Ink plate on receding contact tier',(0,0,.030),(.452,.236,.003),forest if j%2 else brass,o)
# A: source city on brass axle, with reversible underside modeled but at REST.
ax=obj('A • representative colony flip axis (context at rest)');ax.location=(-1.46,.24,.31)
ax['Behavior']='Source has 180° flip; outside this C-only animation.'
shell('A black structural colony plate',black,(0,0,0),(1.42,1.32,.055),ax)
rule('A green printed terrace',(0,0,.029),(1.37,1.266,.006),localgreen,ax)
shell('A raised civic plinth',forest,(-.04,.06,.061),(.86,.78,.05),ax)
shell('A civic tower flax print',light,(-.22,.10,.239),(.24,.24,.417),ax,be=.009)
v=[(.14*cos(i*2*pi/18)*cos(j*pi/8),.14*sin(i*2*pi/18)*cos(j*pi/8),.14*sin(j*pi/8)) for j in range(5) for i in range(18)]
faces=[(a,a//18*18+(a+1)%18,a//18*18+(a+1)%18+18,a+18) for a in range(72)]
dom=mesh('A folded saffron civic dome',v,faces,brass,ax);dom.location=(-.22,.10,.45)
shell('A civic wing flax printed over black substrate',light,(.24,-.18,.143),(.48,.28,.22),ax)
part=plate('A wing folded roof',[(-.24,0),(0,.118),(.24,0)],.28,brass,ax);part.rotation_euler.x=pi/2;part.location=(.24,-.04,.251)
shell('A reverse scarred underside; modeled, not shown in C-only rehearsal',amber,(0,0,-.034),(1.41,1.31,.046),ax)
for j in range(4):
 x=-.38+j*.25;y=.22*(-1 if j%2 else 1)
 lump=mesh('A reverse embossed irregular slag facet',[(x+.14*cos(k*2*pi/5),y+.14*sin(k*2*pi/5),-.06) for k in range(5)]+[(x+.04,y-.05,-.24-(j%2)*.04)],[(k,(k+1)%5,5) for k in range(5)],black if j%2 else amber,ax)
for x in (-2.24,-.68):
 shell('A brass trunnion at source X',brass,(x,.24,.195),(.065,.12,.24))
 shell('A black-paper base under trunnion',mid,(x,.24,.08),(.13,.21,.038))
rule('A mechanically pinned axle',(-1.46,.24,.310),(1.585,.044,.044),brass)
# B: exact runtime geometry export, not a new Codec interpretation.
datum=json.loads((R/'codec_editorial.json').read_text())
O=Matrix(((1,0,0),(0,0,-1),(0,1,0)))
def cv(a):return (a[0],-a[2],a[1])
ms={}
def rec(a,p=None):
 if 'v' in a:
  q=a['v'];v=[cv(q[j:j+3]) for j in range(0,len(q),3)];ix=a['i'] or list(range(len(v)));f=[ix[i:i+3] for i in range(0,len(ix),3)]
  md=a['m'];name=str(md)
  if name not in ms:ms[name]=mat('Codec existing material swatch',md['c'],md['r'],True,md['met']*.6,md.get('em'),md.get('e',0)*.7)
  o=mesh('Codec source '+a['name'],v,f,ms[name],p,codecC)
 else:o=obj('Codec source '+a['name'],p=p,c=codecC)
 o.location=cv(a['p']);w=a['q'];o.rotation_mode='QUATERNION';o.rotation_quaternion=(O@Quaternion((w[3],w[0],w[1],w[2])).to_matrix()@O.transposed()).to_quaternion()
 o.scale=(a['s'][0],a['s'][2],a['s'][1])
 for n in a['children']:rec(n,o)
 return o
c=rec(datum['mesh']);c.name='B • Codec editorial model, exact source mesh';c.location=(0,.78,.109);c['Source']=datum['source']
for k in range(3):
 y=.32-k*.30
 rule('B • counter-Macro slotted brass guide',(0,y,.119),(.95,.038,.026),brass,None,codecC)
 arrow=plate('B • counter-Macro printed arrow at source rest',[(-.31,-.048),(.14,-.048),(.14,-.094),(.32,0),(.14,.094),(.14,.048),(-.31,.048)],.017,ochre,None,codecC)
 arrow.location=(-.22,y,.135)
# C: six folds, exactly 1.08 by .24; four printed cells derive from F04_C.
# Crease edges are mathematically connected; the original .94 center spacing
# is replaced with exact end-to-end joining in the candidate.
CROOT=Vector((1.48,.96,.113));PW=1.08;PL=.24; captions=['','OBSERVE','VERIFY','ACT','RECORD','PULL']
panels=[]
for i,cap in enumerate(captions):
 hinge=obj('C hinge • leaflet %02d'%(i+1),c=fold);hinge.empty_display_size=.10
 hinge['Source slot']='F04.C';hinge['Length']=PL;panels.append(hinge)
 # n-gon with cut-down outer corners only at the pull free edge.
 poly=[(-PW/2,0),(-PW/2,-PL),(PW/2,-PL),(PW/2,0)]
 if i==5:poly=[(-PW/2,0),(-PW/2,-PL+.038),(-PW/2+.037,-PL),(.503,-PL),(.54,-PL+.038),(.54,0)]
 p=plate('C actual black cardstock panel %d'%i,poly,.018,black,hinge,fold)
 shell('C letterpress surface over black-stock edge',light if i%2==0 else dimprint,(0,-PL*.50,.021),(PW-.048,PL-.028,.005),hinge,fold,0)
 rule('C transverse detail rule',(0,-.045,.024),(PW*.87,.007,.003),navy,hinge,fold)
 if i in (0,5):
  rule('C marker at binding or pull end',(.26,-.17,.025),(.28,.025,.004),amber,hinge,fold)
 if cap:text('C exact lesson label • '+cap,cap,(0,-.120,.028),.088,noct,hinge,fold)
 rule('C cyan crease registration',(-.44,-.177,.025),(.038,.033,.003),teal,hinge,fold)
 if i<5:
  # Front edge of each panel denotes the live crease, never a fake separate hinge decal.
  rule('C scored joint line',(0,-PL+.008,.024),(PW-.016,.009,.004),brass,hinge,fold)
shell('C binding saddle clamps black stock',navy,(1.48,.983,.105),(1.21,.14,.08),None,fold)
rule('C saddle foil clamp', (1.48,1.006,.15),(1.12,.028,.009),brass,None,fold)
# Type is framed and printed on page; no invented place labels or war numbers.
for x,name,color in [(-1.46,'A   COLONY OVERLAY',forest),(0,'B   MACRO RESPONSE',navy),(1.48,'C   VERIFICATION',teal)]:
 shell(name+' black edge',black,(x,-.73,.092),(1.45,.255,.042))
 rule(name+' tinted ink face',(x,-.73,.115),(1.412,.208,.005),color)
 text(name,name,(x,-.73,.122),.104,light)
text('F04 exact title accent','IV',(-2.46,-1.406,.067),.113,ochre)
rule('Book leaf title left rule',(-.68,-1.130,.069),(.945,.009,.008))
rule('Book leaf title right rule',(.68,-1.130,.069),(.945,.009,.008))
text('YEAR ZERO title left','YEAR 0',(-1.21,-1.389,.069),.265,light)
text('YEAR ZERO title right','FIRST CONTACT',(1.28,-1.389,.069),.225,light)
text('Exact source subtitle topic left','MACRO RESPONSE',(-1.18,-1.668,.069),.109,ochre)
text('Exact source subtitle topic right','AND VERIFICATION',(1.27,-1.668,.069),.109,ochre)
for j in range(14):
 x=2.26+j%7*.062;y=-1.53+(j//7)*.074
 rule('Purely graphic colophon print ticks',(x,y,.070),(.031,.015,.004),brass)
def sm(t):return (lambda x:x*x*(3-2*x))(max(0,min(1,t)))
s.frame_start=1;s.frame_end=66;s.render.fps=15
for fr in range(1,67):
 progress=sm((fr-7)/21)*(1-sm((fr-45)/16))
 e=.16+(.84*progress);a=1.18+(0.16-1.18)*e
 pos=CROOT.copy()
 for i,h in enumerate(panels):
  theta=-a if i%2==0 else a
  h.location=pos;h.rotation_euler=(theta,0,0)
  h.keyframe_insert('location',frame=fr);h.keyframe_insert('rotation_euler',frame=fr)
  pos=pos+Vector((0,-PL*cos(theta),-PL*sin(theta)))
 assert abs(pos.z-CROOT.z)<1e-6
for f,n in [(1,'C folded to source rest'),(10,'Pull / six connected hinges actuate'),(30,'C reveal: four equivalent lesson cells'),(51,'Refold'),(66,'Reset')]:s.timeline_markers.new(n,frame=f)
def aim(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
def cam(n,loc,t,ortho):
 d=bpy.data.cameras.new(n);d.type='ORTHO';d.ortho_scale=ortho;o=obj(n,d,c=studio);o.location=loc;aim(o,t);return o
def area(n,loc,t,size,en,c):
 d=bpy.data.lights.new(n,'AREA');d.shape='DISK';d.size=size;d.energy=en;d.color=c;o=obj(n,d,c=studio);o.location=loc;aim(o,t)
camA=cam('01 • Bookplate and C reveal',(.95,-7.4,6.9),(0,.06,.16),7.38)
camB=cam('02 • Low fold hinge geometry',(3.04,-4.5,2.27),(1.10,.32,.26),4.62)
area('Broad warm reading light',(-3.1,-3.8,6.6),(0,0,0),4.5,850,(1,.84,.66))
area('Cool right page fill',(4.3,-.74,4.7),(1,.30,.25),4.1,540,(.67,.88,1))
area('Dusk raking on citadel relief',(1.5,4.0,5.0),(0,.7,.3),3.5,630,(.89,.95,1))
shell('Dark unobtrusive worktable',table,(0,0,-.35),(200,200,.13),None,studio,0)
s['Pinned source']=datum['sha'];s['Scope']='F04 source design transfer, slot C only motion. No name, casualty number, secret, narration or new lore.'
s.camera=camA;s.frame_set(35);s.render.filepath='//Palimpsest_F04_Hero.png'
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Palimpsest_F04_Fold_Candidate.blend'))
bpy.ops.render.render(write_still=True)
s.cycles.samples=16;s.render.resolution_percentage=72;s.camera=camB;s.frame_set(20);s.render.filepath=str(R/'F04_Crease_Proof.png');bpy.ops.render.render(write_still=True)
if '--motion' in sys.argv:
 s.cycles.samples=6;s.render.resolution_percentage=51;s.frame_step=2
 s.camera=camA;(R/'frames').mkdir(exist_ok=True)
 s.render.filepath=str(R/'frames'/'f04_')
 bpy.ops.render.render(animation=True)
print('PASS source exact geometry Codec and six constant length C panels')
