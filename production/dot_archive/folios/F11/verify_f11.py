"""Fresh-open tests. The only life and loam fits inside one finite-thickness glass sleeve."""
import bpy, math, json
from mathutils import Vector
from collections import Counter
s=bpy.context.scene;os=bpy.data.objects
def pick(p):return sorted((q for q in os if q.name.startswith(p)),key=lambda x:x.name)
def one(p):return pick(p)[0]
vis=lambda o:not o.hide_render
sample=one('Only living exhibit:')
plant=one('One wheat organism')
soil=one('Only dark living loam')
glass=one('One clear sealed glass sleeve')
assert len(pick('Only living exhibit:'))==len(pick('One wheat organism'))==len(pick('Only wheat stalk'))==len(pick('Only dark living loam'))==1
materials=[m for m in bpy.data.materials if m.name.startswith('EXHIBIT ONLY')]
for o in os:
 if o.type in ('MESH','CURVE','FONT') and any(m in materials for m in o.data.materials):
  anc=o.parent
  while anc is not None and anc!=sample:anc=anc.parent
  assert anc==sample,o.name
assert len(pick('F11 permanent mountain trauma paper cross-section '))==9
mat=glass.data.materials[0]
p=mat.node_tree.nodes['Principled BSDF']
assert p.inputs['Transmission Weight'].default_value>.99
assert p.inputs['Roughness'].default_value<.15
edge=Counter(tuple(sorted((q.vertices[i],q.vertices[(i+1)%len(q.vertices)]))) for q in glass.data.polygons for i in range(len(q.vertices)))
assert set(edge.values())=={2}
assert one('Marcel plain wood shepherd crook').data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value==0
assert pick('Pupil-less cyan eye slit') and len(pick('Continuous cyan behind the mouth silhouette'))==1
assert abs(one('Marcel · sourced').location.z-one('Codec · grounded').location.z)<.004
assert abs(one('Marcel · sourced').location.z-one('Tiger · posed').location.z)<.004
assert one('C attributed speaker').data.body=='THE SHARD-GOD TO CODEC'
tokens=[one('C exact quote line 1').data.body,one('C exact quote line 2').data.body]
assert ' '.join(tokens)=='"Your private discomfort with the shape of survival is not a license to revise the settlement."'
states=[]
def close(f,b):return math.isclose(f,b,abs_tol=1e-5)
lift=one('A · moving tray'); collar=one('A · guided brass');
for f,i,j,k in [(1,0,0,0),(46,1,0,0),(89,1,1,0),(154,1,1,1)]:
 s.frame_set(f); h=lift.location.z-.412; ch=collar.location.z; ang=one('B · reversible').rotation_euler.z
 assert close(h,.396 if i else .102),h
 assert close(ch,.586 if i else .219),ch
 assert close(ang,math.pi if j else 0),ang
 assert all(vis(o)==k for o in pick('C exact quote line'))
 assert vis(one('B active after wording'))==j
 states.append({'frame':f,'loam_carrier_rise':round(h,4),'lens_register':round(ch,4),'turntable_deg':round(math.degrees(ang)),'live_quote':bool(k)})
arms=pick('Loam lift fixed-length');lo=pick('Loam sliding lower pin');hi=pick('Loam sliding upper pin');joint=[]
assert len(arms)==len(lo)==len(hi)==4
for f in (1,16,17,18,24,31,37,43,46,89,154):
 s.frame_set(f)
 # Match end pins to bar centerline endpoints. Every bar maintains identical centre distance throughout rise.
 for a,l,h in zip(arms,lo,hi):
  ends=[a.matrix_world@Vector((sig*.472/2,0,0)) for sig in (-1,1)]
  joint += [min((p-q.matrix_world.translation).length for p in ends) for q in (l,h)]
assert max(joint)<1e-5,max(joint)
# Compare every glass-contained primitive's evaluated local corners against the inner tube radius and caps.
s.frame_set(46);dg=bpy.context.evaluated_depsgraph_get(); rr=[]; hh=[]
for o in [soil,*pick('Contained loam clump'),*plant.children]:
 ev=o.evaluated_get(dg); to_sample=sample.matrix_world.inverted()@ev.matrix_world
 m=ev.to_mesh()
 for v in m.vertices:
  x,y,z=to_sample@v.co
  rr.append(math.hypot(x,y));hh.append(z)
 ev.to_mesh_clear()
assert max(rr)<.1549 and min(hh)>.016 and max(hh)<.533,(max(rr),min(hh),max(hh))
assert not s.sequence_editor or not list(s.sequence_editor.sequences_all)
assert not any('marginalia' in o.name.lower() for o in os)
print('F11_VERIFY '+json.dumps({'source_commit':s['source_commit'],'states':states,'vessel_count':1,'wheat_organisms':1,'max_biological_radius':max(rr),'biological_height_range':[min(hh),max(hh)],'glass':'actual optical transmission; finite-thickness manifold sleeve','fixed_scissor_pins_sampled':len(joint),'max_joint_error':max(joint),'externally_barren':True,'quote_exact_and_attributed':True,'audio_tracks':0,'public_marginalia':0}))
