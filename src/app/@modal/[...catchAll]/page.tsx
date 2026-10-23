// Toute autre page : aucune fenêtre. Sans ce fichier, une navigation dans le site garderait la fenêtre ouverte
// par-dessus la nouvelle page (comportement des emplacements parallèles, documentation Next.js « Modals »).
export default function CatchAll() {
  return null;
}
