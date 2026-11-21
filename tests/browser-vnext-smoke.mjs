import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin=process.env.PALIMPSEST_PREVIEW_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,executablePath:process.env.PALIMPSEST_CHROME_PATH,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
let archiveBrowser=null;
const page=await browser.newPage({viewport:{width:1360,height:840},reducedMotion:'reduce'});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
try {
  let ready=false;
  for(let i=0;i<25;i++) {
    try {const res=await page.goto(origin+'/folio-vnext.html',{waitUntil:'domcontentloaded',timeout:5000}); if(res?.ok()){ready=true;break;}} catch{}
    await wait(500);
  }
  assert.ok(ready,'Built review route must serve HTTP success');
  await page.waitForTimeout(1100);
  const canvasShown=await page.locator('#stage').evaluate(e=>!e.hidden);
  // An actual WebGL scene is required for this optional signature acceptance pass.
  assert.ok(canvasShown,'WebGL must initialize in software renderer for browser smoke');
  assert.equal(await page.locator('[data-panel-id]').count(),4,'four movable instruments still exist');
  assert.equal(await page.locator('#window-layer').getAttribute('class'),'panels-hidden','book-only opening hides all four panels');
  assert.equal(await page.locator('#toggle-panels').getAttribute('aria-expanded'),'false','chevron starts collapsed');
  assert.equal(await page.locator('#toggle-panels').isVisible(),true,'bottom reveal stays available');
  assert.equal(await page.locator('#reset-panels').isVisible(),false,'secondary controls withheld on entry');
  assert.equal(await page.locator('#archival-edition').isVisible(),false,'archive link withheld on entry');
  await page.locator('#toggle-panels').click();
  assert.equal(await page.locator('#toggle-panels').getAttribute('aria-expanded'),'true','chevron expands controls');
  assert.equal(await page.locator('[data-panel-id="folio"]').isVisible(),true,'all existing panels can be recovered');
  const title=page.locator('#folio-title');
  assert.match(await title.textContent(),/Before the Stars/);
  assert.equal(await page.locator('#stage').getAttribute('data-authored-sculptures'),'3','F01 must load the three existing character sculptures');
  const handle=page.locator('[data-panel-id="folio"] [data-panel-handle]');
  const boxBefore=await page.locator('[data-panel-id="folio"]').boundingBox();
  await handle.focus(); await page.keyboard.press('ArrowRight');
  const boxAfter=await page.locator('[data-panel-id="folio"]').boundingBox();
  assert.ok(boxAfter.x>boxBefore.x,'Keyboard reposition works independently from orbit');
  await page.locator('#next').click();
  assert.match(await title.textContent(),/All Unfolds/);
  assert.equal(await page.locator('#stage').getAttribute('data-authored-sculptures'),'1','F02 must load the original Digital Geode sculpture');
  const witness=page.locator('#witness');
  assert.equal(await witness.isHidden(),true,'scale passage withheld before stage C');
  await page.locator('[data-mechanism="A"]').click();
  assert.equal(await witness.isHidden(),true,'A alone cannot trigger signature');
  await page.locator('[data-mechanism="B"]').click();
  assert.equal(await witness.isHidden(),true,'B alone cannot trigger signature');
  await page.locator('[data-mechanism="C"]').click();
  assert.equal(await witness.isVisible(),true,'C opens explicit scale control');
  await witness.click();
  assert.equal(await witness.getAttribute('aria-pressed'),'true','witness toggle engaged');
  await page.keyboard.press('Escape');
  assert.equal(await witness.getAttribute('aria-pressed'),'false','Escape restores reader to book');
  await page.locator('#next').click();
  assert.match(await title.textContent(),/Notebook Program/);
  assert.equal(await page.locator('#stage').getAttribute('data-authored-sculptures'),'0','F03 must not introduce character or Drakken sculptures ahead of canon');
  await page.locator('[data-mechanism="C"]').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/Variation: 1/);
  await page.locator('[data-mechanism="B"]').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/Ink register: 0110/,'second family has distinct printed ink identity');
  await page.locator('#prev').click();
  assert.match(await page.locator('#folio-title').textContent(),/All Unfolds/);
  assert.equal(await page.locator('#witness').isVisible(),true,'three stellar stages survive a folio revisit');
  await page.locator('#prev').click();
  await page.locator('[data-mechanism="A"]').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/Physical folds: opened/);
  await page.locator('#next').click();
  await page.locator('#next').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/Variation: 1/,'F03 generation survives page round trip');
  assert.match(await page.locator('#mechanism-status').textContent(),/Ink register: 0110/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForTimeout(950);
  assert.equal(await page.locator('#window-layer').getAttribute('class'),'panels-hidden','reload still opens on clean book even with saved panel positions');
  await page.locator('#toggle-panels').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/Physical folds: opened/,'the separate study state survives a browser reload');
  await page.locator('#next').click();
  assert.equal(await page.locator('#witness').isVisible(),true,'F02 stage survives reload');
  await page.locator('#next').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/Ink register: 0110/);
  assert.match(await page.locator('#mechanism-status').textContent(),/Variation: 1/);
  await page.locator('#reset-study').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/Ink register: 1001/,'reset restores first template');
  assert.match(await page.locator('#mechanism-status').textContent(),/Variation: 0/,'reset clears generation');
  await page.locator('#prev').click();
  assert.equal(await page.locator('#witness').isHidden(),true,'reset clears F02 stellar progression');
  await page.locator('#prev').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/Physical folds: closed/,'reset clears F01 folds');

  await page.locator('#toggle-panels').click();
  assert.equal(await page.locator('#window-layer').getAttribute('class'),'panels-hidden');
  await page.locator('#toggle-panels').click();
  await page.locator('#reset-panels').click();
  assert.equal(await page.locator('#window-layer').getAttribute('class'),'');
  // Isolate independent routes: a completed WebGL study should not keep an old
  // document's GPU work alive while Chromium boots the archival reader.
  // Every later spread must be a physical 3D scene within the SAME living
  // renderer, with source-authored A/B/C mechanisms rather than an archive jump.
  // Reset study returns to F01; advance to F03 before the nine-page sweep.
  await page.locator('#next').click();
  await page.locator('#next').click();
  const chapters=[
    /First Contact/,/Standard of Conquest/,/Long Attrition/,
    /Ruby Eclipse/,/Aureal Gate/,/Heliocide/,
    /Siege Wall/,/First Dirt/,/Unfinished Peace/,
  ];
  for(let i=0;i<chapters.length;i++){
    await page.locator('#next').click();
    assert.match(await page.locator('#folio-title').textContent(),chapters[i]);
    assert.equal(await page.locator('#stage').getAttribute('data-source-authored-scene'),'true',
      `F${String(i+4).padStart(2,'0')} uses source-authored 3D world`);
    assert.match(await page.locator('#folio-progress').textContent(),new RegExp(`F${String(i+4).padStart(2,'0')} / F12`));
    await page.locator('[data-mechanism="A"]').click();
    assert.match(await page.locator('#mechanism-status').textContent(),/A: (operated|fixed)/);
    if(i===5){
      assert.equal(await page.locator('[data-mechanism="A"]').isDisabled(),true,
        'F09 irreversible filament remains locked');
    }
  }
  assert.equal(await page.locator('#next').isDisabled(),true,'F12 is the final living leaf');
  for(let i=0;i<6;i++)await page.locator('#prev').click();
  assert.match(await page.locator('#folio-title').textContent(),/Long Attrition/);
  await page.locator('[data-mechanism="B"]').click();
  assert.match(await page.locator('#mechanism-status').textContent(),/B: operated/);
  await page.reload({waitUntil:'domcontentloaded'});
  // A fresh page defaults to F01 and starts without UI; reveal controls before navigating.
  assert.equal(await page.locator('#toggle-panels').getAttribute('aria-expanded'),'false');
  await page.locator('#toggle-panels').click();
  for(let i=0;i<5;i++)await page.locator('#next').click();
  assert.match(await page.locator('#folio-title').textContent(),/Long Attrition/);
  assert.match(await page.locator('#mechanism-status').textContent(),/B: operated/);
  await page.close();
  // Chrome's software WebGL backend can retain a busy GPU context across tabs.
  // The archive route must be tested in a clean browser process so the long
  // 12-scene render is not mistaken for an archival navigation failure.
  await browser.close();
  // Check the PUBLIC default entry, not just the direct study route.
  const landingBrowser=await chromium.launch({
    headless:true,
    executablePath:process.env.PALIMPSEST_CHROME_PATH,
    args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'],
  });
  try {
    const landing=await landingBrowser.newPage({viewport:{width:1360,height:840},reducedMotion:'reduce'});
    await landing.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await landing.waitForURL('**/folio-vnext.html',{timeout:12000});
    assert.equal(await landing.locator('#window-layer').getAttribute('class'),'panels-hidden','homepage lands directly on Living Folios without instruments');
    assert.equal(await landing.locator('#toggle-panels').isVisible(),true,'homepage exposes just the bottom chevron');
    assert.equal(await landing.locator('[data-panel-id="folio"]').isVisible(),false,'no floating UI overlays book');
    await landing.locator('#toggle-panels').click();
    assert.equal(await landing.locator('#archival-edition').isVisible(),true,'expanded menu retains explicit archive access');
    await landing.locator('#toggle-panels').click();
    await landing.setViewportSize({width:390,height:844});
    assert.equal(await landing.locator('[data-panel-id="folio"]').isVisible(),false,'mobile also arrives on the unobstructed book');
    const mobileChevron=await landing.locator('#toggle-panels').boundingBox();
    assert.ok(mobileChevron && mobileChevron.x>=0 && mobileChevron.x+mobileChevron.width<=390,
      'chevron stays within narrow mobile viewport');
    await landing.locator('#toggle-panels').click();
    assert.equal(await landing.locator('#prev').isVisible(),true,'mobile can reveal page navigation');
    assert.equal(await landing.locator('#archival-edition').isVisible(),true,'archive still reachable on mobile');
  } finally {await landingBrowser.close();}
  archiveBrowser=await chromium.launch({
    headless:true,
    executablePath:process.env.PALIMPSEST_CHROME_PATH,
    // The historical edition has a full non-WebGL reading path. Test the
    // archive counterpart there to avoid software-GPU stalls from testing
    // its unrelated AtlasEngine on top of the 12-page sculptural journey.
    args:['--disable-webgl'],
  });
  const archivePage=await archiveBrowser.newPage({viewport:{width:1360,height:840},reducedMotion:'reduce'});
  archivePage.on('pageerror',e=>pageErrors.push(String(e)));
  const home=await archivePage.goto(origin+'/archive.html',{waitUntil:'domcontentloaded'});
  assert.ok(home?.ok(),'Original twelve-folio route remains available');
  // The same volume now opens the source-authored opening folios without a new tab.
  const livingEntry=archivePage.getByRole('button',{name:'Enter Living Folios'});
  try { await livingEntry.waitFor({state:'visible',timeout:10000}); } catch (error) {
    console.error('LIVING_ENTRY_DEBUG', JSON.stringify({
      url:archivePage.url(),
      pageErrors,
      documentTitle:await archivePage.title(),
      bodyText:(await archivePage.locator('body').innerText().catch(()=>'' )).slice(0,2800),
      renderedButtons:await archivePage.locator('button').allTextContents(),
      reactRoot:(await archivePage.locator('#root').innerHTML().catch(()=>'' )).slice(0,1200),
    },null,2));
    throw error;
  }
  await livingEntry.click();
  const joined=archivePage.getByRole('dialog',{name:'PALIMPSEST integrated twelve-folio volume'});
  await joined.waitFor({state:'visible',timeout:10000});
  const embedded=archivePage.frameLocator('iframe[title^="F01–F12 living"]');
  // Archive Chromium intentionally disables WebGL; its embedded Living Folios
  // are expected to present the source-grounded illustrated reading fallback.
  await embedded.locator('#webgl-fallback').waitFor({state:'visible',timeout:12000});
  assert.equal(await embedded.locator('#stage').isHidden(),true,'non-WebGL fallback never leaves a blank canvas');
  await archivePage.waitForTimeout(600);
  assert.equal(await embedded.locator('#toggle-panels').getAttribute('aria-expanded'),'false','embedded Living Folios also start with unobstructed book');
  await embedded.locator('#toggle-panels').click();
  assert.equal(await embedded.locator('#stage').getAttribute('data-authored-sculptures'),'3','unified opening uses original three figures');
  assert.equal(await joined.locator('nav button').count(),12,'one twelve-folio navigation rail');
  await joined.getByRole('button',{name:'Folio 02, living edition'}).click();
  await archivePage.waitForTimeout(400);
  assert.match(await embedded.locator('#folio-title').textContent(),/All Unfolds/);
  assert.equal(await embedded.locator('#stage').getAttribute('data-authored-sculptures'),'1','unified F02 reuses Geode');
  await joined.getByRole('button',{name:'Folio 03, living edition'}).click();
  await archivePage.waitForTimeout(400);
  assert.match(await embedded.locator('#folio-title').textContent(),/Notebook Program/);
  assert.equal(await embedded.locator('#stage').getAttribute('data-authored-sculptures'),'0','no early Drakken');
  await embedded.locator('#next').click();
  assert.match(await embedded.locator('#folio-title').textContent(),/First Contact/);
  assert.equal(await joined.isVisible(),true,'F03 continues INSIDE the same living book');
  await joined.getByRole('button',{name:'Folio 12, living edition'}).click();
  await embedded.locator('#folio-title').filter({hasText:'Unfinished Peace'}).waitFor({state:'visible',timeout:12000});
  assert.match(await embedded.locator('#folio-title').textContent(),/Unfinished Peace/);
  await joined.getByRole('button',{name:'Archival counterpart'}).click();
  await joined.waitFor({state:'hidden',timeout:12000});
  await archivePage.locator('header h1').first().filter({hasText:'F12'}).waitFor({state:'visible',timeout:15000});
  assert.match(await archivePage.locator('header h1').first().textContent(),/F12/,
    'explicit archival counterpart opens at matching folio, never automatically');
  const resumeEntry=archivePage.getByRole('button',{name:'Living Folios'});
  await resumeEntry.waitFor({state:'visible'});
  await resumeEntry.click();
  await joined.waitFor({state:'visible'});
  assert.equal(await embedded.locator('#toggle-panels').getAttribute('aria-expanded'),'false',
    're-entering living volume again reveals only the book by default');
  await embedded.locator('#toggle-panels').click();
  await embedded.locator('#folio-title').filter({hasText:'Unfinished Peace'}).waitFor({state:'visible',timeout:15000});
  assert.match(await embedded.locator('#folio-title').textContent(),/Unfinished Peace/,
    'living volume resumes at the archivally selected folio');
  await joined.getByRole('button',{name:'Return to the archival reader'}).click();
  await joined.waitFor({state:'hidden'});
  assert.match(await archivePage.locator('header h1').first().textContent(),/F12/,'return preserves archival position');

  assert.equal(pageErrors.length,0,`no uncaught browser exceptions: ${pageErrors.join('; ')}`);
  console.log('PASS: all 12 living 3D folios, authored A/B/C scenes, state continuity, modal navigation, archival counterpart and preserved reader');
} finally {await archiveBrowser?.close();await browser.close();}
