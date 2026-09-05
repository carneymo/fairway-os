import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'FairwayOS — Find your kind of golf',
  description:
    'Choose your next golf day. Local forecasts, courses worth playing, and a direct path to the first tee.',
  icons: { icon: '/assets/logo/fairwayos-emblem.png' },
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
