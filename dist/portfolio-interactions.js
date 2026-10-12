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
  let frame=0,last=0,currentCard=null,dirty=true;
  const typography=new Map();
  const kineticSelector='#about-title,.about-greeting p,.bring-title,.projects-heading-lead,.projects-heading-statement';
  let kineticEntry=null,kineticIndex=-1;
  function prepare(title){
    if(!title||!fine.matches||reduce.matches)return;
    if(typography.has(title)&&title.querySelector('.proximity-cell'))return;
    const text=title.textContent;title.setAttribute('aria-label',text);
    const kinetic=title.matches(kineticSelector);title.classList.toggle('kinetic-text',kinetic);
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
          cell.append(glyph);word.append(cell);cells.push({cell,value:0,line:root.closest('.projects-heading-lead,.projects-heading-statement')||title});if(about&&cjk)word=null;
        }
        if(title.matches('.about-script')){
          const line=document.createElement('span');line.className='proximity-script-line';line.append(fragment);textNode.replaceWith(line);
        }else textNode.replaceWith(fragment);
      });
    });
    typography.set(title,{title,cells,originals,kinetic});dirty=true;request();
  }
  const aboutText='#about-title,.about-script,.about-greeting p,.about-biography,.about-work-title,.about-work-row>*,.about-work-description';
  // The complete About left column and only the previously selected headings elsewhere.
  function restoreTypography(){clearKinetic();typography.forEach(entry=>{entry.title.classList.remove('kinetic-text');entry.originals.forEach(({root,html})=>root.innerHTML=html);});typography.clear();}
  function clearKinetic(){
    kineticEntry?.cells.forEach(({cell})=>cell.classList.remove('is-kinetic-main','is-kinetic-near','is-kinetic-far'));
    kineticEntry=null;kineticIndex=-1;
  }
  // KineticText: hover weight and spacing ripple to the nearest two characters.
  function trackKinetic(event){
    const title=event.target.closest('.kinetic-text'),entry=typography.get(title);
    const cell=event.target.closest('.proximity-cell');
    const enabled=fine.matches&&!reduce.matches&&!window.portfolioIntroLocked&&!title?.closest('[inert]')&&!dialog.open&&!document.body.classList.contains('menu-open');
    const index=enabled&&entry?.kinetic&&cell?entry.cells.findIndex(c=>c.cell===cell):-1;
    if(index<0){clearKinetic();return;}
    if(kineticEntry===entry&&kineticIndex===index)return;
    clearKinetic();kineticEntry=entry;kineticIndex=index;
    entry.cells.forEach((c,i)=>{
      if(c.line!==entry.cells[index].line)return;
      const distance=Math.abs(i-index);
      if(distance<3)c.cell.classList.add(distance===0?'is-kinetic-main':distance===1?'is-kinetic-near':'is-kinetic-far');
    });
  }
  function typographyMode(){
    restoreTypography();
    if(fine.matches&&!reduce.matches){
      document.querySelectorAll('.bring-title,.projects-heading-lead,.projects-heading-statement,'+aboutText).forEach(prepare);
      if(dialog.open)prepare(document.querySelector('#case-title'));
    }
    request();
  }
  typographyMode();
  window.PortfolioProximity={prepare};
  let viewEntrance;
  function hideView(){clearKinetic();viewEntrance?.cancel();currentCard?.classList.remove('is-view-cursor-active');currentCard=null;bubble.classList.remove('is-visible','is-pressed');}
  function enterCard(card,e){
    if(!fine.matches||reduce.matches||e.pointerType==='touch'||dialog.open)return;
    hideView();currentCard=card;pointer={x:e.clientX,y:e.clientY,inside:true};bx=pointer.x;by=pointer.y;
    card.classList.add('is-view-cursor-active');position.style.transform=`translate3d(${bx-41}px,${by-41}px,0)`;bubble.classList.add('is-visible');
    viewEntrance=bubble.animate([{transform:'scale(.16)',opacity:.3},
      {transform:'scale(.48)',opacity:1,offset:.3},
      {transform:'scale(1.075)',opacity:1,offset:.8},
      {transform:'scale(1)',opacity:1}],{duration:620,easing:'cubic-bezier(.25,.65,.3,1)'});
    request();
  }
  document.querySelectorAll('.projects-gallery .project-card').forEach(card=>{
    card.addEventListener('pointerenter',e=>enterCard(card,e),{signal:events.signal});
    card.addEventListener('pointerleave',()=>{if(currentCard===card)hideView();request();},{signal:events.signal});
    card.addEventListener('pointerdown',()=>{viewEntrance?.cancel();bubble.classList.add('is-pressed');},{signal:events.signal});
    card.addEventListener('pointerup',()=>bubble.classList.remove('is-pressed'),{signal:events.signal});
  });
  function request(){if(!frame&&!document.hidden)frame=requestAnimationFrame(render);}
  function render(now){
    frame=0;const dt=Math.min(40,last?now-last:16.7);last=now;
    const enabled=fine.matches&&!reduce.matches,pointerActive=enabled&&pointer.inside&&!window.portfolioIntroLocked;
    const fast=1-Math.exp(-dt/35),follow=1-Math.exp(-dt/70),recover=1-Math.exp(-dt/150);let moving=false;
    const glowTarget=0;
    gx+=(pointer.x-gx)*fast;gy+=(pointer.y-gy)*fast;glowOpacity+=(glowTarget-glowOpacity)*fast;
    glow.style.transform=`translate3d(${gx-140}px,${gy-140}px,0)`;glow.style.opacity=glowOpacity.toFixed(3);
    if(currentCard){bx+=(pointer.x-bx)*follow;by+=(pointer.y-by)*follow;position.style.transform=`translate3d(${bx-41}px,${by-41}px,0)`;moving ||= Math.abs(pointer.x-bx)+Math.abs(pointer.y-by)>.1;}
    moving ||= Math.abs(pointer.x-gx)+Math.abs(pointer.y-gy)>.1||Math.abs(glowTarget-glowOpacity)>.002;
    const menuOpen=document.body.classList.contains('menu-open')||dialog.classList.contains('case-menu-open');
    typography.forEach(({title,cells,kinetic})=>{
      if(!title.isConnected){typography.delete(title);return;}
      if(kinetic)return;
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
      cells.forEach((c,i)=>{
        const target=targets[i];c.value+=(target-c.value)*(target>c.value?fast:recover);
        if(c.value<.001)c.value=0;
        c.cell.style.setProperty('--proximity',c.value.toFixed(4));moving ||= Math.abs(target-c.value)>.001;
      });
    });
    dirty=false;if(moving&&fine.matches&&!document.hidden)request();
  }
  const passive={passive:true,signal:events.signal};
  document.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointer={x:e.clientX,y:e.clientY,inside:true};trackKinetic(e);const card=e.target.closest('.projects-gallery .project-card');if(card&&card!==currentCard)enterCard(card,e);request();},passive);
  document.addEventListener('pointerleave',()=>{pointer.inside=false;hideView();request();},passive);
  addEventListener('blur',()=>{pointer.inside=false;hideView();request();},{signal:events.signal});
  document.addEventListener('visibilitychange',()=>{pointer.inside=false;hideView();if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();},{signal:events.signal});
  addEventListener('scroll',()=>{hideView();dirty=true;request();},{capture:true,...passive});
  addEventListener('resize',()=>{dirty=true;request();},passive);
  fine.addEventListener('change',()=>{typographyMode();surface();},{signal:events.signal});reduce.addEventListener('change',()=>{typographyMode();surface();},{signal:events.signal});
  const modalObserver=new MutationObserver(surface);modalObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
  const aurora=document.createElement('div');aurora.className='bring-aurora';aurora.setAttribute('aria-hidden','true');const bring=document.querySelector('.bring-section');bring.prepend(aurora);
  let auroraVisible=false;function auroraMotion(){aurora.dataset.motion=auroraVisible&&!document.hidden&&!dialog.open&&!reduce.matches?'running':'paused';}
  const auroraObserver=new IntersectionObserver(entries=>{auroraVisible=entries[0].isIntersecting;auroraMotion();});auroraObserver.observe(bring);
  document.addEventListener('visibilitychange',auroraMotion,{signal:events.signal});dialog.addEventListener('toggle',auroraMotion,{signal:events.signal});reduce.addEventListener('change',auroraMotion,{signal:events.signal});
  surface();
  document.fonts.ready.then(typographyMode);
  addEventListener('pagehide',e=>{if(e.persisted)return;events.abort();modalObserver.disconnect();auroraObserver.disconnect();cancelAnimationFrame(frame);layer.remove();},{signal:events.signal});
})();
