/* First-visit intro only. Scroll composition and pointer depth stay in hero-motion.js. */
(() => {
  const labels = Object.freeze({ introStart: 0, constructionLines: 300, frameDrawing: 800,
    frameHold: 2200, lightReveal: 2480, backgroundReveal: 2580,
    constructionFadeOut: 3600, contentEntrance: 2580, introComplete: 4400 });
  const backgroundRevealMs = 1400;
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => { const t = clamp(value); return t*t*(3-2*t); };

  // Every native tween is paused and sampled from this one master playhead.
  // No independent CSS timers, delayed callbacks or competing animation clocks.
  class MasterTimeline {
    constructor(onFrame, onComplete) {
      this.time = 0; this.last = null; this.frame = 0; this.tweens = [];
      this.onFrame = onFrame; this.onComplete = onComplete; this.done = false;
      this.assetsReady = false; this.duration = labels.introComplete;
      this.tick = this.tick.bind(this);
    }
    add(node, keyframes, duration, at, easing = 'cubic-bezier(.22,1,.36,1)') {
      if (!node) return;
      const animation = node.animate(keyframes, { duration, delay: at, easing, fill: 'both' });
      animation.pause(); animation.currentTime = 0; this.tweens.push(animation);
    }
    tick(now) {
      this.frame = 0; if (this.done || document.hidden) return;
      if (this.last !== null) this.time += now - this.last;
      this.last = now;
      // Hold the completed frame only when the real photograph is still decoding.
      // Loading begins immediately; a cached image adds no wait to the timeline.
      if (!this.assetsReady && this.time > labels.lightReveal) this.time = labels.lightReveal;
      const t = Math.min(this.time, this.duration);
      this.tweens.forEach(animation => { animation.currentTime = t; });
      this.onFrame(t);
      if (t >= this.duration) this.onComplete();
      else this.frame = requestAnimationFrame(this.tick);
    }
    play() { if (!this.done && !this.frame && !document.hidden) { this.last = null; this.frame = requestAnimationFrame(this.tick); } }
    pause() { cancelAnimationFrame(this.frame); this.frame = 0; this.last = null; }
    finish() { this.done = true; this.pause(); this.tweens.forEach(animation => animation.cancel()); this.tweens = []; }
  }

  function construction(panel, stage) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 361 499');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true'); svg.classList.add('hero-construction');
    // The reference uses golden-ratio corner brackets, frame extensions,
    // two diagonals and opposed circular arcs, rather than a repeated grid.
    const sx = panel.offsetWidth/361, sy = panel.offsetHeight/499;
    const left = panel.offsetLeft-panel.offsetWidth/2, top = panel.offsetTop-panel.offsetHeight/2;
    const x0 = -left/sx, x1 = (stage.clientWidth-left)/sx;
    const y0 = -top/sy, y1 = (stage.clientHeight-top)/sy;
    const r = 451.25, cx = 180.5, cy = 249.5;
    const lines = [
      { d: 'M-223 0H0 M-223 53H-138V0', group: 'mark', at: 300 },
      { d: 'M361 499H584 M499 499V446H584', group: 'mark', at: 360 },
      { d: 'M-171 53V33H-138 M-171 33V20H-158', group: 'mark', at: 430 },
      { d: 'M532 446V466H499 M532 466V479H519', group: 'mark', at: 480 },
      { d: `M${x0} 138H0`, group: 'axis', at: 420 },
      { d: `M361 361H${x1}`, group: 'axis', at: 490 },
      ...[0,cx,361].map((x,i) => ({ d: `M${x} ${y0}V${y1}`, group: 'axis', at: 500+i*60 })),
      { d: `M${x0} ${y0}L${x1} ${y1}`, group: 'diagonal', at: 650 },
      { d: `M${x1} ${y0}L${x0} ${y1}`, group: 'diagonal', at: 710 },
      { d: `M${cx-r} ${cy-r}A${r} ${r} 0 0 0 ${cx+r} ${cy-r}`, group: 'arc', at: 720 },
      { d: `M${cx+r} ${cy+r}A${r} ${r} 0 0 0 ${cx-r} ${cy+r}`, group: 'arc', at: 780 }
    ];
    lines.forEach(line => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', line.d); path.setAttribute('pathLength', '1');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.dataset.group = line.group; svg.append(path); line.node = path;
    });
    function resize() {
      const scaleX=panel.offsetWidth/361,scaleY=panel.offsetHeight/499;
      const panelLeft=panel.offsetLeft-panel.offsetWidth/2,panelTop=panel.offsetTop-panel.offsetHeight/2;
      const minX=-panelLeft/scaleX,maxX=(stage.clientWidth-panelLeft)/scaleX;
      const minY=-panelTop/scaleY,maxY=(stage.clientHeight-panelTop)/scaleY;
      const paths=[`M${minX} 138H0`,`M361 361H${maxX}`,
        ...[0,cx,361].map(x=>`M${x} ${minY}V${maxY}`),
        `M${minX} ${minY}L${maxX} ${maxY}`,`M${maxX} ${minY}L${minX} ${maxY}`];
      paths.forEach((d,i)=>lines[i+4].node.setAttribute('d',d));
    }
    panel.prepend(svg); return { svg, lines, resize };
  }

  // A transparent WebGL veil reveals the EXISTING DOM photograph. No image
  // replacement or duplicate 3D scene: only the moving dissolution boundary is rendered.
  function opticalReveal(stage) {
    const veil = document.createElement('div'); veil.className = 'hero-intro-curtain';
    veil.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas'); veil.append(canvas); stage.prepend(veil);
    const resources = [], events = new AbortController();
    let gl, program, buffer, uniforms, fallback = false, lastSize = '';
    const vertex = `attribute vec2 aPosition;varying vec2 vUv;
      void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
    const fragment = `precision highp float;
      varying vec2 vUv;uniform vec2 uResolution;uniform float uProgress,uLight;
      float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
      float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=a*noise(p);p=p*2.03+vec2(13.7,9.2);a*=.5;}return n;}
      void main(){
        if(uProgress>=1.){gl_FragColor=vec4(0.);return;}
        vec2 uv=vec2(vUv.x,1.-vUv.y), ratio=vec2(uResolution.x/uResolution.y,1.);
        vec2 q=uv*ratio;
        vec2 warp=vec2(fbm(q*3.1+vec2(7.2,1.8)),fbm(q*3.4+vec2(1.3,8.6)));
        float coarse=fbm(q*4.0+warp*2.6+vec2(4.1,9.3));
        float medium=noise(q*32.+warp+vec2(2.7)),detail=noise(q*115.+vec2(8.2));
        float grain=hash(floor(q*750.));
        // Distributed, domain-warped islands merge; there is no directional sweep origin.
        float a=length((uv-vec2(.39,.56))*ratio);
        float b=length((uv-vec2(.65,.32))*ratio);
        float c=length((uv-vec2(.78,.66))*ratio);
        float d=length((uv-vec2(.57,.82))*ratio);
        float distance=min(min(a,b),min(c,d));
        float field=coarse*.88+medium*.08+detail*.035+min(distance,.8)*.28+(grain-.5)*.014;
        float threshold=mix(.25,.95,uProgress);
        float edge=field-threshold;
        float open=(1.-smoothstep(-.008,.014,edge))*smoothstep(.001,.05,uProgress);
        float envelope=smoothstep(.005,.10,uProgress)*(1.-smoothstep(.83,1.,uProgress));
        float texture=mix(.02,1.,smoothstep(.35,.74,noise(q*185.)))*mix(.35,1.,grain);
        float rim=exp(-abs(edge)*155.)*texture*.85*envelope;
        float bloom=exp(-abs(edge)*27.)*.16*envelope;
        float precursor=(exp(-a*a/.024)+exp(-b*b/.018)+exp(-c*c/.035)+exp(-d*d/.015))*uLight*.23;
        float light=rim+bloom+precursor;
        float alpha=clamp(1.-open+light,0.,1.);
        vec3 silver=vec3(1.,.96,.86)*light;
        gl_FragColor=vec4(silver/max(alpha,.0001),alpha);
      }`;
    function gradientFallback() { fallback = true; veil.dataset.renderer = 'gradient'; canvas.remove(); }
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
      uniforms = Object.fromEntries(['uResolution','uProgress','uLight'].map(name=>[name,gl.getUniformLocation(program,name)]));
      veil.dataset.renderer = 'webgl';
      canvas.addEventListener('webglcontextlost', event=>{event.preventDefault();gradientFallback();}, {signal:events.signal});
    } catch (_) { gradientFallback(); }
    function draw(progress, light = 0) {
      if (progress >= 1) { veil.style.visibility = 'hidden'; return; }
      veil.style.visibility = 'visible';
      const w=stage.clientWidth,h=stage.clientHeight;
      if (fallback) {
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
      const scale=Math.min(devicePixelRatio,1.25,1440/w,1000/h);
      const size=`${w}x${h}`;
      if(size!==lastSize){canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));gl.viewport(0,0,canvas.width,canvas.height);lastSize=size;}
      gl.uniform2f(uniforms.uResolution,w,h);
      gl.uniform1f(uniforms.uProgress,progress);gl.uniform1f(uniforms.uLight,light);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
    draw(0);
    return { draw, renderer:veil.dataset.renderer, dispose() {
      events.abort();veil.remove();
      if(gl){resources.forEach(shader=>gl.deleteShader(shader));if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();}
    }};
  }

  function create({ hero, onComplete, revealMs, staggerMs }) {
    const stage=hero.querySelector('.hero-stage'), panel=hero.querySelector('.hero-panel');
    const auxiliary=construction(panel,stage), optics=opticalReveal(stage);
    const root=document.documentElement, events=new AbortController();
    const scene=hero.querySelector('.hero-scene'); let disposed=false;
    const timeline=new MasterTimeline(t=>{
      hero.dataset.introTime=String(Math.round(t));
      hero.dataset.intro=t<labels.frameDrawing?'construction':t<labels.frameHold?'drawing':
        t<labels.lightReveal?'frame-hold':t<labels.contentEntrance?'light-reveal':'content';
      const progress=smooth((t-labels.backgroundReveal)/backgroundRevealMs);
      const light=smooth((t-labels.lightReveal)/160)*(1-smooth((t-labels.backgroundReveal-100)/500));
      if(t>=labels.lightReveal)optics.draw(progress,light);
    },onComplete);
    auxiliary.lines.forEach(({node,group,at})=>{
      timeline.add(node,[{strokeDashoffset:'1'},{strokeDashoffset:'0'}],group==='arc'?700:480,at,'cubic-bezier(.45,0,.35,1)');
      const fade=labels.constructionFadeOut+{arc:0,diagonal:100,axis:220,mark:310}[group];
      timeline.add(node,[{opacity:.105},{opacity:0}],group==='mark'?390:500,fade);
    });
    timeline.add(hero.querySelector('.hero-border path'),[{strokeDashoffset:'1'},{strokeDashoffset:'0'}],
      labels.frameHold-labels.frameDrawing,labels.frameDrawing,'cubic-bezier(.55,.01,.3,1)');
    timeline.add(scene,[{filter:'brightness(1.12) saturate(.9) blur(1.5px)'},{filter:'none'}],backgroundRevealMs,labels.backgroundReveal);
    // Preserve the existing text keyframes, easing, positions and stagger intervals.
    const text=[{opacity:0,filter:'blur(8px)',transform:'translate3d(0,16px,0)'},
      {opacity:1,filter:'blur(0px)',transform:'translate3d(0,0,0)'}];
    timeline.add(panel.querySelector('.hero-heading .hero-reveal'),text,revealMs,labels.contentEntrance);
    timeline.add(panel.querySelector('.hero-philosophy .hero-reveal'),text,revealMs,labels.contentEntrance+170);
    panel.querySelectorAll('.hero-nav-item .hero-reveal').forEach((node,i)=>
      timeline.add(node,text,revealMs,labels.contentEntrance+340+i*staggerMs));
    // All three top controls share the same downward motion, start and easing.
    const topEntrance=[{opacity:0,transform:'translate3d(0,-32px,0)'},
      {opacity:1,transform:'translate3d(0,0,0)'}];
    timeline.add(hero.querySelector('.hero-author .hero-reveal'),topEntrance,760,labels.contentEntrance);
    timeline.add(document.querySelector('.header'),topEntrance,760,labels.contentEntrance);
    timeline.add(hero.querySelector('.hero-bottom'),[{opacity:0},{opacity:1}],600,labels.contentEntrance+170);
    timeline.add(document.querySelector('.section-rail'),[{opacity:0},{opacity:1}],600,labels.contentEntrance+340);
    timeline.duration=Math.max(labels.introComplete,labels.contentEntrance+340+4*staggerMs+revealMs);
    // Decode the fallback and wait for a real video frame during construction.
    const video=hero.querySelector('video');
    const videoReady=video.readyState>=2?Promise.resolve():new Promise(resolve=>{
      const ready=()=>{video.removeEventListener('loadeddata',ready);video.removeEventListener('error',ready);resolve();};
      video.addEventListener('loadeddata',ready,{once:true,signal:events.signal});
      video.addEventListener('error',ready,{once:true,signal:events.signal});
    });
    Promise.all([videoReady,...[...hero.querySelectorAll('.hero-photo img,.hero-light-plane img')].map(img=>
      img.decode?img.decode().catch(()=>{}):Promise.resolve())]).then(()=>{timeline.assetsReady=true;});
    document.addEventListener('visibilitychange',()=>document.hidden?timeline.pause():timeline.play(),{signal:events.signal});
    addEventListener('resize',auxiliary.resize,{passive:true,signal:events.signal});
    hero.dataset.introRenderer=optics.renderer;
    return {
      play() { hero.classList.add('hero-intro-running');root.classList.add('intro-running');root.classList.remove('intro-pending');timeline.play(); },
      finish() {
        if(disposed)return;disposed=true;events.abort();timeline.finish();optics.dispose();auxiliary.svg.remove();
        clearTimeout(window.portfolioIntroWatchdog);root.classList.remove('intro-pending','intro-running');
      },
      dispose() { this.finish(); }
    };
  }
  window.PortfolioIntro={create,labels};
})();
