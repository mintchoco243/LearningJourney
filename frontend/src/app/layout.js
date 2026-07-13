import "./globals.css";
import { Agentation } from "agentation";
import { GoogleAnalyticsLoader } from "@/components/GoogleAnalyticsLoader";

export const metadata = {
  title: "Garena Learning Compass",
  description: "Hành trình phát triển kỹ năng tại Garena",
  icons: {
    icon: "/20ad908d-4854-41c4-9251-365e0cf2f557.png",
  },
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html
      lang="vi"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
      <GoogleAnalyticsLoader initialGaId={gaId} />
      {process.env.NODE_ENV === "development" && <Agentation />}
    </html>
  );
}
