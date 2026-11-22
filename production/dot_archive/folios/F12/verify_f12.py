import bpy, json, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view
S=bpy.context.scene; O=bpy.data.objects
leaf=O['C single physical archival cardstock leaf']
pivot=O['C · archival leaf crease pivot']
pin=O['C bonded stationary hinge pin']
wide=O['01 / Matched review camera']
assert leaf.parent is pivot
assert O['Exact closing slogan'].data.body=='Your fate is in our hands.'
assert O['Public archive heading'].data.body=='SYRIN 4 GENOCIDE RECORD'
assert O['Archive recorded status KAIL'].data.body=='LAST KNOWN SURVIVING INITIATE'
assert O['Do not infer an exact count or day'].data.body=='EXACT DATE AND CASUALTY COUNT UNRECORDED'
assert not any(o.type=='SPEAKER' for o in O)
assert not any(i.source=='FILE' for i in bpy.data.images)
assert S['source_commit']=='41dddee6383d94e8ce0f68303a506cd9290225ee'
pinned=(Vector((.48,1.07,.377)),Vector((3.52,1.07,.377)))
testpoints=[
 ('heading',(2,.593,.363)),('syrin4',(1.24,.184,.366)),
 ('kail',(1.26,-.30,.366)),('closure',(2,-1.371,.375))
]
max_error=0;last_angle=0;states=[]
def occluded(f):
 S.frame_set(f);bpy.context.view_layer.update()
 e=bpy.context.evaluated_depsgraph_get();bvh=BVHTree.FromObject(leaf,e)
 conv=leaf.matrix_world.inverted();eye=wide.matrix_world.to_quaternion()@Vector((0,0,1))
 out={}
 for name,point in testpoints:
  p=Vector(point); origin=conv@(p+eye*15); dest=conv@p
  loc,normal,index,d=bvh.ray_cast(origin,(dest-origin).normalized(),(dest-origin).length)
  out[name]=loc is not None
 return out
for f in range(1,85):
 S.frame_set(f);bpy.context.view_layer.update()
 a=pivot.rotation_euler.x
 assert a<=last_angle+1e-6,f;last_angle=a
 pp=(pivot.matrix_world@Vector((-1.52,0,0)),pivot.matrix_world@Vector((1.52,0,0)))
 max_error=max(max_error,*[(x-y).length for x,y in zip(pp,pinned)])
 if f in (1,25,50,67,84):states.append(dict(frame=f,angle=round(math.degrees(a),2)))
assert max_error<1e-5,max_error
assert occluded(1)=={n:True for n,_ in testpoints},occluded(1)
assert occluded(67)=={n:False for n,_ in testpoints},occluded(67)
assert abs(last_angle+math.radians(105))<1e-6
S.frame_set(67);bpy.context.view_layer.update()
back_title=O['Reverse-side printed title'].matrix_world
center=world_to_camera_view(S,wide,back_title@Vector((0,0,0)))
upright=world_to_camera_view(S,wide,back_title@Vector((0,.2,0)))
assert upright.y>center.y,(center,upright)
print("F12_VERIFY "+json.dumps(dict(pinned_source=S['source_commit'],frames_checked=84,maximum_hinge_pin_error=max_error,states=states,closed_cover_occludes_record=occluded(1),open_cover_occludes_record=occluded(67),inside_title_upright=True,closing_exact=O['Exact closing slogan'].data.body,external_images=0,speakers=0)))
