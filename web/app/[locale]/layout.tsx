import type { Metadata } from 'next';
import { League_Spartan, Roboto } from 'next/font/google';
import '../globals.css';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n';

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

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
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
