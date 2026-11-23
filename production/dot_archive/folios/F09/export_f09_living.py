"""Blender 4.3 headless: export only the reviewed, editable F09.A teaching apparatus."""
import bpy, hashlib, json, struct, sys
from pathlib import Path
from mathutils import Quaternion

S=bpy.context.scene
EXPECTED='22dc04b507e1720f0b269caeff3d02d9b2695e8149adbcd39bbefbd1b3674a14'
source=Path(bpy.data.filepath)
assert hashlib.sha256(source.read_bytes()).hexdigest()==EXPECTED, 'Unexpected candidate bytes'
dest=Path(sys.argv[sys.argv.index('--')+1]).resolve()
F=bpy.data.objects
arm=F['A / armillary enclosure • stationary']
model=F['A / golden paper MODEL STAR']
void=F['A / permanent matte black singularity']
tab=F['A / cyan extraction pull tab · one-way']
fiber=F['Moving cyan filament • independent from history chart']
hinges=[F[f'A spoke shared crease {i:02d}'] for i in range(8)]
direct=['Slate die-cut mounting board','Hairline border around black mounting socket','Printed dial graduation','Gimbal bridge buttress','Gimbal pin scored brace','Cardboard pull-tab receiver rail','Pressed brass guide seam','Fixed endstop','Pressed black model-label backing','Nonhistorical separation label']
book=arm.parent
allowed=set([arm,*arm.children_recursive,tab,*tab.children_recursive,fiber])
allowed.update(o for o in book.children if any(o.name==p or o.name.startswith(p+'.') for p in direct))
assert len([o for o in allowed if o.name.startswith('Slate die-cut mounting board')])==3
assert len([o for o in allowed if o.name.startswith('Cardboard pull-tab receiver rail')])==2
renames={arm:'F09_A_ARMILLARY',model:'F09_A_MODEL',void:'F09_A_MATTE_ABSENCE',tab:'F09_A_PULL_RING',fiber:'F09_A_FILAMENT',
         **{o:f'F09_A_SPOKE_{i+1:02d}' for i,o in enumerate(hinges)}}

# Only changing frames need keys; every sampled vertex comes from the evaluated reviewed curve,
# including the original diameter and segmented divisions.
def baked_positions(o):
 dg=bpy.context.evaluated_depsgraph_get()
 me=bpy.data.meshes.new_from_object(o.evaluated_get(dg),depsgraph=dg)
 vs=[0.]*(len(me.vertices)*3);me.vertices.foreach_get('co',vs)
 bpy.data.meshes.remove(me)
 return vs

S.frame_set(1)
basis=baked_positions(fiber)
morph_frames=[]
last=basis
for f in range(2,55):
 S.frame_set(f)
 now=baked_positions(fiber)
 assert len(now)==len(basis)
 if max(abs(a-b) for a,b in zip(now,last))>1e-6:
  morph_frames.append((f,now));last=now
assert 25<len(morph_frames)<54

def translated(v):return (v[0],v[2],-v[1])
def rotated(q):return (q.x,q.z,-q.y,q.w)
def scale(v):return (v[0],v[2],v[1])
frames=range(1,97)
transforms={o:[] for o in hinges+[tab,void]}
for f in frames:
 S.frame_set(f)
 for o in hinges:transforms[o].append(rotated(o.rotation_euler.to_quaternion()))
 transforms[tab].append(translated(tab.location))
 transforms[void].append(scale(void.scale))

# The black mark is hidden at f1 in the source. Evaluate real geometry at a frame where
# it is visible; static clones have no inherited Blender viewport flags or extract-only FCurves.
S.frame_set(1)
matte_name='F09 matte obsidian | color without glow'
matte=F['Dry obsidian model mark'].data.materials[0].copy()
matte.name=matte_name
bpy.ops.object.select_all(action='DESELECT')
outroot=bpy.data.objects.new('F09_A_Approved_Blender_Source',None);S.collection.objects.link(outroot)
copies={}
def inherited(a):
 n=0
 while a.parent:n+=1;a=a.parent
 return n
for orig in sorted(allowed,key=lambda o:(inherited(o),o.name)):
 old_name=orig.name
 name=renames.get(orig,'F09 '+old_name)
 local=orig.matrix_local.copy()
 if orig.type=='EMPTY':
  me=None
 else:
  if orig in void.children_recursive:
   S.frame_set(70)
  dg=bpy.context.evaluated_depsgraph_get()
  me=bpy.data.meshes.new_from_object(orig.evaluated_get(dg),depsgraph=dg)
  assert len(me.polygons)>0, old_name
  if old_name=='Dry obsidian model mark':
   me.materials.clear();me.materials.append(matte)
  if orig in void.children_recursive:
   S.frame_set(1)
 ob=bpy.data.objects.new(name,me);S.collection.objects.link(ob)
 ob.parent=copies.get(orig.parent,outroot);ob.matrix_basis=local
 ob.select_set(True);copies[orig]=ob

# Basis + exact sampled morphs avoid reconstructing a substitute cylinder in Three.js.
moving=copies[fiber];moving.shape_key_add(name='Basis')
for f,coords in morph_frames:
 key=moving.shape_key_add(name=f'Authored filament frame {f:02d}',from_mix=False)
 key.data.foreach_set('co',coords)
outroot.select_set(True)
tmp=dest.with_suffix('.static.glb')
bpy.ops.export_scene.gltf(filepath=str(tmp),export_format='GLB',use_selection=True,
 export_animations=False,export_cameras=False,export_lights=False,export_yup=True,
 export_materials='EXPORT',export_morph=True,export_morph_normal=False,export_extras=False)
raw=tmp.read_bytes();assert raw[:4]==b'glTF'
jlen=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+jlen]);start=20+jlen
bsize=struct.unpack_from('<I',raw,start)[0];data=bytearray(raw[start+8:start+8+bsize])
nodes={o['name']:i for i,o in enumerate(doc['nodes'])}
selection=doc['meshes'][doc['nodes'][nodes[moving.name]]['mesh']]
assert len(selection['primitives'][0]['targets'])==len(morph_frames)
doc.setdefault('extensionsUsed',[]).append('KHR_materials_unlit')
for m in doc['materials']:
 if m['name']==matte_name:
  m.setdefault('extensions',{})['KHR_materials_unlit']={}
def add(values,width=1,*,time=False):
 while len(data)%4:data.append(0)
 off=len(data)
 flat=[float(y) for x in values for y in x] if width!=1 else list(map(float,values))
 data.extend(struct.pack('<%df'%len(flat),*flat))
 bv=len(doc['bufferViews']);doc['bufferViews'].append(dict(buffer=0, byteOffset=off, byteLength=len(data)-off))
 a=len(doc['accessors']);item=dict(bufferView=bv,componentType=5126,count=len(values),type={1:'SCALAR',3:'VEC3',4:'VEC4'}[width])
 if time:item.update(min=[min(flat)],max=[max(flat)])
 doc['accessors'].append(item);return a
time=add([(f-1)/S.render.fps for f in frames],time=True)
clip=dict(name='F09_A_Authored_Model_Star_Extraction',channels=[],samplers=[],extras=dict(fps=S.render.fps,frames=[1,96],source_sha256=EXPECTED))
def track(name,path,output):
 i=len(clip['samplers']);clip['samplers'].append(dict(input=time,output=output,interpolation='LINEAR'))
 clip['channels'].append(dict(sampler=i,target=dict(node=nodes[name],path=path)))
for o in hinges:track(copies[o].name,'rotation',add(transforms[o],4))
track(copies[tab].name,'translation',add(transforms[tab],3))
track(copies[void].name,'scale',add(transforms[void],3))
index={f:i for i,(f,_) in enumerate(morph_frames)}
weights=[]
current=None
for f in frames:
 if f in index:current=index[f]
 weights.extend([float(i==current) for i in range(len(morph_frames))])
track(moving.name,'weights',add(weights))
doc['animations']=[clip]
doc['asset']['extras']=dict(source_file=source.name,source_sha256=EXPECTED,
 filter='F09.A geometry only; B/C remain authored Living Book controls; no cameras/lighting/private media',filamentMorphs=len(morph_frames))
doc['buffers'][0]['byteLength']=len(data)
j=json.dumps(doc,ensure_ascii=True,separators=(',',':')).encode()
j+=b' '*((-len(j))%4)
dest.write_bytes(struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(data))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(data),b'BIN\0')+data)
tmp.unlink()
print(f'F09 candidate: {len(nodes)} nodes, {len(doc["meshes"])} meshes, {len(clip["channels"])} authored channels, {len(morph_frames)} exact filament morphs, {dest.stat().st_size} bytes')
