# Codadvent 2026

Mes solutions au [calendrier de l'Avent Coda](https://codadvent.fr/) : 25 défis (jours 0 à 24), un langage différent chaque jour.

> Règle de la communauté : sur le Discord, on discute des pistes, on ne balance pas la solution complète. Ce dépôt est public : évite de le partager avant la fin du calendrier.

## Organisation

```
starters/              copie des starters Coda (git subtree) — ne pas modifier
tools/                 CLI de récupération des consignes (Node, sans dépendance)
days/day-XX/
├── CONSIGNE.md        énoncé du jour (converti depuis le site)
├── snippets/          squelettes de code présents dans la fiche
├── upstream/          sources officielles du jour (zip du site), tel quel
└── <langage>/         ma solution du jour
```

## Prérequis

- Node ≥ 24, `pandoc`, `unzip`
- la chaîne d'outils du langage du jour (voir [`starters/README.md`](starters/README.md))

## Routine du jour

```bash
node tools/codadvent.mjs pull 3            # consigne + squelettes + sources officielles
node tools/codadvent.mjs start 3 python    # prépare days/day-03/python/
```

`start` choisit la base du dossier de travail :

1. **les sources officielles contiennent le langage** (`upstream/<langage>`) → copie du projet officiel tel quel, avec son propre outillage de test ;
2. **sinon** → copie du starter `starters/<langage>`, puis fusion à la main avec le squelette de la fiche :
   - remplacer `HelloWorld` (code et test) par le squelette de `snippets/`, transposé dans le langage du jour ;
   - garder le namespace `codadvent` du starter ;
   - écrire les tests de la règle métier avant le code.

`start` refuse d'écraser un dossier existant. `pull` peut être relancé sans risque : il ne touche qu'à `CONSIGNE.md`, `snippets/` et `upstream/`.

Ensuite : tests au vert, puis un commit par jour (`day-03: <titre> (python)`).

Langages : `c`, `cobol`, `csharp` (`c#`, `cs`), `java`, `php`, `typescript` (`ts`), `python` (`py`), `scala`, `kotlin` (`kt`), `rust` (`rs`).

## Maintenance

```bash
node --test 'tools/test/*.test.mjs'   # tests de la CLI
git subtree pull --prefix=starters https://github.com/Coda-Dijon/codadvent-starters.git main --squash
```

## Avancement

| Jour | Titre | Langage | Statut |
|---:|---|---|---|
| 0 | Avant que tout commence (SockMatch) | | à faire |
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |
| 11 | | | |
| 12 | | | |
| 13 | | | |
| 14 | | | |
| 15 | | | |
| 16 | | | |
| 17 | | | |
| 18 | | | |
| 19 | | | |
| 20 | | | |
| 21 | | | |
| 22 | | | |
| 23 | | | |
| 24 | | | |
