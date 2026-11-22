import bpy, math
s=bpy.context.scene
o=bpy.data.objects
w=o['Notebook • rotating cardstock wheel']
left=o['Western world panel • driven by Notebook wheel']
right=o['Eastern world panel • driven by Notebook wheel']
rack=o['Die follower • visible proof of wheel linkage']
stripes=[p for p in o if p.name.startswith('B • added folded tectonic band')]
assert len(stripes)==4
for f in [1,21,32,54,64,94,124,138]:
 s.frame_set(f)
 dg=bpy.context.evaluated_depsgraph_get()
 d,l,r,x=(w.evaluated_get(dg).rotation_euler.z,left.evaluated_get(dg).rotation_euler.y,
 right.evaluated_get(dg).rotation_euler.y,rack.evaluated_get(dg).location.x)
 e=-max(0,1-abs(-d-.54)/.27)*.62-max(0,min(1,(-d-.81)/.52))*1.10
 assert math.isclose(l,-.62*e,abs_tol=1e-5) and math.isclose(r,.93*e,abs_tol=1e-5)
 assert math.isclose(x,.78+.14*d,abs_tol=1e-5)
 assert all(p.evaluated_get(dg).hide_render==(d>-.81) for p in stripes)
 if f==54: assert abs(d+.54)<1e-5 and abs(r)>.50
 if f==94: assert abs(d+1.33)<1e-5 and abs(r)>.95
 if f in [1,21,32,124,138]: assert abs(r)<1e-5
 print(f, 'wheel',round(d,3),'left',round(l,3),'right',round(r,3),'follower',round(x,3))
print('PASS: both detents and reverse, crease pivots, follower, and alt paper print')
