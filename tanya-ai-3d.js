// ================= 3D AI COMPANION (LUNA) =================
(function() {
  let scene, camera, renderer;
  let robotGroup, headMesh, eyeLeft, eyeRight, earLeft, earRight, antennaBall;
  let avatarState = 'idle'; // 'idle' | 'speaking' | 'listening'
  let mouseX = 0, mouseY = 0;
  let isVisible = true;

  window.setAvatarState = function(state) {
    avatarState = state;
  };

  function initAvatar3D() {
    const canvas = document.getElementById('avatarCanvas');
    if(!canvas) return;
    const wrap = canvas.parentElement;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xF39C12, 1.2, 8);
    pointLight.position.set(0, -0.5, 2);
    scene.add(pointLight);

    // Robot Structure
    robotGroup = new THREE.Group();

    // Head
    const headGeo = new THREE.BoxGeometry(1.6, 1.3, 1.2);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.05 });
    headMesh = new THREE.Mesh(headGeo, headMat);
    robotGroup.add(headMesh);

    // Screen Visor
    const visorGeo = new THREE.PlaneGeometry(1.3, 0.85);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x1A2530 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.02, 0.61);
    headMesh.add(visor);

    // Eyes
    const eyeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38EF7D });
    eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.35, 0.04, 0.63);
    eyeLeft.rotation.z = Math.PI / 2;
    headMesh.add(eyeLeft);

    eyeRight = eyeLeft.clone();
    eyeRight.position.set(0.35, 0.04, 0.63);
    headMesh.add(eyeRight);

    // Ears / Headset
    const earGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 24);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xD35400, roughness: 0.3 });
    earLeft = new THREE.Mesh(earGeo, earMat);
    earLeft.rotation.z = Math.PI / 2;
    earLeft.position.set(-0.9, 0, 0);
    headMesh.add(earLeft);

    earRight = earLeft.clone();
    earRight.position.set(0.9, 0, 0);
    headMesh.add(earRight);

    // Antenna
    const antStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 12);
    const antStemMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const antStem = new THREE.Mesh(antStemGeo, antStemMat);
    antStem.position.set(0, 0.8, 0);
    headMesh.add(antStem);

    const antBallGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const antBallMat = new THREE.MeshStandardMaterial({
      color: 0xF39C12, emissive: 0xD35400, emissiveIntensity: 0.6, roughness: 0.1
    });
    antennaBall = new THREE.Mesh(antBallGeo, antBallMat);
    antennaBall.position.set(0, 1.0, 0);
    headMesh.add(antennaBall);

    // Collar
    const collarGeo = new THREE.TorusGeometry(0.6, 0.08, 12, 32);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x26314A, roughness: 0.4 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, -0.85, 0);
    robotGroup.add(collar);

    scene.add(robotGroup);

    // Mouse Tracking
    wrap.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    });
    wrap.addEventListener('mouseleave', () => { mouseX = 0; mouseY = 0; });

    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    });
    observer.observe(wrap);

    window.addEventListener('resize', () => {
      if (!wrap.clientWidth || !wrap.clientHeight) return;
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    });

    animateAvatar();
  }

  function animateAvatar() {
    requestAnimationFrame(animateAvatar);
    if (!isVisible) return;
    const time = Date.now() * 0.003;

    // Idle float
    robotGroup.position.y = Math.sin(time) * 0.08;

    // Head turn
    headMesh.rotation.y += (mouseX * 0.45 - headMesh.rotation.y) * 0.08;
    headMesh.rotation.x += (-mouseY * 0.35 - headMesh.rotation.x) * 0.08;

    // Blink occasionally
    if (Math.random() < 0.012) {
      eyeLeft.scale.y = 0.1; eyeRight.scale.y = 0.1;
      setTimeout(() => { eyeLeft.scale.y = 1; eyeRight.scale.y = 1; }, 130);
    }

    // Reaction modes
    if (avatarState === 'speaking') {
      headMesh.position.y = Math.sin(time * 6) * 0.06;
      headMesh.rotation.z = Math.sin(time * 4) * 0.04;
      eyeLeft.material.color.setHex(0x00E5FF);
      eyeRight.material.color.setHex(0x00E5FF);
      antennaBall.material.emissiveIntensity = 1.0 + Math.sin(time * 10) * 0.5;
    } else if (avatarState === 'listening') {
      headMesh.position.y = 0;
      headMesh.rotation.z = 0.08;
      eyeLeft.material.color.setHex(0xFF4757);
      eyeRight.material.color.setHex(0xFF4757);
      antennaBall.material.emissiveIntensity = 1.3;
    } else {
      headMesh.position.y = 0;
      headMesh.rotation.z = 0;
      eyeLeft.material.color.setHex(0x38EF7D);
      eyeRight.material.color.setHex(0x38EF7D);
      antennaBall.material.emissiveIntensity = 0.5;
    }

    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAvatar3D);
  } else {
    initAvatar3D();
  }
})();
