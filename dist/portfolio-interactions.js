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
    hideView();
    if(topLayer){if(layer.matches(':popover-open'))layer.hidePopover();if(fine.matches&&!reduce.matches)layer.showPopover();}
    else(dialog.open?dialog:document.body).append(layer);
    request();
  }
  let pointer={x:innerWidth/2,y:innerHeight/2,inside:false},gx=pointer.x,gy=pointer.y,bx=gx,by=gy,glowOpacity=0;
  let frame=0,last=0,currentCard=null,workAmount=0,dirty=true;
  const typography=new Map();
  function prepare(title){
    if(!title||!fine.matches)return;
    const previous=typography.get(title);if(previous&&title.querySelector('.proximity-cell'))return;
    const text=title.textContent;title.setAttribute('aria-label',text);
    const roots=title.querySelectorAll('.projects-heading-word').length?[...title.querySelectorAll('.projects-heading-word')]:[title];
    const cells=[];
    roots.forEach(root=>{
      const source=root.textContent;if(!source)return;
      // Freeze the original glyph advances, including kerning, in em units.
      root.textContent=source;const textNode=root.firstChild,range=document.createRange(),fontSize=parseFloat(getComputedStyle(root).fontSize);
      const widths=[];let offset=0;
      for(const char of Array.from(source)){range.setStart(textNode,offset);range.setEnd(textNode,offset+char.length);widths.push(range.getBoundingClientRect().width/fontSize);offset+=char.length;}
      const fragment=document.createDocumentFragment();let word=null,index=0;
      for(const char of Array.from(source)){
        if(/\s/.test(char)){word=null;fragment.append(document.createTextNode(char));index++;continue;}
        if(!word){word=document.createElement('span');word.className='proximity-word';word.setAttribute('aria-hidden','true');fragment.append(word);}
        const cell=document.createElement('span'),glyph=document.createElement('span');cell.className='proximity-cell';glyph.className='proximity-glyph';glyph.textContent=char;cell.style.width=widths[index++]+'em';cell.append(glyph);word.append(cell);cells.push({cell,value:0});
      }
      root.replaceChildren(fragment);
    });
    typography.set(title,{title,cells,roots:roots.map(root=>({root,text:root.textContent}))});dirty=true;request();
  }
  // Exactly two strengths headings, two summary lines, and the current case title.
  function restoreTypography(){typography.forEach(entry=>entry.roots.forEach(({root,text})=>root.textContent=text));typography.clear();}
  function typographyMode(){restoreTypography();if(fine.matches){document.querySelectorAll('.bring-title,.projects-heading h2').forEach(prepare);if(dialog.open)prepare(document.querySelector('#case-title'));}request();}
  typographyMode();
  window.PortfolioProximity={prepare};
  const workRoot=[document.querySelector('.about-work-title'),...document.querySelectorAll('.about-experience')],workPieces=[];
  const workRows=[...document.querySelectorAll('.about-experience')];
  workRoot.forEach(root=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const fragment=document.createDocumentFragment();
      const parts=node.textContent.match(/[\u3400-\u9fff]{1,2}|[A-Za-z0-9]+|\s+|[^\u3400-\u9fffA-Za-z0-9\s]+/gu)||[];
      parts.forEach(text=>{if(/^\s+$/.test(text)){fragment.append(document.createTextNode(text));return;}const piece=document.createElement('span');piece.className='work-light-piece';piece.textContent=text;fragment.append(piece);workPieces.push({piece,row:root.closest('.about-experience'),value:0});});node.replaceWith(fragment);
    });
  });
  const halo=document.createElement('div');halo.className='work-spotlight-halo';halo.setAttribute('aria-hidden','true');board.querySelector('.about-work-title').before(halo);
  function workMode(){board.classList.toggle('work-spotlight-enabled',fine.matches);if(!fine.matches){workAmount=0;workPieces.forEach(c=>{c.value=0;c.piece.style.removeProperty('--work-strength');});workRows.forEach(row=>row.style.removeProperty('--work-row-strength'));halo.style.setProperty('--work-halo','0');}request();}
  function hideView(){currentCard?.classList.remove('is-view-cursor-active');currentCard=null;bubble.classList.remove('is-visible','is-pressed');}
  function enterCard(card,e){
    if(!fine.matches||reduce.matches||e.pointerType==='touch'||dialog.open)return;
    hideView();currentCard=card;pointer={x:e.clientX,y:e.clientY,inside:true};bx=pointer.x;by=pointer.y;
    card.classList.add('is-view-cursor-active');position.style.transform=`translate3d(${bx-49}px,${by-49}px,0)`;bubble.classList.add('is-visible');request();
  }
  document.querySelectorAll('.projects-gallery .project-card').forEach(card=>{
    card.addEventListener('pointerenter',e=>enterCard(card,e),{signal:events.signal});
    card.addEventListener('pointerleave',()=>{if(currentCard===card)hideView();request();},{signal:events.signal});
    card.addEventListener('pointerdown',()=>bubble.classList.add('is-pressed'),{signal:events.signal});
    card.addEventListener('pointerup',()=>bubble.classList.remove('is-pressed'),{signal:events.signal});
  });
  function request(){if(!frame&&!document.hidden)frame=requestAnimationFrame(render);}
  function render(now){
    frame=0;const dt=Math.min(40,last?now-last:16.7);last=now;
    const enabled=fine.matches&&!reduce.matches,pointerActive=enabled&&pointer.inside&&!window.portfolioIntroLocked;
    const fast=1-Math.exp(-dt/35),follow=1-Math.exp(-dt/70),recover=1-Math.exp(-dt/115);let moving=false;
    const glowTarget=pointerActive&&!currentCard? .46:0;
    gx+=(pointer.x-gx)*fast;gy+=(pointer.y-gy)*fast;glowOpacity+=(glowTarget-glowOpacity)*fast;
    glow.style.transform=`translate3d(${gx-140}px,${gy-140}px,0)`;glow.style.opacity=glowOpacity.toFixed(3);
    if(currentCard){bx+=(pointer.x-bx)*follow;by+=(pointer.y-by)*follow;position.style.transform=`translate3d(${bx-49}px,${by-49}px,0)`;moving ||= Math.abs(pointer.x-bx)+Math.abs(pointer.y-by)>.1;}
    moving ||= Math.abs(pointer.x-gx)+Math.abs(pointer.y-gy)>.1||Math.abs(glowTarget-glowOpacity)>.002;
    const menuOpen=document.body.classList.contains('menu-open')||dialog.classList.contains('case-menu-open');
    typography.forEach(({title,cells})=>{
      if(!title.isConnected){typography.delete(title);return;}
      const r=title.getBoundingClientRect(),inCase=Boolean(title.closest('dialog'));
      const active=pointerActive&&!menuOpen&&(inCase?dialog.open:!dialog.open)&&r.bottom>0&&r.top<innerHeight&&nearRect(pointer.x,pointer.y,r)<170;
      if(!active&&!cells.some(c=>c.value>.001))return;
      const radius=Math.max(85,Math.min(145,parseFloat(getComputedStyle(title).fontSize)*1.65));
      cells.forEach(c=>{
        let target=0;if(active){const rect=c.cell.getBoundingClientRect();target=Math.pow(clamp(1-Math.hypot(pointer.x-(rect.left+rect.width/2),pointer.y-(rect.top+rect.height/2))/radius),1.6);}
        c.value+=(target-c.value)*(target>c.value?fast:recover);if(c.value<.001)c.value=0;
        c.cell.style.setProperty('--proximity',c.value.toFixed(4));moving ||= Math.abs(target-c.value)>.001;
      });
    });
    if(fine.matches){
      const bounds=[...workRoot,...board.querySelectorAll('.about-work-description')].map(el=>el.getBoundingClientRect()),b=board.getBoundingClientRect(),scale=b.width/board.offsetWidth;
      const left=Math.min(...bounds.map(r=>r.left))-10,top=Math.min(...bounds.map(r=>r.top))-10;
      halo.style.left=(left-b.left)/scale+'px';halo.style.top=(top-b.top)/scale+'px';halo.style.width=(Math.max(...bounds.map(r=>r.right))-left+10)/scale+'px';halo.style.height=(Math.max(...bounds.map(r=>r.bottom))-top+10)/scale+'px';
    }
    const workBounds=halo.getBoundingClientRect(),workActive=fine.matches&&pointer.inside&&!dialog.open&&!menuOpen&&!board.closest('[inert]')&&workBounds.bottom>0&&workBounds.top<innerHeight&&nearRect(pointer.x,pointer.y,workBounds)<65;
    if(workActive||workAmount>.001||workPieces.some(c=>c.value>.001)){
      workAmount+=((workActive?1:0)-workAmount)*fast;
      const localX=(gx-workBounds.left)/Math.max(.001,workBounds.width)*halo.offsetWidth,localY=(gy-workBounds.top)/Math.max(.001,workBounds.height)*halo.offsetHeight;
      halo.style.setProperty('--work-x',localX+'px');halo.style.setProperty('--work-y',localY+'px');halo.style.setProperty('--work-halo',workAmount.toFixed(3));
      const workFollow=1-Math.exp(-dt/65),workRecover=1-Math.exp(-dt/190);
      // Read all glyph positions before writing styles to avoid layout thrashing.
      const workTargets=workPieces.map(c=>{
        if(!workActive)return 0;
        const r=c.piece.getBoundingClientRect(),distance=Math.hypot(gx-r.left-r.width/2,gy-r.top-r.height/2);
        const t=clamp(1-distance/165);return t*t*(3-2*t);
      });
      const rowStrengths=new Map(workRows.map(row=>[row,0]));
      workPieces.forEach((c,index)=>{
        const target=workTargets[index];
        c.value+=(target-c.value)*(reduce.matches?1:target>c.value?workFollow:workRecover);if(c.value<.001)c.value=0;
        c.piece.style.setProperty('--work-strength',c.value.toFixed(4));moving ||= Math.abs(target-c.value)>.001;
        if(c.row)rowStrengths.set(c.row,Math.max(rowStrengths.get(c.row),c.value));
      });rowStrengths.forEach((value,row)=>row.style.setProperty('--work-row-strength',value.toFixed(4)));
      moving ||= Math.abs((workActive?1:0)-workAmount)>.001;
    }
    dirty=false;if(moving&&fine.matches&&!document.hidden)request();
  }
  const passive={passive:true,signal:events.signal};
  document.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointer={x:e.clientX,y:e.clientY,inside:true};const card=e.target.closest('.projects-gallery .project-card');if(card&&card!==currentCard)enterCard(card,e);request();},passive);
  document.addEventListener('pointerleave',()=>{pointer.inside=false;hideView();request();},passive);
  addEventListener('blur',()=>{pointer.inside=false;hideView();request();},{signal:events.signal});
  document.addEventListener('visibilitychange',()=>{pointer.inside=false;hideView();if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();},{signal:events.signal});
  addEventListener('scroll',()=>{hideView();dirty=true;request();},{capture:true,...passive});
  addEventListener('resize',()=>{dirty=true;request();},passive);
  fine.addEventListener('change',()=>{workMode();typographyMode();surface();},{signal:events.signal});reduce.addEventListener('change',surface,{signal:events.signal});
  const modalObserver=new MutationObserver(surface);modalObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
  const aurora=document.createElement('div');aurora.className='bring-aurora';aurora.setAttribute('aria-hidden','true');const bring=document.querySelector('.bring-section');bring.prepend(aurora);
  let auroraVisible=false;function auroraMotion(){aurora.dataset.motion=auroraVisible&&!document.hidden&&!dialog.open&&!reduce.matches?'running':'paused';}
  const auroraObserver=new IntersectionObserver(entries=>{auroraVisible=entries[0].isIntersecting;auroraMotion();});auroraObserver.observe(bring);
  document.addEventListener('visibilitychange',auroraMotion,{signal:events.signal});dialog.addEventListener('toggle',auroraMotion,{signal:events.signal});reduce.addEventListener('change',auroraMotion,{signal:events.signal});
  workMode();surface();
  document.fonts.ready.then(typographyMode);
  addEventListener('pagehide',e=>{if(e.persisted)return;events.abort();modalObserver.disconnect();auroraObserver.disconnect();cancelAnimationFrame(frame);layer.remove();},{signal:events.signal});
})();
