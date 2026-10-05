import "./globals.css";

export const metadata = {
  title: "Şantiye Yönetim Sistemi",
  description: "Şantiye ve proje yönetim sistemi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
