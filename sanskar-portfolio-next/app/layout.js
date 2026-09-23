import "./globals.css";

export const metadata = {
  title: "Sanskar Sharma · Interactive Portfolio",
  description:
    "Sanskar Sharma, UX designer. An interactive portfolio in four chapters.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Nunito:ital,wght@0,400;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
