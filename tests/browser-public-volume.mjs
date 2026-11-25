import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';

const origin = process.env.PALIMPSEST_PREVIEW_URL || 'http://127.0.0.1:4173';
const evidence = process.env.PALIMPSEST_BROWSER_EVIDENCE;
const browser = await chromium.launch({
  executablePath: process.env.PALIMPSEST_CHROME_PATH,
  args: ['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'],
});
const pageErrors = [];
const failures = [];
const observed = [];
const image = async (page, name) => {
  if (!evidence) return;
  await mkdir(evidence, {recursive:true});
  await page.screenshot({path:join(evidence,`${name}.png`)});
};
function observe(page) {
  page.on('pageerror', error=>pageErrors.push(error.message));
  page.on('response', response=>{
    const url = new URL(response.url());
    if (url.origin===origin && !url.pathname.endsWith('/favicon.ico') && response.status()>=400) {
      failures.push(`${response.status()} ${url.pathname}`);
    }
  });
}
function waitForSpread(page, folio) {
  return page.waitForFunction(expected=>{
    const stage=document.getElementById('stage');
    return stage.dataset.publicFolio===expected && stage.dataset.pageTurn==='idle';
  },folio,{timeout:18000});
}
function f(number) {return 'F'+String(number).padStart(2,'0');}
function source(folio) {return String(folio<4?folio:folio-1);}
async function turn(page, key, destination) {
  await page.locator('#stage').focus();
  await page.keyboard.press(key);
  await waitForSpread(page,destination);
}
async function checkState(page, expected) {
  const state = await page.locator('#stage').getAttribute('data-misunderstanding');
  assert.deepEqual(JSON.parse(state),expected);
}

async function verifyTestimony() {
  const page=await browser.newPage({viewport:{width:720,height:480},reducedMotion:'reduce'});
  observe(page);
  const stage=page.locator('#stage');
  const announcer=page.locator('#global-announcer');
  try {
    for(const folio of [1,2]){
      await page.goto(origin+'/folio-vnext.html?folio='+folio,{waitUntil:'domcontentloaded'});
      await waitForSpread(page,f(folio));
      await stage.focus();
      if(folio===1){
        await page.keyboard.press('Enter');
        await page.waitForFunction(()=>document.getElementById('stage').dataset.bookPhase==='open');
      }
      for(const key of ['i','m','i']){
        await page.keyboard.press(key);
        assert.doesNotMatch(await announcer.textContent(),/Maker inscription/);
      }
      await page.keyboard.down('w');
      await page.evaluate(async duration=>{
        let last=performance.now();
        let elapsed=0;
        while(elapsed<duration){
          const now=await new Promise(requestAnimationFrame);
          elapsed+=Math.max(0,Math.min(50,now-last));
          last=now;
        }
      },folio===1?960:730);
      await page.keyboard.up('w');
      await page.keyboard.press('i');
      const line=folio===1?'He murdered her.':'NiAlBu still watches her die. Again and again.';
      await page.waitForFunction(expected=>document.getElementById('global-announcer').textContent.includes(expected),
        line,{timeout:7500});
      assert.ok(!(await page.locator('#folio-description').textContent()).includes(line));
      await page.keyboard.press('Escape');
    }
  } finally {
    await page.close();
  }
}

const blank = {eggLanded:false,templeRaised:false,roofLifted:false};
const egg = {...blank,eggLanded:true};
const temple = {...egg,templeRaised:true};
const roof = {...temple,roofLifted:true};
try {
  const page = await browser.newPage({viewport:{width:1100,height:750},reducedMotion:'reduce'});
  observe(page);
  await page.goto(origin+'/?atmosphere-proof=1&background-proof=1',{waitUntil:'domcontentloaded'});
  await page.waitForURL(/folio-vnext\.html\?/);
  await waitForSpread(page,'F01');
  const stage = page.locator('#stage');
  assert.equal(await stage.getAttribute('data-book-phase'),'closed');
  assert.equal(await stage.isVisible(),true);
  assert.equal(await page.locator('meta[name="palimpsest-edition"]').getAttribute('content'),'paper-atmosphere-f13');
  await image(page,'cover');
  const bounds=await stage.boundingBox();
  await page.mouse.click(bounds.x+bounds.width*.655,bounds.y+bounds.height*.475);
  await page.waitForFunction(()=>document.getElementById('stage').dataset.bookPhase==='open');

  const x=bounds.x+bounds.width*.78;
  const y=bounds.y+bounds.height*.61;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x-bounds.width*.045,y,{steps:4});
  assert.equal(await stage.getAttribute('data-page-turn'),'dragging');
  await page.mouse.up();
  await waitForSpread(page,'F01');
  for(let folio=1;folio<=13;folio++){
    await waitForSpread(page,f(folio));
    const expected = folio===4?'great-misunderstanding':source(folio);
    assert.equal(await stage.getAttribute('data-revision-folio'),expected);
    if (folio===4) {
      await checkState(page,blank);
      await image(page,'F04-folded');
      await page.mouse.click(bounds.x+bounds.width*.355,bounds.y+bounds.height*.58);
      await checkState(page,egg);
      await stage.focus();
      await image(page,'F04-egg');
      await page.keyboard.press('b');
      await checkState(page,temple);
      await image(page,'F04-temple');
      await page.keyboard.press('c');
      await checkState(page,roof);
      await image(page,'F04-roof');
    }
    if (folio!==4) {
      await image(page,f(folio));
      await stage.focus();
      for (const slot of ['A','B','C']) {
        const button=page.locator(`[data-mechanism="${slot}"]`);
        assert.equal(await button.isEnabled(),true);
        await page.keyboard.press(slot.toLowerCase());
        assert.equal(await button.getAttribute('aria-pressed'),'true',`${f(folio)} mechanism ${slot}`);
      }
    }
    if(folio===5) assert.match(await page.locator('#folio-title').textContent(),/^F05 .*First Contact/);
    if(folio===13) assert.match(await page.locator('#folio-title').textContent(),/^F13 .*Unfinished Peace/);
    await page.waitForFunction(publicPage=>{
      return JSON.parse(document.getElementById('stage').dataset.atmosphereProof||'{}').publicPage===publicPage;
    },f(folio));
    observed.push(await stage.evaluate(canvas=>({
      page:canvas.dataset.publicFolio, source:canvas.dataset.revisionFolio,
      atmosphere:JSON.parse(canvas.dataset.atmosphereProof).nodes,
      background:!!canvas.dataset.bgProof,
      encore:canvas.dataset.encoreProof?JSON.parse(canvas.dataset.encoreProof).folio:null,
      cast:!!canvas.dataset.castProof,
    })));
    await turn(page,'ArrowRight',folio===13?'coda':f(folio+1));
  }
  assert.equal(await page.locator('#folio-description').textContent(),'Your fate is in our hands.');
  await image(page,'closing-imprint');
  await stage.focus();
  await page.keyboard.press('ArrowRight');
  await waitForSpread(page,'coda');
  for(let folio=13;folio>=1;folio--) await turn(page,'ArrowLeft',f(folio));
  await page.keyboard.press('ArrowLeft');
  await waitForSpread(page,'F01');
  await page.goto(origin+'/folio-vnext.html?folio=4',{waitUntil:'domcontentloaded'});
  await waitForSpread(page,'F04');
  await checkState(page,roof);
  await page.locator('#toggle-panels').click();
  const legacyKey='palimpsest.living.f04-f12.study.v1';
  const legacyBefore=await page.evaluate(key=>sessionStorage.getItem(key),legacyKey);
  assert.ok(legacyBefore);
  await page.locator('#reset-study').click();
  await checkState(page,blank);
  assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),legacyKey),legacyBefore);
  await page.close();
  await verifyTestimony();

  const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  observe(touch);
  await touch.goto(origin+'/folio-vnext.html?folio=4',{waitUntil:'domcontentloaded'});
  await waitForSpread(touch,'F04');
  const touchBounds=await touch.locator('#stage').boundingBox();
  await touch.touchscreen.tap(touchBounds.x+touchBounds.width*.655,touchBounds.y+touchBounds.height*.527);
  await checkState(touch,roof);
  await image(touch,'F04-portrait');
  await touch.close();

  const fallbackBrowser=await chromium.launch({
    executablePath: process.env.PALIMPSEST_CHROME_PATH,
    args:['--disable-webgl','--disable-webgl2'],
  });
  try {
    const fallback=await fallbackBrowser.newPage();
    observe(fallback);
    await fallback.goto(origin+'/folio-vnext.html?folio=4',{waitUntil:'domcontentloaded'});
    await fallback.locator('#misunderstanding-fallback').waitFor({state:'visible'});
    assert.equal(await fallback.locator('#stage').isHidden(),true);
    await fallback.locator('#toggle-panels').click();
    await fallback.locator('[data-mechanism="C"]').click();
    assert.equal(await fallback.locator('#misunderstanding-diagram-soil').isVisible(),true);
    await fallback.locator('#next').click();
    await waitForSpread(fallback,'F05');
    assert.equal(await fallback.locator('#misunderstanding-fallback').isHidden(),true);
    await fallback.locator('#prev').click();
    await fallback.locator('#misunderstanding-fallback').waitFor({state:'visible'});
    assert.equal(await fallback.locator('#misunderstanding-diagram-soil').isVisible(),true);
    await image(fallback,'F04-reading-plate');
    await fallback.goto(origin+'/archive.html',{waitUntil:'domcontentloaded'});
    await fallback.getByRole('button',{name:'Enter Living Folios'}).click();
    const embedded=fallback.frameLocator('iframe[title^="F01–F12 living"]');
    await embedded.locator('#webgl-fallback').waitFor({state:'visible'});
    await embedded.locator('#toggle-panels').click();
    for(let turn=2;turn<=4;turn++){
      await embedded.locator('#next').click();
      await embedded.locator('#stage').locator(`xpath=self::*[@data-revision-folio="${turn}"]`).waitFor({state:'attached'});
    }
    assert.match(await embedded.locator('#folio-title').textContent(),/^F04 .*First Contact/);
    assert.equal(await fallback.getByRole('dialog').locator('nav button').count(),12);
  } finally {await fallbackBrowser.close();}
  console.log(JSON.stringify(observed));
  const original=observed.filter(page=>page.source!=='great-misunderstanding');
  for(const spread of original){
    assert.equal(spread.background,true);
    assert.equal(spread.cast,true);
    const sourceIndex=Number(spread.source);
    assert.equal(spread.encore,sourceIndex);
    const atmosphere=['Atmosphere · bound stock and local bounce'];
    if([5,6,7,9,10].includes(sourceIndex)) atmosphere.push('Atmosphere · war folio '+sourceIndex);
    assert.deepEqual(spread.atmosphere,atmosphere);
  }
  assert.deepEqual(observed.find(page=>page.page==='F04'),{
    page:'F04',source:'great-misunderstanding',background:false,encore:null,cast:false,
    atmosphere:['Atmosphere · bound stock and local bounce'],
  });
  assert.deepEqual(pageErrors,[]);
  assert.deepEqual(failures,[]);
  console.log('PASS: built public sequence and reverse, F04 stages and reload/reset, concealed paths, portrait touch, non-WebGL plate, and twelve-source archive bridge');
} finally {await browser.close();}
