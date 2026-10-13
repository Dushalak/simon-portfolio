/* First-visit intro only. Scroll composition and pointer depth stay in hero-motion.js. */
(() => {
  const labels = Object.freeze({ introStart: 0, constructionLines: 300, frameDrawing: 100,
    frameHold: 1000, titleEntrance:120, videoStart:480, lightReveal:1480, backgroundReveal:1580,
    constructionFadeOut:2600, contentEntrance:1280, introComplete:3400 });
  const backgroundRevealMs = 1400;
  const introPlaybackRate = .65;
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => { const t = clamp(value); return t*t*(3-2*t); };

  // Every native tween is paused and sampled from this one master playhead.
  // No independent CSS timers, delayed callbacks or competing animation clocks.
  class MasterTimeline {
    constructor(onFrame, onComplete) {
      this.time = 0; this.last = null; this.frame = 0; this.tweens = [];
      this.onFrame = onFrame; this.onComplete = onComplete; this.done = false;
      this.assetsReady = false; this.duration = labels.introComplete;
      this.lastPaint=-Infinity;this.interval=1000/(window.PortfolioHeroPerformance?.profile.motionFps||60);
      this.tick = this.tick.bind(this);
    }
    add(node, keyframes, duration, at, easing = 'cubic-bezier(.22,1,.36,1)') {
      if (!node) return;
      const animation = node.animate(keyframes, { duration, delay: at, easing, fill: 'both' });
      animation.pause(); animation.currentTime = 0; this.tweens.push({animation,start:at,end:at+duration,lastTime:0});
    }
    tick(now) {
      this.frame = 0; if (this.done || document.hidden) return;
      if (this.last !== null) this.time += (now - this.last) * introPlaybackRate;
      this.last = now;
      // Only the small poster gates this reveal, with a bounded wait. Video never gates text.
      if (!this.assetsReady && this.time > labels.lightReveal) this.time = labels.lightReveal;
      const t = Math.min(this.time, this.duration);
      if(t<this.duration&&now-this.lastPaint<this.interval-1){this.frame=requestAnimationFrame(this.tick);return;}
      this.lastPaint=now;
      for(const tween of this.tweens){
        if(t<tween.start)continue;
        const time=Math.min(t,tween.end);
        if(time!==tween.lastTime){tween.animation.currentTime=time;tween.lastTime=time;}
      }
      this.onFrame(t);
      if (t >= this.duration) this.onComplete();
      else this.frame = requestAnimationFrame(this.tick);
    }
    play() { if (!this.done && !this.frame && !document.hidden) { this.last = null; this.frame = requestAnimationFrame(this.tick); } }
    pause() { cancelAnimationFrame(this.frame); this.frame = 0; this.last = null; }
    finish() { this.done = true; this.pause(); this.tweens.forEach(({animation}) => animation.cancel()); this.tweens = []; }
  }

  function construction(panel, stage) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    // Measured from Shopify's davinci-lines SVG; scale its construction to our frame.
    svg.setAttribute('viewBox', '550 208 340 464');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true'); svg.classList.add('hero-construction');
    const lines = [
      {d:'M339.938 207.740H550.031',group:'mark',at:300},
      {d:'M420.186 207.740V336.130',group:'mark',at:345},
      {d:'M339.938 256.781H420.186',group:'mark',at:390},
      {d:'M389.534 256.781V207.740',group:'mark',at:435},
      {d:'M389.534 238.049H420.186',group:'mark',at:480},
      {d:'M889.969 672.260H1100.062',group:'mark',at:365},
      {d:'M1019.814 672.260V543.870',group:'mark',at:410},
      {d:'M1019.814 623.219H1100.062',group:'mark',at:455},
      {d:'M1050.466 623.219V672.260',group:'mark',at:500},
      {d:'M1050.466 641.951H1019.814',group:'mark',at:545},
      {d:'',geometry:'top-spiral',group:'mark',at:330},
      {d:'',geometry:'bottom-spiral',group:'mark',at:395},
      {d:'',geometry:'left-horizontal',group:'axis',at:550},
      {d:'',geometry:'right-horizontal',group:'axis',at:610},
      ...[550.031,720,889.969].map((x,i)=>({d:'',geometry:'vertical',x,group:'axis',at:590+i*70})),
      {d:'',geometry:'diagonal-down',group:'diagonal',at:750},
      {d:'',geometry:'diagonal-up',group:'diagonal',at:830},
      // The reference's paired 425-unit circles meet at the frame's center.
      {d:'M295 15a425 425 0 1 0 850 0',group:'arc',at:860},
      {d:'M1145 865a425 425 0 1 0-850 0',group:'arc',at:950}
    ];
    lines.forEach(line => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', line.d); path.setAttribute('pathLength', '1');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.dataset.group = line.group; svg.append(path); line.node = path;
    });
    function resize() {
      const scaleX=panel.offsetWidth/340,scaleY=panel.offsetHeight/464;
      const panelLeft=panel.offsetLeft-panel.offsetWidth/2,panelTop=panel.offsetTop-panel.offsetHeight/2;
      const minX=550-panelLeft/scaleX,maxX=550+(stage.clientWidth-panelLeft)/scaleX;
      const minY=208-panelTop/scaleY,maxY=208+(stage.clientHeight-panelTop)/scaleY;
      const extent=Math.max(720-minX,maxX-720),slope=464/340;
      lines.forEach(line=>{
        const paths={
          'top-spiral':`M339.938 ${minY}V336.130`,
          'bottom-spiral':`M1100.062 543.870V${maxY}`,
          'left-horizontal':`M${minX} 336.130H550.031`,
          'right-horizontal':`M889.969 543.870H${maxX}`,
          'vertical':`M${line.x} ${minY}V${maxY}`,
          'diagonal-down':`M${720-extent} ${440-extent/slope}L${720+extent} ${440+extent/slope}`,
          'diagonal-up':`M${720+extent} ${440-extent/slope}L${720-extent} ${440+extent/slope}`
        };
        if(line.geometry)line.node.setAttribute('d',paths[line.geometry]);
      });
    }
    panel.prepend(svg);resize(); return { svg, lines, resize };
  }

  // A transparent WebGL veil reveals the EXISTING DOM photograph. No image
  // replacement or duplicate 3D scene: only the moving dissolution boundary is rendered.
  function opticalReveal(stage, {canvas: suppliedCanvas, overlay = false} = {}) {
    const veil = suppliedCanvas || document.createElement('div');
    if(!suppliedCanvas)veil.className = 'hero-intro-curtain';
    veil.setAttribute('aria-hidden', 'true');
    const canvas = suppliedCanvas || document.createElement('canvas');
    if(!suppliedCanvas){veil.append(canvas);stage.prepend(veil);}
    const resources = [], events = new AbortController();
    let gl, program, buffer, uniforms, fallback = false, lastSize = '', maskKey = '', maskURL = null;
    const quality=window.PortfolioHeroPerformance?.profile||{tier:'high',maxPixels:786432,maxWidth:1280,maxHeight:800,dpr:1,shaderFps:40,octaves:4,detail:1,maskWidth:512};
    let dummy,fieldTexture,fieldBuffer,fieldKey='',floatFields=false,cacheDisabled=false,lastDraw=-Infinity;
    let w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
    const sizeObserver=new ResizeObserver(()=>{w=Math.max(1,stage.clientWidth);h=Math.max(1,stage.clientHeight);lastSize='';});sizeObserver.observe(stage);
    const vertex = `attribute vec2 aPosition;varying vec2 vUv;
      void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
    const fragment = `precision highp float;
      varying vec2 vUv;uniform vec2 uResolution;uniform float uProgress,uLight,uMode,uCached,uPacked,uOctaves,uDetail,uNoiseGain;
      uniform highp sampler2D uField;
      float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
      float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){if(float(i)>=uOctaves)break;n+=a*noise(p);p=p*2.03+vec2(13.7,9.2);a*=.5;}return n*uNoiseGain;}
      void main(){
        if(uProgress<=0.&&uLight<=0.&&uMode<.5){gl_FragColor=vec4(0.,0.,0.,1.);return;}
        if(uProgress>=1.&&uMode<1.5){gl_FragColor=vec4(0.);return;}
        float field,texture,precursor;
        if(uCached>.5){vec4 data=texture2D(uField,vUv);
          if(uPacked>.5){field=(data.r*65280.+data.g*255.)/65535.*2.;texture=data.b;precursor=data.a*2.;}
          else{field=data.r*2.;texture=data.g;precursor=data.b*2.;}}
        else{
        vec2 uv=vec2(vUv.x,1.-vUv.y), ratio=vec2(uResolution.x/uResolution.y,1.);
        vec2 q=uv*ratio;
        vec2 warp=vec2(fbm(q*3.1+vec2(7.2,1.8)),fbm(q*3.4+vec2(1.3,8.6)));
        float coarse=fbm(q*4.0+warp*2.6+vec2(4.1,9.3));
        float medium=noise(q*32.+warp+vec2(2.7)),detail=noise(q*115.+vec2(8.2));
        float grain=hash(floor(q*(750.*uDetail)));
        // Distributed, domain-warped islands merge; there is no directional sweep origin.
        float a=length((uv-vec2(.39,.56))*ratio);
        float b=length((uv-vec2(.65,.32))*ratio);
        float c=length((uv-vec2(.78,.66))*ratio);
        float d=length((uv-vec2(.57,.82))*ratio);
        float distance=min(min(a,b),min(c,d));
        field=coarse*.88+medium*.08+detail*.035+min(distance,.8)*.28+(grain-.5)*.014;
        texture=mix(.02,1.,smoothstep(.35,.74,noise(q*(185.*uDetail))))*mix(.35,1.,grain);
        precursor=(exp(-a*a/.024)+exp(-b*b/.018)+exp(-c*c/.035)+exp(-d*d/.015));
        }
        if(uMode>2.5){
          if(uPacked>.5){float code=floor(clamp(field*.5,0.,1.)*65535.+.5);gl_FragColor=vec4(floor(code/256.)/255.,mod(code,256.)/255.,texture,clamp(precursor*.5,0.,1.));}
          else{gl_FragColor=vec4(field*.5,texture,precursor*.5,1.);}return;}
        if(uMode>1.5){gl_FragColor=vec4(vec3(field),1.);return;}
        float threshold=mix(.25,.95,uProgress);
        float edge=field-threshold;
        float open=(1.-smoothstep(-.008,.014,edge))*smoothstep(.001,.05,uProgress);
        float envelope=smoothstep(.005,.10,uProgress)*(1.-smoothstep(.83,1.,uProgress));
        float rim=exp(-abs(edge)*155.)*texture*.85*envelope;
        float bloom=exp(-abs(edge)*27.)*.16*envelope;
        float light=rim+bloom+precursor*uLight*.23;
        float alpha=clamp(1.-open+light,0.,1.);
        vec3 silver=vec3(1.,.96,.86)*light;
        if(uMode>.5){alpha=clamp(light,0.,1.);}
        gl_FragColor=vec4(silver/max(alpha,.0001),alpha);
      }`;
    function gradientFallback() {
      fallback = true; veil.dataset.renderer = 'gradient';
      if(!suppliedCanvas)canvas.remove();
      else{canvas.style.background='radial-gradient(ellipse 24% 35% at 39% 56%,#e4dfbb40,transparent),radial-gradient(ellipse 21% 30% at 65% 32%,#e4dfbb38,transparent),radial-gradient(ellipse 25% 33% at 78% 66%,#e4dfbb38,transparent)';}
    }
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false,
        antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
      if (!gl) throw new Error('WebGL unavailable');
      function shader(type, source) {
        const shader = gl.createShader(type); resources.push(shader);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Intro shader unavailable');
        return shader;
      }
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Intro program unavailable');
      gl.useProgram(program); buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
      uniforms = Object.fromEntries(['uResolution','uProgress','uLight','uMode','uCached','uField','uPacked','uOctaves','uDetail','uNoiseGain'].map(name=>[name,gl.getUniformLocation(program,name)]));
      dummy=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,dummy);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.uniform1i(uniforms.uField,0);
      floatFields=quality.tier==='high'&&Boolean(gl.getExtension('OES_texture_float')&&gl.getExtension('WEBGL_color_buffer_float'));
      gl.uniform1f(uniforms.uPacked,floatFields?0:1);gl.uniform1f(uniforms.uOctaves,quality.octaves);gl.uniform1f(uniforms.uDetail,quality.detail);
      gl.uniform1f(uniforms.uNoiseGain,.9375/(1-Math.pow(.5,quality.octaves)));
      veil.dataset.renderer = 'webgl';
      canvas.addEventListener('webglcontextlost', event=>{event.preventDefault();gradientFallback();}, {signal:events.signal});
    } catch (_) { gradientFallback(); }
    function fields(width,height,w,h){
      if(cacheDisabled){gl.bindTexture(gl.TEXTURE_2D,dummy);gl.uniform1f(uniforms.uCached,0);return;}
      const key=`${width}x${height}/${w}x${h}`;
      if(key!==fieldKey){
        fieldTexture ||= gl.createTexture();fieldBuffer ||= gl.createFramebuffer();
        gl.bindTexture(gl.TEXTURE_2D,fieldTexture);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        // Desktop keeps Float32. Smaller devices pack the edge into 16 bits in RGBA8.
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,floatFields?gl.FLOAT:gl.UNSIGNED_BYTE,null);
        if(gl.getError()!==gl.NO_ERROR){cacheDisabled=!floatFields;floatFields=false;gl.uniform1f(uniforms.uPacked,1);fieldKey='';fields(width,height,w,h);return;}
        gl.bindFramebuffer(gl.FRAMEBUFFER,fieldBuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,fieldTexture,0);
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){
          gl.bindFramebuffer(gl.FRAMEBUFFER,null);cacheDisabled=!floatFields;floatFields=false;gl.uniform1f(uniforms.uPacked,1);fieldKey='';fields(width,height,w,h);return;
        }
        gl.bindTexture(gl.TEXTURE_2D,dummy);gl.uniform1f(uniforms.uCached,0);
        gl.uniform2f(uniforms.uResolution,w,h);gl.uniform1f(uniforms.uMode,3);gl.uniform1f(uniforms.uProgress,0);gl.uniform1f(uniforms.uLight,0);
        const dither=gl.isEnabled(gl.DITHER);gl.disable(gl.DITHER);
        gl.drawArrays(gl.TRIANGLES,0,6);if(dither)gl.enable(gl.DITHER);gl.bindFramebuffer(gl.FRAMEBUFFER,null);fieldKey=key;
      }
      gl.bindTexture(gl.TEXTURE_2D,fieldTexture);gl.uniform1f(uniforms.uCached,1);veil.dataset.field='cached';veil.dataset.fieldFormat=floatFields?'float32':'rgba8-packed';
    }
    function draw(progress, light = 0) {
      if (progress >= 1) { veil.style.visibility = 'hidden'; return; }
      if (overlay && progress <= 0 && light <= 0) { veil.style.visibility = 'hidden'; return; }
      const now=performance.now();if(now-lastDraw<1000/quality.shaderFps-1&&lastSize)return;lastDraw=now;
      veil.style.visibility = 'visible';
      if (fallback) {
        lastSize=`${w}x${h}`;
        if(overlay){veil.style.opacity=String(smooth(progress/.12)*(1-smooth((progress-.72)/.28)));return;}
        if(progress===0){veil.style.maskImage='none';veil.style.webkitMaskImage='none';veil.style.setProperty('--intro-light',String(light*.3));return;}
        const radius=progress*Math.hypot(w,h)*.80;
        const mask=[[39,56,.88],[65,32,.75],[78,66,1],[57,82,.8]].map(([x,y,s])=>
          `radial-gradient(ellipse ${Math.max(1,radius*s)}px ${Math.max(1,radius*s*.74)}px at ${x}% ${y}%,transparent 65%,#000 100%)`).join(',');
        veil.style.maskImage=mask;veil.style.webkitMaskImage=mask;
        veil.style.maskComposite='intersect';veil.style.webkitMaskComposite='source-in';
        veil.style.setProperty('--intro-light',String(light*.3));
        return;
      }
      // Cap the transient shader resolution. It stops completely once the image is revealed.
      const scale=Math.min(devicePixelRatio,quality.dpr,quality.maxWidth/w,quality.maxHeight/h,Math.sqrt(quality.maxPixels/(w*h)));
      const size=`${w}x${h}`;
      if(size!==lastSize){canvas.width=Math.max(1,Math.floor(w*scale));canvas.height=Math.max(1,Math.floor(h*scale));gl.viewport(0,0,canvas.width,canvas.height);lastSize=size;}
      if(progress>0||light>0)fields(canvas.width,canvas.height,w,h);
      gl.uniform2f(uniforms.uResolution,w,h);
      gl.uniform1f(uniforms.uProgress,progress);gl.uniform1f(uniforms.uLight,light);
      gl.uniform1f(uniforms.uMode,overlay?1:0);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
    // Export the SAME scalar field once per viewport size, not per animation frame.
    // The SVG mask samples it with a moving threshold while the shader lights its edge.
    function maskImage(){
      if(fallback||!gl)return null;
      const key=`${w}x${h}`;
      if(key===maskKey)return maskURL;
      const mw=quality.maskWidth,mh=Math.max(1,Math.min(768,Math.round(mw*h/w)));
      canvas.width=mw;canvas.height=mh;gl.viewport(0,0,mw,mh);
      fields(mw,mh,w,h);
      gl.uniform2f(uniforms.uResolution,w,h);gl.uniform1f(uniforms.uProgress,.5);
      gl.uniform1f(uniforms.uLight,0);gl.uniform1f(uniforms.uMode,2);gl.drawArrays(gl.TRIANGLES,0,6);
      const pixels=new Uint8Array(mw*mh*4);gl.readPixels(0,0,mw,mh,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      const image=document.createElement('canvas');image.width=mw;image.height=mh;
      const context=image.getContext('2d'),data=context.createImageData(mw,mh);
      for(let row=0;row<mh;row++)data.data.set(pixels.subarray((mh-row-1)*mw*4,(mh-row)*mw*4),row*mw*4);
      context.putImageData(data,0,0);maskURL=image.toDataURL('image/png');maskKey=key;lastSize='';
      return maskURL;
    }
    draw(0);
    return { draw, maskImage, renderer:veil.dataset.renderer, get field(){return fieldKey?'cached':'analytic';}, get pixels(){return canvas.width*canvas.height;}, get format(){return veil.dataset.fieldFormat||'none';}, dispose() {
      events.abort();sizeObserver.disconnect();veil.remove();
      if(gl){resources.forEach(shader=>gl.deleteShader(shader));if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);
        if(dummy)gl.deleteTexture(dummy);if(fieldTexture)gl.deleteTexture(fieldTexture);if(fieldBuffer)gl.deleteFramebuffer(fieldBuffer);
        gl.getExtension('WEBGL_lose_context')?.loseContext();}
    }};
  }

  function create({ hero, onComplete, revealMs, staggerMs }) {
    const stage=hero.querySelector('.hero-stage'), panel=hero.querySelector('.hero-panel');
    const auxiliary=construction(panel,stage);
    let optics=null;
    const placeholder=document.createElement('div');placeholder.className='hero-intro-curtain';placeholder.setAttribute('aria-hidden','true');stage.prepend(placeholder);
    const root=document.documentElement, events=new AbortController();
    const scene=hero.querySelector('.hero-scene'); let disposed=false,videoStarted=false;
    const cancelWarmup=window.PortfolioHeroPerformance.afterLoadIdle(()=>{
      if(disposed)return;optics=opticalReveal(stage);placeholder.remove();hero.dataset.introRenderer=optics.renderer;
    });
    const timeline=new MasterTimeline(t=>{
      hero.dataset.introTime=String(Math.round(t));
      hero.dataset.intro=t<labels.frameDrawing?'construction':t<labels.lightReveal?'drawing':
        t<labels.contentEntrance?'light-reveal':'content';
      const progress=smooth((t-labels.backgroundReveal)/backgroundRevealMs);
      const light=smooth((t-labels.lightReveal)/160)*(1-smooth((t-labels.backgroundReveal-100)/500));
      if(t>=labels.videoStart&&!videoStarted){videoStarted=true;dispatchEvent(new Event('portfolio:light-reveal'));}
      if(t>=labels.lightReveal){
        if(optics){optics.draw(progress,light);hero.dataset.introField=optics.field;hero.dataset.introPixels=String(optics.pixels);hero.dataset.introFieldFormat=optics.format;}
        else placeholder.style.opacity=String(1-progress);
      }
    },onComplete);
    auxiliary.lines.forEach(({node,group,at})=>{
      timeline.add(node,[{strokeDashoffset:'1'},{strokeDashoffset:'0'}],group==='arc'?1050:group==='mark'?580:850,at,'cubic-bezier(.45,0,.35,1)');
      const fade=labels.constructionFadeOut+{arc:0,diagonal:100,axis:220,mark:310}[group];
      timeline.add(node,[{opacity:group==='mark'?.30:.24},{opacity:0}],group==='mark'?390:500,fade);
    });
    timeline.add(hero.querySelector('.hero-border path'),[{strokeDashoffset:'1'},{strokeDashoffset:'0'}],
      labels.frameHold-labels.frameDrawing,labels.frameDrawing,'cubic-bezier(.55,.01,.3,1)');
    timeline.add(scene,[{filter:'brightness(1.12) saturate(.9) blur(1.5px)'},{filter:'none'}],backgroundRevealMs,labels.backgroundReveal);
    // The title starts at the frame's vertical center, aligned to its left inset.
    const heading=panel.querySelector('.hero-heading'),title=heading.querySelector('.hero-reveal');
    const centerY=panel.clientHeight/2-heading.offsetTop-heading.offsetHeight/2;
    const centered=`translate3d(0,${centerY}px,0)`;
    timeline.add(title,[{opacity:0,filter:'blur(5px)',transform:centered},
      {opacity:1,filter:'blur(0px)',transform:centered,offset:.28},
      {opacity:1,filter:'blur(0px)',transform:centered,offset:.44},
      {opacity:1,filter:'blur(0px)',transform:'translate3d(0,0,0)'}],1080,labels.titleEntrance);
    const unfold=[{opacity:0,filter:'blur(5px)',transform:'translate3d(0,-14px,0)',clipPath:'inset(0 0 100% 0)'},
      {opacity:1,filter:'blur(0px)',transform:'translate3d(0,0,0)',clipPath:'inset(0 0 0 0)'}];
    timeline.add(panel.querySelector('.hero-philosophy .hero-reveal'),unfold,revealMs,labels.contentEntrance);
    panel.querySelectorAll('.hero-nav-item .hero-reveal').forEach((node,i)=>
      timeline.add(node,unfold,revealMs,labels.contentEntrance+170+i*staggerMs));
    // All three top controls share the same downward motion, start and easing.
    const topEntrance=[{opacity:0,transform:'translate3d(0,-32px,0)'},
      {opacity:1,transform:'translate3d(0,0,0)'}];
    // The author, centered menu and contact now enter together inside the fixed header.
    timeline.add(document.querySelector('.header'),topEntrance,760,labels.contentEntrance);
    timeline.add(hero.querySelector('.hero-bottom'),[{opacity:0},{opacity:1}],600,labels.contentEntrance+170);
    timeline.add(document.querySelector('.section-rail'),[{opacity:0},{opacity:1}],600,labels.contentEntrance+340);
    timeline.duration=Math.max(labels.introComplete,labels.contentEntrance+340+4*staggerMs+revealMs);
    // Hidden photo layers are retained as a fallback without requesting them in video mode.
    const videoMode=Boolean(hero.querySelector('.is-video-scene'));
    if(!videoMode)hero.querySelectorAll('img[data-fallback-src]').forEach(img=>img.src=img.dataset.fallbackSrc);
    // Preserve the sequence while decoding only the immediately visible poster.
    const posterTimeout=setTimeout(()=>{timeline.assetsReady=true;},1000);
    Promise.all([...hero.querySelectorAll(videoMode?'.scene-poster':'.hero-photo img,.hero-light-plane img,.scene-poster')].map(img=>
      img.decode?img.decode().catch(()=>{}):Promise.resolve())).then(()=>{timeline.assetsReady=true;});
    document.addEventListener('visibilitychange',()=>document.hidden?timeline.pause():timeline.play(),{signal:events.signal});
    addEventListener('resize',auxiliary.resize,{passive:true,signal:events.signal});
    hero.dataset.introRenderer='deferred';
    return {
      play() { hero.classList.add('hero-intro-running');root.classList.add('intro-running');root.classList.remove('intro-pending');timeline.play(); },
      finish() {
        if(disposed)return;disposed=true;cancelWarmup();clearTimeout(posterTimeout);events.abort();timeline.finish();optics?.dispose();placeholder.remove();auxiliary.svg.remove();
        clearTimeout(window.portfolioIntroWatchdog);root.classList.remove('intro-pending','intro-running');
      },
      dispose() { this.finish(); }
    };
  }
  window.PortfolioIntro={create,labels,createOpticalField:opticalReveal};
})();
