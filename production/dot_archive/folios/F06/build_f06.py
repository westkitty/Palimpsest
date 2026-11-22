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
book=obj('F06 • Fixed review spread: no scene or runtime replacement')
box('Charcoal book binding',(0,0,-.069),(7.75,4.62,.242),night,book,True)
for side in [-1,1]:
 for i in range(5):
  box('Black paper cross-section',(side*1.89,0,.074+i*.017),(3.67-i*.012,4.43-i*.012,.018),stock if i%2==0 else deep,book,True)
 box('Black through-stock leaf',(side*1.89,0,.174),(3.63,4.39,.052),stock,book,True)
 rect('Printed page perimeter',side*1.88,0,3.30,4.06,.204,gold,book)
box('Book gutter',(0,0,.131),(.075,4.40,.056),night,book)
for k in range(15):
 box('Binding stitch',(0,-1.96+k*.28,.17),(.04,.065,.014),gold,book)
# Three-stage backdrop of paper cut scenery; not a literal new location.
for i,(yy,height,mm) in enumerate([(1.96,1.0,deep),(1.85,.79,rust2),(1.71,.57,slate)]):
 ridge=obj('Storm horizon • bonded rear card '+str(i+1),p=book);ridge.location=(0,yy,.205);ridge.rotation_euler.x=math.radians(79-i*5)
 coords=[(-3.34,0),(-3.34,.41*height),(-2.90,.65*height),(-1.95,.53*height),(-1.05,.85*height),(.11,.76*height),(1.04,1.0*height),(2.00,.72*height),(3.32,.58*height),(3.32,0)]
 plate('Irregular cut horizon',coords,0,mm,ridge,.045)
 polyline('Exposed bonded score',[(x,.018,.035) for x in (-3.34,3.32)],.012,gold,ridge)
 for x in [-2.96,-1.27,1.27,2.96]:
  box('Bonded cardstock foot',(x,yy+.029,.221),(.24,.19,.025),rust2,book,True)
# Public title and station captions.
box('Bonded heading backer',(-.43,1.42,.227),(4.72,.49,.026),deep,book,True)
label('Folio architecture','F06  /  THE LONG ATTRITION',-.43,1.48,.247,.235,ink,book)
label('Source chronology','YEARS 7–120  /  14 SOURCED CAMPAIGN PLATES',-.43,1.278,.247,.102,gold,book)
for x,head,sub in [(-2.35,'A  /  CHRONOLOGY','FOUR DOCUMENTED SPANS'),(0,'B  /  CAMPAIGN PLATE','SELECT A SOURCED STRAIN'),(2.36,'C  /  CUMULATIVE LOSS','UNVERIFIED TOTALS LEFT BLANK')]:
 y=-1.93 if x>1 else -1.78
 label(head,head,x,y,.225,.144,ink,book);label(sub,sub,x,y-.192,.223,.074,gold,book)
 polyline('Station rules',[(x-.94,y-.092,.223),(x+.94,y-.092,.223)],.006,gold,book)
# A: cut gear ring + four exact ranges, held under index while it turns.
wheel=obj('A • Chronology wheel',p=book);wheel.location=(-2.36,-.16,.256)
disc('Chronology footing',-2.36,-.16,.90,.229,slate,book,N=24,th=.035)
profile=[]
for i in range(24):
 for phase,rr in [(0,.73),(.13,.73),(.24,.84),(.61,.84),(.71,.73)]:
  a=2*pi*(i+phase)/24;profile.append((rr*cos(a),rr*sin(a)))
plate('Die-cut teeth, four documented spans',profile,.029,gold,wheel,.046)
disc('Chronology pad',0,0,.72,.063,stock,wheel,N=48,th=.038)
circle('Crimson index ring',0,0,.088,.675,red,wheel,.017)
for i,span in enumerate(['7–30','31–60','61–90','91–120']):
 t=i*pi/2; xx=-sin(t)*.466;yy=cos(t)*.466
 o=label('Documented range '+span,span,xx,yy,.10,.132,ink,wheel);o.rotation_euler.z=t
 polyline('Quarter boundary',[(0,0,.091),(.625*cos(t+pi/4),.625*sin(t+pi/4),.091)],.006,rust,wheel)
disc('Central paper brad',0,0,.093,.104,gold,wheel,N=18,th=.05)
plate('Stationary index',[(-2.48,.72),(-2.24,.72),(-2.36,.52)],.40,red,book,.033)
# B: direct export of runtime visual geometry for the first two F06 authored IDs.
cradle=obj('B • DRAXIS specimen cradle',p=book);cradle.location=(0,-.20,.255)
disc('Stage footing',0,0,.96,.229,slate,book,N=12,th=.039)
disc('Stage plate',0,0,.81,.032,deep,cradle,N=28,th=.048)
circle('Specimen registry registration',0,0,.062,.737,gold,cradle,.014)
raw=json.loads((P/'f06_specimens.json').read_text())['models']
mods={}
matcache={}
for id,specs in raw.items():
 g=obj('F06 runtime authored specimen '+id,p=cradle);g.location.z=.067;g.scale=(1.37,1.37,1.37)
 for j,m in enumerate(specs):
  ck=tuple(m['color'])+tuple(m['emission'])+(m['emissionIntensity'],)
  if ck not in matcache:matcache[ck]=mat('Specimen • source palette %02d'%len(matcache),m['color'],emit=(m['emission'],m['emissionIntensity']*.34))
  mesh('Plate '+id+' runtime mesh '+str(j),m['vertices'],m['faces'],matcache[ck],g)
 mods[id]=g
plaques={}
for id,name in [('003','003  FAULT-TONGUE'),('004','004  OBSIDIAN GUL')]:
 plaques[id]=label('Registry label '+id,name,0,-1.22,.229,.133,ink,book)
# C: six rigid paper faces; running hinges, alternating fold directions and pull-tab.
L=.47; W=1.40; station=2.34; rear=1.12; support_z=.249
panels=[]
for j,body in enumerate(['LOSS RECORD','CLIMATE','CRUST','INFRASTRUCTURE','TOTALS','PULL']):
 p=obj('C • Z-pleat %02d'%(j+1),p=book);panels.append(p)
 plate('Die-cut leaf '+body,[(-W/2,-L),(W/2,-L),(W/2,0),(-W/2,0)],0,rust if j%2==0 else rust2,p,.027)
 rect('Inset frame',0,-L/2,W-.14,L-.10,.021,gold,p)
 label('Printed ledger cell '+body,body,0,-.142 if j in [1,2,3,4] else -.233,.023,.092 if j==3 else .102,ink,p)
 if j in [1,2,3,4]:rect('Empty archival cell',0,-.307,.60,.097,.023,ink,p)
 polyline('Scored hinge seam',[(-W/2,0,.014),(W/2,0,.014)],.008,gold,p)
 if j==5:
  box('Bonded pull-grip',(0,-L-.06,0),(.53,.17,.044),gold,p,True)
  label('Grip letter','C',0,-L-.065,.026,.108,stock,p)
box('Bonded accordion spine',(station,rear+.049,.24),(W+.08,.106,.069),gold,book,True)
# Subtler rear register cards, as receding paper-height record motif, not additional battle data.
for i in range(7):
 x=2.22+(i%4)*.27; y=1.48+i//4*.125
 box('Printed registry dividers',(x,y,.221),(.17,.10,.029),rust2 if i%2 else rust,book,True)
def ease(q):
 q=max(0,min(1,q));return q*q*(3-2*q)
S.frame_start=1;S.frame_end=142
for f in range(1,143):
 t=ease((f-8)/34); ww=-pi/2*t
 wheel.rotation_euler.z=ww;key(wheel,'rotation_euler',f)
 cradle.rotation_euler.z=.32+.60*ease((f-45)/21);key(cradle,'rotation_euler',f)
 for id,o in mods.items():
  use=(id=='003')==(f<57)
  for v in [o,*o.children,plaques[id]]:
   v.hide_render=not use;v.hide_viewport=not use;key(v,'hide_render',f);key(v,'hide_viewport',f)
 ex=ease((f-69)/38)*(1-ease((f-123)/18));a=math.radians(73-62*ex); y,z=rear,support_z
 for j,o in enumerate(panels):
  phi=(-1 if j%2==0 else 1)*a
  o.location=(station,y,z);o.rotation_euler.x=phi;key(o,'location',f);key(o,'rotation_euler',f)
  y-=L*cos(phi);z-=L*sin(phi)
 assert abs(z-support_z)<1e-6
for f,n in [(1,'ARRIVAL • folded register'),(42,'A • indexed span'),(66,'B • next sourced plate'),(111,'C • loss register open'),(142,'C • register refolded')]:
 S.timeline_markers.new(n,frame=f)
box('Worktable',(0,0,-.247),(200,200,.11),desk)
def point(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
def area(n,loc,pow,size,col):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=n;o.data.energy=pow;o.data.shape='DISK';o.data.size=size;o.data.color=col;point(o,(0,0,0))
area('Raking key',(-4,-4,7),1300,4.7,(1,.83,.70))
area('Cool cardstock fill',(6,-1,6),810,5.8,(.79,.87,1))
area('Fold edge rim',(0,4,5),1060,4.1,(1,.78,.68))
def camera(n,loc,targ,scale):
 bpy.ops.object.camera_add(location=loc);o=bpy.context.object;o.name=n;point(o,targ);o.data.type='ORTHO';o.data.ortho_scale=scale;return o
cam=camera('Matched overhead review',(2,-8.85,10),(0,.04,.32),9.07)
detail=camera('Ledger hinges detail',(5.9,-6,5.6),(2.28,-.30,.32),3.48)
S.camera=cam;S.frame_set(111);S.render.image_settings.file_format='PNG'
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Palimpsest_F06_The_Long_Attrition.blend'))
for name,f,c in [('F06_01_Folded',1,cam),('F06_02_Indexed',42,cam),('F06_03_Expanded',111,cam),('F06_04_Ledger_Detail',111,detail)]:
 S.camera=c;S.frame_set(f);S.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
S.camera=cam;S.render.resolution_percentage=60;S.cycles.samples=5;S.frame_step=4
(P/'frames').mkdir(exist_ok=True)
S.render.filepath=str(P/'frames'/'f06_');bpy.ops.render.render(animation=True)
