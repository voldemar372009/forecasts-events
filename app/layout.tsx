import type { Metadata } from "next";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/cyrillic-400.css";
import "@fontsource/roboto/cyrillic-500.css";
import "@fontsource/roboto/cyrillic-700.css";
import "./globals.css";
import VisitTracker from "@/components/VisitTracker";

export const metadata: Metadata = {
  title: "Прогноз AI — ИИ-прогнозы на рынки",
  description:
    "Искусственный интеллект рассчитывает прогнозы на золото, нефть, доллар, биткоин и другие события.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-night text-white antialiased">
        <VisitTracker />
        {children}
      </body>
    </html>
  );
}
