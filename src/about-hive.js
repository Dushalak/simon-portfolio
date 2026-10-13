/* Native integration of the supplied Hive / ShaderDemo GLSL.
   No framework or dependencies are needed in this static portfolio. */
(() => {
  const canvas = document.querySelector('#about .about-hive');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const section = canvas.closest('#about');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const settings = { speed: .55, saturation: .45, maxPixels: 520000, fps: 30 };
  const heroBudget=window.PortfolioHeroPerformance?.profile;
  if(heroBudget){settings.maxPixels=Math.min(settings.maxPixels,heroBudget.maxPixels);settings.fps=Math.min(settings.fps,heroBudget.shaderFps);}
  const activity=window.PortfolioScrollActivity,dialog=document.querySelector('.case-dialog');
  const tier=heroBudget?.tier||'balanced';
  settings.maxPixels=Math.min(settings.maxPixels,tier==='high'?150000:tier==='balanced'?80000:40000);
  settings.fps=Math.min(settings.fps,tier==='high'?15:tier==='balanced'?12:8);
  let cancelSetup=null,inView=false,prewarmRequested=false;
  const reveal=canvas.parentElement,main=document.querySelector('main');
  const vertex = `#version 300 es
    layout(location=0) in vec2 a_pos;
    void main(){ gl_Position=vec4(a_pos,0.0,1.0); }`;
  const fragment = `#version 300 es
    precision highp float;
    out vec4 fragColor;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_saturation;
    void main(){
      // Shift the field upward in screen space while keeping the canvas full size.
      vec3 FC=vec3(gl_FragCoord.xy-vec2(0.0,u_res.y*.06),0.0);
      vec3 r=vec3(u_res,max(u_res.x,u_res.y));
      float t=u_time;
      vec4 o=vec4(0.0);
      vec3 p=vec3(0.0);
      float i=0.0,z=1.0,d=0.0;
      for(;i++<2e1;
          o+=(cos(2e1*p.y/z+vec4(6.0,1.0,2.0,0.0))+1.0)*d/z/4.0){
        p=z*normalize(FC.rgb*2.0-r.xyy);
        p.x-=t;
        p.xy*=0.4;
        z+=(d=max(p.z+6.0,dot(cos(p.xy),sin(p.yx/0.4))));
      }
      o=tanh(o*o);
      float luminance=dot(o.rgb,vec3(.2126,.7152,.0722));
      fragColor=vec4(mix(vec3(luminance),o.rgb,u_saturation),1.0);
    }`;
  let gl,failed=false;
  let program, buffer, resolution, timeUniform, frame=0, time=2.4, last=0, drawn=0, destroyed=false, lost=false;
  function compile(type, source) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('About Hive shader compilation failed'); }
    return shader;
  }
  function setup() {
    gl ||= canvas.getContext('webgl2', { alpha:false, antialias:false, depth:false, premultipliedAlpha:false });
    if(!gl){failed=true;return false;}
    const shaders=[];
    try {
      shaders.push(compile(gl.VERTEX_SHADER,vertex));
      shaders.push(compile(gl.FRAGMENT_SHADER,fragment));
      program=gl.createProgram(); shaders.forEach(shader=>gl.attachShader(program,shader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('About Hive shader linking failed');
      gl.useProgram(program);
      buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
      resolution=gl.getUniformLocation(program,'u_res'); timeUniform=gl.getUniformLocation(program,'u_time');
      gl.uniform1f(gl.getUniformLocation(program,'u_saturation'),settings.saturation);
      return true;
    } catch(error) { if(buffer)gl.deleteBuffer(buffer); if(program)gl.deleteProgram(program); program=null; return false; }
    finally { shaders.forEach(shader=>gl.deleteShader(shader)); }
  }
  function visible() {
    if (!inView || document.hidden || activity.scrolling || dialog?.open || section.closest('[inert]') || lost || !program || destroyed) return false;
    if (section.dataset.storyMode==='transition' && section.dataset.storyVisible!=='true') return false;
    // IntersectionObserver owns geometry; animation ticks do not query layout.
    return true;
  }
  function resize() {
    if (!program || lost || destroyed) return;
    const rect=canvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,1.25);
    const ratio=Math.min(dpr,Math.sqrt(settings.maxPixels/Math.max(1,rect.width*rect.height)));
    const width=Math.max(1,Math.round(rect.width*ratio)), height=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==width || canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height); gl.uniform2f(resolution,width,height);
    draw();canvas.dataset.hiveState='ready';if(reveal)reveal.dataset.hiveReady='true';update();
  }
  function draw() { if(!program || lost)return; gl.uniform1f(timeUniform,time); gl.drawArrays(gl.TRIANGLES,0,6); }
  function tick(now) {
    frame=0;
    if (!visible() || reduced.matches) {last=0;return;}
    if(last)time+=Math.min(.1,(now-last)/1000)*settings.speed;
    last=now;
    if(now-drawn>=1000/settings.fps){draw();drawn=now;}
    frame=requestAnimationFrame(tick);
  }
  function queueSetup(early=false){
    if(program||cancelSetup||failed||destroyed||lost||document.hidden||activity.scrolling||dialog?.open||main.inert||(!early&&section.closest('[inert]'))||(early&&reduced.matches))return;
    if(!early&&!inView)return;
    canvas.dataset.hiveState='preparing';
    cancelSetup=window.PortfolioHeroPerformance.afterLoadIdle(()=>{
      cancelSetup=null;
      if(program||destroyed||lost||document.hidden||activity.scrolling||dialog?.open||main.inert||(!early&&(!inView||section.closest('[inert]'))))return;
      if(setup())resize();else{failed=true;canvas.dataset.hiveState='fallback';}
    });
  }
  window.PortfolioAboutHive={prepare(){prewarmRequested=true;queueSetup(true);}};
  function update() {
    const approaching=section.dataset.storyVisible==='true'||!matchMedia('(min-width:1000px)').matches||reduced.matches;
    if(prewarmRequested)queueSetup(true);
    else if(approaching)queueSetup();
    if(!visible() || reduced.matches){cancelAnimationFrame(frame);frame=0;last=0;}
    else if(!frame){last=0;frame=requestAnimationFrame(tick);}
  }
  const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting&&entries[0].intersectionRatio>=.35;update();},{threshold:[0,.35]});
  const sizeObserver=new ResizeObserver(resize);
  const modeObserver=new MutationObserver(update);
  function dispose(event) {
    if(event.persisted)return;
    destroyed=true;cancelSetup?.();unsubscribe();cancelAnimationFrame(frame);events.abort();observer.disconnect();sizeObserver.disconnect();modeObserver.disconnect();
    if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);
  }
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;if(reveal)reveal.dataset.hiveReady='false';canvas.dataset.hiveState='fallback';update();},{signal:events.signal});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;if(setup())resize();},{signal:events.signal});
  document.addEventListener('visibilitychange',update,{signal:events.signal});
  reduced.addEventListener('change',()=>{draw();update();},{signal:events.signal});
  addEventListener('resize',resize,{passive:true,signal:events.signal});
  addEventListener('pageshow',resize,{signal:events.signal});
  addEventListener('pagehide',dispose,{signal:events.signal});
  const unsubscribe=activity.subscribe(update);
  observer.observe(canvas);sizeObserver.observe(canvas);modeObserver.observe(section,{attributes:true,attributeFilter:['data-story-mode','data-story-visible']});
  modeObserver.observe(document.querySelector('main'),{attributes:true,attributeFilter:['inert']});
  if(dialog)modeObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
  update();
})();
