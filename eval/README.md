# Jeu de test des extraits (U13)

Ce jeu sert uniquement à **mesurer** la qualité de l'identification : pour chaque vidéo, on connaît d'avance la bonne réponse et on vérifie si l'outil la trouve. Les utilisateurs, eux, n'ont rien à saisir.

Les extraits sont des contenus protégés : ils ne sont **jamais** versés dans le dépôt (Q5).

## 1. Préparer le dossier

1. Créez un dossier privé hors du projet, par exemple `C:\eval-extraits`.
2. Déposez-y les vidéos (MP4, MOV, WebM, MKV, AVI…), filmées ou enregistrées comme le ferait un utilisateur.
3. **Nommez chaque fichier d'après son titre** :
   - film : `Intouchables (2011).mp4` (l'année est facultative mais lève les doutes) ;
   - série : `La Casa de Papel [serie].mp4` (la mention `[serie]` est facultative mais lève les doutes) ;
   - plusieurs extraits du même titre : `Intouchables (2011) 2.mp4`, `Intouchables (2011) 3.mp4`.
4. Ajoutez `EVAL_DIR=C:\eval-extraits` dans `.env.local`.

## 2. Générer le corrigé

```bash
npm run eval:prepare
```

L'outil retrouve chaque titre sur TMDB et écrit `manifest.json` dans le dossier. Il affiche, pour chaque vidéo, le titre trouvé : **vérifiez la liste**. Si un titre est faux, renommez le fichier (ajoutez l'année ou `[serie]`), supprimez sa ligne dans `manifest.json` et relancez. Les lignes déjà présentes ne sont jamais modifiées, pour garder vos corrections.

Facultatif : dans `manifest.json`, `difficulty` (`facile`, `moyen`, `difficile`) et `startS` (début du passage analysé, en secondes, pour une vidéo de plus de 60 s).

## 3. Mesurer

```bash
npm install --no-save ffmpeg-static@5.3.0   # une seule fois
npm run eval
```

Chaque passage appelle la vraie IA et TMDB (quelques centimes par extrait). Le rapport est écrit dans `eval-results/` (ignoré par git).
