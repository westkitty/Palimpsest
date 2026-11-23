import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as T from 'three';
import {createPaperCastSilhouette} from '../src/vnext/paperCastSilhouette.ts';

test('matte cast follows the evaluated opaque rails and stays on its bounded receiver',()=>{
  const root=new T.Group(),hinge=new T.Group();root.add(hinge);
  const rails=[-1,1].map(x=>{
    const part=new T.Mesh(new T.BoxGeometry(.10,.08,1.4),new T.MeshBasicMaterial());
    part.position.set(x,.12,.70);hinge.add(part);return part;
  });
  const receiver=(x,z)=>.08+x*.013-z*.009;
  const cast=createPaperCastSilhouette(root,rails,{direction:[-1.2,.92],datum:.08,
    receiver,bounds:[-2.70,1.2,-.1,2],color:0x1f1016,opacity:.6});
  const matte=root.children[1].children[0];
  cast.update(0);
  assert.equal(matte.visible,false);
  assert.equal(matte.geometry.drawRange.count,0);
  const extent=()=>{
    const n=matte.geometry.drawRange.count,a=matte.geometry.getAttribute('position');
    const x=[],z=[];
    for(let i=0;i<n;i++){
      const s=a.getX(i), t=a.getZ(i);x.push(s);z.push(t);
      assert.ok(Math.abs(a.getY(i)-receiver(s,t))<.00001);
      assert.ok(s>=-2.70001&&s<=1.20001&&t>=-.10001&&t<=2.00001);
    }
    return [Math.min(...x),Math.max(...z)];
  };
  cast.update(.05);
  const base=extent();
  hinge.rotation.x=-.68;
  cast.update(.85);
  const lifted=extent();
  assert.ok(lifted[0]<base[0]-.8&&lifted[1]>base[1]+.3);
  assert.equal(matte.castShadow,false);assert.equal(matte.material.toneMapped,true);
  cast.update(0);assert.equal(matte.geometry.drawRange.count,0);
  cast.dispose();assert.deepEqual(root.children,[hinge]);
});
