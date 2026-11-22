"""PALIMPSEST VII — F07, actual pinned-pivot vellum demonstration."""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
from math import sin, cos, pi
R=Path(__file__).resolve().parent
s=bpy.context.scene
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
s.render.engine='CYCLES';s.cycles.use_denoising=False;s.cycles.samples=27;s.cycles.max_bounces=4
s.render.threads_mode='FIXED';s.render.threads=3
s.render.resolution_x=1080;s.render.resolution_y=686;s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX'
s.world.use_nodes=True
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.116,.086,.087,1)
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.32
def coll(name):
 c=bpy.data.collections.new(name);s.collection.children.link(c);return c
base=coll('01 • Black-stock codex and schematic siege board')
codecC=coll('02 • Context-only outcome and logistics')
fold=coll('03 • A • physically hinged printed vellum')
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
table=mat('Desk • quiet slate',(.044,.033,.037),.86)
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
ruby=mat('Colored print • ruby hematite',(.40,.063,.045),.49,True,.12)
darkruby=mat('Crimson paper print • deep cut',(.155,.032,.039))
warMid=mat('Hematite and ink • paper face',(.238,.058,.060))
shadow=mat('Warm ruby-black edge paper',(.037,.025,.033))
vprint=mat('Pigmented ink on vellum, no emission',(.280,.040,.025),.82,False)
vsoft=mat('Faded black ink on vellum',(.073,.057,.054),.82,False)
vellum=bpy.data.materials.new('Light-transmitting paper with physically thin framed edge')
vellum.diffuse_color=(.66,.48,.31,.42);vellum.use_nodes=True
n=vellum.node_tree.nodes;links=vellum.node_tree.links
b=n.get('Principled BSDF');b.inputs['Base Color'].default_value=(.68,.52,.32,1);b.inputs['Roughness'].default_value=.64
out=n.get('Material Output');trans=n.new('ShaderNodeBsdfTransparent');trans.inputs['Color'].default_value=(.95,.90,.80,1)
mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.29
links.new(trans.outputs[0],mix.inputs[1]);links.new(b.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
# Black dyed-through book stock. Colored material is an applied print.
shell('Bound black cloth cover',cloth,(0,0,-.19),(6.40,4.12,.16),be=.014)
for k in range(6):
 shell('Visible sewn black folio edge %d'%k,black if k%2 else mid,(0,0,-.105+k*.015),(6.25-k*.007,3.95-k*.007,.011),be=.002)
for x in (-1.54,1.54):
 shell('True dark paper side',shadow,(x,.014,.013),(3.03,3.85,.087),be=.008)
rule('Center visible dark spine',(0,0,.057),(.062,3.82,.076),black)
for i in range(14):
 rule('Sewn folio spine tab',(0,-1.78+i*.269,.099),(.025,.050,.005),brass)
for x in (-2.87,2.87):rule('Reg. vertical',(x,.005,.068),(.013,3.62,.004),brass)
for y in (-1.78,1.82):rule('Reg. transverse',(0,y,.068),(5.74,.011,.004),brass)
# Living-stagecraft F07 scenic cue: asymmetric ruptured cardstock wedges and brads.
def crossbar(n,a,b,r,m,p=None,c=base):
 a,b=Vector(a),Vector(b)
 t=shell(n,m,(a+b)/2,(r,(b-a).length,r),p,c,.002)
 t.rotation_euler=(b-a).to_track_quat('Y','Z').to_euler()
 return t
def disk(n,x,y,z,r,dep,m,p=None,c=base,num=48):
 xy=[(r*cos(j*2*pi/num),r*sin(j*2*pi/num)) for j in range(num)]
 o=plate(n,xy,dep,m,p,c);o.location=(x,y,z);return o
def ln(n,pts,w,m,p=None,c=base):
 d=bpy.data.curves.new(n,'CURVE');d.dimensions='3D';d.resolution_u=1;d.bevel_depth=w;d.bevel_resolution=0
 z=d.splines.new('POLY');z.points.add(len(pts)-1)
 for q,co in zip(z.points,pts):q.co=(*co,1)
 o=obj(n,d,p,c);o.data.materials.append(m);return o
backy=1.63
for i in range(8):
 x=(i-3.5)*.757
 z=(1.09 if i%2==0 else .72)+.17*(i%3)
 outline=[(-.38,0),(-.31,z*.57),(-.18,z*.66),(-.11,z*.87),(.062,z),(.123,z*.83),(.23,z*.93),(.33,z*.42),(.362,0)]
 upright('F07 broken campaign scenic silhouette / dyed paper core',outline,.049,black,(x,backy+(i%2)*.038,.069))
 inkout=[(a*.94,b*.963) for a,b in outline]
 upright('Fractured theatre ink face',inkout,.006,darkruby if i%2 else warMid,(x,backy+(i%2)*.038-.051,.078))
 foot=shell('Scored rear scenic base gusset',black,(x,backy-.085,.105),(.31,.25,.047));foot.rotation_euler.x=-.14 if i%2 else .06
 disk('Visible fracture brad',x,backy-.141,.13,.051,.036,brass,num=10)
 if i<7:
  ln('Uneven printed hairline break',[(x+.07,backy-.059,.13),(x-.06,backy-.059,.263),(x+.07,backy-.059,.48),(x+.02,backy-.059,.627)],.003,brass)
# Source tactical base and non-geographic landscape centered on the same board.
shell('Two ply tactical tab base',shadow,(0,.22,.140),(3.38,2.23,.095))
shell('Cardboard tactical section with ochre printed edge',brass,(0,.22,.189),(3.24,2.09,.029))
shell('Recessed black relief',black,(0,.22,.206),(3.18,2.04,.026))
shell('Printed tactical upper bed',mid,(0,.22,.226),(2.88,1.84,.029))
for x in (-1.10,-.55,0,.55,1.10):rule('Tactical plan grid longitudinal',(x,.22,.244),(.011,1.65,.005),brass)
for y in (-.37,-.07,.23,.53,.83):rule('Thin transverse registration grid',(0,y,.244),(2.66,.010,.004),shadow)
# Abstract attrition bars are not counts or a map route.
for j in range(6):
 x=-.84+(j%3)*.265;y=-.17+(j//3)*.16+(j%2)*.025
 rule('Qualitative fractured attrition mark', (x,y,.252),(.133,.056,.016),darkruby)
 rule('Broken second edge of attrition mark', (x+.102,y-.021,.251),(.040,.028,.014),warMid)
shape=[(-1.36,0),(-1.26,.045),(-.90,.073),(-.69,.035),(-.48,.085),(-.17,.14),(.16,.06),(.59,.01),(.88,.12),(1.23,.043),(1.34,0)]
for i in range(3):
 upright('Stepped fortress ridge relief below hinge',[(a,b*.61*(1+.24*i)) for a,b in shape],.018,(darkruby,warMid,black)[i],(0,.87-.09*i,.25))
# Low-profile authored ruby-node analogue, mechanically recessed below the moving overlay.
rv=[(-.62,.28,.322),(-.62,.28,.245),(-.82,.28,.276),(-.62,.42,.276),(-.43,.28,.276),(-.62,.14,.276)]
mesh('Embossed ruby tactical node at source planar coordinates',rv,[(0,2,3),(0,3,4),(0,4,5),(0,5,2),(1,3,2),(1,4,3),(1,5,4),(1,2,5)],ruby)
def card(name,position,sz,theme,title_,subtitle=''):
 x,y,z=position;w,d=sz
 shell(name+' • layered black-stock blank',black,(x,y,z),(w,d,.029),c=codecC)
 rule(name+' • pigment print',(x,y,z+.016),(w-.032,d-.031,.004),theme,None,codecC)
 text(name+' • header',title_,(x,y+.029 if subtitle else y,z+.021),.090,light,c=codecC)
 if subtitle:text(name+' • detail',subtitle,(x,y-.046,z+.021),.061,ochre,c=codecC)
card('B fixed outcome plate',(2.292,-.21,.105),(1.169,.37),darkruby,'SIEGE OUTCOME','ATTRITION COST · UNKNOWN TOTALS')
card('Sourced scale warning',(2.292,.48,.126),(1.169,.38),shadow,'PHAROS NEBULA','NOT TO SCALE')
shell('B easel figure foot',navy,(2.292,-.026,.084),(1.15,.071,.088),c=codecC)
# C is a quiet unanimated brass caliper, not a new strategic depiction.
gx,gy=(-1.80,-.51)
disk('C fixed caliper wheel',gx,gy,.092,.225,.066,brass,c=codecC,num=26)
disk('C central boss',gx,gy,.156,.119,.018,navy,c=codecC,num=8)
disk('C red pivot pin',gx,gy,.174,.045,.026,ruby,c=codecC,num=12)
for j in range(12):
 a=j*2*pi/12
 k=shell('C gear tooth',brass,(gx+.237*cos(a),gy+.237*sin(a),.124),(.057,.080,.050),c=codecC);k.rotation_euler.z=a+pi/2
crossbar('C fixed brass supply arm',(gx,gy,.155),(-.666,gy,.169),.078,brass,c=codecC)
disk('C pinned supply end',-.666,gy,.166,.053,.063,ruby,c=codecC,num=8)
# A: exact source dimensions and fold target, physically represented by a
# scored black card frame and a single thin printed vellum carrier.
pivot=(0,1.00,.393)
h=obj('A • rear hinge · Pharos plan overlay',c=fold);h.location=pivot
h.empty_display_size=.2;h['Source active angle radians']=-.76
h['Source geometry']='2.58 x 1.44 plan vellum with actual sourced print vocabulary'
crossbar('A fixed brass axis',(pivot[0]-1.38,pivot[1],pivot[2]),(pivot[0]+1.38,pivot[1],pivot[2]),.046,brass,c=fold)
for x in (-1.29,1.29):
 shell('Glued black-paper hinge mount',(black),(x,1.020,.305),(.15,.22,.151),c=fold)
 shell('A clipped stock edge rail',black,(x,-.76,.002),(.075,1.53,.036),h,fold)
 rule('Warm printed frame margin',(x,-.76,.022),(.055,1.53,.006),brass,h,fold)
shell('A front pull edge',black,(0,-1.51,.013),(2.71,.078,.049),h,fold)
rule('A front pale ink edging',(0,-1.51,.039),(2.66,.055,.007),light,h,fold)
shell('A folded finger pull tab',shadow,(0,-1.602,.011),(.37,.156,.035),h,fold)
text('A pull-label print','A',(0,-1.62,.033),.099,ochre,h,fold)
vplane=mesh('Real A paper membrane',[(-1.29,-.04,.005),(-1.29,-1.48,.005),(1.29,-1.48,.005),(1.29,-.04,.005)],[(0,1,2,3)],vellum,h,fold)
for x in [-.96,-.64,-.32,.32,.64,.96]:
 ln('A thin plan grid',[(x,-.17,.011),(x,-1.33,.011)],.003,vsoft,h,fold)
ln('A crimson print border',[(-1.24,-.095,.013),(1.24,-.095,.013),(1.24,-1.43,.013),(-1.24,-1.43,.013),(-1.24,-.095,.013)],.008,vprint,h,fold)
# Published Canvas overlay uses a skewed dashed ellipse and vertical rules.
def ellipse(t):
 a,b=.856*cos(t),.47*sin(t);return (a*cos(.18)-b*sin(.18),-.765+a*sin(.18)+b*cos(.18),.016)
for j in range(32):
 ln('A dashed ellipse print, sourced schematic vocabulary',[ellipse((j+.69*k/6)*2*pi/32) for k in range(7)],.0055,vprint,h,fold)
for i,(x,y,xx,yy) in enumerate([(-.92,-1.12,.66,-.55),(-.84,-.65,.55,-.34)]):
 a=Vector((x,y,.020));b=Vector((xx,yy,.020));e=(b-a).normalized();n=Vector((-e.y,e.x,0))
 ln('Editorial intended vector, diagram only',[tuple(a),tuple(b)],.012,vprint,h,fold)
 arrow=mesh('Editorial direction arrowhead',[tuple(b),tuple(b-e*.135+n*.05),tuple(b-e*.135-n*.05)],[(0,1,2)],vprint,h,fold)
text('Printed overlay heading','PHAROS NEBULA',(0,-.163,.020),.125,vprint,h,fold)
text('Exact source overlay scale qualifier','SIEGE VECTOR OVERLAY · NOT TO SCALE',(0,-1.358,.021),.080,vprint,h,fold)
# Stable page-identifiers. Dates are sourced, never invented numbers.
text('F07 exact title accent','VII',(-2.47,-1.196,.076),.12,ochre)
for x in (-1.22,1.22):rule('Printed title frame rule',(x,-1.093,.079),(1.46,.012,.005),brass)
text('Split book label left','YEAR 121',(-1.18,-1.22,.080),.300,light)
text('Split book label right','RUBY ECLIPSE',(1.25,-1.22,.080),.261,light)
text('Printed lower chapter label left','THE SIEGE OF THE',(-1.18,-1.507,.080),.117,ochre)
text('Printed lower chapter label right','PHAROS NEBULA · NOT TO SCALE',(1.25,-1.507,.080),.114,ochre)
for i,(x,t) in enumerate([(-2.12,'A   PLAN OVERLAY'),(0,'B   OUTCOME'),(2.12,'C   SUPPLY ARM')]):
 card(t,(x,-.979,.090),(1.36,.146),darkruby if i==0 else navy,t)
def smooth(t):
 u=min(1,max(0,t));return u*u*(3-2*u)
s.frame_start=1;s.frame_end=66;s.render.fps=15
for fr in range(1,67):
 v=smooth((fr-7)/21)*(1-smooth((fr-44)/17))
 h.rotation_euler.x=-.76*v;h.keyframe_insert('rotation_euler',frame=fr)
for f,n in [(1,'A • source rest'),(10,'A • actual hinge lifts printed membrane'),(31,'A • open with underlying attrition visible'),(50,'A • refold'),(66,'A • restores rest')]:s.timeline_markers.new(n,frame=f)
def aim(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
def cam(n,loc,t,ortho):
 d=bpy.data.cameras.new(n);d.type='ORTHO';d.ortho_scale=ortho;o=obj(n,d,c=studio);o.location=loc;aim(o,t);return o
def area(n,loc,t,size,en,c):
 d=bpy.data.lights.new(n,'AREA');d.shape='DISK';d.size=size;d.energy=en;d.color=c;o=obj(n,d,c=studio);o.location=loc;aim(o,t)
camA=cam('01 • Settled book and open vellum',(1.28,-5.40,10.45),(0,.095,.34),7.59)
camB=cam('02 • Hinge and layered cost record along diagonal',(-4.25,-3.4,5.50),(.03,.35,.38),6.10)
area('Warm desk light',(-4,-3.6,6.9),(0,0,0),4.8,812,(1,.80,.65))
area('Gentle slate fill',(4.6,-.5,4.9),(1,.3,.25),4.3,600,(.78,.87,1))
area('Crimson horizon skim',(1.9,4.3,4.8),(0,.7,.3),3.2,500,(1,.72,.67))
shell('Plain slate desk',table,(0,0,-.35),(200,200,.14),None,studio,0)
s['Pinned runtime and story source']='41dddee6383d94e8ce0f68303a506cd9290225ee'
s['Scope']='Slot A reversible vellum fold only. B/C static. No exact map, unknown casualty figures, no voice or secret.'
s.camera=camA;s.frame_set(36);s.render.filepath='//Palimpsest_F07_Hero.png'
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Palimpsest_F07_Fold_Candidate.blend'))
bpy.ops.render.render(write_still=True)
s.cycles.samples=14;s.render.resolution_percentage=72
s.camera=camA;s.frame_set(1);s.render.filepath=str(R/'F07_Closed_Plan_Proof.png');bpy.ops.render.render(write_still=True)
s.camera=camB;s.frame_set(36);s.render.filepath=str(R/'F07_Hinge_and_Cost_Proof.png');bpy.ops.render.render(write_still=True)
if '--motion' in sys.argv:
 s.cycles.samples=6;s.render.resolution_percentage=50;s.frame_step=2;s.camera=camA
 (R/'frames').mkdir(exist_ok=True);s.render.filepath=str(R/'frames'/'f07_')
 bpy.ops.render.render(animation=True)
print('PASS F07 pivot proof finished')
