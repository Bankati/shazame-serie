import { MarketingShell } from "@/components/layout/marketing-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
