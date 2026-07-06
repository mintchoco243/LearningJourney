import "./globals.css";
import { Agentation } from "agentation";
import Script from "next/script";

export const metadata = {
  title: "Garena Learning Hub",
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
    >
      <body className="min-h-full flex flex-col">{children}</body>
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', { send_page_view: false });
            `}
          </Script>
        </>
      )}
      {process.env.NODE_ENV === "development" && <Agentation />}
    </html>
  );
}
