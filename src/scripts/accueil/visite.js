/* Chorégraphie au défilement : chargeur, sections épinglées, anneau des projets, manège T’as cru. */
(function () {
  'use strict';
  var racine = document.documentElement;
  if (racine.classList.contains('statique')) return;

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
  var $ = function (s, el) {
    return (el || document).querySelector(s);
  };
  var $$ = function (s, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(s));
  };

  /* ============================================================ */
  /* Chargeur : le carré se trace, les bandes montent, puis le    */
  /* logo glisse jusqu’à sa place exacte dans la scène 3D.        */
  /* ============================================================ */
  (function () {
    var chargeur = $('#chargeur');
    var logo = $('#chargeur-logo');
    var fini = false;
    function terminer() {
      if (fini) return;
      fini = true;
      racine.classList.remove('chargement');
      relancer();
      setTimeout(function () {
        chargeur.remove();
      }, 400);
    }
    function poser() {
      if (chargeur.classList.contains('se-pose')) return;
      chargeur.classList.add('se-pose');
      var cible =
        window.__glm && window.__glm.logo && !racine.classList.contains('sans-3d')
          ? window.__glm.logo()
          : null;
      if (cible && window.scrollY < 20) {
        var l = logo.offsetWidth;
        var s = cible.cote / l;
        var tx = cible.x - cible.cote / 2 - window.innerWidth * 0.5;
        var ty = cible.y - cible.cote / 2 - window.innerHeight * 0.46;
        logo.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + s + ')';
        setTimeout(terminer, 950);
      } else {
        logo.style.opacity = '0';
        logo.style.transition = 'opacity 400ms';
        setTimeout(terminer, 450);
      }
    }
    // Une visite reprise en milieu de page n’a pas besoin du chargeur.
    if (window.scrollY > 20) {
      poser();
      terminer();
    } else {
      setTimeout(poser, 2150);
    }
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
      window.addEventListener(
        ev,
        function () {
          if (racine.classList.contains('chargement')) poser();
        },
        { passive: true, once: true },
      );
    });
  })();

  /* ============================================================ */
  /* Moteur : chaque piste a une progression 0 → 1 lissée          */
  /* ============================================================ */
  var scenes = [];
  var raf = 0;
  function enregistrer(el, rendre, mesurer, extra) {
    var s = { el: el, rendre: rendre, mesurer: mesurer || null, p: -1, dernier: -2 };
    if (extra) for (var k in extra) s[k] = extra[k];
    scenes.push(s);
    return s;
  }
  function progression(el) {
    var r = el.getBoundingClientRect();
    var course = el.offsetHeight - window.innerHeight;
    return course > 0 ? clamp(-r.top / course, 0, 1) : 0;
  }
  function boucle() {
    var encore = false;
    var vh = window.innerHeight;
    scenes.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      var c = progression(s.el);
      var proche = r.bottom > -vh * 0.3 && r.top < vh * 1.3;
      if (!proche || s.p < 0) s.p = c;
      else {
        s.p += (c - s.p) * 0.14;
        if (Math.abs(c - s.p) < 0.0002) s.p = c;
        else encore = true;
      }
      if (proche && s.p !== s.dernier) {
        s.dernier = s.p;
        s.rendre(s.p);
      }
    });
    ton();
    var total = document.documentElement.scrollHeight - vh;
    $('#progression').style.transform = 'scaleX(' + (total > 0 ? window.scrollY / total : 0).toFixed(4) + ')';
    raf = encore ? requestAnimationFrame(boucle) : 0;
  }
  function relancer() {
    if (!raf) raf = requestAnimationFrame(boucle);
  }
  function toutMesurer() {
    scenes.forEach(function (s) {
      if (s.mesurer) s.mesurer();
      s.dernier = -2;
    });
    relancer();
  }

  /* La navigation passe en Encre sur les fonds Ivoire. */
  var nav = $('#nav');
  function ton() {
    var y = nav.offsetHeight / 2;
    var fond = 'nuit';
    scenes.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) {
        fond = s.de ? (s.p > 0.5 ? s.vers : s.de) : s.el.getAttribute('data-fond') || fond;
      }
    });
    nav.classList.toggle('ton-ivoire', fond === 'ivoire');
  }

  /* ============================================================ */
  /* Passages : trois bandes montent, la couleur suivante arrive  */
  /* ============================================================ */
  $$('.passage').forEach(function (el) {
    var bandes = $$('.passage__bandes i', el);
    var suivant = $('.passage__suivant', el);
    var mot = $('.passage__mot span', el);
    enregistrer(
      el,
      function (p) {
        bandes.forEach(function (b, i) {
          var d = i * 0.07;
          var y = (1 - eio(lin(p, 0.04 + d, 0.4 + d))) * 100 - eio(lin(p, 0.52 + d, 0.88 + d)) * 100;
          b.style.transform = 'translateY(' + y.toFixed(2) + '%)';
        });
        suivant.style.transform = 'translateY(' + ((1 - eio(lin(p, 0.38, 0.6))) * 100).toFixed(2) + '%)';
        var o = lisse(0.6, 0.8, p) * (1 - lisse(0.93, 1, p));
        mot.style.opacity = o.toFixed(3);
        mot.style.transform = 'translateY(' + ((1 - lisse(0.55, 0.85, p)) * 2).toFixed(2) + 'rem)';
      },
      null,
      { de: el.getAttribute('data-de'), vers: el.getAttribute('data-vers') },
    );
  });

  /* ============================================================ */
  /* Méthode : le rail défile, chaque étape dessine son plan      */
  /* ============================================================ */
  (function () {
    var el = $('#methode');
    var rail = $('.methode__rail', el);
    var mots = $('.mots', el);
    var ligne = $('.methode__ligne span', el);
    var etapes = $$('.etape', el);
    var m = { rail: 0, mots: 0, vw: 1, centres: [] };
    enregistrer(
      el,
      function (p) {
        var pp = lin(p, 0.08, 0.94);
        var x = -pp * m.rail;
        rail.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
        mots.style.transform = 'translate(' + (-pp * m.mots).toFixed(1) + 'px, -50%)';
        ligne.style.transform = 'scaleX(' + pp.toFixed(4) + ')';
        etapes.forEach(function (e, i) {
          var cx = m.centres[i] + x;
          // Chaque étape finit son dessin au centre de l’écran, ou à sa position finale si elle
          // ne l’atteint pas (la dernière s’arrête à droite) : « Accompagner » se termine aussi.
          var q = lin(cx, m.vw * 0.98, Math.min(m.vw * 0.9, Math.max(m.vw * 0.5, m.centres[i] - m.rail + 1)));
          e.style.setProperty('--q', q.toFixed(3));
          e.style.setProperty('--r', lin(q, 0.55, 1).toFixed(3));
        });
      },
      function () {
        m.vw = window.innerWidth;
        m.rail = Math.max(0, rail.scrollWidth - m.vw);
        m.mots = Math.max(0, mots.scrollWidth - m.vw);
        m.centres = etapes.map(function (e) {
          return e.offsetLeft + e.offsetWidth / 2;
        });
      },
    );
  })();

  /* ============================================================ */
  /* Projets : un mur courbe, vu de l’intérieur                   */
  /* ============================================================ */
  (function () {
    var el = $('#projets');
    var anneau = $('#anneau');
    var cartes = $$('.projet', el);
    var ombres = cartes.map(function (c) {
      return $('.projet__ombre', c);
    });
    var compte = $('#compte');
    var m = { R: 1000, A: 30 };

    // Animation des cartes : au survol ou au focus avec une souris, sinon sur la carte de face.
    var survol = window.matchMedia('(hover: hover) and (pointer: fine)');
    var etats = cartes.map(function () {
      return { survol: false, focus: false, face: false, actif: false };
    });
    function majActivite(i) {
      var e = etats[i];
      var actif = survol.matches ? e.survol || e.focus : e.face || e.focus;
      if (actif === e.actif) return;
      e.actif = actif;
      cartes[i].classList.toggle('est-active', actif);
      var video = $('video', cartes[i]);
      if (!video) return;
      if (actif) {
        var lecture = video.play();
        if (lecture) lecture.catch(function () {});
      } else video.pause();
    }
    cartes.forEach(function (c, i) {
      c.addEventListener('pointerenter', function () {
        etats[i].survol = true;
        majActivite(i);
      });
      c.addEventListener('pointerleave', function () {
        etats[i].survol = false;
        majActivite(i);
      });
      c.addEventListener('focusin', function () {
        etats[i].focus = true;
        majActivite(i);
      });
      c.addEventListener('focusout', function () {
        etats[i].focus = false;
        majActivite(i);
      });
    });
    enregistrer(
      el,
      function (p) {
        var phi = mix(-m.A * 0.35, (cartes.length - 1) * m.A + m.A * 0.35, lin(p, 0.05, 0.95));
        anneau.style.transform = 'translateZ(' + m.R + 'px) rotateY(' + phi.toFixed(3) + 'deg)';
        var proche = 0,
          ecart = 999;
        cartes.forEach(function (c, i) {
          var theta = phi - i * m.A;
          c.style.transform = 'rotateY(' + (-i * m.A).toFixed(3) + 'deg) translateZ(' + -m.R + 'px)';
          ombres[i].style.opacity = Math.min(0.7, (Math.abs(theta) / 70) * 0.7).toFixed(3);
          c.inert = Math.abs(theta) > m.A * 0.5;
          if (Math.abs(theta) < ecart) {
            ecart = Math.abs(theta);
            proche = i;
          }
        });
        compte.textContent = ('0' + (proche + 1)).slice(-2);
        var visible = p > 0 && p < 1;
        etats.forEach(function (e, i) {
          e.face = visible && i === proche;
          majActivite(i);
        });
      },
      function () {
        var l = cartes[0].offsetWidth;
        m.R = Math.max(l * 1.9, Math.min(window.innerWidth * 0.75, 1150));
        m.A = (2 * Math.asin(Math.min(0.95, (l / 2 + 28) / m.R)) * 180) / Math.PI;
      },
    );
  })();

  /* ============================================================ */
  /* Équipe : les trois bandes du logo s’étirent ensemble et      */
  /* deviennent trois colonnes, une par associé.                  */
  /* ============================================================ */
  (function () {
    var el = $('#equipe');
    var etage = $('.etage', el);
    var bandes = $$('#trio i');
    var fiches = $$('.associe', el);
    var mobile = window.matchMedia('(max-width: 47.99rem)');
    var depart = [],
      arrivee = [];
    enregistrer(
      el,
      function (p) {
        var W = etage.clientWidth,
          H = etage.clientHeight;
        fiches.forEach(function (f, i) {
          var a = depart[i],
            b = arrivee[i];
          if (!a || !b) return;
          // ouverture légèrement décalée de gauche à droite, fermeture dans l’ordre inverse
          var k =
            eio(lin(p, 0.1 + i * 0.04, 0.34 + i * 0.04)) *
            (1 - eio(lin(p, 0.82 + (2 - i) * 0.03, 0.93 + (2 - i) * 0.03)));
          f.style.visibility = k > 0.001 ? 'visible' : 'hidden';
          var haut = mix(a.top, b.top, k),
            gauche = mix(a.left, b.left, k),
            droite = mix(a.right, b.right, k),
            bas = mix(a.bottom, b.bottom, k);
          f.style.clipPath =
            'inset(' +
            haut.toFixed(1) +
            'px ' +
            (W - droite).toFixed(1) +
            'px ' +
            (H - bas).toFixed(1) +
            'px ' +
            gauche.toFixed(1) +
            'px)';
          var o = lisse(0.34 + i * 0.03, 0.46 + i * 0.03, p) * (1 - lisse(0.76, 0.84, p));
          f.style.setProperty('--o', o.toFixed(3));
          f.inert = o < 0.5;
        });
      },
      function () {
        var base = etage.getBoundingClientRect();
        var W = base.width,
          H = base.height;
        var nav = $('#nav').offsetHeight;
        depart = bandes.map(function (b) {
          var r = b.getBoundingClientRect();
          return {
            top: r.top - base.top,
            left: r.left - base.left,
            right: r.right - base.left,
            bottom: r.bottom - base.top,
          };
        });
        arrivee = bandes.map(function (b, i) {
          if (mobile.matches) {
            var h = (H - nav) / 3;
            return { top: nav + i * h, left: 0, right: W, bottom: nav + (i + 1) * h };
          }
          return { top: 0, left: (i * W) / 3, right: ((i + 1) * W) / 3, bottom: H };
        });
      },
    );
  })();

  /* ============================================================ */
  /* T’as cru ? : le manège des épisodes                          */
  /* ============================================================ */
  (function () {
    var el = $('#tascru');
    var axe = $('#manege');
    var eps = $$('.episode', el);
    var m = { R: 500 };
    enregistrer(
      el,
      function (p) {
        var phi = -20 - p * 300;
        axe.style.transform = 'rotateX(-9deg) rotateY(' + phi.toFixed(2) + 'deg)';
        eps.forEach(function (e, i) {
          var a = i * (360 / eps.length);
          e.style.transform = 'rotateY(' + a + 'deg) translateZ(' + m.R + 'px)';
          // Les cartes vues de dos (à l’arrière du manège) s’effacent.
          var face = Math.cos(((a + phi) * Math.PI) / 180);
          e.style.opacity = (0.18 + 0.82 * lin(face, -0.2, 0.35)).toFixed(3);
        });
      },
      function () {
        var l = eps[0].offsetWidth;
        m.R = (l * 1.08) / (2 * Math.tan(Math.PI / eps.length));
      },
    );
  })();

  /* ============================================================ */
  /* Vision : le cap s’écrit mot à mot, puis les trois principes  */
  /* ============================================================ */
  (function () {
    var el = $('#vision');
    var mots = $$('.vision__cap span', el);
    var principes = $$('.principe', el);
    enregistrer(el, function (p) {
      var pp = lin(p, 0.04, 0.55) * mots.length;
      mots.forEach(function (w, i) {
        w.style.opacity = (0.16 + 0.84 * lin(pp - i, 0, 1)).toFixed(3);
      });
      principes.forEach(function (pr, i) {
        pr.style.setProperty('--o', eio(lin(p, 0.6 + i * 0.08, 0.76 + i * 0.08)).toFixed(3));
      });
    });
  })();

  /* ============================================================ */
  /* Contact, puis le logo se referme                              */
  /* ============================================================ */
  (function () {
    var el = $('#contact');
    var lettres = $$('.contact__titre span', el);
    var corps = $('#contact-corps');
    var autres = $$('.contact__corps > :not(.contact__titre)', el);
    var bandes = $$('.fin .bande', el);
    var nom = $('.fin p', el);
    enregistrer(el, function (p) {
      lettres.forEach(function (l, i) {
        l.style.setProperty('--o', eio(lin(p, 0.02 + i * 0.025, 0.2 + i * 0.025)).toFixed(3));
      });
      var o = lisse(0.16, 0.3, p);
      autres.forEach(function (a) {
        a.style.opacity = o.toFixed(3);
      });
      var sortie = eio(lin(p, 0.5, 0.66));
      corps.style.opacity = (1 - sortie).toFixed(3);
      corps.style.transform = 'translateY(' + (-sortie * 8).toFixed(2) + 'vh)';
      corps.inert = sortie > 0.5;
      bandes.forEach(function (b, i) {
        b.style.transform = 'scaleY(' + eio(lin(p, 0.64 + i * 0.05, 0.82 + i * 0.05)).toFixed(3) + ')';
      });
      nom.style.opacity = lisse(0.84, 0.94, p).toFixed(3);
    });
  })();

  window.addEventListener('scroll', relancer, { passive: true });
  window.addEventListener('resize', toutMesurer);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(toutMesurer);
  toutMesurer();

  // Accès pour les captures : aller à une progression précise d’une section.
  window.__visite = {
    aller: function (sel, p) {
      var el = $(sel);
      var y = el.getBoundingClientRect().top + window.scrollY + p * (el.offsetHeight - window.innerHeight);
      window.scrollTo(0, y);
      scenes.forEach(function (s) {
        s.p = progression(s.el);
        s.dernier = -2;
      });
      boucle();
    },
  };
})();
