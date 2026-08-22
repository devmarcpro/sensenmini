# Pistes — rapprocher le combat d'un Shin Megami Tensei

*Document de côté, écrit le 2026-08-22. Rien de ceci n'est fait. C'est une
question posée par l'auteur — « est-ce que le combat est tactique au moins au
niveau d'un SMT ? » — et la réponse honnête est **non, pas sur l'axe qui fait
la tactique de SMT**. Ce qui suit dit pourquoi, et ce qu'il faudrait.*

---

## Où nous en sommes

**Ce que SMT met au centre**, c'est l'**économie de tours**. Le Press Turn
transforme chaque action en pari sur un budget : toucher une faiblesse coûte
un demi-tour au lieu d'un, se faire absorber en coûte deux. Tout le reste —
la matrice de faiblesses par démon, les buffs plafonnés à ±2 crans avec
Dekaja et Dekunda, la composition d'équipe par fusion — existe pour alimenter
ce pari. Nous n'avons pas cet engrenage.

**Notre cousin le plus proche est la chaîne Wu Xing** : enchaîner les éléments
dans le bon ordre paie un multiplicateur au coup qui la résout. Mais elle ne
rend ni ne prend de tour, donc elle n'oblige jamais à réviser un plan en cours
de combat.

**Où nous sommes tactiques, c'est ailleurs :**
- la **lecture du geste** — quatorze télégraphes, chacun venant d'une hauteur,
  et la garde qui doit répondre : c'est du Mount & Blade, pas du SMT ;
- l'**économie de souffle** — six postures dont l'axe est le coût, pas les
  dégâts ;
- la **chaîne** et le choix d'élément contre le vecteur de la cible ;
- la **zone touchée**, et la visée qui a remplacé le critique au dé.

**Où nous sommes clairement plus pauvres :**
- pas de matrice discrète faiblesse / résistance / absorption à découvrir et à
  mémoriser par espèce — nos vecteurs sont continus, donc jamais un « aha » ;
- pas de guerre de buffs et débuffs avec plafond et retrait ;
- une escorte très en deçà d'une équipe qu'on compose.

Autrement dit : **un combat se gagne chez nous par la lecture et le rythme,
pas par la connaissance de l'adversaire.**

---

## Levier 1 — la chaîne résolue comme économie d'actions

**Aujourd'hui.** `S.seg` accumule les éléments des coups portés ; quand le
cycle se referme, le coup suivant est un « résolveur » multiplié par
`1 + S.bonus`. C'est une récompense de fin de séquence, pas une économie :
rien ne se dépense, rien ne se perd.

**La transposition honnête.** Notre budget n'est pas le tour, c'est le couple
**souffle + récupération** (`wSpeed()`, `endLock`, le coût en endurance de la
posture). Donc :

- un coup qui tombe sur l'élément **dominant** rend un fragment de
  récupération — on repart plus vite ;
- un coup **résisté** allonge la récupération.

L'accord élémentaire cesse d'être « +20 % de dégâts » et devient « je frappe
plus souvent » : c'est la boucle de SMT écrite en temps réel. **Avec un
plafond** — deux accords enchaînés au maximum — sinon ça s'emballe.

**Ce que ça touche.** Une branche dans `attack()` (src/24-combat.js), un terme
dans `wSpeed()`, un retour visuel dans la scène de combat.

**Risque.** C'est le levier qui accélère tout le jeu si le réglage est faux.
Mesurable immédiatement : mises à mort par jour dans `tools/progression.mjs`,
qui a déjà attrapé deux dérives de ce genre le même jour.

---

## Levier 2 — le vecteur découvrable *(le plus rentable, à faire en premier)*

**Aujourd'hui.** Chaque créature porte un `vec` de cinq flottants, `vmult` en
tire un multiplicateur, et le joueur voit passer un `剋` **après** le coup.
L'information existe ; elle n'est ni nommée, ni mémorisée, ni gagnée.

**Le point important : il ne faut pas remplacer les vecteurs continus par une
matrice discrète.** Il suffit de **quantifier l'affichage** — seuiller `vmult`
contre les cinq éléments donne « faible au Métal · résiste au Bois ».
Continu sous le capot, discret à l'écran : c'est là que naît le « aha ».

**Et ça se gagne.** `S.bes[k]` compte déjà les fois croisées (`v`) et abattues
(`t`). Quatre paliers :

| palier | condition | ce qu'on apprend |
|---|---|---|
| 0 | croisée | la silhouette, le biome, le niveau |
| 1 | croisée ×3 | ses gestes (et donc les hauteurs de garde qui répondent) |
| 2 | abattue ×3 | son élément dominant |
| 3 | abattue ×10 | le vecteur entier, et ce qui la domine |

En combat, dès le palier 2, l'en-tête de la cible dirait `剋` / `生` / `—`
selon l'arme qu'on tient.

**Ce que ça touche.** Une fonction `besSavoir(k)`, le panneau du bestiaire
(src/39-panel-compagnons.js), l'en-tête de combat (src/29-render.js).

**Risque : aucun.** C'est de l'information pure — pas une ligne d'équilibre ne
bouge. C'est aussi le levier qui donne le plus de sens à la collection : le
bestiaire devient un **outil** au lieu d'un tableau de chasse.

---

## Levier 3 — buffs et débuffs avec plafond

**Aujourd'hui.** Des états (ralenti, affaibli, saignement, gel…) et des bonus
temporaires existent ; l'ordre « Gêner » d'un compagnon en pose. Mais sans
discipline : ni plafond, ni cumul lisible, ni retrait. Rien à empiler, donc
rien à défaire.

**Ce qu'il faudrait.** Deux axes — attaque, défense — × trois crans, des deux
côtés, chaque cran valant environ 15 %, plus des effets qui **retirent** les
crans (les siens ou ceux d'en face). C'est le sous-jeu classique : trois tours
pour monter, un pour tout perdre.

**Ce que ça touche.** Un petit système de piles et ses icônes ; les formules
de dégâts et de mitigation.

**Risque : le plus élevé des trois.** Il change surtout le **long** combat,
celui contre un gardien. En contrepartie il rendrait les compagnons bien plus
intéressants — c'est le troisième manque cité plus haut.

---

## Ordre recommandé

1. **Levier 2** — presque gratuit, sans risque d'équilibre, et il installe la
   couche de connaissance sur laquelle les deux autres s'appuient.
2. **Levier 1** — c'est lui qui change ce qu'*est* un combat chez nous, et il
   se mesure.
3. **Levier 3** — il ne prend son sens que quand les deux premiers sont là.

## La réserve, et elle est importante

SMT est un jeu où l'on **s'arrête pour réfléchir**. Le nôtre tourne quand on ne
le regarde pas. Tout ce qu'on ajoute doit rester lisible **au pouce et sans
lecture**, sinon on obtient la profondeur de SMT sans son support — et un idle
qu'il faut piloter n'est plus un idle.

C'est précisément pourquoi le levier 1 s'ancre sur le **tempo** plutôt que sur
des tours : le tempo se sent, il ne se calcule pas.
