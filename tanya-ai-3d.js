// ================= 3D CHIBI HOLOGRAM COMPANION (LUNA) =================
(function() {
  let scene, camera, renderer;
  let characterGroup, head, mouth, eyeL, eyeR, eyeL_mesh, eyeR_mesh;
  let isVisible = true;
  let mouseX = 0, mouseY = 0;

  // Sync state
  let avatarState = 'idle';
  window.setAvatarState = function(state) {
    avatarState = state;
  };

  // Baca Audio Analyser (60FPS Lip-Sync)
  let freqData = null;
  function getLipVolume() {
    if (window.LunaLive && LunaLive.isSpeaking() && LunaLive.getAnalyser()) {
       const ana = LunaLive.getAnalyser();
       if (!freqData || freqData.length !== ana.frequencyBinCount) {
         freqData = new Uint8Array(ana.frequencyBinCount);
       }
       ana.getByteFrequencyData(freqData);
       let sum = 0;
       for (let i = 0; i < freqData.length; i++) sum += freqData[i];
       return (sum / (freqData.length * 255));
    }
    return 0;
  }

  function initAvatar3D() {
    const canvas = document.getElementById('avatarCanvas');
    if(!canvas) return;
    const wrap = canvas.parentElement;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Pencahayaan Lembut
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(1, 2, 4);
    scene.add(dirLight);

    // ================== MEMBUAT CHIBI LUNA ==================
    characterGroup = new THREE.Group();

    // 1. Kepala (Flat sphere, gaya ilustrasi pop)
    const headGeo = new THREE.SphereGeometry(1, 32, 32);
    headGeo.scale(1, 0.9, 0.7); // Pipih ala 2.5D
    const skinMat = new THREE.MeshToonMaterial({ color: 0xFFEDDF, roughness: 0.5 });
    head = new THREE.Mesh(headGeo, skinMat);
    characterGroup.add(head);

    // 2. Rambut Belakang (Orange Pastel)
    const hairMat = new THREE.MeshToonMaterial({ color: 0xFF8A65, roughness: 0.8 });
    const hairBackGeo = new THREE.SphereGeometry(1.08, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hairBackGeo.scale(1, 0.9, 0.65);
    const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
    head.add(hairBack);

    // Poni Depan
    const bangGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 32, 1, false, 0, Math.PI);
    bangGeo.scale(1.3, 1, 1.1);
    const bang = new THREE.Mesh(bangGeo, hairMat);
    bang.rotation.x = Math.PI / 2;
    bang.position.set(0, 0.7, 0.3);
    head.add(bang);
    
    // Rambut samping (Tails)
    const createTail = (x, rotZ) => {
      const geo = new THREE.CapsuleGeometry(0.2, 0.8, 16, 16);
      geo.translate(0, -0.4, 0);
      const mesh = new THREE.Mesh(geo, hairMat);
      mesh.position.set(x, 0.2, 0.1);
      mesh.rotation.z = rotZ;
      return mesh;
    };
    head.add(createTail(-1.05, 0.2));
    head.add(createTail(1.05, -0.2));

    // 3. Mata (Stylized, lucu, flat)
    const scleraGeo = new THREE.CircleGeometry(0.25, 32);
    scleraGeo.scale(1, 1.1, 1);
    const scleraMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);

    const irisGeo = new THREE.CircleGeometry(0.18, 32);
    irisGeo.scale(1, 1.1, 1);
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x26C6DA }); // Cyan Cerah
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(0, -0.02, 0.01);
    sclera.add(iris);

    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), new THREE.MeshBasicMaterial({color: 0x1A2530}));
    pupil.position.set(0, -0.02, 0.02);
    sclera.add(pupil);

    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), scleraMat);
    hl.position.set(-0.06, 0.08, 0.03);
    sclera.add(hl);

    // Bulu mata atas tebal
    const lashGeo = new THREE.RingGeometry(0.25, 0.32, 32, 1, 0, Math.PI);
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const lash = new THREE.Mesh(lashGeo, lashMat);
    lash.position.set(0, 0, 0.01);
    sclera.add(lash);

    eyeL = new THREE.Group();
    eyeL_mesh = sclera.clone();
    eyeL.add(eyeL_mesh);
    eyeL.position.set(-0.4, 0.05, 0.65);
    eyeL.rotation.y = -0.15;
    head.add(eyeL);

    eyeR = new THREE.Group();
    eyeR_mesh = sclera.clone();
    eyeR.add(eyeR_mesh);
    eyeR.position.set(0.4, 0.05, 0.65);
    eyeR.rotation.y = 0.15;
    head.add(eyeR);

    // 4. Pipi Merona (Blush)
    const blushGeo = new THREE.CircleGeometry(0.18, 16);
    blushGeo.scale(1.5, 0.8, 1);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xFF8A8A, transparent: true, opacity: 0.6 });
    const blushL = new THREE.Mesh(blushGeo, blushMat);
    blushL.position.set(-0.55, -0.2, 0.6);
    blushL.rotation.y = -0.2;
    head.add(blushL);
    const blushR = blushL.clone();
    blushR.position.set(0.55, -0.2, 0.6);
    blushR.rotation.y = 0.2;
    head.add(blushR);

    // 5. Mulut (Lip-sync Animasi)
    const mouthGroup = new THREE.Group();
    // Bentuk mulut setengah lingkaran
    const mGeo = new THREE.CircleGeometry(0.1, 32, 0, Math.PI);
    mGeo.scale(1, 0.8, 1);
    mGeo.translate(0, -0.1, 0); // Pivot di atas
    mouth = new THREE.Mesh(mGeo, new THREE.MeshBasicMaterial({ color: 0xC0392B }));
    
    const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xF5B7B1 }));
    tongue.position.set(0, -0.12, 0.01);
    tongue.scale.set(1, 0.6, 1);
    mouth.add(tongue);
    
    mouth.position.set(0, 0, 0);
    mouthGroup.add(mouth);

    // Garis senyum (idle)
    const smileLine = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.1, 16, 1, Math.PI, Math.PI), new THREE.MeshBasicMaterial({color: 0x884ea0}));
    smileLine.position.set(0, -0.05, -0.01);
    mouthGroup.add(smileLine);

    mouthGroup.position.set(0, -0.28, 0.7);
    head.add(mouthGroup);

    // 6. Tubuh Kecil (Chibi Body)
    const bodyGroup = new THREE.Group();
    const bGeo = new THREE.ConeGeometry(0.5, 0.8, 32);
    const bMat = new THREE.MeshToonMaterial({ color: 0xFAFAFA }); // Baju Putih
    const body = new THREE.Mesh(bGeo, bMat);
    bodyGroup.add(body);

    const collarGeo = new THREE.TorusGeometry(0.35, 0.08, 16, 32);
    const collar = new THREE.Mesh(collarGeo, new THREE.MeshToonMaterial({ color: 0x34495E }));
    collar.position.set(0, 0.25, 0);
    collar.rotation.x = Math.PI / 2;
    bodyGroup.add(collar);
    
    const ribbon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshToonMaterial({ color: 0xE74C3C }));
    ribbon.scale.set(1.5, 0.6, 0.5);
    ribbon.position.set(0, 0.2, 0.35);
    bodyGroup.add(ribbon);

    bodyGroup.position.set(0, -1.3, 0);
    characterGroup.add(bodyGroup);

    scene.add(characterGroup);

    // ================== EVENT LISTENERS ==================
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

    // Nafas Halus
    characterGroup.position.y = Math.sin(time * 1.5) * 0.02;

    // Gerak Kepala melihat kursor (Smooth Lerp)
    head.rotation.y += (mouseX * 0.3 - head.rotation.y) * 0.1;
    head.rotation.x += (-mouseY * 0.2 - head.rotation.x) * 0.1;
    head.position.y = Math.sin(time * 3) * 0.02;

    // Kedipan Mata Alami
    if (Math.random() < 0.015 && eyeL_mesh.scale.y > 0.9) {
      eyeL_mesh.scale.y = 0.1; 
      eyeR_mesh.scale.y = 0.1;
      setTimeout(() => { eyeL_mesh.scale.y = 1; eyeR_mesh.scale.y = 1; }, 120);
    }

    // ================= LIP SYNC & EMOSI =================
    let lipVolume = getLipVolume();
    
    if (avatarState === 'speaking') {
      // Mulut membuka seiring volume
      let targetMouthOpen = 0.1 + (lipVolume * 4.0);
      if (targetMouthOpen > 1.2) targetMouthOpen = 1.2;

      mouth.scale.y += (targetMouthOpen - mouth.scale.y) * 0.4;
      mouth.scale.x = 0.8 + (targetMouthOpen * 0.2); 
      
      head.rotation.z = Math.sin(time * 8) * 0.03;
      mouth.visible = true;

    } else if (avatarState === 'listening') {
      mouth.scale.y += (0.05 - mouth.scale.y) * 0.2;
      mouth.scale.x = 0.5;
      head.rotation.z += (0.05 - head.rotation.z) * 0.1; // Miring dikit
      if(mouth.scale.y < 0.1) mouth.visible = false;

    } else { // 'idle'
      mouth.scale.y += (0.05 - mouth.scale.y) * 0.2;
      mouth.scale.x = 0.7;
      head.rotation.z += (0 - head.rotation.z) * 0.1;
      if(mouth.scale.y < 0.1) mouth.visible = false;
    }

    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAvatar3D);
  } else {
    initAvatar3D();
  }
})();
