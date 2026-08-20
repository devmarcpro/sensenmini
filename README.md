# 森森 Sensen Mini

Version *idle* de **Sensen**, le RPG voxel Wu Xing. Le jeu tourne dans un
navigateur, sans dépendance ni build obligatoire : tout est en JavaScript
classique, chargé dans l'ordre par `index.html`. Il se joue sur ordinateur
(souris + clavier) et sur téléphone (tactile), et s'installe comme une
application hors-ligne.

---

## Lancer

**Le plus simple** — ouvrir `index.html` en double-cliquant. Tout marche en
`file://` puisqu'il n'y a ni module ES ni import (seule l'installation
hors-ligne demande un serveur, voir plus bas).

**Dans VS Code** — installer l'extension *Live Server* (recommandée dans
`.vscode/extensions.json`), clic droit sur `index.html` → *Open with Live
Server*. Rechargement automatique à chaque sauvegarde.

**En ligne de commande** (Node seul, aucun paquet à installer)

```bash
npm run dev      # sert le dossier sur http://localhost:5173 et affiche l'URL réseau
npm run check    # vérifie la syntaxe de chaque module, sans navigateur (2 s)
npm test         # test de fumée dans Edge/Chrome headless : téléphone + ordinateur
npm run sim      # simule des parties longues avec des bots (équilibrage, voir plus bas)
npm run icons    # régénère les icônes PNG de l'application (icons/)
npm run build    # reconstruit dist/sensen-mini.html (fichier unique, file://)
```

### Sur téléphone

1. `npm run dev` sur l'ordinateur : le terminal affiche une ligne
   `téléphone : http://192.168.x.x:5173/`.
2. Ouvrir cette adresse dans le navigateur du téléphone (même Wi-Fi).
3. *Ajouter à l'écran d'accueil* (Safari : Partager → Sur l'écran d'accueil ;
   Chrome : menu ⋮ → Installer l'application). Le jeu s'ouvre alors plein
   écran, sans barre d'adresse, et fonctionne sans réseau.

### En ligne, sans l'ordinateur allumé

Le dépôt est sur **[github.com/devmarcpro/sensenmini](https://github.com/devmarcpro/sensenmini)**.
C'est un site statique : GitHub Pages suffit à l'héberger, sans build ni
serveur. Sur le dépôt → *Settings* → *Pages* → *Source : Deploy from a
branch* → branche `main`, dossier `/ (root)` → *Save*. Une minute plus tard,
le jeu est jouable sur `https://devmarcpro.github.io/sensenmini/`, installable
depuis le téléphone, et hors-ligne une fois ouvert.

La sauvegarde reste dans le navigateur de chaque appareil — pour la déplacer,
自 VEILLE → *Exporter la sauvegarde*, puis *Importer* sur l'autre appareil.

---

## Ordinateur et téléphone

Une seule interface, qui s'adapte :

| | ordinateur | téléphone |
|---|---|---|
| onglets | tous visibles, sur deux lignes | défilent, fondu aux bords, recentrage au tap |
| combat | `Espace` garde (maintenir), `D` frappe lourde, `1`–`4` postures, `Tab`/`←``→` changer de cible, `F` rompre | boutons larges ; garde = appui maintenu, tap sur une créature pour la viser |
| raccourcis affichés | oui (`<kbd>`) | masqués (`pointer: coarse`) |
| cibles | taille normale | boutons et listes agrandis, pas de zoom iOS |
| encoche / barre d'accueil | — | `env(safe-area-inset-*)` |

**Cycle de vie.** Sur téléphone le navigateur gèle l'onglet dès qu'on change
d'application ou qu'on éteint l'écran — la boucle `requestAnimationFrame`
s'arrête net. `52-boot.js` sauvegarde donc à chaque passage en arrière-plan
(`visibilitychange`, `pagehide`), et au retour résout le temps écoulé comme une
absence (`absence()` dans `51-save.js`, formules de `19-idle.js`) si elle
dépasse 90 s. Même logique qu'un rechargement, sans recharger.

**Hors-ligne.** `sw.js` lit `index.html` à l'installation et met en cache tout
ce qu'il référence — pas de liste de fichiers à maintenir quand on ajoute un
module. Ensuite : cache d'abord, rafraîchi en arrière-plan ; une mise à jour
publiée arrive au rechargement suivant. Le service worker ne s'enregistre
qu'en `http(s)`, jamais en `file://` ni dans le build mono-fichier.

---

## Structure

```
index.html              markup, HUD, onglets, ordre de chargement, métadonnées PWA
manifest.webmanifest    nom, icônes, mode plein écran
sw.js                   service worker (cache de l'application, hors-ligne)
icons/                  icon.svg (source et favicon), PNG générés par tools/icons.mjs
src/style.css           toute la présentation (le bloc « ordinateur et téléphone » à la fin)
src/01..09              données et fondations (Wu Xing, matériaux, compétences, monde)
src/10..23              systèmes (craft, PNJ, royaume, cuisine, compagnons, bâti,
                        donjons, météo, veille, statuts, réputation, villes)
src/24..28              combat, modules, récolte, horloge, boucle
src/29..45              rendu et panneaux (un fichier par onglet)
src/46-tips.js          conseils contextuels (onboarding E.19)
src/50..52              entrées, sauvegarde, démarrage
tools/                  check, build, serve, smoke, sim, icons
```

**Portée globale partagée, ordre significatif.** Les fichiers ne sont pas des
modules ES : ils s'exécutent à la suite dans le même contexte. Les numéros de
préfixe *sont* l'ordre de chargement — un fichier peut appeler une fonction
définie plus loin (les déclarations `function` sont hissées), mais pas lire une
`const` définie après lui. En pratique : ajoute tes données avant `08-state.js`,
tes systèmes après, tes panneaux dans les 30–45.

Après avoir ajouté ou renommé un fichier dans `src/`, ajoute la balise
`<script>` correspondante dans `index.html` (l'ordre alphabétique du dossier est
la convention). Un nouvel onglet demande aussi un bouton `data-tab` dans la
`<nav>` et une entrée dans `paint()` (`29b-panels-core.js`).

---

## Repères de code

| tu cherches | fichier |
|---|---|
| les cinq éléments, l'engendrement et la domination | `01-core.js` |
| les matériaux et leurs 13 stats | `02-data-materials.js` |
| composants, stations, armes, 14 slots | `03-data-craft.js` |
| la jauge de chaîne, l'endurance, les zones | `24-combat.js` |
| la compilation des sorts façon Noita | `25-modules.js` |
| la génération des royaumes par secteurs | `22-realms.js` |
| la résolution hors-ligne | `19-idle.js` |
| l'état de la partie (`S`) | `08-state.js` |
| clics, taps, clavier | `50-input.js` |
| sauvegarde, absence | `51-save.js` |
| boucle, arrière-plan, service worker | `52-boot.js` |

L'état complet tient dans un seul objet `S`, sérialisé tel quel dans la
sauvegarde. `NEW()` en donne la forme de référence.

---

## Tester

`npm test` lance `tools/smoke.mjs` : il sert le projet, pilote Edge ou Chrome
headless par le protocole DevTools (sans rien installer), et joue trois
scénarios — téléphone 390×844 tactile, petit téléphone 320×568, ordinateur
1280×860. Pour chacun : création de personnage, visite de tous les onglets,
combat (garde maintenue puis relâchée, frappe lourde, clavier sur ordinateur),
passage en arrière-plan, rechargement, puis chargement **sans réseau** via le
service worker. Il signale toute exception JS, erreur console, débordement
horizontal, onglet sans bouton, sauvegarde manquante. Captures d'écran dans
`.shots/`.

---

## Systèmes

Au-delà du découpage d'origine, les systèmes suivants sont en place (section du
GDD entre parenthèses) :

| système | fichier | en deux mots |
|---|---|---|
| lieu de naissance (6.3) | `11-character.js` | carte 9×9 à trois niveaux de danger, case sûre présélectionnée |
| conseils contextuels (E.19) | `46-tips.js` | une fois chacun, sur l'état ; mode vétéran dans 自 VEILLE |
| gisements hebdomadaires (3.3) | `07-worldgen.js` | stock par cellule et matériau ; régénération des cases sauvages et des claims « ressources » |
| saisons (E.28) | `18-weather.js` | année de 120 jours ; température, pousse, gisements du vivant |
| boutiques (7.1 / A.8) | `23b-shops.js` | étal hebdomadaire par commerce, prix A.8, fermé la nuit et aux mal-vus |
| gemmes (A.12) | `10b-gems.js` | taille (dégâts, domaine, affinité), sertissures tirées au loot, désertir détruit |
| agriculture et élevage (7.4) | `16-building.js` | champs semés, rendement par formule à la semaine ; bétail en enclos |
| dialogue PNJ (E.23) | `12-npc.js` | répliques à conditions, anti-répétition, rumeurs qui révèlent la carte |
| entraîneurs (A.1) | `12-npc.js` | 20 or × niveau → +10 de potentiel dans le métier du PNJ |
| trésor et dette (14.6) | `13-kingdom.js` | dépôts libres, paliers de dette à 1, 2 et 4 semaines |
| mort (A.10) | `24-combat.js` | −10 % de l'or, aucune compétence, réveil au dernier lit |
| Fondeur, Marmite | `19-idle.js`, `28-loop.js` | automatisations : fondre le butin banal, nourrir cru à défaut de cuisine |
| matériaux (F.1 / F.8) | `02-data-materials.js` | 176 matériaux **générés** par `tools/gen-materials.mjs` depuis le GDD — ne pas éditer à la main |
| modules (F.2) | `04-data-magic.js`, `25-modules.js` | 62 modules : statuts, buffs, drain, esquive, invocation, purge ; 18 passifs de manuel |
| bestiaire (F.3) | `23c-creatures.js` | 30 espèces par biome, meutes, fuite, venin, nuées, embuscade, humains à bourse, corrompus, statue 1:1 |
| donjons (E.29) | `17-dungeon.js` | quatre thèmes, onze types de salles (piège, autel, puits, cellule, cache, armurerie…) |
| multi-ennemis (5.1) | `24-combat.js`, `28-loop.js` | groupe de quatre, cible au tap, le dos coûte +30 %, balayage à l'allonge |
| prises en main (5.1) | `10-craft.js`, `24-combat.js` | bouclier, deux mains, deux armes, arc — chacune sa contrepartie |
| gestes des créatures (5.1) | `23c-creatures.js` | six patterns télégraphiés : coup, enchaînement, charge, balayage, morsure, crachat |
| stats qui montent (6.4) | `09-progress.js` | les six stats ont leur potentiel et progressent par l'usage, comme les compétences |
| sac et coffres (A.4.2 / F.6) | `10-craft.js`, `16-building.js` | le dos porte 20 + Force×2 ; un coffre garde le reste, attaché à sa cellule |
| guildes (7.3 / B.7) | `13b-guilds.js` | 29 gabarits de quête, rangs qui les ouvrent, présent à chaque palier |
| familles (12.2 / 12.3) | `12b-family.js` | couples et enfants, deuil, héritage, succession des trônes |

---

### Ce qu'on tient dans les mains

Le GDD posait la question sans la trancher : « un bouclier occupe une main dans
un système qui récompense la rotation d'armes — quelle compensation ? » Voici
la réponse retenue, et ses symétries.

| prise | ce qu'elle donne | ce qu'elle coûte |
|---|---|---|
| **arme et bouclier** | réduction sur toutes les zones, parade élargie de 35 %, et **une parade parfaite pose l'élément du bouclier dans la chaîne** — il défend *en* participant au cycle | −6 % de dégâts |
| **deux armes** | la seconde main pose **son propre segment** : la chaîne tourne deux fois plus vite | aucune réduction, aucune parade élargie |
| **deux mains** | +18 % de dégâts, et l'allonge ≥ 2 balaie tout le groupe | fenêtre de parade −15 %, seconde main impossible |
| **arc, fronde** | la Dextérité porte le trait, et l'on tient la créature à distance (elle revient 38 % moins vite) | **rien ne se pare**, et pas de balayage |

Un arc ne tire pas sa puissance de la dureté mais de l'**élasticité** du bois
(colonne `Éla` de F.1) : if 78, bambou 75, frêne 62 — contre ébène 15 et fer 10.
Un arc d'if frappe trois fois plus fort qu'un arc d'ébène. L'if pousse en forêt
de mana, le bambou sur la côte : faire un vrai arc demande d'aller le chercher.

---

## Simuler et équilibrer

`npm run sim` lance `tools/sim.mjs` : il charge toute la logique du jeu dans
un contexte Node isolé (DOM factice, aléatoire reproductible), fait naître un
personnage et laisse un **bot** jouer en accéléré — la boucle `step(dt)` est
exactement celle du navigateur, seul le rendu est neutralisé. Huit heures de
jeu se simulent en quelques secondes.

```bash
npm run sim                                  # les quatre bots, 8 h chacun
npm run sim -- --bot batisseur --hours 24    # un seul bot, plus longtemps
npm run sim -- --trace "領,従,死"             # journaliser certains cut-ins (heure, PV, or, arme)
npm run sim -- --seed 7 --json               # autre graine, sortie brute
```

| bot | ce qu'il exerce |
|---|---|
| `guerrier` | combat en boucle, lit ses livres, équipe le meilleur butin, mange cru |
| `mineur` | récolte le plus dur possible, change de cellule quand les gisements sont vides |
| `mixte` | combat, explore, entre dans les donjons connus |
| `batisseur` | la boucle d'endgame : claim, bâtiment, lit, cuisine, stations, dort, cuisine, recrute au village, assigne, dépose au trésor |

Il relève aussi le **rythme** : nombre de rencontres, taille moyenne des groupes,
voyages et jours de marche. Un bot qui fait l'aller-retour en boucle fausse toutes
les mesures hebdomadaires — cette ligne est là pour le voir tout de suite.

Il relève or, PV, kills, morts, objets, livres, modules, matériaux, arme,
armure et compétences par demi-heure, puis l'état du territoire, et signale
toute exception ou `NaN`. C'est l'outil pour juger un changement de formule :
lance-le avant et après.

Repères de rythme visés en début de partie (cellule paisible, kit de départ) :
un kill toutes les ~8 s, ~1 000 or/h, un objet de butin toutes les ~8 min, un
livre toutes les ~20 min, un gisement qui nourrit ~45 min de récolte.

---

## Sauvegarde

`src/51-save.js` choisit le stockage au chargement : `window.storage` quand il
existe (environnement Claude), `localStorage` sinon (navigateur classique, clé
`sensen:mini:step2`). La partie persiste donc entre deux rechargements, y
compris en `file://`.

**Le monde ne se stocke pas, il se regénère.** `genCell(x,y)` est déterministe :
la graine suffit à retrouver chaque cellule. La sauvegarde n'enregistre donc que
ce qui *s'écarte* du monde généré — vu ou non, creusé, revendiqué, bâti, sa
corruption qui a dérivé. Une cellule seulement traversée pèse une quinzaine
d'octets au lieu de deux cent cinquante : **82 % de moins** sur un monde
largement exploré. C'est le principe G.1 du GDD, appliqué là où il compte.

Repère mesuré sur 24 h de jeu simulé : 24 à 89 ko selon le style de jeu, contre
90 à 200 ko avant. `npm run sim` affiche la ligne `sauvegarde` à chaque run.

L'onglet 自 VEILLE porte tout le reste : **exporter** la partie en un bloc de
texte, l'**importer** sur un autre appareil, couper les sons, et **recommencer**
(double confirmation).

---

## Fidélité au GDD

Chaque système porte en commentaire la section du GDD dont il vient (`5.2`,
`A.4.6`, `E.25`…). Les formules sont reprises telles quelles quand elles
existent : courbe de compétence `100 × (N+1)^1.6`, qualité `N/(N+25) × 2`,
temps de récolte `dureté / (dureté_outil × qualité × skill_factor)`, capacité
d'escorte `1 + Charisme/5 + Leadership/10`, DD d'apprivoisement
`10 + niveau_cible/2`.

Ce qu'une version idle ne porte pas : la construction voxel à subdivision
fractale, les tables de sculpture, le multijoueur.
