import Link from "next/link";

import { ErrorScreen } from "@/components/layout/error-screen";
import { Button } from "@/components/ui/button";
import { LAYOUT_TEXT } from "@/content/fr/layout";

export default function NotFound() {
  const { notFound } = LAYOUT_TEXT;

  return (
    <ErrorScreen
      eyebrow={notFound.code}
      title={notFound.title}
      description={notFound.description}
      actions={
        <Button asChild className="h-11 px-6 text-base hover:bg-primary-hover">
          <Link href="/">{notFound.back}</Link>
        </Button>
      }
    />
  );
}
