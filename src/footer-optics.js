/* Cache the existing CSS spectra; move their images instead of rebuilding full-page gradients. */
(() => {
  const svgImage=(width,height,body)=>{
    const image=new Image();image.alt='';image.draggable=false;image.setAttribute('aria-hidden','true');
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(height)}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" color-interpolation="sRGB">${body}</svg>`);
    Object.assign(image.style,{position:'absolute',width:width+'px',height:height+'px',maxWidth:'none',pointerEvents:'none',willChange:'transform,opacity'});
    return image;
  };
  const stops=values=>{
    // CSS interpolates translucent gradients in premultiplied color space.
    const points=values.map(([p,color,a],i)=>[p,a?color:(values.slice(i+1).find(v=>v[2])||[...values.slice(0,i)].reverse().find(v=>v[2])||[0,color])[1],a]);
    const result=[];
    points.forEach(([p,color,a],i)=>{
      if(i){const [start,from,alpha]=points[i-1];
        if(alpha&&a&&alpha!==a&&from!==color){
          const c1=from.match(/[\d.]+/g).map(Number),c2=color.match(/[\d.]+/g).map(Number);
          for(let step=1;step<16;step++){const t=step/16,opacity=alpha+(a-alpha)*t;
            result.push([start+(p-start)*t,'rgb('+c1.map((c,j)=>(c*alpha*(1-t)+c2[j]*a*t)/opacity).join(',')+')',opacity]);
          }
        }
      }
      result.push([p,color,a]);
    });
    return result.map(([position,color,opacity])=>`<stop offset="${position}%" stop-color="${color}" stop-opacity="${opacity}"/>`).join('');
  };
  window.PortfolioFooterOptics={create(root){
    const beam=root.querySelector('.bwf-beam'),glow=root.querySelector('.bwf-glow');
    let key='',generation=0,texture=null,spots=[],geometry=null,destroyed=false;
    let last={b:58,x:0,y:0,g:0};
    function update(b,x,y,g){
      last={b,x,y,g};if(!geometry)return;
      const shift=(b-58)*geometry.length/100;
      const transform=`translate3d(${shift*geometry.dx}px,${shift*geometry.dy}px,0)`;
      if(texture.style.transform!==transform)texture.style.transform=transform;
      spots.forEach(({image,left,top})=>{
        const transform=`translate3d(${x+left}px,${y+top}px,0)`;
        if(image.style.transform!==transform)image.style.transform=transform;
        if(image.style.opacity!==String(g))image.style.opacity=String(g);
      });
    }
    function resize(width,height,contentWidth){
      const nextKey=[width,height,contentWidth].join('/');if(key===nextKey||destroyed)return;key=nextKey;
      const current=++generation,style=getComputedStyle(root);
      const read=name=>style.getPropertyValue('--bwf-'+name).trim();
      const color=name=>'rgb('+read(name)+')',strength=Number(read('prism-strength')),power=Number(read('glow-strength'));
      const angle=parseFloat(read('ang'))*Math.PI/180,dx=Math.sin(angle),dy=-Math.cos(angle);
      const length=Math.abs(width*dx)+Math.abs(height*dy),padX=Math.ceil(length*Math.abs(dx)*.34),padY=Math.ceil(length*Math.abs(dy)*.34);
      const w=width+padX*2,h=height+padY*2,cx=width/2+padX,cy=height/2+padY;
      const endpoint=`gradientUnits="userSpaceOnUse" x1="${cx-dx*length/2}" y1="${cy-dy*length/2}" x2="${cx+dx*length/2}" y2="${cy+dy*length/2}"`;
      const clear='rgb(0,0,0)',values=[
        [[26,clear,0],[31,color('cyan'),.06],[33,color('lit'),.07],[35,color('violet'),.045],[40,clear,0]],
        [[52,clear,0],[58,color('lit'),.22],[64,clear,0]],
        [[48,clear,0],[51,color('red'),strength],[52.5,color('orange'),strength],[54,color('yellow'),strength],[55.5,color('green'),strength],[57,color('cyan'),strength],[59.5,color('blue'),strength],[62,color('violet'),strength],[66,clear,0]]
      ];
      const nextTexture=svgImage(w,h,'<defs>'+values.map((values,i)=>`<linearGradient id="g${i}" ${endpoint}>${stops(values)}</linearGradient>`).join('')+'</defs>'+values.map((_,i)=>`<rect width="100%" height="100%" fill="url(#g${i})"/>`).join(''));
      nextTexture.style.left=-padX+'px';nextTexture.style.top=-padY+'px';
      const unit=contentWidth/100;
      // CSS backgrounds paint the first listed layer last, over the layers below it.
      const nextSpots=[['lit',26,26,0,0,.055],['violet',20,20,8,2,power*.55],['cyan',16,24,4,0,power],['red',16,24,-4,0,power*.65]].map(([name,rx,ry,ox,oy,alpha])=>{
        const image=svgImage(rx*unit*2,ry*unit*2,`<defs><radialGradient id="g">${stops([[0,color(name),alpha],[72,clear,0]])}</radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>`);
        image.style.left='0';image.style.top='0';return {image,left:(ox-rx)*unit,top:(oy-ry)*unit};
      });
      Promise.all([nextTexture,...nextSpots.map(s=>s.image)].map(image=>image.decode())).then(()=>{
        if(destroyed||generation!==current)return;
        texture=nextTexture;spots=nextSpots;geometry={dx,dy,length};
        beam.replaceChildren(texture);glow.replaceChildren(...spots.map(s=>s.image));
        beam.classList.add('bwf-optics-cached');glow.classList.add('bwf-optics-cached');
        root.dataset.optics='cached';update(last.b,last.x,last.y,last.g);
      }).catch(()=>{
        if(destroyed||generation!==current)return;
        geometry=null;root.dataset.optics='css';beam.replaceChildren();glow.replaceChildren();beam.classList.remove('bwf-optics-cached');glow.classList.remove('bwf-optics-cached');
        beam.style.setProperty('--bwf-b',last.b+'%');glow.style.setProperty('--bwf-px',last.x+'px');glow.style.setProperty('--bwf-py',last.y+'px');glow.style.setProperty('--bwf-g',String(last.g));
      }); // Keep the original CSS if a browser cannot decode a new image size.
    }
    return {resize,update,dispose(){destroyed=true;generation++;beam.replaceChildren();glow.replaceChildren();beam.classList.remove('bwf-optics-cached');glow.classList.remove('bwf-optics-cached');}};
  }};
})();
