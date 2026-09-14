// ======== 3D ASTRO-BOT MASCOT (index_3d.js) ========
let scene, camera, renderer, robotGroup, body, visor, eyes, jetpack, handL, handR, particles = [];
let isVisible = true;
let targetRotationX = 0, targetRotationY = 0;
let mouseX = 0, mouseY = 0;

function init3D() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const wrap = canvas.parentElement;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  

  renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true   });
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  const fillLight = new THREE.PointLight(0x00E5FF, 0.8, 10);
  fillLight.position.set(-2, 0, 3);
  scene.add(fillLight);
  
  const backLight = new THREE.PointLight(0xFF007F, 0.8, 10);
  backLight.position.set(3, -2, -3);
  scene.add(backLight);

  robotGroup = new THREE.Group();

  // Materials
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xF5F7FA, roughness: 0.1, metalness: 0.4   });
  const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.0, metalness: 0.9   });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xFF9F1C, roughness: 0.3, metalness: 0.2   }); // Orange accents
  const glowCyan = new THREE.MeshBasicMaterial({ color: 0x00E5FF   });

  // 1. Main Capsule Body
  const bodyGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.4, 32);
  const topDome = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI*2, 0, Math.PI/2), shellMat);
  topDome.position.y = 0.7;
  const bottomDome = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI*2, 0, Math.PI/2), shellMat);
  bottomDome.rotation.x = Math.PI;
  bottomDome.position.y = -0.7;
  body = new THREE.Mesh(bodyGeo, shellMat);
  body.add(topDome);
  body.add(bottomDome);
  robotGroup.add(body);

  // 2. Visor (Wide Glass Screen)
  const visorGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.6, 32, 1, false, -Math.PI/2.5, Math.PI/(1.25));
  visor = new THREE.Mesh(visorGeo, darkGlassMat);
  visor.position.y = 0.4;
  body.add(visor);

  // 3. Glowing Eyes
  eyes = new THREE.Group();
  eyes.position.set(0, 0.4, 0.73);
  body.add(eyes);

  const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const eyeL = new THREE.Mesh(eyeGeo, glowCyan);
  eyeL.scale.set(1, 1.5, 1);
  eyeL.position.set(-0.25, 0, 0);
  eyeL.rotation.z = Math.PI/2;
  eyes.add(eyeL);

  const eyeR = eyeL.clone();
  eyeR.position.set(0.25, 0, 0);
  eyes.add(eyeR);

  // 4. Headphones / Ear Pods
  const earGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 32);
  const earL = new THREE.Mesh(earGeo, accentMat);
  earL.rotation.z = Math.PI/2;
  earL.position.set(-0.75, 0.4, 0);
  body.add(earL);

  const earR = earL.clone();
  earR.position.set(0.75, 0.4, 0);
  body.add(earR);

  // 5. Floating Hands
  const handGeo = new THREE.SphereGeometry(0.2, 32, 32);
  handL = new THREE.Mesh(handGeo, shellMat);
  handL.position.set(-1.2, -0.2, 0.4);
  robotGroup.add(handL);

  handR = new THREE.Mesh(handGeo, shellMat);
  handR.position.set(1.2, -0.2, 0.4);
  robotGroup.add(handR);
  
  // Hand Accents
  const handRingGeo = new THREE.TorusGeometry(0.22, 0.03, 16, 32);
  const handRingL = new THREE.Mesh(handRingGeo, accentMat);
  handRingL.rotation.x = Math.PI/2;
  handL.add(handRingL);
  const handRingR = handRingL.clone();
  handR.add(handRingR);

  // 6. Jetpack Base
  jetpack = new THREE.Group();
  jetpack.position.set(0, -1.2, 0);
  body.add(jetpack);

  const nozzleGeo = new THREE.CylinderGeometry(0.3, 0.2, 0.2, 16);
  const nozzle = new THREE.Mesh(nozzleGeo, darkGlassMat);
  jetpack.add(nozzle);
  
  const thrustGlowGeo = new THREE.SphereGeometry(0.22, 16, 16);
  const thrustGlow = new THREE.Mesh(thrustGlowGeo, glowCyan);
  thrustGlow.position.y = -0.1;
  jetpack.add(thrustGlow);

  // 7. Floating Orbit Data Cubes
  const cubeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  for(let i=0; i<4; i++) {
    const cube = new THREE.Mesh(cubeGeo, glowCyan);
    cube.userData = { angle: i * Math.PI/2, radius: 1.5, speed: 0.02, floatOffset: i };
    particles.push(cube);
    robotGroup.add(cube);
  }

  robotGroup.position.y = 0.0;
  robotGroup.scale.set(1.0, 1.0, 1.0);
  scene.add(robotGroup);

  // Interactions
  wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    
    targetRotationY = mouseX * 0.4;
    targetRotationX = -mouseY * 0.2;
    });

  wrap.addEventListener('mouseleave', () => {
    targetRotationX = 0; targetRotationY = 0;
    });
  const observer = new IntersectionObserver((entries) => { isVisible = entries[0].isIntersecting;   });

  observer.observe(wrap);


  window.addEventListener('resize', () => {
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      frameCamera();
  });

  frameCamera();

  animate3D();
}

// Auto-frame: jarak kamera dihitung dari ukuran asli model supaya TIDAK terpotong
function frameCamera() {
  const box = new THREE.Box3().setFromObject(robotGroup);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const fov = camera.fov * Math.PI / 180;
  const distV = (size.y / 2) / Math.tan(fov / 2);
  const distH = (size.x / 2) / Math.tan(fov / 2) / camera.aspect;
  const dist = Math.max(distV, distH) * 1.18 + size.z / 2;
  camera.position.set(center.x, center.y, dist);
  camera.lookAt(center.x, center.y, center.z);
}

function animate3D() {
  requestAnimationFrame(animate3D);
  if (!isVisible) return;

  robotGroup.rotation.y += (targetRotationY - robotGroup.rotation.y) * 0.1;
  robotGroup.rotation.x += (targetRotationX - robotGroup.rotation.x) * 0.1;

  const t = Date.now() * 0.003;
  
  // Bobbing animation for the whole robot
  robotGroup.position.y = Math.sin(t) * 0.12;
  
  // Body slight tilt
  body.rotation.z = Math.sin(t * 0.5) * 0.05;
  body.rotation.x = Math.cos(t * 0.7) * 0.05;

  // Blinking
  if (Math.random() < 0.01) {
    eyes.scale.y = 0.1;
    setTimeout(() => { eyes.scale.y = 1; }, 150);
  }

  // Floating hands
  handL.position.y = -0.2 + Math.sin(t * 1.5) * 0.15;
  handL.position.x = -1.2 + Math.cos(t * 1.2) * 0.05;
  handL.rotation.x = Math.sin(t) * 0.5;
  handL.rotation.y += 0.02;

  handR.position.y = -0.2 + Math.cos(t * 1.5) * 0.15;
  handR.position.x = 1.2 + Math.sin(t * 1.2) * 0.05;
  handR.rotation.x = Math.cos(t) * 0.5;
  handR.rotation.y -= 0.02;

  // Jetpack thruster pulse
  const thrustScale = 1.0 + Math.sin(t * 8) * 0.15;
  jetpack.children[1].scale.set(thrustScale, thrustScale, thrustScale);

  // Orbiting data cubes
  particles.forEach((p) => {
    p.userData.angle += p.userData.speed;
    p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
    p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
    p.position.y = Math.sin(t * 2 + p.userData.floatOffset) * 0.3;
    p.rotation.x += 0.03;
    p.rotation.y += 0.04;
    });

  renderer.render(scene, camera);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3D);
} else {
  init3D();
}







