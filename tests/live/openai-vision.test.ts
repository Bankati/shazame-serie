import { describe, expect, it } from "vitest";

import { getVisionProvider } from "@/server/ai/openai-vision-provider";

import { sceneJpeg } from "../support/scene-images";

// Critère de fin de U07 : un appel réel renvoie un objet conforme, avec son coût.
// Coût indicatif : quelques centimes au total. Lancement manuel uniquement (npm run test:ai).

// Image du domaine public (Méliès, 1902), téléchargée à l'exécution et jamais stockée dans le dépôt.
const PUBLIC_DOMAIN_STILL = "https://commons.wikimedia.org/wiki/Special:FilePath/Le_Voyage_dans_la_lune.jpg?width=768";

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { "User-Agent": "plateforme-cinephile-test/1.0 (dev)" } });
  if (!response.ok) throw new Error(`Téléchargement impossible : ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

describe("OpenAI vision en direct", () => {
  it("renvoie un objet conforme et chiffré pour des images sans film (non reconnu attendu)", async () => {
    const result = await getVisionProvider().identify([await sceneJpeg(1), await sceneJpeg(2)]);
    console.info("synthèse :", JSON.stringify({ answer: result.answer, model: result.model, latencyMs: result.latencyMs, usage: result.usage, costMicroEur: result.costMicroEur }));

    expect(result.promptVersion).toBe("identify.v1");
    expect(result.costMicroEur).toBeGreaterThan(0);
    expect(result.answer.confidence).toBeLessThan(50);
  });

  it("reconnaît un film célèbre du domaine public (Le Voyage dans la Lune, 1902)", async () => {
    const still = await download(PUBLIC_DOMAIN_STILL);
    const result = await getVisionProvider().identify([still, still]);
    console.info("Méliès :", JSON.stringify({ answer: result.answer, latencyMs: result.latencyMs, usage: result.usage, costMicroEur: result.costMicroEur }));

    expect(result.answer.recognized).toBe(true);
    if (result.answer.recognized) {
      expect(result.answer.year).toBe(1902);
      expect(result.answer.kind).toBe("film");
      expect(result.answer.title.toLowerCase()).toContain("lune");
    }
  });
});
