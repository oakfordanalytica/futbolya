import { SlimLayout } from "@/components/ui/slim-layout";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SlimLayout>{children}</SlimLayout>;
}
