import "./globals.css";
import { Agentation } from "agentation";

export const metadata = {
  title: "Garena Learning Hub",
  description: "Hành trình phát triển kỹ năng tại Garena",
  icons: {
    icon: "/20ad908d-4854-41c4-9251-365e0cf2f557.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="vi"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
      {process.env.NODE_ENV === "development" && <Agentation />}
    </html>
  );
}
