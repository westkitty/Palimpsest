"""Export only the approved Palimpsest F08 paper sculptures. Blender 4.3.2."""
import bpy, re, json, struct
from pathlib import Path
from mathutils import Matrix
D=Path(__file__).resolve().parent
s=bpy.context.scene
assert Path(bpy.data.filepath).name=='Palimpsest_F08_The_Aureal_Gate.blend'
assert s.render.fps==24
source=list(s.objects)
# The existing book substrate, actual Hookshot portal and plasma, all runtime characters,
# levers and navigation stay in the reader. This only ports candidate physical theatre.
book=('Editorial negative-space gate cut','Nested relief glued bond foot','Folded nested relief supported score','Quiet right backcloth silhouette','Folio identifier','Title','Date stamp','Right station','No geographical mapping')
words=('A source interpretation','B imprint pre','B imprint post','C broad direction legend',*book[-5:])
selection=[]
for o in source:
 cs={q.name[:2] for q in o.users_collection}
 if o.type not in ('MESH','EMPTY','CURVE','FONT'):continue
 if o.type=='FONT' and o.name not in words:continue
 if cs&{'02','03'} or ('00'in cs and o.name.startswith(book)) or ('01'in cs and not o.name.startswith(('Cyan paper Starsilk','Cyan teaching ribbon','Azure paper ribbon'))):
  selection.append(o)
assert all(o.parent is None or o.parent in selection for o in selection)
controls={}
for o in selection:
 nm=o.name
 if 'gate-shield hinge' in nm:controls[nm]=('A','F08_SHUTTER_'+('L' if 'left' in nm else 'R'),('rotation',))
 elif nm.startswith('B broken assumption arc folded support'):controls[nm]=('B','F08_B_ARC_PIVOT_'+nm[-1],('rotation','translation'))
 elif nm=='B movable indication tab':controls[nm]=('B','F08_B_SLIDER',('translation',))
 elif nm.startswith('C physical accordion leaf'):controls[nm]=('C','F08_C_LEAF_'+nm[-1],('rotation',))
gate=[]
for o in selection:
 nm=o.name
 fcurves=o.animation_data.action.fcurves if o.animation_data and o.animation_data.action else []
 if any(f.data_path=='hide_viewport' for f in fcurves):
  gate.append(o)
clips={'A':{ },'B':{},'C':{}}
M=Matrix(((1,0,0),(0,0,1),(0,-1,0)))
def cv(v):return tuple(M@v)
startend={'A':(16,40),'B':(65,88),'C':(103,153)}
for slot,(st,en) in startend.items():
 fs=[1,*range(st,en+1)]
 gathered={}
 for f in fs:
  s.frame_set(f)
  for nm,(ss,n,props) in controls.items():
   if ss!=slot:continue
   o=bpy.data.objects[nm]
   for prop in props:
    if prop=='rotation':
     q=(M@o.rotation_euler.to_matrix()@M.transposed()).to_quaternion()
     v=(q.x,q.y,q.z,q.w)
    elif prop=='translation':v=cv(o.location)
    gathered.setdefault((n,prop),[fs,[]])[1].append(v)
 clips[slot].update(gathered)
s.frame_set(1)
rt=bpy.data.objects.new('F08_Exact_Blender_Theatre',None);s.collection.objects.link(rt)
# Runtime book leaf is wider than the archival panorama's safe margin. Uniform scaling
# preserves all angles, pivot registration and ring topology. Set source .12 page to .21.
rt.location=(0,0,.108);rt.scale=(.86,.86,.86)
for o in selection:
 if o.parent is None:o.parent=rt
for o in gate:
 n0=o.name
 ss='C' if n0=='C broad direction legend' else 'B'
 i=gate.index(o);name='F08_'+ss+'_VIS_'+str(i)
 pivot=bpy.data.objects.new(name,None);o.users_collection[0].objects.link(pivot)
 pivot.parent=o.parent;pivot.location=o.location
 # Scale gate around each existing plate/fragment origin. Wholly zero only in the hidden detent.
 o.parent=pivot;o.location=(0,0,0)
 f=[1,137,138,153] if ss=='C' else [1,68,69,88]
 seq=[0,0,1,1] if n0 not in ('B imprint pre','B whole gold circle · earlier doctrine') else [1,1,0,0]
 clips[ss][name,'scale']=[f,[(i,i,i) for i in seq]]
 o.animation_data_clear();o.hide_render=False;o.hide_viewport=False;o.hide_set(False)
 selection.append(pivot)
selection.append(rt)
for n0,(_,n2,_) in controls.items():bpy.data.objects[n0].name=n2
for o in selection:
 o.hide_viewport=False;o.hide_render=False;o.hide_set(False)
bpy.context.view_layer.update()
dg=bpy.context.evaluated_depsgraph_get()
for i,o in enumerate(selection):
 if (o.type in ('CURVE','FONT')) or (o.type=='MESH' and o.modifiers):
  me=bpy.data.meshes.new_from_object(o.evaluated_get(dg),depsgraph=dg)
  assert len(me.polygons),o.name
  if o.type=='MESH':
   o.modifiers.clear();o.data=me
  else:
   nm=o.name;o.name='Unexported original '+nm
   q=bpy.data.objects.new(nm,me);o.users_collection[0].objects.link(q)
   q.parent=o.parent;q.matrix_basis=o.matrix_basis.copy()
   selection[i]=q
bpy.ops.object.select_all(action='DESELECT')
for o in selection:o.select_set(True)
tmp=D/'f08-static.tmp.glb'
bpy.ops.export_scene.gltf(filepath=str(tmp),export_format='GLB',use_selection=True,export_animations=False,
  export_cameras=False,export_lights=False,export_yup=True,export_extras=False)
raw=tmp.read_bytes();nl=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+nl]);data=bytearray(raw[28+nl:])
nodes={o['name']:i for i,o in enumerate(doc['nodes']) if 'name' in o}
def writer(v,typ='SCALAR',times=False):
 while len(data)%4:data.append(0)
 flat=[float(x) for x in v] if typ=='SCALAR' else [float(y) for x in v for y in x]
 off=len(data);data.extend(struct.pack('<%df'%len(flat),*flat))
 k=len(doc['bufferViews']);doc['bufferViews'].append(dict(buffer=0,byteOffset=off,byteLength=len(flat)*4))
 a=dict(bufferView=k,componentType=5126,count=len(v),type=typ)
 if times:a.update(min=[min(flat)],max=[max(flat)])
 ix=len(doc['accessors']);doc['accessors'].append(a)
 return ix
doc['animations']=[]
for slot,tracks in clips.items():
 an=dict(name='F08_BLENDER_SLOT_'+slot,samplers=[],channels=[])
 for (nm,path),(fs,vals) in tracks.items():
  node=nodes[nm];k=len(an['samplers'])
  kind='VEC4' if path=='rotation' else 'VEC3'
  sampler=dict(input=writer([(f-1)/24 for f in fs],times=True),output=writer(vals,kind),interpolation='STEP' if path=='scale' else 'LINEAR')
  an['samplers'].append(sampler);an['channels'].append(dict(sampler=k,target=dict(node=node,path=path)))
  if path=='scale':doc['nodes'][node]['scale']=list(vals[0])
 doc['animations'].append(an)
while len(data)%4:data.append(0)
doc['buffers'][0]['byteLength']=len(data)
meta=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode()
meta+=b' '*((-len(meta))%4)
(D/'f08.glb').write_bytes(struct.pack('<4sII',b'glTF',2,28+len(meta)+len(data))+struct.pack('<I4s',len(meta),b'JSON')+meta+struct.pack('<I4s',len(data),b'BIN\0')+data)
tmp.unlink()
print('F08 GLB:',len(doc['nodes']),'nodes',len(doc['meshes']),'meshes',[(x['name'],len(x['channels'])) for x in doc['animations']],len(data),'BIN bytes')
