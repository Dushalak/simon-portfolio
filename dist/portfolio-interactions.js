(() => {
  const fine=matchMedia('(min-width:721px) and (hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
  const events=new AbortController(),dialog=document.querySelector('.case-dialog'),board=document.querySelector('.about-board');
  const clamp=v=>Math.max(0,Math.min(1,v)),nearRect=(x,y,r)=>Math.hypot(Math.max(r.left-x,0,x-r.right),Math.max(r.top-y,0,y-r.bottom));
  const layer=document.createElement('div');layer.className='portfolio-pointer-layer';layer.setAttribute('aria-hidden','true');
  const glow=document.createElement('div');glow.className='portfolio-pointer-light';
  const position=document.createElement('div');position.className='project-view-position';
  const bubble=document.createElement('div');bubble.className='project-view-bubble';bubble.innerHTML='<span>View</span><span>↗</span>';position.append(bubble);layer.append(glow,position);document.body.append(layer);
  // A manual, non-interactive top-layer overlay also covers native case dialogs.
  const topLayer=Boolean(layer.showPopover);if(topLayer)layer.setAttribute('popover','manual');
  function surface(){
    hideView(true);
    if(topLayer){if(layer.matches(':popover-open'))layer.hidePopover();if(fine.matches&&!reduce.matches)layer.showPopover();}
    else(dialog.open?dialog:document.body).append(layer);
    request();
  }
  let pointer={x:innerWidth/2,y:innerHeight/2,inside:false},gx=pointer.x,gy=pointer.y,bx=gx,by=gy,glowOpacity=0;
  let frame=0,last=0,currentCard=null,dirty=true;
  const typography=new Map();
  function prepare(title){
    if(!title||!fine.matches||reduce.matches)return;
    if(typography.has(title)&&title.querySelector('.proximity-cell'))return;
    const text=title.textContent;title.setAttribute('aria-label',text);
    const roots=title.querySelectorAll('.projects-heading-word').length?[...title.querySelectorAll('.projects-heading-word')]:[title];
    const cells=[],originals=roots.map(root=>({root,html:root.innerHTML}));
    const about=Boolean(title.closest('.about-board'));
    roots.forEach(root=>{
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
      while(walker.nextNode())if(walker.currentNode.textContent.trim())nodes.push(walker.currentNode);
      nodes.forEach(textNode=>{
        const source=textNode.textContent,parent=textNode.parentElement,style=getComputedStyle(parent);
        const fontSize=parseFloat(style.fontSize),range=document.createRange();
        let scale=1;
        for(let ancestor=parent;ancestor;ancestor=ancestor.parentElement){
          const transform=getComputedStyle(ancestor).transform;
          if(transform!=='none'){const matrix=new DOMMatrixReadOnly(transform);scale*=Math.hypot(matrix.a,matrix.b)||1;}
        }
        const widths=[];let offset=0;
        for(const char of Array.from(source)){
          range.setStart(textNode,offset);range.setEnd(textNode,offset+char.length);
          widths.push(range.getBoundingClientRect().width/fontSize/scale);offset+=char.length;
        }
        const fragment=document.createDocumentFragment();let word=null,index=0;
        for(const char of Array.from(source)){
          if(/\s/.test(char)){word=null;fragment.append(document.createTextNode(char));index++;continue;}
          const cjk=/[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]/u.test(char);
          const closing=about&&/[、。，；：？！）」』】》〉…]/u.test(char);
          if(closing&&fragment.lastChild?.nodeType===1)word=fragment.lastChild;
          if(!word||about&&cjk&&!closing){word=document.createElement('span');word.className='proximity-word';word.setAttribute('aria-hidden','true');fragment.append(word);}
          const cell=document.createElement('span'),glyph=document.createElement('span');
          cell.className='proximity-cell';glyph.className='proximity-glyph';glyph.textContent=char;
          if(!title.matches('.about-script'))cell.style.width=widths[index]+'em';index++;
          cell.append(glyph);word.append(cell);cells.push({cell,value:0});if(about&&cjk)word=null;
        }
        if(title.matches('.about-script')){
          const line=document.createElement('span');line.className='proximity-script-line';line.append(fragment);textNode.replaceWith(line);
        }else textNode.replaceWith(fragment);
      });
    });
    typography.set(title,{title,cells,originals});dirty=true;request();
  }
  const aboutText='#about-title,.about-script,.about-greeting p,.about-biography,.about-work-title,.about-work-row>*,.about-work-description';
  // The complete About left column and only the previously selected headings elsewhere.
  function restoreTypography(){typography.forEach(entry=>entry.originals.forEach(({root,html})=>root.innerHTML=html));typography.clear();}
  function typographyMode(){
    restoreTypography();
    if(fine.matches&&!reduce.matches){
      // Keep the hero's animated reveal wrapper intact; split only its two text spans.
      document.querySelectorAll('.hero-heading .hero-reveal > span,.bring-title,.projects-heading h2,'+aboutText).forEach(prepare);
      if(dialog.open)prepare(document.querySelector('#case-title'));
    }
    request();
  }
  typographyMode();
  window.PortfolioProximity={prepare};
  let viewEntrance,viewExit,viewLeaving=false,hitPending=false;
  function clearView(){
    viewEntrance?.cancel();viewExit?.cancel();viewEntrance=viewExit=null;viewLeaving=false;
    currentCard?.classList.remove('is-view-cursor-active');currentCard=null;
    bubble.classList.remove('is-visible','is-pressed');document.body.classList.remove('project-view-held');
  }
  function hideView(immediate=false){
    if(immediate){clearView();return;}
    if(!currentCard||viewLeaving)return;
    const visual=getComputedStyle(bubble),start={transform:visual.transform,opacity:visual.opacity};
    viewEntrance?.cancel();viewEntrance=null;
    currentCard.classList.remove('is-view-cursor-active');currentCard=null;viewLeaving=true;
    bubble.classList.remove('is-pressed');
    // Keep the custom cursor at the pointer until its shrink has finished.
    viewExit=bubble.animate([start,{transform:'scale(.04)',opacity:0}],{duration:340,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    viewExit.onfinish=()=>{clearView();request();};request();
  }
  function enterCard(card,e){
    if(!fine.matches||reduce.matches||e.pointerType==='touch'||dialog.open)return;
    if(currentCard===card)return;
    const continuing=Boolean(currentCard||viewLeaving);
    clearView();currentCard=card;pointer={x:e.clientX,y:e.clientY,inside:true};
    if(!continuing){bx=pointer.x;by=pointer.y;}
    document.body.classList.add('project-view-held');
    card.classList.add('is-view-cursor-active');position.style.transform=`translate3d(${bx-41}px,${by-41}px,0)`;bubble.classList.add('is-visible');
    if(!continuing)viewEntrance=bubble.animate([{transform:'scale(.16)',opacity:.3},
      {transform:'scale(.48)',opacity:1,offset:.3},
      {transform:'scale(1.075)',opacity:1,offset:.8},
      {transform:'scale(1)',opacity:1}],{duration:620,easing:'cubic-bezier(.25,.65,.3,1)'});
    request();
  }
  document.querySelectorAll('.projects-gallery .project-card').forEach(card=>{
    card.addEventListener('pointerenter',e=>enterCard(card,e),{signal:events.signal});
    card.addEventListener('pointerleave',()=>{hitPending=true;request();},{signal:events.signal});
    card.addEventListener('pointerdown',()=>{viewEntrance?.cancel();bubble.classList.add('is-pressed');},{signal:events.signal});
    card.addEventListener('pointerup',()=>bubble.classList.remove('is-pressed'),{signal:events.signal});
  });
  function request(){if(!frame&&!document.hidden)frame=requestAnimationFrame(render);}
  function render(now){
    frame=0;const dt=Math.min(40,last?now-last:16.7);last=now;
    if(hitPending){
      hitPending=false;
      const card=pointer.inside&&!dialog.open?document.elementFromPoint(pointer.x,pointer.y)?.closest('.projects-gallery .project-card'):null;
      if(card)enterCard(card,{clientX:pointer.x,clientY:pointer.y});else hideView();
    }
    const enabled=fine.matches&&!reduce.matches,pointerActive=enabled&&pointer.inside&&!window.portfolioIntroLocked;
    const fast=1-Math.exp(-dt/35),follow=1-Math.exp(-dt/70),recover=1-Math.exp(-dt/150);let moving=false;
    const glowTarget=pointerActive&&!currentCard&&!viewLeaving? .46:0;
    gx+=(pointer.x-gx)*fast;gy+=(pointer.y-gy)*fast;glowOpacity+=(glowTarget-glowOpacity)*fast;
    glow.style.transform=`translate3d(${gx-140}px,${gy-140}px,0)`;glow.style.opacity=glowOpacity.toFixed(3);
    if(currentCard||viewLeaving){bx+=(pointer.x-bx)*follow;by+=(pointer.y-by)*follow;position.style.transform=`translate3d(${bx-41}px,${by-41}px,0)`;moving ||= Math.abs(pointer.x-bx)+Math.abs(pointer.y-by)>.1;}
    moving ||= Math.abs(pointer.x-gx)+Math.abs(pointer.y-gy)>.1||Math.abs(glowTarget-glowOpacity)>.002;
    const menuOpen=document.body.classList.contains('menu-open')||dialog.classList.contains('case-menu-open');
    const typographyUpdates=[];
    typography.forEach(({title,cells})=>{
      if(!title.isConnected){typography.delete(title);return;}
      const r=title.getBoundingClientRect(),inCase=Boolean(title.closest('dialog'));
      const active=pointerActive&&!menuOpen&&!title.closest('[inert]')&&(inCase?dialog.open:!dialog.open)&&r.bottom>0&&r.top<innerHeight&&nearRect(pointer.x,pointer.y,r)<170;
      if(!active&&!cells.some(c=>c.value>.001))return;
      const radius=Math.max(85,Math.min(145,parseFloat(getComputedStyle(title).fontSize)*1.85));
      // Measure before writing: enlarged glyphs never change the distance reference.
      const targets=cells.map(c=>{
        if(!active)return 0;
        const rect=c.cell.getBoundingClientRect();
        const distance=Math.hypot(pointer.x-(rect.left+rect.width/2),pointer.y-(rect.top+rect.height/2));
        const t=clamp((1-distance/radius)*1.22);return t*t*(3-2*t);
      });
      typographyUpdates.push({cells,targets});
    });
    // Finish measuring every title before writing any glyph style.
    typographyUpdates.forEach(({cells,targets})=>cells.forEach((c,i)=>{
        const target=targets[i];c.value+=(target-c.value)*(target>c.value?fast:recover);
        if(c.value<.001)c.value=0;
        const output=c.value.toFixed(4);
        if(c.output!==output){c.cell.style.setProperty('--proximity',output);c.output=output;}
        moving ||= Math.abs(target-c.value)>.001;
      }));
    dirty=false;if(moving&&fine.matches&&!document.hidden)request();
  }
  const passive={passive:true,signal:events.signal};
  document.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointer={x:e.clientX,y:e.clientY,inside:true};hitPending=true;request();},passive);
  document.addEventListener('pointerleave',()=>{pointer.inside=false;hideView(true);request();},passive);
  addEventListener('blur',()=>{pointer.inside=false;hideView(true);request();},{signal:events.signal});
  document.addEventListener('visibilitychange',()=>{pointer.inside=false;hideView(true);if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();},{signal:events.signal});
  addEventListener('scroll',()=>{hitPending=true;dirty=true;request();},{capture:true,...passive});
  addEventListener('resize',()=>{hitPending=true;dirty=true;request();},passive);
  fine.addEventListener('change',()=>{typographyMode();surface();},{signal:events.signal});reduce.addEventListener('change',()=>{typographyMode();surface();},{signal:events.signal});
  const modalObserver=new MutationObserver(surface);modalObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
  surface();
  document.fonts.ready.then(typographyMode);
  addEventListener('pagehide',e=>{if(e.persisted)return;clearView();events.abort();modalObserver.disconnect();cancelAnimationFrame(frame);layer.remove();},{signal:events.signal});
})();
