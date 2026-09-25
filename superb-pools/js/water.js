// Animated pool-water caustics for the hero, drawn with a small WebGL shader.
// Falls back to the CSS gradient on .hero when WebGL is unavailable, renders a
// single still frame for reduced-motion users, and pauses when off screen.
(function () {
  var canvas = document.querySelector('.hero-water');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) { canvas.remove(); return; }

  var vert = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var frag = [
    'precision mediump float;',
    'uniform vec2 r;uniform float t;',
    '#define TAU 6.28318530718',
    'float caustic(vec2 uv,float time){',
    '  vec2 p=mod(uv*TAU,TAU)-250.;vec2 i=p;float c=1.;float inten=.005;',
    '  for(int n=0;n<5;n++){',
    '    float tt=time*(1.-(3.5/float(n+1)));',
    '    i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));',
    '    c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));',
    '  }',
    '  c/=5.;c=1.17-pow(c,1.4);return pow(abs(c),8.);',
    '}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/r.y*.55;',
    '  float time=t*.22+23.;',
    '  float c=caustic(uv,time);',
    '  vec2 st=gl_FragCoord.xy/r;',
    '  vec3 deep=vec3(.035,.20,.25);',
    '  vec3 mid=vec3(.11,.45,.52);',
    '  vec3 shallow=vec3(.30,.66,.70);',
    '  vec3 base=mix(deep,mid,smoothstep(0.,1.,st.y*.9+st.x*.35));',
    '  base=mix(base,shallow,smoothstep(.55,1.2,st.x+st.y*.3)*.55);',
    '  vec3 col=base+vec3(.75,.92,.9)*clamp(c,0.,1.)*.55;',
    '  gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = compile(gl.VERTEX_SHADER, vert);
  var fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) { canvas.remove(); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'r');
  var uTime = gl.getUniformLocation(prog, 't');

  // Caustics are soft; rendering below device resolution keeps it cheap on phones.
  var scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
  function resize() {
    var w = Math.max(1, Math.round(canvas.clientWidth * scale));
    var h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true;
  var raf = 0;
  var start = performance.now();

  function draw(now) {
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (!reduced && !raf) raf = requestAnimationFrame(loop); }

  resize();
  draw(start + 4000);
  kick();

  window.addEventListener('resize', function () { resize(); if (reduced) draw(start + 4000); });
  document.addEventListener('visibilitychange', kick);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      kick();
    }).observe(canvas);
  }
})();
