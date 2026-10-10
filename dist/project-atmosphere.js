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
    void main(){
      vec2 fragCoord=gl_FragCoord.xy;
      if(iFlipX>0.5)fragCoord.x=iResolution.x-fragCoord.x;
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
      gl_FragColor=color;
    }`;
  const rgb=hex=>hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255);
  window.PortfolioProjectAtmosphere={create(dialog){
    const layer=dialog.querySelector('.case-atmosphere'),canvas=layer.querySelector('canvas');
    const intro=dialog.querySelector('.case-intro'),toolbar=dialog.querySelector('.case-toolbar');
    const media=matchMedia('(prefers-reduced-motion:reduce)'),events=new AbortController();
    let gl,program,buffer,uniforms={},theme,frame=0,lastFrame=0,progress=0,visible=true,lost=false,destroyed=false;
    let shaders=[];
    function setup(){
      try{
        gl ||= canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,depth:false,stencil:false});
        if(!gl)return;
        function compile(type,source){
          const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
          if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw Error('Shader unavailable');}
          shaders.push(shader);return shader;
        }
        program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
        if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader unavailable');
        gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
        const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
        ['iTime','iResolution','iSpeed','iRayColor1','iRayColor2','iIntensity','iSpread','iFlipX','iFlipY','iTilt','iSaturation','iBlend','iFalloff','iOpacity'].forEach(name=>uniforms[name]=gl.getUniformLocation(program,name));
        layer.dataset.renderer='webgl';
      }catch{release();gl=null;layer.dataset.renderer='gradient';}
    }
    function release(){
      if(!gl)return;
      if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);
      shaders.forEach(shader=>gl.deleteShader(shader));shaders=[];buffer=program=null;
    }
    function measure(){
      if(destroyed||!dialog.open)return;
      layer.style.height=(toolbar.offsetHeight+intro.offsetHeight+110)+'px';
      if(!gl||lost)return;
      const dpr=Math.min(devicePixelRatio||1,innerWidth<=720?1:1.5);
      const width=Math.max(1,Math.round(layer.clientWidth*dpr)),height=Math.max(1,Math.round(layer.clientHeight*dpr));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);draw(performance.now());
    }
    function draw(time){
      if(!gl||!program||lost||!theme)return;
      gl.useProgram(program);gl.uniform1f(uniforms.iTime,media.matches?0:time*.001);
      gl.uniform2f(uniforms.iResolution,canvas.width,canvas.height);
      gl.uniform3fv(uniforms.iRayColor1,rgb(theme.rayColor1));gl.uniform3fv(uniforms.iRayColor2,rgb(theme.rayColor2));
      gl.uniform1f(uniforms.iFlipX,theme.origin.endsWith('left')?1:0);gl.uniform1f(uniforms.iFlipY,theme.origin.startsWith('bottom')?1:0);
      ['Speed','Intensity','Spread','Tilt','Saturation','Blend','Falloff','Opacity'].forEach(name=>gl.uniform1f(uniforms['i'+name],theme[name[0].toLowerCase()+name.slice(1)]));
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    const canAnimate=()=>!destroyed&&gl&&!lost&&theme&&dialog.open&&visible&&progress<1&&!document.hidden&&!media.matches;
    function tick(time){
      frame=0;if(!canAnimate()){layer.dataset.motion='paused';return;}
      if(time-lastFrame>=32){draw(time);lastFrame=time;}
      frame=requestAnimationFrame(tick);
    }
    function stop(){cancelAnimationFrame(frame);frame=0;layer.dataset.motion='paused';}
    function sync(){
      if(canAnimate()){if(!frame){layer.dataset.motion='running';frame=requestAnimationFrame(tick);}}
      else{stop();if(media.matches&&dialog.open){draw(0);layer.dataset.motion='static';}}
    }
    const resize=new ResizeObserver(()=>{measure();sync();});resize.observe(intro);resize.observe(toolbar);
    const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{root:dialog,threshold:0});intersection.observe(layer);
    media.addEventListener('change',sync,{signal:events.signal});document.addEventListener('visibilitychange',sync,{signal:events.signal});
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;stop();layer.dataset.renderer='gradient';},{signal:events.signal});
    canvas.addEventListener('webglcontextrestored',()=>{lost=false;program=buffer=null;shaders=[];setup();measure();sync();},{signal:events.signal});
    addEventListener('pagehide',event=>{
      stop();if(event.persisted)return;
      destroyed=true;resize.disconnect();intersection.disconnect();events.abort();release();
    },{signal:events.signal});addEventListener('pageshow',sync,{signal:events.signal});
    return {
      setProject(project){
        theme=project.atmosphere;progress=0;visible=true;dialog.dataset.projectTheme=theme.name;
        layer.style.setProperty('--case-depth',theme.depth);layer.style.setProperty('--case-glow-1',theme.rayColor1+'4a');layer.style.setProperty('--case-glow-2',theme.rayColor2+'66');
        layer.style.setProperty('--case-light-x',theme.origin.endsWith('left')?'18%':'82%');layer.style.opacity='1';
        if(!gl&&!lost){layer.dataset.renderer='gradient';setup();}measure();sync();
      },
      setProgress(value){progress=value;layer.style.opacity=String(1-value*.85);sync();},stop
    };
  }};
})();
