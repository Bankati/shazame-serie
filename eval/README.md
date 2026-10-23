# Jeu de test des extraits (U13)

Les extraits sont des contenus protégés : ils ne sont **jamais** versés dans le dépôt (Q5).

1. Créez un dossier privé hors du dépôt, par exemple `C:\eval-extraits`.
2. Déposez-y les extraits (MP4, MOV, WebM, MKV, AVI…), filmés ou enregistrés comme le ferait un utilisateur.
3. Copiez `manifest.example.json` dans ce dossier sous le nom `manifest.json`, et décrivez chaque extrait :
   - `file` : nom du fichier ;
   - `tmdbId` et `mediaType` (`movie` ou `tv`) : le titre attendu, lu dans l'adresse de sa page TMDB (themoviedb.org/movie/603 → 603 et movie) ;
   - `difficulty` : `facile`, `moyen` ou `difficile` ;
   - `startS` (facultatif) : début du passage analysé pour une vidéo de plus de 60 s.
4. Ajoutez `EVAL_DIR=C:\eval-extraits` dans `.env.local`.
5. `npm install --no-save ffmpeg-static@5.3.0` (une fois), puis `npm run eval`.

Chaque passage appelle la vraie IA et TMDB (quelques centimes par extrait). Le rapport est écrit dans `eval-results/` (ignoré par git).
