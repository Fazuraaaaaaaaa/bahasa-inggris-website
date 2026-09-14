// ======== 3D CYBER AUDIO BOT (pelafalan_3d.js) ========
let scene, camera, renderer, botGroup, head, headphones, soundWaves = [];
let isDragging = false, prevMouseX = 0, prevMouseY = 0;
let pulseActive = false;

function init3D() {
  const canvas = document.getElementById('threeCanvas');
  if (!canvas) return;
  const wrap = canvas.parentElement;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true   });
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  const neonPink = new THREE.PointLight(0xFF0055, 1, 10);
  neonPink.position.set(-2, 2, 2);
  scene.add(neonPink);

  const neonCyan = new THREE.PointLight(0x00F0FF, 1, 10);
  neonCyan.position.set(2, -2, 2);
  scene.add(neonCyan);

  botGroup = new THREE.Group();

  // Materials
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1A1E24, roughness: 0.2, metalness: 0.8   });
  const cyberWhite = new THREE.MeshStandardMaterial({ color: 0xF0F4F8, roughness: 0.3   });
  const glowCyan = new THREE.MeshBasicMaterial({ color: 0x00F0FF   });

  // 1. Head (Sleek Sphere/Capsule)
  const headGeo = new THREE.SphereGeometry(1.0, 32, 32);
  head = new THREE.Mesh(headGeo, cyberWhite);
  botGroup.add(head);

  // Visor (Dark face shield)
  const visorGeo = new THREE.SphereGeometry(1.02, 32, 16, 0, Math.PI, 0, Math.PI/2);
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x050811, roughness: 0.1, metalness: 0.9   });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.rotation.x = Math.PI / 2;
  visor.rotation.y = -Math.PI / 2;
  head.add(visor);

  // Equalizer lines on face
  const eqGeo = new THREE.PlaneGeometry(0.1, 0.4);
  for(let i = -3; i <= 3; i++) {
    const eqBar = new THREE.Mesh(eqGeo, glowCyan);
    eqBar.position.set(i * 0.15, 0, 1.03);
    head.add(eqBar);
  }

  // 2. Cyber Headphones
  headphones = new THREE.Group();
  
  // Arc
  const arcGeo = new THREE.TorusGeometry(1.2, 0.08, 16, 32, Math.PI);
  const arc = new THREE.Mesh(arcGeo, darkMetal);
  arc.position.y = 0.2;
  headphones.add(arc);

  // Ear Cups
  const cupGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
  const cupL = new THREE.Mesh(cupGeo, darkMetal);
  cupL.rotation.z = Math.PI / 2;
  cupL.position.set(-1.1, 0.2, 0);
  headphones.add(cupL);

  const cupR = cupL.clone();
  cupR.position.set(1.1, 0.2, 0);
  headphones.add(cupR);

  // Cup Lights
  const ringGeo = new THREE.TorusGeometry(0.3, 0.04, 16, 32);
  const ringL = new THREE.Mesh(ringGeo, glowCyan);
  ringL.rotation.y = Math.PI / 2;
  ringL.position.set(-1.26, 0.2, 0);
  headphones.add(ringL);

  const ringR = ringL.clone();
  ringR.position.set(1.26, 0.2, 0);
  headphones.add(ringR);

  botGroup.add(headphones);

  // 3. Floating Soundwave Rings
  for(let i=0; i<3; i++) {
    const waveGeo = new THREE.TorusGeometry(1.6 + i*0.4, 0.02, 8, 48);
    const waveMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0   });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.userData = { scale: 1, base: 1.6 + i*0.4 };
    soundWaves.push(wave);
    botGroup.add(wave);
  }

  scene.add(botGroup);

  // Interaction
  wrap.addEventListener('mousedown', (e) => { isDragging = true; prevMouseX = e.clientX; prevMouseY = e.clientY;   });
  window.addEventListener('mouseup', () => { isDragging = false;   });
  window.addEventListener('mousemove', (e) => {
    if(!isDragging) return;
    botGroup.rotation.y += (e.clientX - prevMouseX) * 0.01;
    botGroup.rotation.x += (e.clientY - prevMouseY) * 0.01;
    prevMouseX = e.clientX; prevMouseY = e.clientY;
    });
  const observer = new IntersectionObserver((entries) => { isVisible = entries[0].isIntersecting;   });

  observer.observe(wrap);


  window.addEventListener('resize', () => {
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    });

  animate3D();
}

window.trigger3DPulse = function() {
  pulseActive = true;
  setTimeout(() => pulseActive = false, 2500);
};

function animate3D() {
  requestAnimationFrame(animate3D);
  if (!isVisible) return;
  const t = Date.now() * 0.003;

  if (!isDragging && botGroup) {
    botGroup.rotation.y = Math.sin(t * 0.5) * 0.2;
    botGroup.rotation.x = Math.cos(t * 0.3) * 0.1;
  }

  // Floating
  botGroup.position.y = Math.sin(t) * 0.1;

  // Head nodding slightly (groovy robot)
  head.rotation.x = Math.sin(t * 2) * 0.05;

  // Soundwave trigger
  soundWaves.forEach((w) => {
    if(pulseActive) {
      w.userData.scale += 0.03;
      w.material.opacity = 1 - (w.userData.scale - 1) / 1.5;
      if(w.userData.scale > 2.5) w.userData.scale = 1;
    } else {
      w.userData.scale = 1;
      w.material.opacity = 0;
    }
    w.scale.set(w.userData.scale, w.userData.scale, w.userData.scale);
    });

  renderer.render(scene, camera);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3D);
} else {
  init3D();
}



