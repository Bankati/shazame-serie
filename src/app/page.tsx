import { APP_TEXT } from "@/content/fr/app";

// Page provisoire : la coquille et le design arrivent en U02.
export default function Home() {
  return (
    <main>
      <h1>{APP_TEXT.name}</h1>
      <p>{APP_TEXT.tagline}</p>
      <p>{APP_TEXT.comingSoon}</p>
    </main>
  );
}
