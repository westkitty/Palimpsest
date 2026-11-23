"""Blender 4.3.2, open Palimpsest_F11_Dimensional_Quality_Proof.blend. Exports assets only."""
import bpy, math, sys, json, hashlib, struct
from collections import defaultdict
from pathlib import Path
from mathutils import Matrix

src=bpy.context.scene
assert Path(bpy.data.filepath).name=='Palimpsest_F11_Dimensional_Quality_Proof.blend'
dst=Path(sys.argv[-1]).resolve(); dst.mkdir(parents=True,exist_ok=True)
lookup=lambda pre:next(o for o in src.objects if o.name.startswith(pre))
groups={**{f'ACTOR_{a.upper()}':lookup(p) for a,p in [('Codec','Codec · grounded'),('Marcel','Marcel · sourced'),('Tiger','Tiger · posed')]},
 'ROOT_REGISTER':lookup('F11 | Root-view registration frame'),
 'MARCEL_EFFECT':lookup('F11 | Marcel arrives'),
 **{f'PLANT_{i:02d}':lookup(f'Root point anchored to spread {i:02d}') for i in range(27)}}
fac=lookup('Tiger | FACIAL_LR')
def action_samples(action,indices,frame_count):
    curves={f.array_index:f for f in action.fcurves if f.data_path=='rotation_euler'}
    return [[round(curves[i].evaluate(f),6) if i in curves else 0 for i in indices] for f in range(1,frame_count+1)]
side={'fps':src.render.fps,'last':180,'sourceSHA256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),'idles':{},'eyes':{}}
for actor in ('Codec','Marcel','Tiger'):
    for layer in ('Body','Head'):
        ob=lookup(f'{actor} | {layer.upper()}_IDLE')
        tr=ob.animation_data.nla_tracks[0]; strip=tr.strips[0]; action=strip.action
        influence=next(f for f in strip.fcurves if f.data_path=='influence')
        side['idles'][f'{actor.upper()}_{layer.upper()}_IDLE']={'offset':int(strip.frame_start)-1,'samples':action_samples(action,(0,1,2),int(action.frame_range[1])),'weights':[round(influence.evaluate(f),4) for f in range(1,181)]}
        tr.mute=True
for clip in ('Blink','Wink_L','Wink_R','Face_Idle'):
    action=bpy.data.actions['Tiger · '+clip]
    fcurves={f.data_path:f for f in action.fcurves}
    side['eyes'][clip]=[[round(fcurves['["close_'+s+'"]'].evaluate(f),4) for s in ('L','R')] for f in range(1,int(action.frame_range[1])+1)]
fac.animation_data.nla_tracks[0].mute=True

out=bpy.data.scenes.new('F11 Living solids')
out.frame_start=1; out.frame_end=180; out.render.fps=24
objects={}; owners={}; names={}
def empty(name,parent=None):
    o=bpy.data.objects.new(name,None);out.collection.objects.link(o);o.parent=parent;return o
stage=empty('F11_BLENDER_STAGE')
def safe_name(q,index):
    n=q.name
    if ' | BODY_' in n or ' | HEAD_' in n:return n.replace(' | ','_').upper()
    if n.startswith('Paper stem hinge'):return 'STEM_'+n[-2:]
    if n.startswith('Folded leaf frond axis'):return 'FROND_'+n[-4:].replace('.','_')
    if n.startswith('F11 | racing under-page'):return 'ROOT_TRACE'
    if n.startswith('Wordstream animated'):return f'WORDSTREAM_{index:03d}'
    return f'MOTION_{index:03d}'
def rec(q,owner,i=0):
    if q!=owner and q.animation_data and q!=fac:
        name=safe_name(q,len(objects)); b=empty(name,objects[owner]);objects[q]=b
        owners[q]=owner
        owner=q
    if q.type in {'MESH','CURVE'} and not q.name.startswith('Raked two-sided paper blade'):
        names[q]=owner
    for c in q.children:rec(c,owner)
for name,o in groups.items():
    owners[o]=None;objects[o]=empty(name,stage);rec(o,o)

# Store exact interpolated visual TRS as a glTF clip, with degrees of freedom left on each pivot.
samples={o:[] for o in objects}
for f in range(1,181,2):
    src.frame_set(f)
    dg=bpy.context.evaluated_depsgraph_get()
    transform={o:o.evaluated_get(dg).matrix_world.copy() for o in objects}
    for o,b in objects.items():
        p=owners[o]
        basis=transform[o] if p is None else transform[p].inverted_safe()@transform[o]
        samples[o].append((f,basis))
src.frame_set(180)
dg=bpy.context.evaluated_depsgraph_get()
for o in objects:
    p=owners[o]; w=o.evaluated_get(dg).matrix_world.copy()
    samples[o].append((180,w if p is None else p.evaluated_get(dg).matrix_world.inverted_safe()@w))
src.frame_set(154)
dg=bpy.context.evaluated_depsgraph_get()

matmap={}
def material(m):
    if m in matmap:return matmap[m]
    n=bpy.data.materials.new('F11: '+m.name)
    n.use_nodes=True
    target=n.node_tree.nodes.get('Principled BSDF')
    if m.use_nodes and (p:=next((x for x in m.node_tree.nodes if x.type=='BSDF_PRINCIPLED'),None)):
        for key in ('Base Color','Roughness','Metallic','Alpha','Emission Color','Emission Strength'):
            if key in p.inputs and key in target.inputs:target.inputs[key].default_value=p.inputs[key].default_value
    else:target.inputs['Base Color'].default_value=m.diffuse_color
    n.diffuse_color=target.inputs['Base Color'].default_value
    n.use_backface_culling=False
    if target.inputs['Alpha'].default_value<.999:n.surface_render_method='BLENDED'
    matmap[m]=n;return n

# Join only fixed geometry local to each distinct moving pivot, preserving true crease geometry.
batches={}
plant_owners=set()
for q in objects:
    p=q
    while owners[p] is not None:p=owners[p]
    if p.name.startswith('Root point anchored'):plant_owners.add(q)
stock=bpy.data.materials.new('F11: Dyed uncoated paper stock');stock.use_nodes=True
p=stock.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.82
vc=stock.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='Dye'
stock.node_tree.links.new(vc.outputs['Color'],p.inputs['Base Color'])
def make(name,parent,verts,faces,m):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.materials.append(m);d.update()
    o=bpy.data.objects.new(name,d);out.collection.objects.link(o);o.parent=parent;return o
for q,owner in names.items():
    evo=q.evaluated_get(dg); owner_e=owner.evaluated_get(dg); basis=owner_e.matrix_world.inverted_safe()@evo.matrix_world
    if q.type=='MESH' and q.data.shape_keys:
        # Original editable Tiger cutout and both crystal edges per side. Keep a real shape target.
        old=q.data
        a=old.shape_keys.key_blocks
        side_id=q.name[-1]
        tag='SLIT' if 'Canonical cyan slit' in q.name else 'UPPER' if ' TOP ' in q.name else 'LOWER'
        o=make('TIGER_EYE_'+side_id+'_'+tag,objects[owner],[basis@v.co for v in a[0].data],
          [tuple(p.vertices) for p in old.polygons],material(old.materials[0]))
        o.shape_key_add(name='Basis')
        t=o.shape_key_add(name='Closure')
        for k,v in enumerate(a[1].data):t.data[k].co=basis@v.co
        continue
    mesh=evo.to_mesh()
    if not mesh or not mesh.polygons:
        evo.to_mesh_clear();continue
    mesh.calc_loop_triangles()
    for tri in mesh.loop_triangles:
        idx=tri.material_index
        if idx>=len(mesh.materials) or not mesh.materials[idx]:continue
        orig=mesh.materials[idx]
        key=(owner,None if owner in plant_owners else orig)
        verts,faces,colors,seen=batches.setdefault(key,([],[],[],{}))
        color=tuple(material(orig).diffuse_color)
        corners=[]
        for j in tri.vertices:
            co=basis@mesh.vertices[j].co
            index_key=(tuple(round(x,7) for x in co),color if key[1] is None else ())
            i=seen.get(index_key)
            if i is None:
                i=len(verts);seen[index_key]=i;verts.append(co);colors.append(color)
            corners.append(i)
        if len(set(corners))==3:faces.append(tuple(corners))
    evo.to_mesh_clear()
for j,((owner,m),(verts,faces,colors,_)) in enumerate(batches.items()):
    if not faces:continue
    ob=make(f'PAPER_{j:03d}',objects[owner],verts,faces,material(m) if m else stock)
    if m is None:
        attr=ob.data.color_attributes.new(name='Dye',type='FLOAT_COLOR',domain='POINT')
        for i,v in enumerate(attr.data):v.color=colors[i]
        ob.data.color_attributes.active_color=attr
for o,b in objects.items():
    prev=None
    b.rotation_mode='QUATERNION'
    for f,X in samples[o]:
        loc,rot,scale=X.decompose()
        if prev is not None and prev.dot(rot)<0:rot.negate()
        prev=rot.copy()
        b.location=loc;b.rotation_quaternion=rot;b.scale=scale
        # Keep channels on their owning Blender node; do not collapse the story into mesh vertices.
        for k in ('location','rotation_quaternion','scale'):b.keyframe_insert(data_path=k,frame=f)
    for c in b.animation_data.action.fcurves:
        for k in c.keyframe_points:k.interpolation='LINEAR'
bpy.context.window.scene=out
out.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(dst/'palimpsest-f11-challenger.glb'),export_format='GLB',use_active_scene=True,
   export_animations=True,export_animation_mode='SCENE',export_force_sampling=True,export_frame_step=2,
   export_cameras=False,export_lights=False,export_yup=True,export_materials='EXPORT',export_extras=False,
   export_morph=True, export_optimize_animation_size=True)
# Generated batch/morph meshes start at an identity local matrix by construction.
# Blender SCENE sampling can infer nonidentity local transforms on their very
# small folded ancestors. Remove only those synthetic child TRS channels; the
# pivot transforms and Tiger morph targets remain untouched.
glb=dst/'palimpsest-f11-challenger.glb'
raw=glb.read_bytes()
magic,version,_=struct.unpack('<4sII',raw[:12]);json_size=struct.unpack('<I',raw[12:16])[0]
doc=json.loads(raw[20:20+json_size])
static={i for i,n in enumerate(doc['nodes']) if n.get('name','').startswith(('PAPER_','TIGER_EYE_'))}
for i in static:
    for key in ('matrix','translation','rotation','scale'):doc['nodes'][i].pop(key,None)
good=[]
for animation in doc.get('animations',[]):
    channels=[c for c in animation['channels'] if c['target']['node'] not in static]
    if not channels:continue
    used=sorted({c['sampler'] for c in channels})
    animation['samplers']=[animation['samplers'][i] for i in used]
    for c in channels:c['sampler']=used.index(c['sampler'])
    animation['channels']=channels;good.append(animation)
doc['animations']=good
head=json.dumps(doc,separators=(',',':')).encode()
head+=b' '*((-len(head))%4)
tail=raw[20+json_size:]
glb.write_bytes(struct.pack('<4sIII4s',magic,version,20+len(head)+len(tail),len(head),b'JSON')+head+tail)

(dst/'palimpsest-f11-motion.json').write_text(json.dumps(side,separators=(',',':'))+'\n')
print('F11_INVENTORY',json.dumps({'pivots':len(objects),'draws':len(batches)+6,'morphs':6,'selectedSourceObjects':len(names),'motion':179/24}))
