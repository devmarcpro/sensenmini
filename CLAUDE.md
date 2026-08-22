# Sensen Mini — notes de travail

*Ce que je voudrais savoir avant d'ouvrir un fichier, et que le code ne dit
pas de lui-même.*

## La forme du projet

- **JavaScript brut, aucun module ES.** Le préfixe numérique des fichiers de
  `src/` **est** l'ordre de chargement, et `index.html` le répète : une suite
  du banc d'essai vérifie que les deux concordent. Un fichier `24c-` doit
  donc être chargé après `24b-`.
- **Sept instruments**, tous en `node:vm` avec un faux DOM et un hasard semé :
  - `tools/spec.mjs` — le banc d'essai (près de mille vérifications, ~20 s)
  - `tools/smoke.mjs` — un vrai navigateur, trois formats d'écran
  - `tools/sim.mjs` — des bots qui jouent longtemps
  - `tools/courbe.mjs` — la courbe d'équipement (butin / boutique / atelier)
  - `tools/atteignable.mjs` — le contenu mort : ce que le monde ne produit jamais
  - `tools/mutation.mjs` — débranche des règles exprès et exige que le banc hurle
  - `tools/progression.mjs` — la forme d'une partie de soixante jours
- `npm test` enchaîne l'essentiel. **Rien ne se pousse sans les avoir passés.**

## Les pièges qui m'ont coûté du temps

**L'apostrophe française dans une chaîne à quotes simples.** Elle a cassé le
fichier entier quatre fois dans la même journée — quatre-vingt-dix suites en
échec d'un coup. Dans un texte français, **écrire la chaîne en quotes
doubles**. Le banc le dit en quatre secondes, mais autant ne pas l'écrire.

**Les scripts qui GÉNÈRENT du code.** J'édite souvent via un petit script
Node (le shell mange les apostrophes et les accents graves). Deux règles :
- ne jamais écrire un saut de ligne sous forme d'échappement dans une chaîne
  générée — il arrive une fois sur deux dans le fichier sous forme de vraie
  coupure et casse tout. Demander le caractère par son code ;
- **une ancre de remplacement tient sur UNE ligne**, sinon elle se casse au
  premier changement de mise en forme.

**Les ancres de `tools/mutation.mjs` vieillissent.** Quand une ligne du jeu
gagne un terme, l'ancre ne la trouve plus et l'outil le dit (« ancre
absente ») — c'est un signal, pas un bug : il faut la réaccrocher.

## Les règles de conception qui se sont imposées

Elles sont nées de défauts réels, chacune est tenue par une vérification.

- **Un contenu déclaré doit pouvoir sortir.** `atteignable.mjs` refuse une
  matière, une créature, un lieu, un geste, une quête que le monde ne produit
  jamais.
- **Un effet qu'on ne voit pas n'existe pas.** Un modificateur de sort, un
  état posé, un raccourci clavier, un plat, un passif : si aucun panneau ne
  le dit, il est mort. Trouvé quatre fois.
- **Un compte recopié finit par mentir.** « Trois postures » quand il y en a
  quatre, « Digit1-4 » quand il y en a six, `120` écrit à quatre endroits.
  La prose garde ses lettres (`nomNombre`), le nombre vient de la table.
- **Le contenu doit exister LÀ OÙ IL SERT.** Un geste de créature réservé aux
  espèces de début de partie, un lieu qui rend autant au niveau soixante
  qu'au premier jour : présents et pourtant absents.
- **Une option qui gagne partout n'est pas une option.** Toute table de choix
  (postures, modificateurs) doit avoir un défaut par entrée.
- **Un bouton couvert est un bouton absent.** La sonde demande au navigateur
  ce qui se trouve au centre de chaque bouton.
- **Ajouter n'est pas remplacer.** Distribuer un geste neuf en retirant un
  ancien a adouci le bestiaire de vingt-deux pour cent sans que je le veuille.
- **Mesurer avant d'accuser le jeu.** Plusieurs fois l'outil avait tort, pas
  le jeu : une sonde qui entraînait le forgeron qu'elle mesurait, un seuil
  calibré sur trop peu de tirages, une empreinte qui ne regardait pas où
  l'effet agit.

## Ce que le GDD dit, et ce qu'on en fait

`GDD.md` (racine) fait autorité et est plus récent que `SENSEN_GDD.md`. Il
décrit un jeu voxel en trois dimensions ; **nous en sommes la version idle de
navigateur**. Une section qui parle de rigs, de frames ou de collisions ne se
transpose pas telle quelle : on en garde la RÈGLE et on la réécrit dans notre
vocabulaire (exemple : « la lame rebondit sur un bloc » est devenue « une
hampe cogne les parois d'une galerie »).

Pas de sculpture (13), pas de voxel nouveau : c'est un jeu de navigateur qui
tourne en veille.

`PISTES-COMBAT.md` garde une analyse mise de côté : trois leviers pour
rapprocher le combat d'un Shin Megami Tensei. **Rien n'en est implémenté.**
