import type { Metadata } from 'next';
import { League_Spartan, Roboto } from 'next/font/google';
import './globals.css';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { NextIntlClientProvider } from 'next-intl';

const leagueSpartan = League_Spartan({
  variable: '--font-league-spartan',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
});

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
});

export const metadata: Metadata = {
  title: 'White Rabbit',
  description:
    'Mystery Knowledge Database visualisation web app built with Neo4J and NextJS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${leagueSpartan.variable} ${roboto.variable} antialiased`}
      >
        <NextIntlClientProvider>
          <Header />
          <main className={'flex flex-col min-h-screen dark:bg-dark-gray'}>
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
