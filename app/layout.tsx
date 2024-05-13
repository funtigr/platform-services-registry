'use client';

import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { useQuery } from '@tanstack/react-query';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';
import Footer from '@/components/Footer';
import Nav from '@/components/nav/Nav';
import Provider from '@/components/Provider';
import { getInfo } from '@/services/backend';
import { useAppState } from '@/states/global';
import classNames from '@/utils/classnames';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

function MainBody({ children }: { children: React.ReactNode }) {
  const [appState, appSnapshot] = useAppState();

  const { data: info } = useQuery({
    queryKey: ['info'],
    queryFn: () => getInfo(),
  });

  useEffect(() => {
    if (info) appState.info = info;
  }, [appState, info]);

  return (
    <body className={classNames('flex flex-col min-h-screen', inter.className)}>
      <Nav />
      <main className="flex-grow h-100">
        <div className="mt-8 mb-8 h-full mx-4 lg:mx-20">{children}</div>
      </main>
      <Footer />
    </body>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Provider>
        <MainBody>{children}</MainBody>
      </Provider>
    </html>
  );
}
