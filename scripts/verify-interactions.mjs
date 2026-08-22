// Verifies the compare slider with JS on, the <noscript> fallback with JS off,
// and that prefers-reduced-motion disables the gallery fade.
import { chromium } from 'playwright';
import { serve, CHROMIUM } from './lib/serve.mjs';

const { origin, close } = await serve(8093);
const b = await chromium.launch({ executablePath: CHROMIUM });

// --- with JS ---
{
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  await import('node:fs').then(m=>m.mkdirSync('shots',{recursive:true}));
  const page=await ctx.newPage();
  await page.goto(origin + '/',{waitUntil:'load'});
  await page.waitForTimeout(600);
  const hyd = await page.evaluate(()=>{
    const imgs=[...document.querySelectorAll('.compare__frame [data-lazy] img')];
    return imgs.map(i=>({hasSrc:!!i.getAttribute('src'), loaded:i.complete && i.naturalWidth>0, w:i.naturalWidth}));
  });
  console.log('JS ON  — slider images hydrated:', JSON.stringify(hyd));

  const frame=page.locator('[data-compare]');
  await frame.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box=await frame.boundingBox();
  await page.mouse.move(box.x+box.width*0.5, box.y+box.height*0.5);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*0.25, box.y+box.height*0.5,{steps:10});
  await page.mouse.up();
  await page.waitForTimeout(200);
  console.log('JS ON  — drag sets --pos:', await frame.evaluate(e=>e.style.getPropertyValue('--pos')));
  console.log('JS ON  — noscript fallback rendered:', await page.locator('.compare__frame--static').count() ? 'present in DOM (inert)' : 'not rendered');
  await page.screenshot({path:'shots/verify-slider-js.png', clip:{x:box.x,y:box.y,width:box.width,height:box.height}});
  await ctx.close();
}

// --- without JS ---
{
  const ctx=await b.newContext({viewport:{width:1440,height:900}, javaScriptEnabled:false});
  const page=await ctx.newPage();
  await page.goto(origin + '/',{waitUntil:'load'});
  await page.waitForTimeout(1200);
  const st = page.locator('.compare__frame--static');
  console.log('JS OFF — static fallback visible:', await st.isVisible());
  const imgs = await page.evaluate(()=>[...document.querySelectorAll('.compare__frame--static img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,w:i.naturalWidth})));
  console.log('JS OFF — fallback images loaded:', JSON.stringify(imgs));
  console.log('JS OFF — gallery visible (reveal not hiding):', await page.locator('.gallery figure').first().isVisible());
  await st.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await st.screenshot({path:'shots/verify-slider-nojs.png'});
  await ctx.close();
}

// --- reduced motion ---
{
  const ctx=await b.newContext({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
  const page=await ctx.newPage();
  await page.goto(origin + '/',{waitUntil:'load'});
  await page.waitForTimeout(500);
  const r = await page.evaluate(()=>{
    const f=document.querySelector('.gallery figure');
    return {opacity:getComputedStyle(f).opacity, transition:getComputedStyle(f).transitionDuration};
  });
  console.log('REDUCED MOTION — gallery figure:', JSON.stringify(r));
  await ctx.close();
}
await b.close(); close();
