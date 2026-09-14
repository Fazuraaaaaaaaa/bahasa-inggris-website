// ================= 3D ANIME COMPANION (LUNA) =================
(function() {
  let scene, camera, renderer;
  let characterGroup, head, hairGroup, mouth, eyeL, eyeR, eyeL_mesh, eyeR_mesh, blushL, blushR;
  
  let avatarState = 'idle'; // 'idle' | 'speaking' | 'listening'
  let mouseX = 0, mouseY = 0;
  let isVisible = true;
  
  // Audio Analyzer untuk Lip-sync dari volume suara (bukan hardcoded)
  // LunaLive akan memancarkan event volume
  let lipVolume = 0;
  
  // Custom Hook to sync avatar state
  window.setAvatarState = function(state) {
    avatarState = state;
  };
  
  // Terima data volume RMS dari LunaLive
  window.setAvatarLipSync = function(volume) {
    lipVolume = volume; // 0.0 to 1.0 (aprox)
  };

  function initAvatar3D() {
    const canvas = document.getElementById('avatarCanvas');
    if(!canvas) return;
    const wrap = canvas.parentElement;

    scene = new THREE.Scene();
    
    // Kamera pas di wajah
    camera = new THREE.PerspectiveCamera(35, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Pencahayaan Lembut ala Anime (Toon shading butuh light terarah)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xaaddff, 0.6);
    rimLight.position.set(-2, 1, -2);
    scene.add(rimLight);

    // ================== MEMBUAT ANIME LUNA ==================
    characterGroup = new THREE.Group();

    // 1. Kepala (Sphere halus)
    const headGeo = new THREE.SphereGeometry(1, 32, 32);
    const skinMat = new THREE.MeshToonMaterial({ color: 0xFFF0E5 });
    head = new THREE.Mesh(headGeo, skinMat);
    
    // Tarik sedikit agar dagu lancip ala anime
    const positions = headGeo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      if (positions[i+1] < -0.3) {
        positions[i] *= 0.85; // Pipinya ditarik
        positions[i+1] -= 0.15; // Dagu diturunin
      }
    }
    headGeo.computeVertexNormals();
    characterGroup.add(head);

    // 2. Rambut Belakang & Poni (Anime Hair)
    hairGroup = new THREE.Group();
    const hairColor = 0xFF7A59; // Jingga kemerahan (Orange-red hair)
    
    const hairBaseGeo = new THREE.SphereGeometry(1.04, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hairMat = new THREE.MeshToonMaterial({ color: hairColor, side: THREE.DoubleSide });
    const hairBase = new THREE.Mesh(hairBaseGeo, hairMat);
    hairGroup.add(hairBase);

    // Poni depan (Bang strands)
    const createStrand = (w, h, x, y, z, rotZ, rotX) => {
      const geo = new THREE.ConeGeometry(w, h, 8);
      geo.translate(0, -h/2, 0); // Pivot di atas
      const strand = new THREE.Mesh(geo, hairMat);
      strand.position.set(x, y, z);
      strand.rotation.z = rotZ;
      strand.rotation.x = rotX;
      return strand;
    };
    
    hairGroup.add(createStrand(0.25, 0.8, -0.4, 0.9, 0.9, 0.3, 0.2));
    hairGroup.add(createStrand(0.3, 0.9, 0, 0.95, 0.95, 0, 0.2));
    hairGroup.add(createStrand(0.25, 0.8, 0.4, 0.9, 0.9, -0.3, 0.2));
    // Helai samping (Twin tails / side hair)
    hairGroup.add(createStrand(0.35, 1.4, -0.95, 0.6, 0.4, 0.1, 0));
    hairGroup.add(createStrand(0.35, 1.4, 0.95, 0.6, 0.4, -0.1, 0));
    head.add(hairGroup);

    // Ahoge (Rambut berdiri di atas kepala)
    const ahoge = createStrand(0.1, 0.6, 0, 1.0, 0, 0, 0);
    ahoge.rotation.x = -0.5;
    hairGroup.add(ahoge);

    // 3. Mata (Anime Eyes) - Oval
    const eyeBase = new THREE.Group();
    const scleraGeo = new THREE.CircleGeometry(0.2, 32);
    scleraGeo.scale(1, 1.3, 1);
    const scleraMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    
    // Pupil
    const irisGeo = new THREE.CircleGeometry(0.13, 32);
    irisGeo.scale(1, 1.25, 1);
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x2E86C1 }); // Biru Laut
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.z = 0.01;
    sclera.add(iris);
    
    // Pupil hitam
    const pupilGeo = new THREE.CircleGeometry(0.06, 16);
    pupilGeo.scale(1, 1.3, 1);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1B4F72 });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.z = 0.02;
    sclera.add(pupil);
    
    // Highlight putih (Cahaya di mata)
    const highGeo = new THREE.CircleGeometry(0.04, 16);
    const highMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const highlight = new THREE.Mesh(highGeo, highMat);
    highlight.position.set(-0.05, 0.08, 0.03);
    sclera.add(highlight);
    
    const highlight2 = new THREE.Mesh(new THREE.CircleGeometry(0.02, 16), highMat);
    highlight2.position.set(0.06, -0.05, 0.03);
    sclera.add(highlight2);

    // Bulu Mata (Eyelashes)
    const lashGeo = new THREE.RingGeometry(0.2, 0.25, 32, 1, 0, Math.PI);
    lashGeo.scale(1, 1.3, 1);
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
    const lash = new THREE.Mesh(lashGeo, lashMat);
    lash.position.z = 0.04;
    sclera.add(lash);

    eyeL = new THREE.Group();
    eyeL_mesh = sclera.clone();
    eyeL.add(eyeL_mesh);
    eyeL.position.set(-0.35, -0.05, 0.9);
    eyeL.rotation.y = -0.15;
    eyeL.rotation.x = -0.05;
    head.add(eyeL);

    eyeR = new THREE.Group();
    eyeR_mesh = sclera.clone();
    eyeR.add(eyeR_mesh);
    eyeR.position.set(0.35, -0.05, 0.9);
    eyeR.rotation.y = 0.15;
    eyeR.rotation.x = -0.05;
    head.add(eyeR);

    // 4. Mulut (Bisa Lip-sync)
    const mouthGeo = new THREE.CircleGeometry(0.12, 32, 0, Math.PI);
    mouthGeo.scale(1, 0.8, 1);
    mouthGeo.translate(0, -0.12, 0); // Pivot di bibir atas
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xCB4335 }); // Merah Bibir dalam
    mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.4, 0.98);
    mouth.rotation.x = -0.1;
    head.add(mouth);

    // Lidah
    const tongueGeo = new THREE.CircleGeometry(0.08, 16, 0, Math.PI);
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0xF1948A });
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.position.set(0, -0.16, 0.01);
    tongue.scale.set(1, 0.5, 1);
    mouth.add(tongue);

    // 5. Pipi Merona (Blush)
    const blushGeo = new THREE.CircleGeometry(0.15, 16);
    blushGeo.scale(1.5, 0.8, 1);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xFF9999, transparent: true, opacity: 0.6 });
    blushL = new THREE.Mesh(blushGeo, blushMat);
    blushL.position.set(-0.55, -0.3, 0.75);
    blushL.rotation.y = -0.3;
    head.add(blushL);

    blushR = new THREE.Mesh(blushGeo, blushMat);
    blushR.position.set(0.55, -0.3, 0.75);
    blushR.rotation.y = 0.3;
    head.add(blushR);

    // 6. Badan / Baju Sekolah Anime (Sailor uniform)
    const bodyGeo = new THREE.ConeGeometry(0.9, 1.2, 32);
    const bodyMat = new THREE.MeshToonMaterial({ color: 0xECF0F1 }); // Putih
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, -1.5, 0);
    characterGroup.add(body);

    // Kerah Pelaut (Sailor collar)
    const collarGeo = new THREE.TorusGeometry(0.65, 0.1, 16, 32);
    const collarMat = new THREE.MeshToonMaterial({ color: 0x1A5276 }); // Biru Dongker
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, -1, 0);
    collar.rotation.x = Math.PI / 2;
    characterGroup.add(collar);

    // Pita Merah (Ribbon)
    const ribbonGeo = new THREE.SphereGeometry(0.2, 16, 16);
    ribbonGeo.scale(1.5, 0.5, 0.5);
    const ribbonMat = new THREE.MeshToonMaterial({ color: 0xE74C3C });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(0, -1.05, 0.6);
    ribbon.rotation.z = -0.1;
    characterGroup.add(ribbon);

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

    // Bernapas santai (Dada/Badan naik turun dikit)
    characterGroup.position.y = Math.sin(time * 0.8) * 0.04;

    // Gerak Kepala melihat kursor dengan mulus (Lerp)
    head.rotation.y += (mouseX * 0.4 - head.rotation.y) * 0.08;
    head.rotation.x += (-mouseY * 0.3 - head.rotation.x) * 0.08;
    // Rambut belakang sedikit goyang
    hairGroup.rotation.x = Math.sin(time * 0.9) * 0.02;

    // Kedipan Mata (Blink)
    if (Math.random() < 0.01 && eyeL_mesh.scale.y > 0.9) {
      eyeL_mesh.scale.y = 0.1; 
      eyeR_mesh.scale.y = 0.1;
      setTimeout(() => { eyeL_mesh.scale.y = 1; eyeR_mesh.scale.y = 1; }, 150);
    }

    // ================= LIP SYNC & EMOSI =================
    if (avatarState === 'speaking') {
      // Jika model sedang "Speaking", mulut digerakkan berdasarkan Audio Volume (lipVolume)
      // Ditambah random noise halus agar selalu gerak meski volume stabil
      let targetMouthOpen = 0.1 + (lipVolume * 4.5) + (Math.sin(time * 15) * 0.1);
      
      // Batasi bukaan mulut
      if (targetMouthOpen < 0.1) targetMouthOpen = 0.1;
      if (targetMouthOpen > 1.2) targetMouthOpen = 1.2;

      mouth.scale.y += (targetMouthOpen - mouth.scale.y) * 0.3; // Mulut buka tutup
      mouth.scale.x = 0.8 + (targetMouthOpen * 0.2); // Sedikit melebar
      
      // Sedikit gerak kepala waktu ngomong
      head.position.y = Math.sin(time * 6) * 0.015;
      
      blushL.material.opacity = 0.8;
      blushR.material.opacity = 0.8;
      
    } else if (avatarState === 'listening') {
      // Ngatup mulut
      mouth.scale.y += (0.05 - mouth.scale.y) * 0.2;
      mouth.scale.x = 0.6;
      head.position.y = 0;
      
      // Pipi lebih merona
      blushL.material.opacity = 0.9;
      blushR.material.opacity = 0.9;
      // Kepala agak miring sedikit (mendengarkan)
      head.rotation.z += (0.05 - head.rotation.z) * 0.1;

    } else { // 'idle'
      // Mulut tertutup biasa tersenyum kecil
      mouth.scale.y += (0.05 - mouth.scale.y) * 0.1;
      mouth.scale.x = 0.7;
      head.position.y = 0;
      blushL.material.opacity = 0.5;
      blushR.material.opacity = 0.5;
      head.rotation.z += (0 - head.rotation.z) * 0.1;
    }

    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAvatar3D);
  } else {
    initAvatar3D();
  }
})();
