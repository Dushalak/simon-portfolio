/* SideRays shader supplied by the user (React Bits), hosted in the existing
 * buildless site. The rayStrength, spread, falloff and color math are unchanged;
 * native WebGL replaces only the React/OGL lifecycle adapter. */
(() => {
  const vertex=`attribute vec2 position;
    void main(){gl_Position=vec4(position,0.0,1.0);}`;
  const fragment=`precision highp float;
    uniform float iTime;
    uniform vec2 iResolution;
    uniform float iSpeed;
    uniform vec3 iRayColor1;
    uniform vec3 iRayColor2;
    uniform float iIntensity;
    uniform float iSpread;
    uniform float iFlipX;
    uniform float iFlipY;
    uniform float iMirrorPair;
    uniform float iTilt;
    uniform float iSaturation;
    uniform float iBlend;
    uniform float iFalloff;
    uniform float iOpacity;

    float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
      float seedA, float seedB, float speed) {
      vec2 sourceToCoord=coord-raySource;
      float cosAngle=dot(normalize(sourceToCoord),rayRefDirection);
      return clamp((0.45+0.15*sin(cosAngle*seedA+iTime*speed))+
        (0.3+0.2*cos(-cosAngle*seedB+iTime*speed)),0.0,1.0)*
        clamp((iResolution.x-length(sourceToCoord))/iResolution.x,0.5,1.0);
    }
    vec4 sampleRays(vec2 fragCoord){
      if(iFlipY>0.5)fragCoord.y=iResolution.y-fragCoord.y;
      vec2 coord=vec2(fragCoord.x,iResolution.y-fragCoord.y);
      vec2 rayPos=vec2(iResolution.x*1.1,-0.5*iResolution.y);
      float tiltRad=iTilt*3.14159265/180.0;
      float cs=cos(tiltRad),sn=sin(tiltRad);
      vec2 rel=coord-rayPos;
      vec2 tiltedCoord=vec2(rel.x*cs-rel.y*sn,rel.x*sn+rel.y*cs)+rayPos;
      float halfSpread=iSpread*0.275;
      vec2 rayRefDir1=normalize(vec2(cos(0.785398+halfSpread),sin(0.785398+halfSpread)));
      vec2 rayRefDir2=normalize(vec2(cos(0.785398-halfSpread),sin(0.785398-halfSpread)));
      vec4 rays1=vec4(iRayColor1,1.0)*rayStrength(rayPos,rayRefDir1,tiltedCoord,36.2214,21.11349,iSpeed);
      vec4 rays2=vec4(iRayColor2,1.0)*rayStrength(rayPos,rayRefDir2,tiltedCoord,22.3991,18.0234,iSpeed*0.2);
      vec4 color=rays1*(1.0-iBlend)*0.9+rays2*iBlend*0.9;
      float distanceToLight=length(fragCoord.xy-vec2(rayPos.x,iResolution.y-rayPos.y))/iResolution.y;
      float brightness=iIntensity*0.4/pow(max(distanceToLight,0.001),iFalloff);
      color.rgb*=brightness;
      float gray=dot(color.rgb,vec3(0.299,0.587,0.114));
      color.rgb=mix(vec3(gray),color.rgb,iSaturation);
      color.a=max(color.r,max(color.g,color.b))*iOpacity;
      return color;
    }
    void main(){
      vec2 fragCoord=gl_FragCoord.xy;
      if(iFlipX>0.5)fragCoord.x=iResolution.x-fragCoord.x;
      vec4 color=sampleRays(fragCoord);
      if(iMirrorPair>0.5){
        color=(color+sampleRays(vec2(iResolution.x-fragCoord.x,fragCoord.y)))*0.72;
      }
      float alpha=clamp(color.a,0.0,1.0);
      gl_FragColor=vec4(clamp(color.rgb,0.0,1.0)*alpha,alpha);
    }`;
  const rgb=hex=>hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255);
  window.PortfolioProjectAtmosphere={create(dialog){
    const layer=dialog.querySelector('.case-atmosphere'),ending=dialog.querySelector('.case-end');
    const intro=dialog.querySelector('.case-intro'),toolbar=dialog.querySelector('.case-toolbar');
    const media=matchMedia('(prefers-reduced-motion:reduce)'),events=new AbortController();
    const tier=window.PortfolioHeroPerformance?.profile.tier||'balanced';
    const maxPixels=tier==='high'?360000:tier==='balanced'?180000:90000,interval=1000/(tier==='high'?24:tier==='balanced'?18:12);
    const parameters=['Speed','Intensity','Spread','Tilt','Saturation','Blend','Falloff','Opacity'];
    // A single clock/RAF drives the same supplied shader at the two ends of a case.
    // Only a visible surface allocates WebGL or draws; long case pages cost no GPU time.
    const surfaces=[
      {layer,canvas:layer.querySelector('canvas'),bottom:false},
      {layer:ending,canvas:ending.querySelector('.case-end-rays'),bottom:true}
    ].map(surface=>({...surface,gl:null,program:null,buffer:null,uniforms:{},shaders:[],visible:false,lost:false,failed:false,reported:-1,draws:0}));
    let theme,colors,values,frame=0,lastFrame=0,lastTick=0,clock=0,progress=0,destroyed=false,suspended=false,scrolling=false,quietTimer=0;
    function setup(surface){
      if(surface.failed||surface.lost||media.matches)return;
      try{
        const gl=surface.gl ||= surface.canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,depth:false,stencil:false,powerPreference:'low-power'});
        if(!gl){surface.failed=true;return;}
        function compile(type,source){
          const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
          if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw Error('Shader unavailable');}
          surface.shaders.push(shader);return shader;
        }
        const program=surface.program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
        if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader unavailable');
        gl.useProgram(program);surface.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,surface.buffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
        const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
        ['iTime','iResolution','iSpeed','iRayColor1','iRayColor2','iIntensity','iSpread','iFlipX','iFlipY','iMirrorPair','iTilt','iSaturation','iBlend','iFalloff','iOpacity'].forEach(name=>surface.uniforms[name]=gl.getUniformLocation(program,name));
      }catch{release(surface);surface.failed=true;}
    }
    function release(surface){
      const {gl,buffer,program,shaders}=surface;
      if(!gl)return;
      if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);
      shaders.forEach(shader=>gl.deleteShader(shader));surface.shaders=[];surface.buffer=surface.program=null;
    }
    function size(surface){
      const {gl,canvas,layer}=surface;if(!gl||!surface.program||surface.lost)return;
      const dpr=Math.min(devicePixelRatio||1,1,Math.sqrt(maxPixels/Math.max(1,layer.clientWidth*layer.clientHeight)));
      const width=Math.max(1,Math.round(layer.clientWidth*dpr)),height=Math.max(1,Math.round(layer.clientHeight*dpr));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);
    }
    function draw(surface){
      const {gl,program,uniforms,canvas}=surface;if(!gl||!program||surface.lost||!theme)return;
      gl.useProgram(program);gl.uniform1f(uniforms.iTime,clock);
      gl.uniform2f(uniforms.iResolution,canvas.width,canvas.height);
      gl.uniform3fv(uniforms.iRayColor1,colors[0]);gl.uniform3fv(uniforms.iRayColor2,colors[1]);
      gl.uniform1f(uniforms.iFlipX,0);gl.uniform1f(uniforms.iFlipY,surface.bottom?1:0);
      gl.uniform1f(uniforms.iMirrorPair,surface.bottom?1:0);
      for(let i=0;i<parameters.length;i++)gl.uniform1f(uniforms['i'+parameters[i]],values[i]);
      gl.drawArrays(gl.TRIANGLES,0,3);
      surface.draws++;
      if(clock-surface.reported>=1){surface.layer.dataset.rayTime=clock.toFixed(2);surface.layer.dataset.drawCount=String(surface.draws);surface.reported=clock;}
    }
    const visibleSurface=surface=>surface.visible&&(surface.bottom||progress<1);
    const canAnimate=surface=>!destroyed&&!suspended&&!scrolling&&theme&&dialog.open&&visibleSurface(surface)&&surface.program&&!surface.lost&&!document.hidden&&!media.matches;
    function visibility(){
      const bounds=dialog.getBoundingClientRect();
      surfaces.forEach(surface=>{const rect=surface.layer.getBoundingClientRect();surface.visible=rect.bottom>bounds.top&&rect.top<bounds.bottom&&rect.width>0;});
    }
    function measure(){
      if(destroyed||!dialog.open)return;
      layer.style.height=Math.max(dialog.clientHeight,toolbar.offsetHeight+intro.offsetHeight+160)+'px';
      visibility();surfaces.forEach(surface=>{size(surface);if(visibleSurface(surface))draw(surface);});sync();
    }
    function tick(time){
      frame=0;let active=false;for(const surface of surfaces)if(canAnimate(surface)){active=true;break;}if(!active){sync();return;}
      if(lastTick)clock+=Math.min((time-lastTick)*.001,.1);lastTick=time;
      if(time-lastFrame>=interval){for(const surface of surfaces)if(canAnimate(surface))draw(surface);lastFrame=time;}
      frame=requestAnimationFrame(tick);
    }
    function halt(){cancelAnimationFrame(frame);frame=0;lastTick=0;surfaces.forEach(surface=>surface.layer.dataset.motion='paused');}
    function stop(){suspended=true;halt();}
    function sync(){
      let running=false;
      surfaces.forEach(surface=>{
        if(!suspended&&!scrolling&&dialog.open&&theme&&visibleSurface(surface)&&!surface.program&&!document.hidden){setup(surface);size(surface);draw(surface);}
        surface.layer.dataset.renderer=surface.program&&!surface.lost&&!media.matches?'webgl':'gradient';
        const animate=canAnimate(surface);surface.layer.dataset.motion=media.matches?'static':animate?'running':'paused';running ||= animate;
      });
      if(running){if(!frame){lastTick=0;frame=requestAnimationFrame(tick);}}
      else{cancelAnimationFrame(frame);frame=0;lastTick=0;}
    }
    const resize=new ResizeObserver(measure);[intro,toolbar,ending].forEach(el=>resize.observe(el));
    dialog.addEventListener('scroll',()=>{
      if(!scrolling){scrolling=true;halt();}clearTimeout(quietTimer);
      quietTimer=setTimeout(()=>{quietTimer=0;scrolling=false;sync();},140);
    },{passive:true,signal:events.signal});
    const intersection=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{const surface=surfaces.find(surface=>surface.layer===entry.target);surface.visible=entry.isIntersecting;});sync();
    },{root:dialog,threshold:0});surfaces.forEach(surface=>intersection.observe(surface.layer));
    media.addEventListener('change',sync,{signal:events.signal});document.addEventListener('visibilitychange',sync,{signal:events.signal});
    surfaces.forEach(surface=>{
      surface.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();surface.lost=true;sync();},{signal:events.signal});
      surface.canvas.addEventListener('webglcontextrestored',()=>{surface.lost=false;surface.failed=false;surface.program=surface.buffer=null;surface.shaders=[];measure();},{signal:events.signal});
    });
    addEventListener('pagehide',event=>{
      halt();clearTimeout(quietTimer);quietTimer=0;scrolling=false;if(event.persisted)return;
      destroyed=true;resize.disconnect();intersection.disconnect();events.abort();surfaces.forEach(release);
    },{signal:events.signal});addEventListener('pageshow',measure,{signal:events.signal});
    return {
      setProject(project){
        halt();theme=project.atmosphere;colors=[new Float32Array(rgb(theme.rayColor1)),new Float32Array(rgb(theme.rayColor2))];values=parameters.map(name=>theme[name[0].toLowerCase()+name.slice(1)]);progress=clock=0;suspended=false;dialog.dataset.projectTheme=theme.name;
        dialog.style.setProperty('--case-depth',theme.depth);dialog.style.setProperty('--case-glow-1',theme.rayColor1+'55');dialog.style.setProperty('--case-glow-2',theme.rayColor2+'66');
        dialog.style.setProperty('--case-light-x','82%');layer.style.opacity='1';
        surfaces.forEach(surface=>{surface.reported=-1;surface.draws=0;surface.layer.dataset.rayOrigin=surface.bottom?'bottom-pair':'top-right';surface.layer.dataset.rayTime='0';surface.layer.dataset.drawCount='0';});measure();
      },
      setProgress(value){progress=value;layer.style.opacity=String(1-value*.72);visibility();sync();},stop
    };
  }};
})();
