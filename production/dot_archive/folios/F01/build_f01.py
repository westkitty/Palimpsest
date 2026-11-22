"""PALIMPSEST F01 · source-staging paper mechanism candidate. Blender 4.3; see manifest."""
import bpy,json,math,sys
from mathutils import Vector, Matrix, Quaternion
from pathlib import Path
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'f01_geometry.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
prefs=bpy.context.preferences;prefs.filepaths.save_version=0
S=bpy.context.scene
S.render.engine='CYCLES';S.cycles.samples=22;S.cycles.use_denoising=False
S.cycles.max_bounces=4;S.cycles.diffuse_bounces=2
S.render.threads_mode='FIXED';S.render.threads=3
S.view_settings.view_transform='AgX'
S.world.use_nodes=True
S.world.node_tree.nodes.get('Background').inputs[0].default_value=(.095,.117,.16,1)
S.world.node_tree.nodes.get('Background').inputs[1].default_value=.23
S.render.resolution_x=1120;S.render.resolution_y=680;S.render.resolution_percentage=100
S.render.image_settings.file_format='PNG'
def collection(n):
 c=bpy.data.collections.new(n);S.collection.children.link(c);return c
source=collection('01 • Published F01 source staging: editable mesh and transform transfer')
folds=collection('02 • Candidate scored paper support links: constant length')
conf=collection('03 • Concealed inscription: disabled in normal renders')
lighting=collection('04 • Review camera and studio lighting')
conf.hide_render=True
conf.hide_viewport=True
def mat(name,col,rough=.8,metal=0,emit=None,em=0,grain=True):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True
 ns=m.node_tree.nodes;lk=m.node_tree.links;b=ns.get('Principled BSDF')
 for key,val in [('Base Color',(*col,1)),('Roughness',rough),('Metallic',metal),('Emission Color',(*(emit or (0,0,0)),1)),('Emission Strength',em)]:
  b.inputs[key].default_value=val
 if grain:
  tex=ns.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=198;tex.inputs['Detail'].default_value=2
  coords=ns.new('ShaderNodeTexCoord');lk.new(coords.outputs['Object'],tex.inputs['Vector'])
  bump=ns.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18;bump.inputs['Distance'].default_value=.0045
  lk.new(tex.outputs['Fac'],bump.inputs['Height']);lk.new(bump.outputs['Normal'],b.inputs['Normal'])
 return m
mats={}
def srcmat(d):
 k=json.dumps(d,sort_keys=True)
 if k not in mats:
  mats[k]=mat('Upstream cardstock swatch %02d'%len(mats),d['color'],d['rough'],d['metal']*.58,d['emit'],d['em']*.58)
 return mats[k]
def obj(n,data=None,c=source,parent=None):
 o=bpy.data.objects.new(n,data);c.objects.link(o);o.parent=parent;return o
def mesh(n,v,f,m,c=source,parent=None):
 data=bpy.data.meshes.new(n);data.from_pydata(v,[],f);data.update()
 o=obj(n,data,c,parent);data.materials.append(m);return o
def box(n,loc,dim,m,c=source,parent=None):
 a,b,d=(x/2 for x in dim); me=[(-a,-b,-d),(a,-b,-d),(a,b,-d),(-a,b,-d),(-a,-b,d),(a,-b,d),(a,b,d),(-a,b,d)]
 o=mesh(n,me,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m,c,parent);o.location=loc;return o
def font(n,body,loc,size,m,c=source,parent=None,rot=(0,0,0)):
 d=bpy.data.curves.new(n,'FONT');d.body=body;d.align_x='CENTER';d.align_y='CENTER';d.size=size
 o=obj(n,d,c,parent);o.location=loc;o.rotation_euler=rot;d.materials.append(m);return o
def ringline(n,vs,width,m,c=source,parent=None):
 d=bpy.data.curves.new(n,'CURVE');d.dimensions='3D';d.resolution_u=1;d.bevel_depth=width;d.bevel_resolution=0
 spl=d.splines.new('POLY');spl.points.add(len(vs)-1)
 for p,v in zip(spl.points,vs):p.co=(*v,1)
 o=obj(n,d,c,parent);d.materials.append(m);return o
ink=mat('Label ink • source Georgia-like serif',(0.022,.034,.046))
slip=mat('Warm ivory label board',(0.67,.60,.44))
fillet=mat('Ochre printed registration border',(.34,.237,.108))
suppA=mat('V-fold leaf • indigo paper stock',(.060,.085,.135))
suppB=mat('V-fold reverse • navy paper stock',(.095,.135,.193))
desk=mat('Unmarked starless desk',(.020,.026,.036),.85)
az=mat('Inspection ink • azure, concealed only',(.05,.58,.72),.67,emit=(.01,.36,.65),em=.3,grain=False)
serif=Path(__file__).resolve().parents[2] / 'licenses' / 'LiberationSerif-Bold.ttf'
face=bpy.data.fonts.load(str(serif)) if serif.exists() else None
if face:face.pack()
R=Matrix(((1,0,0),(0,0,-1),(0,1,0)));Ri=R.transposed()
def v3(v):return (v[0],-v[2],v[1])
def rot(q):return (R@Quaternion((q[3],q[0],q[1],q[2])).to_matrix()@Ri).to_quaternion()
hinges={};tabs={};details={}; source_ids=[]
def instantiate(d,parent=None):
 if d.get('inscription'):return
 n=d['name']
 if n.startswith('F01 non-celestial'):return
 if d.get('label'):
  title=d['label'];w=max(d['vertices'][::3])-min(d['vertices'][::3])
  o=box('Cut label • '+title,(0,0,0),(w,w*.175,.008),slip,source,parent);o.location=v3(d['p'])
  o['Origin']='src/vnext/previewV2.ts: plaque()'
  a=w*.48;b=w*.077
  ringline('Printed frame • '+title,[(-a,-b,.005),(a,-b,.005),(a,b,.005),(-a,b,.005),(-a,-b,.005)],.004,fillet,source,o)
  tx=font('Printed words • '+title,title,(0,0,.006),min(.183,w*.110,w/(max(4,len(title))*.57)),ink,source,o)
  if face:tx.data.font=face
 else:
  if 'vertices' in d:
   q=d['vertices'];v=[v3(q[j:j+3]) for j in range(0,len(q),3)];idx=d['indices'] or range(len(v))
   f=[idx[j:j+3] for j in range(0,len(idx),3)]
   o=mesh(n,v,f,srcmat(d['mat']),source,parent)
   o['Geometry from source']=d['geo']
   # Polymer box edge glint is intentionally avoided; small bevel matches real cardstock cut.
   if d['geo']=='BoxGeometry' and len(v)<=24:
    pass
  else:o=obj(n,c=source,parent=parent)
  o.location=v3(d['p']);o.rotation_mode='QUATERNION';o.rotation_quaternion=rot(d['q']);o.scale=(d['s'][0],d['s'][2],d['s'][1])
 if 'hinge' in d:
  i=d['hinge'];o.name=f'A • fold axis {i+1}';o.empty_display_size=.16;hinges[i]=o
 if 'tab' in d:
  i=d['tab'];o.name=f'Pull-tab {chr(65+i)}';tabs[i]=o;o.empty_display_size=.16
 if 'detail' in d:
  i=d['detail'];o.name=f'B • detail marks {i+1}';details[i]=o
 if n.startswith('palimpsest-original-'):
  o['Provenance']='CharacterFigures.ts and previewV2.ts generated source geometry at '+D['ref']
  o['Approval']='Prior editorial representation; no new visual canon approval';source_ids.append(n)
 for cc in d['children']:instantiate(cc,o)
 return o
root=instantiate(D['geometry'])
assert len(hinges)==len(tabs)==len(details)==3 and len(source_ids)==3
# An inspection-only copy attaches to the underside near the center stand's
# front edge. It carries the existing literal, never in a public render.
under=font('INSPECTION ONLY • existing literal','[Inspection text omitted]',(0,-.96,-.025),.060,az,conf,hinges[1],rot=(math.pi,0,0))
if face:under.data.font=face
under['Public visibility']='None. Separate inspection-only collection intentionally disabled.'
# Add paired die-cut gussets under the three supplied standees. Arm lengths are
# constant: a solved linkage tracks the existing F01 hinge targets.
L=.49
supports=[]
for i in range(3):
 for side in (-1,1):
  set_=[]
  for j,m in enumerate((suppA,suppB)):
   profile=[(-.105,0),(.105,0),(.105,L*.23),(.081,L*.82),(.053,L),(-.053,L),(-.081,L*.82),(-.105,L*.23)]
   if j:profile=[(x,L-y) for x,y in profile][::-1]
   o=mesh('Scored cardstock gusset • %s %d link %d'%('Left' if side<0 else 'Right',i+1,j+1),[(x,y,0) for x,y in profile],[list(range(len(profile)))],m,folds)
   sol=o.modifiers.new('Cardstock cut thickness','SOLIDIFY');sol.thickness=.008
   e=o.modifiers.new('Soft die edge','BEVEL');e.width=.0017;e.segments=2
   ringline('Score across cardstock root',[(-.09,.028,.003),(.09,.028,.003)],.002,fillet,folds,o)
   set_.append(o)
  supports.append((i,side,set_))
def key_pose(o,loc,q,fr,location=True):
 o.rotation_mode='QUATERNION'
 if o.get('_q') and q.dot(o.rotation_quaternion)<0:q.negate()
 o['_q']=1;o.rotation_quaternion=q;o.location=loc
 o.keyframe_insert('rotation_quaternion',frame=fr)
 if location:o.keyframe_insert('location',frame=fr)
def ease(fr,a,b):
 q=min(1,max(0,(fr-a)/(b-a)));return q*q*(3-2*q)
def pose(fr,a,b,c):
 coords={}
 for i,o in hinges.items():
  # Asset state from the live mechanism; right-before-left calibration avoided.
  rx=-.03+(-.94 if i==1 else -.79)*a+.03*a
  # Three y-axis yaw maps to Blender z; Three local XYZ preserves order X then Y.
  rz=(i-1)*.10*c
  q=(Matrix.Rotation(rx,3,'X')@Matrix.Rotation(rz,3,'Z')).to_quaternion()
  key_pose(o,Vector(o.location),q,fr,False)
  coords[i]=(Vector(o.location),q)
 for i,o in tabs.items():
  a_=([a,b,c])[i]
  loc=Vector(((i-1)*2.52,-(2.71+.31*a_),.32))
  key_pose(o,loc,Matrix.Rotation(-.12*a_,3,'X').to_quaternion(),fr)
 for i,o in details.items():
  # Only geometry, never secrets, is toggled by the detail tab.
  o.scale=(1,1,1) if b>.53 else (.0001,)*3;o.keyframe_insert('scale',frame=fr)
 for i,side,(u,v) in supports:
  orig,q=coords[i]
  B=orig+q@Vector((side*.62,-.86,.012))
  A=orig+Vector((side*.62,-.18,-.015))
  D=B-A
  assert D.length<2*L
  N=Vector((1,0,0)).cross(D).normalized()
  # This sign keeps the center crease clear of the substrate as the pad rises.
  if N.z<0:N.negate()
  M=(A+B)*.5+N*math.sqrt(max(0,L*L-D.length_squared*.25))
  assert abs((M-A).length-L)<1e-6 and abs((B-M).length-L)<1e-6
  for ob,start,end in ((u,A,M),(v,M,B)):
   yy=(end-start).normalized()
   zz=Vector((1,0,0)).cross(yy).normalized()
   xx=yy.cross(zz).normalized()
   qq=Matrix((xx,yy,zz)).transposed().to_quaternion()
   key_pose(ob,start,qq,fr)
S.frame_start=1;S.frame_end=72;S.render.fps=18
for f in range(1,73):
 a=ease(f,7,28)*(1-ease(f,51,68));b=ease(f,23,34)*(1-ease(f,47,54));c=ease(f,32,43)*(1-ease(f,46,53));pose(f,a,b,c)
for f,n in [(1,'REST • current F01 layout'),(9,'A • fold raises stands'),(25,'B • detail marks'),(35,'C • compare by yaw'),(45,'A/B/C active • main overview'),(54,'Reset and reverse'),(72,'REST')]:
 S.timeline_markers.new(n,frame=f)
def point(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
def area(n,loc,target,power,col,sz):
 d=bpy.data.lights.new(n,'AREA');d.energy=power;d.color=col;d.shape='DISK';d.size=sz
 o=obj(n,d,lighting);o.location=loc;point(o,target)
area('Warm raking desk key',(-5,-4,8),(0,.2,.3),970,(1,.86,.72),5)
area('Cool paper tone right',(5,-1,6),(0,.8,.45),610,(.68,.84,1),4)
area('Backdrop cut edges',(-1,5,7),(0,1,.5),730,(.83,.88,1),4)
for i in range(3):
 area('F01 non-celestial footlight %d'%i,((i-1)*2.67,-.05,1.05),((i-1)*2.67,2,1.06),31,(.73,.89,1) if i==1 else (1,.84,.68),1.1)
box('Plain slate worktop',(0,0,-.31),(200,200,.1),desk,lighting)
def camera(n,loc,target,size):
 d=bpy.data.cameras.new(n);d.type='ORTHO';d.ortho_scale=size
 o=obj(n,d,lighting);o.location=loc;point(o,target);return o
shot=camera('F01 reading overview',(.88,-11.2,9.5),(0,.28,.39),11.13)
close=camera('F01 mechanism cut-edge proof',(1.48,-5.25,2.85),(0,1.3,.99),8.15)
S.camera=shot
S['Candidate role']='Physical folding study of published F01, not replacement narrative or new likeness approval.'
S['Verified source SHA']=D['ref']
S['Concealed text']='Disabled in all deliverable cameras and normal renders; optional local inspection.'
S['Mechanism A']='Fold: left and right -0.79 rad, center -0.94 rad when engaged; -0.03 rest.'
S['Mechanism B']='Reversible printed detail mark reveal. Not an inscription trigger.'
S['Mechanism C']='Comparison yaw ±0.10 rad; center remains neutral.'
S.frame_set(45)
S.render.filepath='//Palimpsest_F01_Paper_Proof.png'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Palimpsest_F01_Fold_Candidate.blend'))
def render(n,f,c):
 S.frame_set(f);S.camera=c;S.render.filepath=str(ROOT/n);bpy.ops.render.render(write_still=True)
render('Palimpsest_F01_Paper_Proof.png',45,shot)
S.cycles.samples=13;S.render.resolution_percentage=85
render('F01_Rest.png',1,shot)
render('F01_Cut_Edge_Proof.png',45,close)
if '--motion' in sys.argv:
 S.frame_step=2;S.render.resolution_percentage=57;S.cycles.samples=6
 (ROOT/'frames').mkdir(exist_ok=True)
 S.render.filepath=str(ROOT/'frames'/'f01_');S.camera=shot
 bpy.ops.render.render(animation=True)
print('PASS • source figures',source_ids,'paper hinge count',len(hinges),'supports',len(supports),'secret excluded',conf.hide_render)
