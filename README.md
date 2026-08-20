# 森森 Sensen Mini

Version *idle* de **Sensen**, le RPG voxel Wu Xing. Le jeu tourne dans un
navigateur, sans dépendance ni build obligatoire : tout est en JavaScript
classique, chargé dans l'ordre par `index.html`.

---

## Lancer

**Le plus simple** — ouvrir `index.html` en double-cliquant. Tout marche en
`file://` puisqu'il n'y a ni module ES ni import.

**Dans VS Code** — installer l'extension *Live Server* (recommandée dans
`.vscode/extensions.json`), clic droit sur `index.html` → *Open with Live
Server*. Rechargement automatique à chaque sauvegarde.

**En ligne de commande**

```bash
npm run dev      # sert le dossier sur http://localhost:5173
npm run check    # vérifie la syntaxe de chaque module, sans navigateur
npm run build    # reconstruit dist/sensen-mini.html (fichier unique)
```

`npm run check` et `npm run build` n'ont besoin que de Node ; `npm run dev`
télécharge `serve` à la volée.

---

## Structure

```
index.html              markup, HUD, onglets, ordre de chargement
src/style.css           toute la présentation
src/01..09              données et fondations (Wu Xing, matériaux, compétences, monde)
src/10..23              systèmes (craft, PNJ, royaume, cuisine, compagnons, bâti,
                        donjons, météo, veille, statuts, réputation, villes)
src/24..28              combat, modules, récolte, horloge, boucle
src/29..46              rendu et panneaux (un fichier par onglet)
src/50..52              entrées, sauvegarde, démarrage
tools/                  check.mjs, build.mjs
```

**Portée globale partagée, ordre significatif.** Les fichiers ne sont pas des
modules ES : ils s'exécutent à la suite dans le même contexte. Les numéros de
préfixe *sont* l'ordre de chargement — un fichier peut appeler une fonction
définie plus loin (les déclarations `function` sont hissées), mais pas lire une
`const` définie après lui. En pratique : ajoute tes données avant `08-state.js`,
tes systèmes après, tes panneaux dans les 30–46.

Après avoir ajouté ou renommé un fichier dans `src/`, ajoute la balise
`<script>` correspondante dans `index.html` (l'ordre alphabétique du dossier est
la convention).

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

L'état complet tient dans un seul objet `S`, sérialisé tel quel dans la
sauvegarde. `NEW()` en donne la forme de référence.

---

## Sauvegarde

Le jeu utilise `window.storage` quand il existe (environnement Claude), et
retombe silencieusement sur rien ailleurs. Pour une sauvegarde locale dans le
navigateur, remplacer les deux appels de `src/51-save.js` par `localStorage` :

```js
async function save(){ S.t=Date.now(); localStorage.setItem(KEY,JSON.stringify(S)); }
async function load(){ const v=localStorage.getItem(KEY); if(!v)return false; /* ... */ }
```

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
