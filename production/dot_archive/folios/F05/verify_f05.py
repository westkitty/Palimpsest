"""Fresh-open geometry and timeline verification for the F05 review candidate."""
import bpy, math, json
from collections import Counter
from mathutils import Vector
s=bpy.context.scene;o=bpy.data.objects
def one(p):return next(q for q in o if q.name.startswith(p))
visible=lambda x:not x.hide_render
band=one('A · PHYSICAL')
before=one('Fallenstar Prime · living surface')
after=one('Fallenstar Prime · after conquest')
parts=sorted([q for q in o if q.name.startswith('Documented material passage marker ')],key=lambda obj:obj.name)
aps=sorted([q for q in o if q.name.startswith('B aperture ')],key=lambda obj:obj.name)
assert len(parts)==len(aps)==4
counts=Counter(tuple(sorted((f.vertices[i],f.vertices[(i+1)%len(f.vertices)]))) for f in band.data.polygons for i in range(len(f.vertices)))
assert min(counts.values())==max(counts.values())==2
for m in band.data.materials:
 p=m.node_tree.nodes['Principled BSDF']
 assert p.inputs['Alpha'].default_value==1 and p.inputs['Transmission Weight'].default_value==0 and p.inputs['Emission Strength'].default_value==0
angles=[];states=[]
for f,N in [(1,0),(38,0),(65,1),(85,2),(105,3),(126,4),(159,4)]:
 s.frame_set(f)
 assert visible(before)==(f==1) and visible(after)==(f!=1) and visible(band)==(f!=1)
 visible_seq=[visible(p) for p in parts];assert visible_seq==[i<N for i in range(4)],(f,visible_seq)
 fold_seq=[round(math.degrees(p.rotation_euler[0])) for p in aps]
 assert fold_seq==[0 if i<N else -80 for i in range(4)],(f,fold_seq)
 left=one('B · left slotted');right=one('B · right slotted')
 angle=round(math.degrees(left.rotation_euler[2]));assert math.isclose(right.rotation_euler[2],-left.rotation_euler[2],abs_tol=1e-7)
 assert angle==(-14 if f<60 else -93)
 ca=one('C · attributed quotation');cb=one('C · archive record')
 assert round(math.degrees(ca.rotation_euler[0]))==round(math.degrees(cb.rotation_euler[0]))==(-26 if f>=159 else -81)
 states.append({'frame':f,'ring_visible':visible(band),'staged_markers':visible_seq,'aperture_angles_deg':fold_seq,'outer_door_angles_deg':(angle,-angle)})
# Relate animated door geometry to fixed pin origins, and each child-return pin to the same joint through every sampled frame.
hinges=[]
for f in [1,23,42,47,53,60,65,85,105,126,143,159]:
 s.frame_set(f)
 for parent in [q for q in o if q.name.startswith(('B · left slotted','B · right slotted'))]:
  ext=next(q for q in parent.children if q.name.startswith('B · coupled bi-fold'))
  pin=next(q for q in parent.children if q.name.startswith('Door second fold pin'))
  a=ext.matrix_world.translation.copy();b=pin.matrix_world@Vector((0,0,-pin.location.z))
  hinges.append((a-b).length)
assert max(hinges)<1e-5
for prefix,N in [('044 dorsal furnace silo',4),('044 reservoir flask',6),('044 rear crawler support',4),('029 splayed bronze gantry leg',4),('029 vertical pressure cage rib',6),('029 cyan containment ring',3)]:
 assert len([q for q in o if q.name.startswith(prefix)])==N,(prefix,N)
assert one('C documentary line 0.0').data.body=='"Your sky is built from your dead."'
assert one('C exact attribution title 0').data.body=='DRAKKEN DOCTRINAL INSCRIPTION'
assert one('C exact attribution title 1').data.body=='FACTUAL RECORD / YEAR 3'
assert not any('marginalia' in q.name.lower() for q in o)
assert not s.sequence_editor or not len(s.sequence_editor.sequences_all)
print('F05_VERIFY '+json.dumps({'source_commit':s['source_commit'],'states':states,'orbital_ring_mesh':'closed opaque two-manifold (every edge shared by two faces), no emission or transparency','physical_bi_fold_joint_samples':len(hinges),'max_joint_error':max(hinges),'source_DRAXIS_counts':'verified','quote_record_separation':'verified','audio_tracks':0,'public_marginalia':0}))
