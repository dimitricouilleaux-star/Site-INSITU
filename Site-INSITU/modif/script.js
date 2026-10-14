document.documentElement.classList.add('js');

/* ===== Formulaires : envoi via Formspree =====
   1. Créer un formulaire sur https://formspree.io (e-mail de réception : in-situ@outlook.fr)
   2. Coller ci-dessous l'identifiant du formulaire : la fin de son adresse https://formspree.io/f/xxxxxxxx (ici « xxxxxxxx ») */
const FORMSPREE_ID = 'VOTRE_ID';
async function envoyerFormspree(sujet, paires, piege){
  if (!/^[a-z0-9]{6,}$/i.test(FORMSPREE_ID)) throw new Error('Identifiant Formspree manquant ou invalide : renseigner FORMSPREE_ID.');
  const data = new FormData();
  data.append('_subject', sujet);
  paires.forEach(([, valeur, nom]) => data.append(nom, valeur));
  if (piege) data.append('_gotcha', piege);
  const r = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {method:'POST', body:data, headers:{Accept:'application/json'}});
  if (!r.ok) {
    let detail = ''; try { detail = ((await r.json()).errors || []).map(e => e.message).join(', '); } catch(e){}
    throw new Error('Formspree ' + r.status + (detail ? ' : ' + detail : ''));
  }
}
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Intro animée : le symbole se forme, puis la page apparaît */
const intro = document.getElementById('intro-anim');
let introFinie = false;
function finIntro(){
  if (introFinie) return; introFinie = true;
  intro.classList.add('fin'); document.body.classList.remove('bloque');
  document.documentElement.classList.add('pret');
  try { sessionStorage.setItem('insitu-intro','vue'); } catch(e){}
}
let dejaVue = false; try { dejaVue = sessionStorage.getItem('insitu-intro') === 'vue'; } catch(e){}
if (reduit || dejaVue) { intro.classList.add('fin'); introFinie = true; document.documentElement.classList.add('pret'); }
else { document.body.classList.add('bloque'); setTimeout(finIntro, 2300); intro.addEventListener('click', finIntro); }

/* En-tête */
const entete = document.querySelector('.entete');
const liensNav = [...document.querySelectorAll('.nav a')];
const majEntete = () => entete.classList.toggle('defile', scrollY > innerHeight * .35);
addEventListener('scroll', majEntete, {passive:true}); majEntete();
const ioNav = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) liensNav.forEach(a => a.classList.toggle('actif', a.getAttribute('href') === '#' + e.target.id));
}), {rootMargin:'-45% 0px -50% 0px'});
['projets','apropos','contact'].forEach(id => ioNav.observe(document.getElementById(id)));

/* Apparitions douces */
const ioRev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('attente'); ioRev.unobserve(e.target); } }), {threshold:.12});
document.querySelectorAll('.revele').forEach(el => { if (!reduit && el.getBoundingClientRect().top > innerHeight) { el.classList.add('attente'); ioRev.observe(el); } });

/* Vidéo au survol / lecture auto sur mobile */
document.querySelectorAll('.carte').forEach(c => {
  const v = c.querySelector('video');
  if (!v) { if (matchMedia('(hover: none)').matches) new IntersectionObserver(es => es.forEach(e => c.querySelector('.media').classList.toggle('lecture', e.isIntersecting)), {threshold:.6}).observe(c); return; }
  c.addEventListener('mouseenter', () => { v.currentTime = 0; v.play().catch(()=>{}); });
  c.addEventListener('mouseleave', () => v.pause());
  if (matchMedia('(hover: none)').matches) {
    new IntersectionObserver(es => es.forEach(e => { const m = c.querySelector('.media'); if (e.isIntersecting) { m.classList.add('lecture'); v.play().catch(()=>{}); } else { m.classList.remove('lecture'); v.pause(); } }), {threshold:.6}).observe(c);
  }
});

/* Curseur personnalisé */
const curseur = document.querySelector('.curseur');
if (matchMedia('(pointer: fine)').matches && !reduit) {
  document.body.classList.add('curseur-actif');
  let x = -100, y = -100, cx = x, cy = y;
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; curseur.classList.add('visible'); });
  document.addEventListener('mouseleave', () => curseur.classList.remove('visible'));
  (function boucle(){ cx += (x - cx) * .22; cy += (y - cy) * .22; curseur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(boucle); })();
  document.addEventListener('mouseover', e => {
    const lien = e.target.closest('a,button,label,input,textarea,.etiquettes li,.parcours li');
    curseur.classList.toggle('lien-survol', !!lien);
  });
}

/* Panneaux plein écran */
let ouverte = null, dernierFocus = null;
const colorerCode = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/(&lt;\/|&gt;)/g,'<span class="chev">$1</span>').replace(/&amp;(?!lt;|gt;)/g,'<span class="esp">&amp;</span>');
function taper(t){
  const txt = t.dataset.texte; clearInterval(t._iv);
  if (reduit) { t.innerHTML = colorerCode(txt); return; }
  let i = 0; t.innerHTML = '';
  t._iv = setInterval(() => { i++; t.innerHTML = colorerCode(txt.slice(0,i)); if (i >= txt.length) clearInterval(t._iv); }, 95);
}
let ioFiche = null;
function animerFiche(f){
  f.classList.remove('joue'); void f.offsetWidth; f.classList.add('joue');
  const p = f.querySelector('.br .p-logo path, .p-logo path:only-child');
  if (f.classList.contains('br')) { const tr = f.querySelector('.p-logo path'); const L = Math.ceil(tr.getTotalLength()); tr.style.strokeDasharray = L; tr.style.setProperty('--longueur', L); }
  if (ioFiche) ioFiche.disconnect();
  const cibles = [...f.querySelectorAll('.anim, .nuancier, .dossards, .terrain')];
  f.querySelectorAll('.tape').forEach(t => t.innerHTML = ''); f.querySelectorAll('.tape-simple').forEach(t => t.textContent = '');
  if (reduit) { cibles.forEach(c => c.classList.remove('attente')); f.querySelectorAll('.tape').forEach(taper); return; }
  cibles.forEach(c => c.classList.add('attente'));
  ioFiche = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const c = e.target; c.classList.remove('attente'); ioFiche.unobserve(c);
    c.querySelectorAll('.tape').forEach(t => setTimeout(() => taper(t), 400));
    c.querySelectorAll('.tape-simple').forEach(t => setTimeout(() => taperSimple(t), 500));
    c.querySelectorAll('video').forEach(v => { v.currentTime = 0; v.play().catch(()=>{}); });
    if (c.classList.contains('terrain')) c.querySelectorAll('.sticker').forEach((s, k) => s.style.transitionDelay = (k * 90) + 'ms');
    if (c.classList.contains('flip-zone')) setTimeout(() => c.querySelector('.flip').classList.add('retourne'), 900);
  }), {root:f, threshold:.2});
  cibles.forEach(c => ioFiche.observe(c));
}
function ouvrir(id){
  const f = document.getElementById('fiche-' + id); if (!f) return;
  if (ouverte && ouverte !== f) { ouverte.querySelectorAll('video').forEach(v => v.pause()); ouverte.classList.remove('ouverte'); }
  if (!ouverte) dernierFocus = document.activeElement;
  ouverte = f; f.scrollTop = 0;
  f.classList.add('ouverte'); document.body.classList.add('bloque');
  if (f.classList.contains('vc') || f.classList.contains('br')) animerFiche(f);
  setTimeout(() => f.querySelector('.fermer').focus({preventScroll:true}), 300);
  try { history.replaceState(null,'','#' + id); } catch(e){}
}
function fermer(){
  if (!ouverte) return;
  ouverte.querySelectorAll('video').forEach(v => v.pause());
  ouverte.classList.remove('ouverte'); ouverte = null;
  document.body.classList.remove('bloque');
  try { history.replaceState(null,'',location.pathname + location.search); } catch(e){}
  if (dernierFocus) dernierFocus.focus({preventScroll:true});
}
document.querySelectorAll('[data-projet]').forEach(c => c.addEventListener('click', () => ouvrir(c.dataset.projet)));
document.querySelectorAll('[data-ouvrir]').forEach(b => b.addEventListener('click', () => ouvrir(b.dataset.ouvrir)));
document.querySelectorAll('.fiche:not(.fiche-ext) .fiche-barre .fermer').forEach(b => b.addEventListener('click', fermer));
addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });
const ancre = location.hash.slice(1);
if (['vitrine-co','la-boucle-rose','questionnaire'].includes(ancre)) { finIntro(); ouvrir(ancre); }

/* Mentions légales : la page externe s'affiche dans un panneau pop-up (le lien reste utilisable seul, par ex. clic droit > nouvel onglet) */
const ficheMentions = document.getElementById('fiche-mentions');
const cadreMentions = ficheMentions.querySelector('iframe');
let mentionsOuvertes = false, focusAvantMentions = null;
function ouvrirMentions(ancre){
  const cible = cadreMentions.dataset.src + (ancre ? '#' + ancre : '');
  if (cadreMentions.getAttribute('src') !== cible) cadreMentions.src = cible;
  focusAvantMentions = document.activeElement;
  mentionsOuvertes = true;
  ficheMentions.classList.add('ouverte');
  document.body.classList.add('bloque', 'sans-curseur');
  setTimeout(() => ficheMentions.querySelector('.fermer').focus({preventScroll:true}), 300);
}
function fermerMentions(){
  if (!mentionsOuvertes) return;
  mentionsOuvertes = false;
  ficheMentions.classList.remove('ouverte');
  document.body.classList.remove('sans-curseur');
  if (!ouverte) document.body.classList.remove('bloque');
  if (focusAvantMentions) focusAvantMentions.focus({preventScroll:true});
}
document.querySelectorAll('[data-mentions]').forEach(a => a.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault(); ouvrirMentions(a.dataset.mentions);
}));
ficheMentions.querySelector('.fermer').addEventListener('click', fermerMentions);
addEventListener('keydown', e => { if (e.key === 'Escape' && mentionsOuvertes) { e.stopImmediatePropagation(); fermerMentions(); } }, true);
/* Échap pressé à l'intérieur du cadre : la page des mentions prévient celle-ci */
addEventListener('message', e => { if (e.source === cadreMentions.contentWindow && e.data && e.data.insitu === 'fermer-mentions') fermerMentions(); });
if (location.hash === '#mentions') { finIntro(); ouvrirMentions(); }

/* Logo de l'en-tête : retour en haut */
document.querySelector('.marque').addEventListener('click', e => { e.preventDefault(); fermer(); scrollTo({top:0, behavior: reduit ? 'auto' : 'smooth'}); });

/* Grand logo : traits au toucher sur mobile */
const h1 = document.querySelector('.accueil h1');
h1.addEventListener('click', () => { h1.classList.remove('actif'); void h1.offsetWidth; h1.classList.add('actif'); setTimeout(() => h1.classList.remove('actif'), 1500); });

/* Cartes de visite : retourner au clic */
document.querySelectorAll('.flip-zone').forEach(z => { const go = () => z.querySelector('.flip').classList.toggle('retourne'); z.addEventListener('click', go); z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });

/* Parallaxe douce de l'affiche */
document.querySelectorAll('.fiche').forEach(f => f.addEventListener('scroll', () => {
  if (reduit) return;
  f.querySelectorAll('.parallaxe img').forEach(img => { const r = img.parentElement.getBoundingClientRect(); const d = (r.top + r.height/2 - innerHeight/2) / innerHeight; img.style.transform = `scale(1.08) translateY(${d * -4}%)`; });
}, {passive:true}));

/* Stickers déplaçables */
document.querySelectorAll('.terrain').forEach(t => {
  let s = null, dx = 0, dy = 0, z = 10;
  t.addEventListener('pointerdown', e => {
    if (!e.target.classList.contains('sticker')) return;
    s = e.target; s.setPointerCapture(e.pointerId); s.classList.add('tenu'); s.style.zIndex = ++z;
    const r = s.getBoundingClientRect(); dx = e.clientX - r.left; dy = e.clientY - r.top; e.preventDefault();
  });
  t.addEventListener('pointermove', e => {
    if (!s) return;
    const T = t.getBoundingClientRect();
    s.style.left = ((e.clientX - T.left - dx) / T.width * 100) + '%';
    s.style.top = ((e.clientY - T.top - dy) / T.height * 100) + '%';
  });
  const lacher = () => { if (s) { s.classList.remove('tenu'); s = null; } };
  t.addEventListener('pointerup', lacher); t.addEventListener('pointercancel', lacher);
});

/* Nuanciers : copier le code couleur */
document.querySelectorAll('.nuance').forEach(b => b.addEventListener('click', () => {
  const hex = b.querySelector('small').textContent, c = b.querySelector('.copie');
  const fait = t => { c.textContent = t; setTimeout(() => c.textContent = 'Copier', 1500); };
  try { navigator.clipboard.writeText(hex).then(() => fait('Copié'), () => fait(hex)); } catch(e) { fait(hex); }
}));

/* Carrousel de la plaquette + zoom */
document.querySelectorAll('.diapo').forEach(d => {
  const piste = d.querySelector('.diapo-piste'), vues = [...d.querySelectorAll('.diapo-vue')];
  const points = d.querySelector('.diapo-points'), num = d.querySelector('.diapo-num');
  vues.forEach(() => points.appendChild(document.createElement('i')));
  let idx = 0, survol = false;
  const maj = i => { idx = i; vues.forEach((v,k) => v.classList.toggle('active', k === i)); [...points.children].forEach((p,k) => p.classList.toggle('on', k === i)); num.textContent = `${i+1} / ${vues.length}`; };
  const aller = i => { i = (i + vues.length) % vues.length; const v = vues[i]; piste.scrollTo({left: v.offsetLeft - (piste.clientWidth - v.clientWidth)/2, behavior: reduit ? 'auto' : 'smooth'}); maj(i); };
  maj(0);
  piste.addEventListener('scroll', () => { const c = piste.scrollLeft + piste.clientWidth/2; let best = 0, bd = 1e9; vues.forEach((v,k) => { const dd = Math.abs(v.offsetLeft + v.clientWidth/2 - c); if (dd < bd) { bd = dd; best = k; } }); if (best !== idx) maj(best); }, {passive:true});
  d.querySelector('.d-prec').addEventListener('click', () => aller(idx - 1));
  d.querySelector('.d-suiv').addEventListener('click', () => aller(idx + 1));
  d.addEventListener('mouseenter', () => survol = true); d.addEventListener('mouseleave', () => survol = false);
  if (!reduit) setInterval(() => { const f = d.closest('.fiche'); if (f && f.classList.contains('ouverte') && !survol && document.getElementById('zoom').hidden) { const r = d.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) aller(idx + 1); } }, 4000);
  vues.forEach((v,k) => v.addEventListener('click', () => { if (k !== idx) { aller(k); return; } ouvrirZoom(v.querySelector('img')); }));
});
const zoom = document.getElementById('zoom');
function ouvrirZoom(img){ const z = zoom.querySelector('img'); z.src = img.currentSrc || img.src; z.alt = img.alt; zoom.hidden = false; document.getElementById('zoom-fermer').focus(); }
function fermerZoom(){ zoom.hidden = true; }
document.getElementById('zoom-fermer').addEventListener('click', fermerZoom);
zoom.addEventListener('click', e => { if (e.target === zoom) fermerZoom(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !zoom.hidden) { e.stopImmediatePropagation(); fermerZoom(); } }, true);


/* Affiche : inclinaison 3D au survol */
document.querySelectorAll('.affiche-bloc').forEach(b => {
  const c = b.querySelector('.incline'); if (reduit) return;
  b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    c.style.transform = `perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`; c.style.setProperty('--mx', (x + .5) * 100 + '%'); c.style.setProperty('--my', (y + .5) * 100 + '%'); });
  b.addEventListener('mouseleave', () => { c.style.transform = ''; });
});
/* Texte tapé en Filson */
function taperSimple(t){ const txt = t.dataset.texte; clearInterval(t._iv); if (reduit) { t.textContent = txt; return; } let i = 0; t.textContent = ''; t._iv = setInterval(() => { i++; t.textContent = txt.slice(0,i); if (i >= txt.length) clearInterval(t._iv); }, 80); }

/* Questionnaire en étapes */
const qForm = document.getElementById('questionnaire');
const etapes = [...qForm.querySelectorAll('.etape-q')];
const barre = document.querySelector('#fiche-questionnaire .progression');
etapes.forEach(() => barre.appendChild(document.createElement('i')));
const prec = document.getElementById('q-prec'), suiv = document.getElementById('q-suiv'), compteur = document.getElementById('q-compteur');
let qi = 0;
/* Lecture des champs d'un formulaire ou d'une étape : [libellé affiché, valeur, nom du champ envoyé] */
function collecter(racine){
  const out = [];
  racine.querySelectorAll('input[name]:not([type=radio]):not([type=checkbox]):not([name^="_"]), textarea[name]').forEach(el => {
    const v = el.value.trim(); if (v) out.push([el.dataset.label || el.name, v, el.name]);
  });
  racine.querySelectorAll('.puces[data-nom]').forEach(p => {
    const v = [...p.querySelectorAll('input:checked')].map(i => i.value).join(', '); if (v) out.push([p.dataset.nom, v, p.dataset.nom]);
  });
  return out;
}
const reponses = () => etapes.slice(0,-1).flatMap(et => collecter(et));
function recapituler(){
  const dl = document.getElementById('recap'); dl.innerHTML = '';
  reponses().forEach(([libelle, valeur]) => { const d = document.createElement('div'); d.innerHTML = '<dt></dt><dd></dd>'; d.firstChild.textContent = libelle; d.lastChild.textContent = valeur; dl.appendChild(d); });
}
function afficher(n, dir = 1){
  etapes[qi].hidden = true; qi = n; const et = etapes[qi]; et.hidden = false;
  et.classList.remove('anim-entree'); void et.offsetWidth; if (dir > 0) et.classList.add('anim-entree');
  [...barre.children].forEach((b, k) => b.classList.toggle('fait', k <= qi));
  compteur.textContent = `Étape ${qi + 1} sur ${etapes.length} · ${et.dataset.titre}`;
  prec.disabled = qi === 0;
  const derniere = qi === etapes.length - 1;
  suiv.innerHTML = derniere ? 'Envoyer mes réponses <span class="fleche">→</span>' : 'Suivant <span class="fleche">→</span>';
  if (derniere) recapituler();
  document.getElementById('fiche-questionnaire').scrollTo({top:0, behavior: reduit ? 'auto' : 'smooth'});
}
function etapeValide(){
  const requis = [...etapes[qi].querySelectorAll('[required]')];
  requis.forEach(i => i.style.borderBottomColor = '');
  const ko = requis.filter(i => !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)));
  ko.forEach(i => i.style.borderBottomColor = 'var(--corail)');
  if (ko.length) { ko[0].focus(); return false; }
  return true;
}
suiv.addEventListener('click', async () => {
  if (!etapeValide()) return;
  if (qi < etapes.length - 1) { afficher(qi + 1, 1); return; }
  /* dernière étape : on revérifie les champs obligatoires de toutes les étapes avant l'envoi */
  const manquant = [...qForm.querySelectorAll('[required]')].find(i => !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)));
  if (manquant) { afficher(etapes.findIndex(et => et.contains(manquant)), -1); etapeValide(); return; }
  const merci = document.getElementById('q-merci'), erreur = document.getElementById('q-erreur'), libelle = suiv.innerHTML;
  erreur.hidden = true; suiv.disabled = true; prec.disabled = true; suiv.textContent = 'Envoi en cours…';
  try {
    await envoyerFormspree('INSITU · Questionnaire de ' + document.getElementById('q-entreprise').value.trim(), reponses(), qForm.querySelector('.hp').value);
    merci.hidden = false; document.querySelector('.q-nav').style.display = 'none';
    merci.scrollIntoView({block:'center', behavior: reduit ? 'auto' : 'smooth'});
  } catch (err) {
    console.error('[Formspree]', err);
    erreur.hidden = false; suiv.disabled = false; prec.disabled = qi === 0; suiv.innerHTML = libelle;
    erreur.scrollIntoView({block:'center', behavior: reduit ? 'auto' : 'smooth'});
  }
});
prec.addEventListener('click', () => { if (qi > 0) afficher(qi - 1, -1); });
qForm.addEventListener('submit', e => e.preventDefault());
afficher(0, 0);

/* Copier l'e-mail */
document.getElementById('copier').addEventListener('click', e => {
  const b = e.currentTarget, mail = document.getElementById('email').textContent;
  const ok = () => { b.textContent = 'Copié'; b.classList.add('ok'); setTimeout(() => { b.textContent = 'Copier'; b.classList.remove('ok'); }, 1800); };
  const repli = () => { const r = document.createRange(); r.selectNodeContents(document.getElementById('email')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Sélectionné'; };
  try { navigator.clipboard.writeText(mail).then(ok, repli); } catch(err) { repli(); }
});

/* Formulaire de contact : envoi via Formspree */
document.getElementById('formulaire').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.currentTarget, merci = document.getElementById('merci'), erreur = document.getElementById('erreur');
  const requis = [...f.querySelectorAll('[required]')];
  requis.forEach(i => i.style.borderBottomColor = '');
  const ko = requis.filter(i => !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)));
  if (ko.length) { ko.forEach(i => i.style.borderBottomColor = 'var(--corail)'); ko[0].focus(); return; }
  const bouton = f.querySelector('button[type=submit]'), libelle = bouton.innerHTML;
  merci.hidden = true; erreur.hidden = true; bouton.disabled = true; bouton.textContent = 'Envoi en cours…';
  try {
    await envoyerFormspree('INSITU · Message de ' + document.getElementById('f-nom').value.trim(), collecter(f), f.querySelector('.hp').value);
    f.reset(); merci.hidden = false;
  } catch (err) {
    console.error('[Formspree]', err);
    erreur.hidden = false;
  } finally {
    bouton.disabled = false; bouton.innerHTML = libelle;
  }
});
