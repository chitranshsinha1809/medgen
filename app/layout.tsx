import "./globals.css";

export const metadata = {
  title: "Med-Gen",
  description: "Medical Report Analyzer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}