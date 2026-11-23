"""Run with the scrubbed F02 Blender candidate open. Outputs beside this script."""
import bpy, math, json, struct, re
from pathlib import Path
from mathutils import Quaternion
D=Path(__file__).resolve().parent
s=bpy.context.scene
assert Path(bpy.data.filepath).name=='Palimpsest_F02_The_All_Unfolds.blend'
s.frame_set(1)
source={o.name:o for o in s.objects}
hinges=[next(o for o in source.values() if o.name.startswith('Fold '+k+' ·')) for k in 'ABC']
gussets=[o for o in s.objects if o.name.startswith('Black gusset with moving plate joint')]
assert len(gussets)==6
folds=((18,39),(42,65),(68,97))
# Capture the original Hook results; meshes keep the exact triangles, thickness, and fixed attachment vertices.
def p3(v):return (v[0],v[2],-v[1])
def ev(ob):
 dg=bpy.context.evaluated_depsgraph_get()
 me=ob.evaluated_get(dg).to_mesh()
 out=[v.co.copy() for v in me.vertices]
 ob.evaluated_get(dg).to_mesh_clear()
 return out
gus={}
for o in gussets:
 tag=o.name.split(' joint ')[1][0]
 start,end=folds['ABC'.index(tag)]
 fs=list(range(start,end,3))+[end]
 qs=[]
 for f in fs:
  s.frame_set(f);qs.append(ev(o))
 gus[o.name]=(fs,qs)
s.frame_set(1)
# Slate worktop, shared leaves/binding/controls, all text/hidden collections, and slate Geode substitute
# are deliberately excluded. Runtime retains the exact original author-built Geode + inspection gate.
book_names=('Pre-existing source lamina','Lamina index incision','Fixed connection from pre-existing lamina',
 'Black die-cut rear framing arch','Arched arch ink perimeter','Rear arch bond foot','Rear arch score',
 'Bonded black root rail','Spine fastener','Gusset book bond tab')
allow=[]
for o in list(s.objects):
 cs=[c.name[:2] for c in o.users_collection]
 if (o.type in ('EMPTY','MESH','CURVE') or o.name=='Zentrum landmark plaque') and (any(x in cs for x in ('01','02','03','04')) or ('00'in cs and o.name.startswith(book_names))):
  allow.append(o)
# Fix on/off semantic names for direct inspection. Export no Blender extras.
stages=[]
for i,h in enumerate(hinges):
 h.name='F02_HINGE_'+'ABC'[i]
 names=('Die-cut points','Registration orbit ink','Printed ink face','Black die-cut spiral','Folded black ribbon support','Spiral ribbon bond foot')
 layer=bpy.data.objects.new('F02_STELLAR_'+'ABC'[i],None)
 h.users_collection[0].objects.link(layer);layer.parent=h
 for q in list(h.children):
  if q.name.startswith(names):
   q.parent=layer
   q.animation_data_clear();q.hide_viewport=False;q.hide_render=False;q.hide_set(False)
 stages.append(layer);allow.append(layer)
# Clear HIDE_VIEWPORT drivers first, then convert visual curve traces to evaluated printable geometry.
s.frame_set(1);bpy.context.view_layer.update()
dg=bpy.context.evaluated_depsgraph_get()
for o in list(allow):
 if o.type in ('CURVE','FONT'):
  n=o.name;o.name='UNEXPORTED Original '+n
  me=bpy.data.meshes.new_from_object(o.evaluated_get(dg),depsgraph=dg)
  assert me.polygons,n
  q=bpy.data.objects.new(n,me);o.users_collection[0].objects.link(q);q.parent=o.parent
  q.matrix_parent_inverse=o.matrix_parent_inverse.copy();q.matrix_basis=o.matrix_basis.copy()
  allow.remove(o);allow.append(q)
for o in gussets:
 frames,snapshots=gus[o.name]
 me=bpy.data.meshes.new_from_object(o.evaluated_get(dg),depsgraph=dg)
 assert len(me.vertices)==len(snapshots[0])
 o.modifiers.clear()
 o.data=me
 o.shape_key_add(name='Basis')
 for f,pts in zip(frames[1:],snapshots[1:]):
  key=o.shape_key_add(name='Original_Hook_'+str(f))
  for j,v in enumerate(pts):key.data[j].co=v
 o.name='F02_GUSSET_'+o.name.split(' joint ')[1][0]+'_'+o.name.split('.')[-1].replace(' ','_')[-3:]
 # Non-identical constant names are required for Three PropertyBinding.
for i,o in enumerate(gussets):o.name='F02_GUSSET_'+str(i)
# Apply modifier geometry without disabling the explicitly baked gusset shape keys.
# All three die-cut cards, strip edges, folds and bevels retain black-through stock.
for o in allow:
 if o.type=='MESH' and o not in gussets and o.modifiers:
  me=bpy.data.meshes.new_from_object(o.evaluated_get(dg),depsgraph=dg)
  o.modifiers.clear();o.data=me
# Align the Blender paper base with the standard .21 runtime page surface. X unchanged.
root=bpy.data.objects.new('F02_Blender_Paper_Stage',None);s.collection.objects.link(root)
root.location=(0,0,.101)
for o in list(allow):
 if o.parent is None:
  o.parent=root
allow.append(root)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in allow:o.select_set(True)
tmp=D/'f02_mesh.tmp.glb'
bpy.ops.export_scene.gltf(filepath=str(tmp),export_format='GLB',use_selection=True,export_animations=False,
 export_cameras=False,export_lights=False,export_yup=True,export_materials='EXPORT',export_morph=True,export_extras=False)
raw=tmp.read_bytes();n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);data=bytearray(raw[28+n:])
nodes={o['name']:i for i,o in enumerate(doc['nodes']) if 'name'in o}
def writer(v,typ='SCALAR',times=False):
 while len(data)%4:data.append(0)
 off=len(data); flat=[float(x) for x in v] if typ=='SCALAR' else [float(y) for x in v for y in x]
 data.extend(struct.pack('<%df'%len(flat),*flat))
 k=len(doc['bufferViews']);doc['bufferViews'].append(dict(buffer=0,byteOffset=off,byteLength=len(flat)*4))
 ix=len(doc['accessors']);a=dict(bufferView=k,componentType=5126,count=len(v),type=typ)
 if times:a.update(min=[min(flat)],max=[max(flat)])
 doc['accessors'].append(a)
 return ix
anim=dict(name='F02_ORIGINAL_BLENDER_FOLDS',channels=[],samplers=[])
def chan(name,prop,frames,values,typ='SCALAR',easing='LINEAR'):
 k=len(anim['samplers']);node=nodes[name]
 anim['samplers'].append(dict(input=writer([(f-1)/24 for f in frames],times=True),output=writer(values,typ),interpolation=easing))
 anim['channels'].append(dict(sampler=k,target=dict(node=node,path=prop)))
frames=list(range(1,111))
qs={h.name:[] for h in hinges}
for f in frames:
 s.frame_set(f)
 for h in hinges:
  # glTF assigns all-negative scale to mirrored node. Preserve the exact
  # static decomposition rather than re-decomposing a reflected Euler rest.
  ox,oy,oz,ow=doc['nodes'][nodes[h.name]]['rotation']
  q=Quaternion((1,0,0),h.rotation_euler.x) @ Quaternion((ow,ox,oy,oz))
  qs[h.name].append((q.x,q.y,q.z,q.w))
for h in hinges:chan(h.name,'rotation',frames,qs[h.name],'VEC4')
for i,o in enumerate(gussets):
 source_name=list(gus)[i];fs,_=gus[source_name];m=len(fs)-1
 vals=[];kf=[1,*fs,110]
 for j in range(len(kf)):
  w=[0.]*m
  if j>=2:w[min(j-2,m-1)]=1.
  vals+=w
 assert len(doc['meshes'][doc['nodes'][nodes[o.name]]['mesh']]['primitives'][0]['targets'])==m
 chan(o.name,'weights',kf,vals)
for i,layer in enumerate(stages):
 start,end=folds[i]
 # Original faces switch on at start+3; a 4-frame deployment avoids a distracting hard pop.
 # For first points only, the original stage trigger is retained exactly until they emerge.
 chan(layer.name,'scale',[1,start+2,start+6,110],[(0,0,0),(0,0,0),(1,1,1),(1,1,1)],'VEC3')
 # Explicit time-zero hidden even if a consumer previews without attaching the animation.
 doc['nodes'][nodes[layer.name]]['scale']=[0,0,0]
doc['animations']=[anim]
while len(data)%4:data.append(0)
doc['buffers'][0]['byteLength']=len(data)
meta=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode()
meta+=b' '*((-len(meta))%4)
(D/'f02.glb').write_bytes(struct.pack('<4sII',b'glTF',2,28+len(meta)+len(data))+struct.pack('<I4s',len(meta),b'JSON')+meta+struct.pack('<I4s',len(data),b'BIN\0')+data)
tmp.unlink()
print('F02 GLB:',len(doc['nodes']),'nodes',len(doc['meshes']),'meshes',len(anim['channels']),'authored tracks',len(data),'bytes BIN')
