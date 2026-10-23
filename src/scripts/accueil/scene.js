/* Scène 3D de l’ouverture : le logo, puis les mondes Web, IA et Robotique (three.js). */
import * as THREE from 'three';

(function () {
  'use strict';

  /* =========================================================== */
  /* Réglages                                                    */
  /* =========================================================== */
  var COUL = {
    nuit: '#0b1533',
    ivoire: '#f4efe4',
    corail: '#e9674f',
    jade: '#2fa877',
    bleu: '#3f63f2',
    trait: '#3a4156',
  };
  var INERTIE = 0.1;

  /* Champ de vision de la caméra à l’intérieur de chaque monde. */
  var FOV_MONDE = 42;

  /* =========================================================== */
  /* Repli : mouvement réduit ou WebGL absent                     */
  /* =========================================================== */
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl;
  var canvas = document.getElementById('gl');
  try {
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  } catch {
    gl = null;
  }
  if (reduit || !gl || !THREE) {
    document.documentElement.classList.add('sans-3d');
    return;
  }

  /* =========================================================== */
  /* Outils                                                      */
  /* =========================================================== */
  var V = THREE.Vector3;
  var clamp = function (x, a, b) {
    return Math.min(b, Math.max(a, x));
  };
  var lin = function (x, a, b) {
    return clamp((x - a) / (b - a), 0, 1);
  };
  var lisse = function (a, b, x) {
    var t = lin(x, a, b);
    return t * t * (3 - 2 * t);
  };
  var eio = function (t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  var mix = function (a, b, t) {
    return a + (b - a) * t;
  };
  function graine(s) {
    return function () {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Mélange fait en sRGB (comme dans un logiciel de design), pas en espace linéaire.
  function teinte(base, vers, k) {
    var a = new THREE.Color(base).getRGB({}, THREE.SRGBColorSpace);
    var b = new THREE.Color(vers).getRGB({}, THREE.SRGBColorSpace);
    return new THREE.Color().setRGB(
      a.r + (b.r - a.r) * k,
      a.g + (b.g - a.g) * k,
      a.b + (b.b - a.b) * k,
      THREE.SRGBColorSpace,
    );
  }

  /* Aplats ombrés à la main : une couleur fixe par face (+x, −x, +y, −y, +z, −z).
     Pas d’éclairage calculé : les couleurs de la charte restent exactes en face avant. */
  var cacheMat = {};
  function matsBloc(base, cle) {
    cle = cle || base;
    if (cacheMat[cle]) return cacheMat[cle];
    var faces = [
      teinte(base, COUL.nuit, 0.42),
      teinte(base, COUL.nuit, 0.2),
      teinte(base, COUL.ivoire, 0.16),
      teinte(base, COUL.nuit, 0.6),
      new THREE.Color(base),
      teinte(base, COUL.nuit, 0.5),
    ];
    cacheMat[cle] = faces.map(function (c) {
      return new THREE.MeshBasicMaterial({ color: c });
    });
    return cacheMat[cle];
  }
  function bloc(l, h, p, mats) {
    return new THREE.Mesh(new THREE.BoxGeometry(l, h, p), mats);
  }

  /* =========================================================== */
  /* Rendu                                                       */
  /* =========================================================== */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var camera = new THREE.PerspectiveCamera(16, 1, 0.01, 400);

  /* ---------- Scène principale : le logo devenu bloc ---------- */
  var principale = new THREE.Scene();
  principale.background = new THREE.Color(COUL.nuit);
  principale.fog = new THREE.Fog(COUL.nuit, 120, 240);

  // Le carré : face avant exactement en Nuit, il se fond dans le fond comme sur le site.
  var matsCube = [
    teinte(COUL.nuit, COUL.trait, 0.5),
    teinte(COUL.nuit, COUL.trait, 0.8),
    teinte(COUL.nuit, COUL.trait, 1),
    teinte(COUL.nuit, '#000000', 0.25),
    new THREE.Color(COUL.nuit),
    teinte(COUL.nuit, COUL.trait, 0.35),
  ].map(function (c) {
    return new THREE.MeshBasicMaterial({ color: c });
  });
  var cube = bloc(12, 12, 12, matsCube);
  var aretes = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(12.02, 12.02, 12.02)),
    new THREE.LineBasicMaterial({ color: COUL.trait, transparent: true, opacity: 0 }),
  );
  cube.add(aretes);
  principale.add(cube);

  // Les trois bandes restent collées dans le carré (2 × 6 modules, à 3 modules du bord).
  // Leur face avant est mobile : une porte (bleu), une porte de garage (corail), un portail (jade).
  // Derrière, une « fenêtre » montre le monde intérieur en direct : la bande est une entrée, pas un décor.
  var PROF = 12.2;
  var AVANT = 0.1 + PROF / 2; // z de la face avant des bandes
  var cibleRendu = new THREE.WebGLRenderTarget(4, 4);
  var matFenetre = new THREE.ShaderMaterial({
    uniforms: { carte: { value: cibleRendu.texture }, res: { value: new THREE.Vector2(1, 1) } },
    vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'uniform sampler2D carte;\nuniform vec2 res;\nvoid main() {\n  gl_FragColor = texture2D(carte, gl_FragCoord.xy / res);\n  #include <colorspace_fragment>\n}',
  });
  var invisible = new THREE.MeshBasicMaterial({ visible: false });

  var bandes = {};
  ['corail', 'jade', 'bleu'].forEach(function (k, i) {
    var x = -2 + 2 * i;
    var mats = matsBloc(COUL[k]).slice();
    var mobile = k !== 'corail'; // le corail reste plein : on y entre par un portail, depuis le monde bleu
    if (mobile) mats[4] = invisible; // la face avant est remplacée par la façade mobile
    var corps = bloc(2, 6, PROF, mats);
    corps.position.set(x, 0, 0.1);
    principale.add(corps);
    if (mobile) {
      var fenetre = new THREE.Mesh(new THREE.PlaneGeometry(2, 6), matFenetre);
      fenetre.position.set(x, 0, AVANT - 0.14);
      principale.add(fenetre);
    }
    bandes[k] = {
      x: x,
      centre: new V(x, 0, AVANT - 0.14),
      details: [],
      ouvrir: function () {},
    };
  });
  function detail(b, l, h, p, couleur, parent, x, y, z) {
    var m = bloc(l, h, p, matsBloc(couleur));
    m.position.set(x, y, z);
    parent.add(m);
    b.details.push(m);
    return m;
  }

  function hasard(x) {
    var v = Math.sin(x) * 43758.5453;
    return v - Math.floor(v);
  }

  // Bleu · l’écran de pixels : la face est un écran de 8 × 24 pixels. À notre approche il grésille,
  // puis les pixels s’écartent depuis le centre et laissent passer.
  (function () {
    var b = bandes.bleu;
    var COLS = 8,
      RANGS = 24,
      PAS = 0.25;
    var pix = new THREE.InstancedMesh(
      new THREE.BoxGeometry(PAS * 1.01, PAS * 1.01, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      COLS * RANGS,
    );
    principale.add(pix);
    var alea = graine(5);
    var info = [];
    var rmax = Math.hypot(1, 3 * 0.55);
    for (var r = 0; r < RANGS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = -1 + PAS / 2 + c * PAS,
          y = -3 + PAS / 2 + r * PAS;
        var l = Math.hypot(x, y * 0.55) || 1;
        info.push({
          x: x,
          y: y,
          dx: x / l,
          dy: (y * 0.55) / l,
          r: l / rmax,
          loin: 1.2 + alea() * 2.8,
          avance: 0.4 + alea() * 3,
          rx: alea() - 0.5,
          ry: alea() - 0.5,
          rz: alea() - 0.5,
          h: alea(),
        });
      }
    }
    var o3 = new THREE.Object3D();
    var cBleu = new THREE.Color(COUL.bleu),
      cClair = teinte(COUL.bleu, COUL.ivoire, 0.65),
      cSombre = teinte(COUL.bleu, COUL.nuit, 0.45);
    b.ouvrir = function (o, t) {
      t = t || 0;
      var bruit = lisse(0.08, 0.3, t) * (1 - lisse(0.75, 0.95, o));
      var trame = Math.floor(t * 40);
      info.forEach(function (q, i) {
        var d = q.r * 0.45 + q.h * 0.12;
        var m = eio(lin(o, d, d + 0.43));
        o3.position.set(b.x + q.x + q.dx * q.loin * m, q.y + q.dy * q.loin * m, AVANT - 0.06 + q.avance * m);
        o3.rotation.set(q.rx * 3 * m, q.ry * 3 * m, q.rz * 3 * m);
        o3.scale.setScalar(Math.max(0.001, 1 - m));
        o3.updateMatrix();
        pix.setMatrixAt(i, o3.matrix);
        var h = hasard(i * 7.13 + trame * 1.731);
        pix.setColorAt(i, bruit > 0 && h < 0.3 * bruit ? (h < 0.15 * bruit ? cClair : cSombre) : cBleu);
      });
      pix.instanceMatrix.needsUpdate = true;
      if (pix.instanceColor) pix.instanceColor.needsUpdate = true;
    };
  })();

  // Jade · la porte de garage : on ressort par là. Six lames qui montent et s’enroulent sous le
  // plafond de la bande, puis redescendent derrière nous.
  (function () {
    var b = bandes.jade;
    var joint = teinte(COUL.jade, COUL.nuit, 0.45).getStyle();
    var lames = [];
    for (var i = 0; i < 6; i++) {
      var g = new THREE.Group();
      g.add(bloc(2, 1, 0.12, matsBloc(COUL.jade)));
      if (i < 5) detail(b, 2, 0.05, 0.02, joint, g, 0, 0.5, 0.065);
      principale.add(g);
      lames.push({ g: g, tau: i + 0.5 });
    }
    var haut = 2.94,
      z0 = AVANT - 0.06;
    b.ouvrir = function (o) {
      var h = 6.3 * o;
      lames.forEach(function (l) {
        var t = l.tau + h;
        if (t <= 5.5) {
          l.g.position.set(b.x, t - 3, z0);
          l.g.rotation.x = 0;
        } else if (t <= 6.5) {
          // virage : la lame pivote autour du haut de l’ouverture et rentre dans la bande
          var phi = (Math.PI / 2) * (t - 5.5);
          l.g.position.set(b.x, haut - 0.5 * Math.cos(phi), z0 - 0.5 * Math.sin(phi));
          l.g.rotation.x = phi;
        } else {
          l.g.position.set(b.x, haut, z0 - 0.5 - (t - 6.5));
          l.g.rotation.x = Math.PI / 2;
        }
      });
    };
  })();

  function fermerTout() {
    Object.keys(bandes).forEach(function (k) {
      bandes[k].ouvrir(0);
      reveler(bandes[k], 0);
    });
  }
  function reveler(b, k) {
    b.details.forEach(function (d) {
      d.visible = k > 0.001;
      d.scale.setScalar(Math.max(0.001, k));
    });
  }

  function poserLogo(p) {
    fermerTout();
    aretes.material.opacity = 0.9 * lisse(0.06, 0.16, p) * (1 - lisse(0.94, 0.995, p));
  }

  /* ---------- Portails ---------- */
  // Un cadre est un seuil orienté : sa position, et une rotation dont l’axe −z est le sens de la traversée.
  function cadreDepuis(pos, dir) {
    var d = dir.clone().normalize();
    var o = new THREE.Object3D();
    o.position.copy(pos);
    o.lookAt(pos.clone().sub(d));
    return { pos: pos.clone(), q: o.quaternion.clone(), d: d };
  }

  // Portail spatio-temporel : une fenêtre carrée sur le monde suivant, dans un tunnel de cadres carrés
  // qui tournent en sens alternés, avec des éclats aspirés vers le centre. Il prend la couleur du monde
  // où il mène.
  function portailSpatial(scene, cadre, couleur, germe) {
    var g = new THREE.Group();
    g.position.copy(cadre.pos);
    g.quaternion.copy(cadre.q);
    scene.add(g);
    var fen = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), matFenetre);
    g.add(fen);
    var teintes = [
      couleur,
      teinte(couleur, COUL.ivoire, 0.45).getStyle(),
      teinte(couleur, COUL.nuit, 0.25).getStyle(),
    ];
    var cadres = [];
    for (var i = 0; i < 9; i++) {
      var c = new THREE.Group();
      c.position.z = 0.02 + i * 0.6;
      var cote = 6.3 + i * 1.15,
        e = 0.22;
      var m = matsBloc(teintes[i % 3]);
      [
        [0, cote / 2, cote + e, e],
        [0, -cote / 2, cote + e, e],
        [cote / 2, 0, e, cote],
        [-cote / 2, 0, e, cote],
      ].forEach(function (s) {
        var bb = bloc(s[2], s[3], e, m);
        bb.position.set(s[0], s[1], 0);
        c.add(bb);
      });
      g.add(c);
      cadres.push(c);
    }
    var alea = graine(germe);
    var gE = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    var mE = new THREE.MeshBasicMaterial({ color: teinte(couleur, COUL.ivoire, 0.6) });
    var eclats = [];
    for (var k = 0; k < 40; k++) {
      var mm = new THREE.Mesh(gE, mE);
      g.add(mm);
      eclats.push({
        m: mm,
        r0: 3.6 + alea() * 5,
        a0: alea() * 6.28,
        v: 2 + alea() * 3,
        dec: alea(),
        z0: alea() * 5.5,
      });
    }
    return function (o, u) {
      fen.scale.setScalar(Math.max(0.001, eio(lin(o, 0.25, 0.8))));
      cadres.forEach(function (c, i) {
        c.scale.setScalar(Math.max(0.001, eio(lin(o, i * 0.045, 0.45 + i * 0.045))));
        c.rotation.z = (i % 2 ? -1 : 1) * (0.25 + i * 0.12) * (u * 9 + o * 2);
      });
      eclats.forEach(function (e) {
        var f = (u * e.v * 0.8 + e.dec) % 1;
        var r = e.r0 * (1 - f * 0.75);
        var a = e.a0 + f * 5;
        e.m.position.set(Math.cos(a) * r, Math.sin(a) * r, e.z0 * (1 - f));
        e.m.scale.setScalar(Math.max(0.001, lin(o, 0.3, 0.8) * (1 - f)));
        e.m.rotation.set(a, a * 0.7, 0);
      });
    };
  }

  /* ---------- Mondes intérieurs (un par bande) ---------- */
  function nouveauMonde(accent, teinteFond) {
    var s = new THREE.Scene();
    var fond = teinte(COUL.nuit, accent, teinteFond);
    s.background = fond;
    s.fog = new THREE.Fog(fond, 18, 75);
    return s;
  }

  /* 01 · La façade : une façade d’immeuble faite de fenêtres de navigateur qui prennent du relief. */
  var facade = (function () {
    var scene = nouveauMonde(COUL.bleu, 0.13);
    var r = graine(7);
    var COLS = 10,
      RANGS = 6,
      L = 3.2,
      H = 2.1,
      PAS_X = 3.75,
      PAS_Y = 2.65;
    var mur = bloc(
      COLS * PAS_X + 3,
      RANGS * PAS_Y + 3,
      1,
      matsBloc(teinte(COUL.nuit, COUL.bleu, 0.3).getStyle()),
    );
    mur.position.z = -0.7;
    scene.add(mur);

    var gCadre = new THREE.BoxGeometry(L, H, 0.24);
    var gBarre = new THREE.BoxGeometry(L, 0.34, 0.26);
    var gLigne = new THREE.BoxGeometry(1, 0.13, 0.06);
    gLigne.translate(0.5, 0, 0); // ancrée à gauche pour « s’écrire »
    var gImage = new THREE.BoxGeometry(0.95, 0.8, 0.06);
    var mCadre = matsBloc(COUL.bleu);
    var mBarre = matsBloc(teinte(COUL.bleu, COUL.ivoire, 0.45).getStyle());
    var mLigne = new THREE.MeshBasicMaterial({ color: COUL.ivoire });
    var mImage = new THREE.MeshBasicMaterial({ color: teinte(COUL.bleu, COUL.nuit, 0.45) });
    var mImageClaire = new THREE.MeshBasicMaterial({ color: teinte(COUL.bleu, COUL.ivoire, 0.7) });

    var fenetres = [];
    for (var c = 0; c < COLS; c++) {
      for (var y = 0; y < RANGS; y++) {
        var g = new THREE.Group();
        g.position.set((c - (COLS - 1) / 2) * PAS_X, (y - (RANGS - 1) / 2) * PAS_Y, 0);
        g.add(new THREE.Mesh(gCadre, mCadre));
        var barre = new THREE.Mesh(gBarre, mBarre);
        barre.position.y = H / 2 - 0.17;
        g.add(barre);
        var lignes = [];
        [
          [1.55, 0.38],
          [1.05, 0.08],
          [1.3, -0.22],
        ].forEach(function (d) {
          var l = new THREE.Mesh(gLigne, mLigne);
          l.position.set(-1.35, d[1], 0.15);
          l.userData.long = d[0];
          l.scale.x = 0.001;
          g.add(l);
          lignes.push(l);
        });
        var img = new THREE.Mesh(gImage, r() < 0.3 ? mImageClaire : mImage);
        img.position.set(0.9, -0.05, 0.15);
        img.scale.set(0.001, 0.001, 1);
        g.add(img);
        scene.add(g);
        fenetres.push({
          g: g,
          lignes: lignes,
          img: img,
          debut: 0.06 + (c / (COLS - 1)) * 0.5 + r() * 0.14,
          relief: 0.4 + r() * 3.4,
        });
      }
    }

    var chemin = new THREE.CatmullRomCurve3([
      new V(-14.5, 1.4, 6.5),
      new V(-11, 3, 15),
      new V(-1, 5.5, 24),
      new V(10, 3.5, 21),
      new V(15, 1.5, 15),
      new V(15, 1, 6),
    ]);
    var vise = new THREE.CatmullRomCurve3([
      new V(-15.5, 1.2, 0),
      new V(-9, 0.5, 0),
      new V(0, 0, 0),
      new V(11, 0.5, 0),
      new V(15, 1, 0),
      new V(15, 1, -4),
    ]);
    // Au bout de la façade, un portail corail : il mène à la structure.
    var sortie = cadreDepuis(chemin.getPoint(1), vise.getPoint(1).sub(chemin.getPoint(1)));
    var poserPortail = portailSpatial(scene, sortie, COUL.corail, 11);

    function poser(u) {
      fenetres.forEach(function (f) {
        var a = eio(lin(u, f.debut, f.debut + 0.2));
        f.g.position.z = a * f.relief;
        f.lignes.forEach(function (l, i) {
          l.scale.x = Math.max(0.001, l.userData.long * lin(a, i * 0.18, 0.5 + i * 0.18));
        });
        var s = Math.max(0.001, lin(a, 0.35, 0.9));
        f.img.scale.set(s, s, 1);
      });
      poserPortail(lisse(0.5, 0.8, u), u);
      camera.fov = FOV_MONDE;
      camera.position.copy(chemin.getPointAt(u));
      camera.lookAt(vise.getPointAt(u));
    }
    return {
      scene: scene,
      poser: poser,
      entree: cadreDepuis(chemin.getPoint(0), vise.getPoint(0).sub(chemin.getPoint(0))),
      portail: sortie,
    };
  })();

  /* 02 · La structure : une charpente qui se monte, puis les données qui y circulent. */
  var structure = (function () {
    var scene = nouveauMonde(COUL.corail, 0.08);
    var r = graine(21);
    var N = 4,
      PAS = 4.6,
      o = -((N - 1) * PAS) / 2;
    var mPoutre = matsBloc(COUL.corail);
    var mNoeud = matsBloc(teinte(COUL.corail, COUL.ivoire, 0.35).getStyle());
    var mPaquet = new THREE.MeshBasicMaterial({ color: COUL.ivoire });
    var gPoutre = new THREE.BoxGeometry(0.22, 0.22, PAS);
    gPoutre.translate(0, 0, PAS / 2);
    var gNoeud = new THREE.BoxGeometry(0.62, 0.62, 0.62);
    var gPaquet = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    var pt = function (i, j, k) {
      return new V(o + i * PAS, o + j * PAS, o + k * PAS);
    };
    var poutres = [],
      noeuds = [];
    for (var i = 0; i < N; i++)
      for (var j = 0; j < N; j++)
        for (var k = 0; k < N; k++) {
          // La charpente se monte depuis le seuil où l’on entre : on la voit déjà par le garage ouvert.
          var d = pt(i, j, k).distanceTo(new V(1.2, 1.0, 3.2)) / 19;
          var n = new THREE.Mesh(gNoeud, mNoeud);
          n.position.copy(pt(i, j, k));
          n.scale.setScalar(0.001);
          scene.add(n);
          noeuds.push({ m: n, debut: -0.4 + d * 0.85 });
          [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ].forEach(function (ax) {
            if (i + ax[0] >= N || j + ax[1] >= N || k + ax[2] >= N) return;
            var m = new THREE.Mesh(gPoutre, mPoutre);
            m.position.copy(pt(i, j, k));
            if (ax[0]) m.rotation.y = Math.PI / 2;
            if (ax[1]) m.rotation.x = -Math.PI / 2;
            m.scale.z = 0.001;
            scene.add(m);
            poutres.push({ m: m, debut: -0.39 + d * 0.85 + r() * 0.05 });
          });
        }

    // Paquets de données : trajets fixes le long des poutres, avancés par le défilement.
    var paquets = [];
    for (var q = 0; q < 34; q++) {
      var c = [Math.floor(r() * N), Math.floor(r() * N), Math.floor(r() * N)];
      var pts = [pt(c[0], c[1], c[2])];
      for (var e = 0; e < 7; e++) {
        var ax = Math.floor(r() * 3);
        var sens = c[ax] === 0 ? 1 : c[ax] === N - 1 ? -1 : r() < 0.5 ? -1 : 1;
        c[ax] += sens;
        pts.push(pt(c[0], c[1], c[2]));
      }
      var m = new THREE.Mesh(gPaquet, mPaquet);
      m.scale.setScalar(0.001);
      scene.add(m);
      paquets.push({ m: m, pts: pts, dec: r(), vit: 1.4 + r() * 1.2 });
    }

    var chemin = new THREE.CatmullRomCurve3([
      new V(1.2, 1.0, 3.2),
      new V(1.5, 1.5, -3),
      new V(9, 6, -11),
      new V(17, 7, 0),
      new V(9, 3, 12),
      new V(-3, 1, 12),
      new V(-10, 1, 12),
    ]);
    var vise = new THREE.CatmullRomCurve3([
      new V(1.2, 1.0, -4),
      new V(0, 0, -8),
      new V(0, 0, 0),
      new V(0, 0, 0),
      new V(-2, 0.5, 6),
      new V(-10, 1, 12),
      new V(-16, 1, 12),
    ]);
    // Au bout de la charpente, un portail jade : il mène à l’atelier des robots.
    var sortie = cadreDepuis(chemin.getPoint(1), vise.getPoint(1).sub(chemin.getPoint(1)));
    var poserPortail = portailSpatial(scene, sortie, COUL.jade, 23);

    function poser(u) {
      noeuds.forEach(function (n) {
        n.m.scale.setScalar(Math.max(0.001, eio(lin(u, n.debut, n.debut + 0.08))));
      });
      poutres.forEach(function (b) {
        b.m.scale.z = Math.max(0.001, eio(lin(u, b.debut, b.debut + 0.12)));
      });
      var vis = lisse(0.52, 0.6, u);
      paquets.forEach(function (pq) {
        var f = (u * pq.vit + pq.dec) % 1;
        var x = f * (pq.pts.length - 1);
        var i = Math.floor(x);
        pq.m.position.lerpVectors(pq.pts[i], pq.pts[Math.min(i + 1, pq.pts.length - 1)], x - i);
        pq.m.scale.setScalar(Math.max(0.001, vis));
      });
      poserPortail(lisse(0.55, 0.82, u), u);
      camera.fov = FOV_MONDE;
      camera.position.copy(chemin.getPointAt(u));
      camera.lookAt(vise.getPointAt(u));
    }
    return {
      scene: scene,
      poser: poser,
      entree: cadreDepuis(chemin.getPoint(0), vise.getPoint(0).sub(chemin.getPoint(0))),
      portail: sortie,
    };
  })();

  /* 03 · L’extension : un bras robotisé se déplie, saisit une caisse et la range. */
  var extension = (function () {
    var scene = nouveauMonde(COUL.jade, 0.08);
    var grille = new THREE.GridHelper(90, 45, COUL.trait, COUL.trait);
    scene.add(grille);

    var mBras = matsBloc(COUL.jade);
    var mSombre = matsBloc(teinte(COUL.jade, COUL.nuit, 0.35).getStyle());
    var mArt = matsBloc(teinte(COUL.jade, COUL.ivoire, 0.3).getStyle());
    var mCaisse = matsBloc(teinte(COUL.ivoire, COUL.jade, 0.12).getStyle());

    function bras() {
      var racine = new THREE.Group();
      var socle = bloc(4.4, 0.7, 4.4, mSombre);
      socle.position.y = 0.35;
      racine.add(socle);
      var tourelle = new THREE.Group();
      tourelle.position.y = 0.7;
      racine.add(tourelle);
      var t = bloc(2.3, 1.5, 2.3, mBras);
      t.position.y = 0.75;
      tourelle.add(t);
      var epaule = new THREE.Group();
      epaule.position.y = 1.9;
      tourelle.add(epaule);
      epaule.add(bloc(1.7, 1.7, 1.7, mArt));
      var s1 = bloc(1.05, 6, 1.05, mBras);
      s1.position.y = 3;
      epaule.add(s1);
      var coude = new THREE.Group();
      coude.position.y = 6;
      epaule.add(coude);
      coude.add(bloc(1.35, 1.35, 1.35, mArt));
      var s2 = bloc(0.85, 5, 0.85, mBras);
      s2.position.y = 2.5;
      coude.add(s2);
      var poignet = new THREE.Group();
      poignet.position.y = 5;
      coude.add(poignet);
      poignet.add(bloc(1.15, 0.9, 1.15, mArt));
      var doigts = [-1, 1].map(function (s) {
        var d = bloc(0.24, 1.15, 0.7, mSombre);
        d.position.set(0.45 * s, 0.95, 0);
        poignet.add(d);
        return d;
      });
      var pince = new THREE.Object3D();
      pince.position.y = 1.25;
      poignet.add(pince);
      return {
        racine: racine,
        poser: function (lacet, ep, co, ouv) {
          tourelle.rotation.y = lacet;
          epaule.rotation.x = ep;
          coude.rotation.x = co;
          poignet.rotation.x = Math.PI - ep - co; // la pince reste tournée vers le sol
          doigts[0].position.x = -0.32 - 0.3 * ouv;
          doigts[1].position.x = 0.32 + 0.3 * ouv;
        },
        pince: pince,
      };
    }

    var principal = bras();
    scene.add(principal.racine);
    var lointains = [
      [-15, -14, 0.8, 0.12],
      [15, -16, 0.8, 0.22],
      [-30, -34, 0.75, 0.3],
      [30, -36, 0.75, 0.06],
    ].map(function (d) {
      var b = bras();
      b.racine.position.set(d[0], 0, d[1]);
      b.racine.scale.setScalar(d[2]);
      b.racine.rotation.y = d[0] < 0 ? 0.5 : -0.5;
      b.retard = d[3];
      scene.add(b.racine);
      return b;
    });

    // Pose en fonction du temps u : repli → dépli → saisie → lever → rotation → dépose.
    var CLES = [
      // u, lacet, épaule, coude, ouverture
      [0.0, 0.0, -0.05, -2.75, 1],
      [0.18, 0.0, -0.05, -2.75, 1],
      [0.4, 0.0, 0.62, 1.25, 1],
      [0.47, 0.0, 0.62, 1.25, 0],
      [0.6, 0.6, 0.2, 1.0, 0],
      [0.78, 1.75, 0.62, 1.25, 0],
      [0.84, 1.75, 0.62, 1.25, 1],
      [1.0, 1.75, 0.15, 0.6, 1],
    ];
    function pose(u) {
      for (var i = 0; i < CLES.length - 1; i++) {
        var a = CLES[i],
          b = CLES[i + 1];
        if (u <= b[0]) {
          var t = eio(lin(u, a[0], b[0]));
          return [mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t), mix(a[4], b[4], t)];
        }
      }
      var z = CLES[CLES.length - 1];
      return [z[1], z[2], z[3], z[4]];
    }

    // Ajuste le coude de la saisie pour que la pince touche le haut de la caisse.
    var COTE = 1.5;
    function bout(l, e, c) {
      principal.poser(l, e, c, 0);
      principal.racine.updateMatrixWorld(true);
      return principal.pince.getWorldPosition(new V());
    }
    var lo = 0.3,
      hi = 2.4;
    for (var it = 0; it < 40; it++) {
      var mid = (lo + hi) / 2;
      if (bout(0, 0.62, mid).y > COTE) lo = mid;
      else hi = mid;
    }
    [2, 3, 5, 6].forEach(function (i) {
      CLES[i][3] = lo;
    });
    var saisie = bout(0, 0.62, lo);
    var depose = bout(1.75, 0.62, lo);

    var caisse = bloc(COTE, COTE, COTE, mCaisse);
    scene.add(caisse);
    var rangees = [
      [1.7, 0],
      [1.7, 1],
      [-1.7, 0],
    ].map(function (d) {
      var c = bloc(COTE, COTE, COTE, mCaisse);
      var dir = new V(depose.x, 0, depose.z).normalize();
      var cote = new V(-dir.z, 0, dir.x);
      c.position.set(depose.x + cote.x * d[0], COTE / 2 + d[1] * COTE, depose.z + cote.z * d[0]);
      c.rotation.y = 1.75;
      scene.add(c);
      return c;
    });

    var chemin = new THREE.CatmullRomCurve3([
      new V(-5.5, 4, 10.5),
      new V(-13, 3.5, 8),
      new V(-15, 6, -5),
      new V(-4, 8, -13),
      new V(9, 6, -6),
      new V(8, 4, 10),
      new V(0, 4, 14),
      new V(0, 4, 18),
    ]);
    var vise = new THREE.CatmullRomCurve3([
      new V(0, 2.2, 0),
      new V(0, 3, 2),
      new V(0, 4, 1),
      new V(0, 4, 0),
      new V(0, 4, 1),
      new V(0, 3, 0),
      new V(0, 3.6, -2),
      new V(0, 3.8, -4),
    ]);

    function poser(u) {
      var p = pose(u);
      principal.poser(p[0], p[1], p[2], p[3]);
      principal.racine.updateMatrixWorld(true);
      if (u < 0.45) {
        caisse.position.set(saisie.x, COTE / 2, saisie.z);
        caisse.rotation.y = 0;
      } else if (u < 0.82) {
        var b = principal.pince.getWorldPosition(new V());
        caisse.position.set(b.x, b.y - COTE / 2, b.z);
        caisse.rotation.y = p[0];
      } else {
        caisse.position.set(depose.x, COTE / 2, depose.z);
        caisse.rotation.y = 1.75;
      }
      lointains.forEach(function (b) {
        var q = pose(clamp(u - b.retard, 0, 1));
        b.poser(q[0], q[1], q[2], q[3]);
      });
      rangees.forEach(function (c, i) {
        c.visible = u > 0.1 + i * 0.05;
      });
      camera.fov = FOV_MONDE;
      camera.position.copy(chemin.getPointAt(u));
      camera.lookAt(vise.getPointAt(u));
    }
    return {
      scene: scene,
      poser: poser,
      entree: cadreDepuis(chemin.getPoint(0), vise.getPoint(0).sub(chemin.getPoint(0))),
      // on recule hors de l’atelier : ce seuil débouche sur la porte de garage de la bande jade
      sortie: cadreDepuis(chemin.getPoint(1), vise.getPoint(1).sub(chemin.getPoint(1))),
    };
  })();

  // Le voyage, dans l’ordre des métiers : on entre dans le bleu (01, la façade), un portail corail
  // mène à la structure (02), un portail jade à l’extension (03), et l’on ressort par la porte de
  // garage du jade.
  var VOYAGE = [
    { id: 'web', monde: facade, de: 0.27, a: 0.46 },
    { id: 'ia', monde: structure, de: 0.46, a: 0.65 },
    { id: 'robotique', monde: extension, de: 0.65, a: 0.84 },
  ];

  /* =========================================================== */
  /* Caméra de la scène principale                               */
  /* =========================================================== */
  var aspect = 1;
  // Recul supplémentaire en portrait, pour que le logo puis les trois bandes tiennent en largeur.
  var recul = function (o) {
    return Math.max(1, (o ? o.r : 1) / aspect);
  };
  // Poses « orbite » : cible, azimut, élévation, distance, focale.
  // Au repos, le logo est plus petit et plus à droite : le titre du hero garde de l’air.
  var INTRO = { c: new V(0, 0, 0), az: 0, el: 0, d: 100, fov: 16, r: 0.95 };
  var HUBS = [
    { c: new V(0, 0, 4), az: -0.62, el: 0.24, d: 40, fov: 34, r: 1.05 },
    { c: new V(0, 0, 4), az: 0.55, el: 0.15, d: 38, fov: 34, r: 1.05 },
    { c: new V(0, 0.4, 4), az: -0.22, el: 0.42, d: 42, fov: 34, r: 1.05 },
    { c: new V(0, 0, 3), az: 0.35, el: 0.12, d: 46, fov: 30, r: 1.05 },
  ];
  function interp(a, b, t) {
    return {
      c: a.c.clone().lerp(b.c, t),
      az: mix(a.az, b.az, t),
      el: mix(a.el, b.el, t),
      d: mix(a.d, b.d, t),
      fov: mix(a.fov, b.fov, t),
      r: mix(a.r, b.r, t),
    };
  }
  function placer(o) {
    var d = o.d * recul(o);
    camera.position.set(
      o.c.x + d * Math.sin(o.az) * Math.cos(o.el),
      o.c.y + d * Math.sin(o.el),
      o.c.z + d * Math.cos(o.az) * Math.cos(o.el),
    );
    camera.fov = o.fov;
    camera.lookAt(o.c);
  }
  function posOrbite(o) {
    var d = o.d * recul(o);
    return new V(
      o.c.x + d * Math.sin(o.az) * Math.cos(o.el),
      o.c.y + d * Math.sin(o.el),
      o.c.z + d * Math.cos(o.az) * Math.cos(o.el),
    );
  }
  // Approche d’une bande : la caméra se place face à elle, la façade s’ouvre, puis on passe le seuil
  // sans ralentir. À t = 1, la caméra est exactement sur le seuil.
  var RECUL_PORTE = 11;
  function approcher(b, hub, t) {
    var devant = b.centre.clone().add(new V(0, 0, RECUL_PORTE));
    var e = eio(lin(t, 0, 0.45));
    var p0 = posOrbite(hub);
    var p1 = b.centre.clone().add(new V(0, 1.5, RECUL_PORTE + 9));
    var a = (1 - e) * (1 - e),
      bb = 2 * (1 - e) * e,
      c = e * e;
    camera.position.set(
      a * p0.x + bb * p1.x + c * devant.x,
      a * p0.y + bb * p1.y + c * devant.y,
      a * p0.z + bb * p1.z + c * devant.z,
    );
    var s = lin(t, 0.62, 1);
    var seuil = s * s; // on accélère jusqu’au seuil : la vitesse continue de l’autre côté
    if (seuil > 0) camera.position.copy(b.centre).add(new V(0, 0, RECUL_PORTE * (1 - seuil)));
    camera.fov = mix(mix(hub.fov, 36, e), FOV_MONDE, lisse(0.62, 1, t));
    camera.lookAt(hub.c.clone().lerp(b.centre, 1 - Math.pow(1 - lin(t, 0, 0.4), 3)));
  }
  function cadreBande(b) {
    return { pos: b.centre, q: new THREE.Quaternion(), d: new V(0, 0, -1) };
  }

  // Ce que l’on voit à travers un seuil : la caméra est transposée du cadre de départ au cadre
  // d’arrivée (avec un changement d’échelle k), et seul ce qui est au-delà du seuil est rendu.
  var camPortail = new THREE.PerspectiveCamera(40, 1, 0.02, 400);
  function poserSeul(monde, u) {
    var pos = camera.position.clone(),
      quat = camera.quaternion.clone(),
      fov = camera.fov;
    monde.poser(u);
    camera.position.copy(pos);
    camera.quaternion.copy(quat);
    camera.fov = fov;
  }
  function rendreSeuil(f) {
    poserSeul(f.monde, f.u);
    var qi = f.depart.q.clone().invert();
    var rel = camera.position.clone().sub(f.depart.pos).applyQuaternion(qi).multiplyScalar(f.k);
    camPortail.position.copy(f.arrivee.pos).add(rel.applyQuaternion(f.arrivee.q));
    camPortail.quaternion.copy(f.arrivee.q).multiply(qi).multiply(camera.quaternion);
    camPortail.fov = camera.fov;
    camPortail.aspect = camera.aspect;
    if (camera.view && camera.view.enabled) {
      var v = camera.view;
      camPortail.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height);
    } else camPortail.clearViewOffset();
    camPortail.updateProjectionMatrix();
    renderer.clippingPlanes = [new THREE.Plane(f.arrivee.d.clone(), -f.arrivee.d.dot(f.arrivee.pos))];
    renderer.setRenderTarget(cibleRendu);
    renderer.render(f.monde.scene, camPortail);
    renderer.setRenderTarget(null);
    renderer.clippingPlanes = [];
  }

  /* =========================================================== */
  /* Composition d’une image pour une progression p              */
  /* =========================================================== */
  var voile = document.getElementById('voile');
  var indice = document.getElementById('indice');
  var plans = {};
  document.querySelectorAll('#ouverture [data-plan]').forEach(function (el) {
    plans[el.getAttribute('data-plan')] = el;
  });
  var largeur = 1,
    hauteur = 1;

  function afficher(nom, o) {
    var el = plans[nom];
    el.style.opacity = o.toFixed(3);
    el.style.transform =
      (nom === 'final' ? 'translateX(-50%) ' : '') + 'translateY(' + ((1 - o) * 14).toFixed(1) + 'px)';
    el.classList.toggle('est-visible', o > 0.01);
    el.setAttribute('aria-hidden', o > 0.5 ? 'false' : 'true');
  }
  function fenetre(p, a, b, f) {
    return lisse(a, a + f, p) * (1 - lisse(b - f, b, p));
  }

  var dernier = -1;
  function rendre(p) {
    if (p === dernier) return;
    dernier = p;
    poserLogo(p);
    var scene = principale;
    var couleurVoile = COUL.bleu;
    var opVoile = 0;
    var decalX = 0,
      decalY = 0;

    var seuil = null;
    if (p < 0.2) {
      var t = eio(lin(p, 0.06, 0.2));
      placer(interp(INTRO, HUBS[0], t));
      var m = 1 - eio(lin(p, 0.04, 0.14));
      if (aspect > 1.1) decalX = -0.23 * m;
      else decalY = 0.2 * m;
    } else if (p < VOYAGE[0].de) {
      // L’écran de pixels du bleu grésille, puis s’écarte à notre arrivée.
      var tp = lin(p, 0.2, VOYAGE[0].de);
      approcher(bandes.bleu, HUBS[0], tp);
      var ouv = eio(lin(tp, 0.3, 0.8));
      bandes.bleu.ouvrir(ouv, tp);
      if (ouv > 0)
        seuil = { depart: cadreBande(bandes.bleu), arrivee: facade.entree, k: 3, monde: facade, u: 0 };
    } else if (p < VOYAGE[2].a) {
      for (var i = 0; i < VOYAGE.length; i++) {
        var v = VOYAGE[i];
        if (p < v.de || p >= v.a) continue;
        var u = lin(p, v.de, v.a);
        scene = v.monde.scene;
        v.monde.poser(u);
        // Sur grand écran, l’image glisse à droite pour laisser la carte de texte à gauche.
        if (aspect > 1.1)
          decalX = -0.12 * (i === 0 ? lisse(0.03, 0.2, u) : 1) * (i === 2 ? 1 - lisse(0.8, 0.97, u) : 1);
        var suivant = VOYAGE[i + 1];
        if (suivant && u > 0.45)
          seuil = {
            depart: v.monde.portail,
            arrivee: suivant.monde.entree,
            k: 1,
            monde: suivant.monde,
            u: 0,
          };
      }
    } else if (p < 0.92) {
      // On ressort à reculons de la bande jade : la porte de garage se referme devant nous.
      var ts = lin(p, VOYAGE[2].a, 0.92);
      approcher(bandes.jade, HUBS[3], 1 - ts);
      var ouvS = eio(lin(1 - ts, 0.3, 0.7));
      bandes.jade.ouvrir(ouvS);
      reveler(bandes.jade, lisse(0, 0.3, 1 - ts));
      if (ouvS > 0)
        seuil = { depart: cadreBande(bandes.jade), arrivee: extension.sortie, k: 3, monde: extension, u: 1 };
    } else {
      placer(interp(HUBS[3], INTRO, eio(lin(p, 0.92, 0.995))));
    }

    camera.aspect = aspect;
    if (decalX || decalY)
      camera.setViewOffset(largeur, hauteur, decalX * largeur, decalY * hauteur, largeur, hauteur);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    if (seuil) rendreSeuil(seuil);
    renderer.render(scene, camera);

    voile.style.background = couleurVoile;
    voile.style.opacity = opVoile.toFixed(3);
    indice.style.opacity = (1 - lisse(0.005, 0.04, p)).toFixed(3);

    afficher('intro', 1 - lisse(0.05, 0.1, p));
    VOYAGE.forEach(function (v) {
      var l = v.a - v.de;
      afficher(v.id, fenetre(p, v.de + l * 0.06, v.de + l * 0.7, l * 0.06));
    });
  }

  /* =========================================================== */
  /* Défilement, inertie et redimensionnement                    */
  /* =========================================================== */
  var piste = document.getElementById('piste');
  var p = 0,
    cible = 0,
    raf = 0;
  function calculerCible() {
    var debut = piste.getBoundingClientRect().top + window.scrollY;
    var course = piste.offsetHeight - window.innerHeight;
    return course > 0 ? clamp((window.scrollY - debut) / course, 0, 1) : 0;
  }
  function boucle() {
    cible = calculerCible();
    p += (cible - p) * INERTIE;
    if (Math.abs(cible - p) < 0.00005) p = cible;
    rendre(p);
    raf = p !== cible ? requestAnimationFrame(boucle) : 0;
  }
  function relancer() {
    if (!raf) raf = requestAnimationFrame(boucle);
  }
  function redimensionner() {
    var scene = document.getElementById('scene');
    largeur = scene.clientWidth;
    hauteur = scene.clientHeight;
    aspect = largeur / hauteur;
    // En portrait la caméra recule : le brouillard recule avec elle pour garder les couleurs exactes.
    principale.fog.near = 120 * recul({ r: 1.05 });
    principale.fog.far = 240 * recul({ r: 1.05 });
    renderer.setSize(largeur, hauteur, false);
    var taille = renderer.getDrawingBufferSize(new THREE.Vector2());
    cibleRendu.setSize(taille.x, taille.y);
    matFenetre.uniforms.res.value.copy(taille);
    dernier = -1;
    rendre(p);
  }
  window.addEventListener('scroll', relancer, { passive: true });
  window.addEventListener('resize', redimensionner);
  redimensionner();
  p = cible = calculerCible();
  rendre(p);

  // Accès pour les tests et les captures : rendre une progression précise.
  window.__glm = {
    aller: function (x) {
      p = cible = x;
      rendre(x);
    },
    // Position et taille (en pixels, dans la scène) du logo tel que la 3D le dessine au repos :
    // le chargeur s’y pose avant de laisser la place à la 3D.
    logo: function () {
      var d = INTRO.d * recul(INTRO);
      var cote = (12 / (2 * d * Math.tan(THREE.MathUtils.degToRad(INTRO.fov / 2)))) * hauteur;
      return {
        x: (aspect > 1.1 ? 0.73 : 0.5) * largeur,
        y: (aspect > 1.1 ? 0.5 : 0.3) * hauteur,
        cote: cote,
      };
    },
  };
})();
