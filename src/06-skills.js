/* Sensen Mini — 06-skills.js
   Table des compétences et courbe de progression
   Chargé dans l'ordre par index.html ; portée globale partagée. */

/* ===== COMPÉTENCES ===== */
const SKILLS={};
const addSk=(id,n,grp)=>SKILLS[id]={n,grp};
addSk('minage','Minage','Récolte');addSk('bucheronnage','Bûcheronnage','Récolte');
addSk('terrassement','Terrassement','Récolte');addSk('herboristerie','Herboristerie','Récolte');
addSk('collecte','Collecte','Récolte');addSk('athletisme','Athlétisme','Vie');
addSk('forge','Forge','Artisanat');addSk('menuiserie','Menuiserie','Artisanat');
addSk('taille','Taille de pierre','Artisanat');addSk('tissage','Tissage','Artisanat');
addSk('enchantement','Enchantement','Artisanat');addSk('assemblage','Assemblage','Artisanat');
Object.keys({matelasse:1,cuir:1,mailles:1,ecailles:1,plaque:1}).forEach(c=>addSk('c_'+c,'Construction '+c,'Constructions'));
Object.keys(FUNC).forEach(f=>addSk(f,FUNC[f].n,'Armes'));
addSk('bouclier','Bouclier','Armes');addSk('deuxmains','Deux Mains','Armes');addSk('dualwield','Dual Wielding','Armes');
EL.forEach(e=>addSk('el_'+e.k,'Élément '+e.n,'Éléments'));
['tranchant','percant','contondant'].forEach(t=>addSk('t_'+t,'Maîtrise '+DT[t],'Types de dégâts'));
addSk('esquive','Esquive','Défense');addSk('encaissement','Encaissement','Défense');
addSk('lecture','Lecture','Vie');addSk('negociation','Négociation','Vie');
addSk('discretion','Discrétion','Vie');addSk('dressage','Dressage','Vie');
addSk('leadership','Leadership','Vie');addSk('agriculture','Agriculture','Vie');
addSk('alchimie','Alchimie','Artisanat');addSk('cuisine','Cuisine','Artisanat');addSk('meditation','Méditation','Magie');addSk('mana','Contrôle du Mana','Magie');
DK.filter(d=>DOMAIN[d].b==='grimoire').forEach(d=>addSk('m_'+d,'Magie — '+DOMAIN[d].n,'Magie'));
addSk('perception_sk','Perception','Vie');
const SK=Object.keys(SKILLS);
const xpNext=N=>100*Math.pow(N+1,1.6);
const sf=N=>1+N*0.02;
const QNAME=q=>q<.5?'Misérable':q<.8?'Pauvre':q<1.2?'Correct':q<1.6?'Bon':q<2?'Excellent':q<3?"Chef-d'œuvre":q<5?'Légendaire':'Mythique';
