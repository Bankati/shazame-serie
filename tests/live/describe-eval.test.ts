import { afterAll, describe, expect, it } from "vitest";

import { getVisionProvider } from "@/server/ai/openai-vision-provider";
import type { VisionResult } from "@/server/ai/vision-provider";
import { matchProposedTitle } from "@/server/catalog/match-title";
import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";

// Volet « description » de l'eval (U35, critère de fin) : 20 descriptions rédigées pour ce jeu (aucun texte
// repris d'un synopsis), titres TMDB vérifiés en U08. Appelle le vrai modèle (quelques centimes par passage) et
// TMDB : jamais en CI, seulement `npm run eval:describe` avec l'accord du fondateur (clés de .env.local).
type Case = { description: string; tmdbId: number; mediaType: "movie" | "tv" };

const CASES: Case[] = [
  { description: "Un pirate informatique découvre que le monde où il vit est une simulation créée par des machines, il apprend à esquiver des balles au ralenti", tmdbId: 603, mediaType: "movie" },
  { description: "Un riche paralysé engage comme aide à domicile un jeune de banlieue sans expérience, film français très drôle et émouvant", tmdbId: 77338, mediaType: "movie" },
  { description: "Une serveuse timide à Montmartre décide de faire le bonheur des autres en secret, film français avec un nain de jardin qui voyage", tmdbId: 194, mediaType: "movie" },
  { description: "Des braqueurs en combinaison rouge et masque de Dalí prennent la fabrique de la monnaie d'Espagne, dirigés par le Professeur", tmdbId: 71446, mediaType: "tv" },
  { description: "Un prof de chimie atteint d'un cancer se met à fabriquer de la drogue avec un ancien élève dans le désert du Nouveau-Mexique", tmdbId: 1396, mediaType: "tv" },
  { description: "Un hobbit doit porter un anneau maléfique jusqu'à un volcan pour le détruire, accompagné d'un magicien, d'un elfe et d'un nain, premier film", tmdbId: 120, mediaType: "movie" },
  { description: "Dessin animé japonais : une fillette se retrouve dans des bains publics pour esprits après que ses parents ont été changés en cochons", tmdbId: 129, mediaType: "movie" },
  { description: "Animé où l'humanité vit derrière d'immenses murs pour se protéger de géants qui dévorent les gens", tmdbId: 1429, mediaType: "tv" },
  { description: "Un banquier condamné à tort pour meurtre passe des années en prison et creuse en cachette un tunnel derrière une affiche", tmdbId: 278, mediaType: "movie" },
  { description: "Des voleurs s'introduisent dans les rêves des gens pour y implanter une idée, avec une toupie qui tourne à la fin", tmdbId: 27205, mediaType: "movie" },
  { description: "Série française : un homme d'origine sénégalaise s'inspire d'un gentleman cambrioleur des romans pour venger son père, au Louvre", tmdbId: 96677, mediaType: "tv" },
  { description: "Film récent avec Timothée Chalamet sur une planète désertique avec des vers géants et une épice précieuse", tmdbId: 438631, mediaType: "movie" },
  { description: "Adaptation des années 80 de David Lynch sur une planète de sable, avec Kyle MacLachlan et le chanteur Sting", tmdbId: 841, mediaType: "movie" },
  { description: "Série américaine filmée comme un faux documentaire dans une entreprise de papier en Pennsylvanie, avec un patron gênant", tmdbId: 2316, mediaType: "tv" },
  { description: "Série coréenne où des gens endettés jouent à des jeux d'enfants mortels pour gagner une fortune, avec des gardes en combinaison rose", tmdbId: 93405, mediaType: "tv" },
  { description: "le film avec keanu reeves où il prend la pilule rouge", tmdbId: 603, mediaType: "movie" },
  { description: "La série espagnole du casse avec la chanson Bella Ciao", tmdbId: 71446, mediaType: "tv" },
  { description: "Omar Sy joue un cambrioleur qui adore les livres d'Arsène Lupin", tmdbId: 96677, mediaType: "tv" },
  { description: "Un dessin animé de Miyazaki avec un dragon blanc et une sorcière qui tient des bains", tmdbId: 129, mediaType: "movie" },
  { description: "Walter White et Jesse Pinkman", tmdbId: 1396, mediaType: "tv" },
];

const RESULTS: { case: Case; top1: boolean; top3: boolean; confidence: number; cost: number }[] = [];
// Seuils de départ (à revoir avec l'eval complète, U13) : la description est plus vague qu'un extrait.
const MIN_TOP1 = 0.7;
const MIN_TOP3 = 0.85;

describe("eval description (20 cas, IA et TMDB réels)", () => {
  it.each(CASES)("$description", async (evalCase) => {
    const result: VisionResult = await getVisionProvider().identifyFromText(evalCase.description);
    const proposals = [
      ...(result.answer.recognized
        ? [{ title: result.answer.title, originalTitle: result.answer.originalTitle, year: result.answer.year, kind: result.answer.kind }]
        : []),
      ...result.answer.alternatives,
    ];
    const matches = await Promise.all(proposals.map((proposed) => matchProposedTitle(getCatalog(), proposed)));
    const found = matches.map((match) => (match.status === "matched" ? `${match.best.mediaType}-${match.best.tmdbId}` : null));
    const expected = `${evalCase.mediaType}-${evalCase.tmdbId}`;
    RESULTS.push({
      case: evalCase,
      top1: result.answer.recognized && found[0] === expected,
      top3: found.includes(expected),
      confidence: result.answer.confidence,
      cost: result.costMicroEur,
    });
  }, 60_000);

  afterAll(() => {
    const total = RESULTS.length || 1;
    const top1 = RESULTS.filter((entry) => entry.top1).length / total;
    const top3 = RESULTS.filter((entry) => entry.top3).length / total;
    const costEur = RESULTS.reduce((sum, entry) => sum + entry.cost, 0) / 1_000_000;
    console.info(`describe.v1 : top-1 ${(top1 * 100).toFixed(0)} %, top-3 ${(top3 * 100).toFixed(0)} %, coût ${costEur.toFixed(4)} €`);
    for (const entry of RESULTS.filter((item) => !item.top1)) {
      console.info(`  manqué (top-1) : ${entry.case.description.slice(0, 60)}… — confiance ${entry.confidence}`);
    }
    expect(top1).toBeGreaterThanOrEqual(MIN_TOP1);
    expect(top3).toBeGreaterThanOrEqual(MIN_TOP3);
  });
});
