"""Inspect editable states, hinge geometry, and exactly twenty opaque crimson markers."""
import bpy, math, json, re
from mathutils import Vector
from collections import Counter
s=bpy.context.scene;os=bpy.data.objects
def pick(pre):return [o for o in os if o.name.startswith(pre)]
def one(pre):return pick(pre)[0]
def vis(o):return not o.hide_render
arch=pick('Editorial negative-space gate cut ');assert len(arch)==5,len(arch)
assert all(o.type=='MESH' and len(o.data.polygons)==44 and len(o.modifiers)==1 for o in arch)
assert all(not any(abs(v.co.x)<.19 and v.co.z<1.4 for v in o.data.vertices) for o in arch)
leaves=sorted(pick('C physical accordion leaf '),key=lambda a:a.name)
assert len(leaves)==4
bodies=pick('C documented world ');rings=pick('C world ')
assert sorted(int(o.name.split()[3]) for o in bodies)==list(range(1,21))
assert sorted(int(o.name.split()[2]) for o in rings)==list(range(1,21))
for leaf in leaves:
 assert sum(child in bodies for child in leaf.children)==5
 assert sum(child in rings for child in leaf.children)==5
for ring in rings:
 p=ring.data.materials[0].node_tree.nodes['Principled BSDF']
 assert p.inputs['Alpha'].default_value==1 and p.inputs['Transmission Weight'].default_value==0 and p.inputs['Emission Strength'].default_value==0
 ec=Counter(tuple(sorted((f.vertices[i],f.vertices[(i+1)%len(f.vertices)]))) for f in ring.data.polygons for i in range(len(f.vertices)))
 assert set(ec.values())=={2}
 ring.data.calc_loop_triangles()
 volume=sum((ring.data.vertices[t.vertices[0]].co.dot(ring.data.vertices[t.vertices[1]].co.cross(ring.data.vertices[t.vertices[2]].co)))/6 for t in ring.data.loop_triangles)
 assert volume>0,volume
assert len(pick('Pupil-less cyan eye slit'))==2
assert len(pick('Continuous cyan behind the mouth silhouette'))==1
assert len(pick('Codec left-chest cyan sunburst roundel'))==1
assert len(pick('Cyan paper Starsilk diagonal '))==4
assert len(pick('B separated crimson interruption '))==3
out=[]
for f,(op,broke,flat) in [(1,(0,0,0)),(44,(1,0,0)),(88,(1,1,0)),(153,(1,1,1))]:
 s.frame_set(f)
 l=one('A · left gate-shield');r=one('A · right gate-shield')
 d=round(math.degrees(l.rotation_euler[2]),1)
 assert abs(d-(-87.1 if op else -11.5))<.03
 assert math.isclose(l.rotation_euler[2],-r.rotation_euler[2],abs_tol=1e-6)
 assert all(vis(o)==op for o in pick('Cyan paper Starsilk diagonal '))
 assert vis(one('B whole gold circle'))==(not bool(broke))
 assert all(vis(o)==broke for o in pick('B separated crimson interruption '))
 assert all(abs(o.rotation_euler[1])<.001 for o in leaves)==bool(flat)
 assert vis(one('C broad direction legend'))==bool(flat)
 out.append({'frame':f,'cyan_cutaway':bool(op),'broken_assumption':bool(broke),'flat_accordion':bool(flat),'shield_pair_deg':[d,-d]})
joints=[]
for f in [1,103,105,112,119,128,132,140,141,153]:
 s.frame_set(f)
 for child in leaves[1:]:
  a=child.matrix_world.translation.copy()
  b=child.parent.matrix_world@Vector((.875,0,0))
  joints.append((a-b).length)
assert max(joints)<1e-5
assert not s.sequence_editor or not list(s.sequence_editor.sequences_all)
assert not any('marginalia' in o.name.lower() for o in os)
print('F08_VERIFY '+json.dumps({'source_commit':s['source_commit'],'states':out,'portal_graphic_cutouts':len(arch),'crimson_world_markers':len(rings),'ring_shells':'closed, outward-facing, physical and opaque','accordion_joint_samples':len(joints),'max_crease_error':max(joints),'audio_tracks':0,'public_marginalia':0}))
