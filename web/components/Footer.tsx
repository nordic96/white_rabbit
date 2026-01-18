'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { HiHome } from 'react-icons/hi';

interface SocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

export default function Footer() {
  const t = useTranslations('Footer');

  const socialLinks: SocialLink[] = [
    {
      icon: <HiHome className="w-5 h-5" />,
      href: 'https://stephenghk.com',
      label: t('links.home'),
    },
    {
      icon: <FaLinkedin className="w-5 h-5" />,
      href: 'https://www.linkedin.com/in/gi-hun-ko-863619184',
      label: t('links.linkedin'),
    },
    {
      icon: <FaGithub className="w-5 h-5" />,
      href: 'https://github.com/nordic96/white_rabbit',
      label: t('links.github'),
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-dark-secondary">
      {/* Main footer content */}
      <div className="mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-start gap-6 sm:gap-8">
          {/* Logo Section */}
          <div className="shrink-0">
            <Image
              src="/images/white_rabbit_logo.svg"
              alt="White Rabbit Logo"
              width={200}
              height={120}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Name Card with Social Links */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            <p className="text-gray-400 text-sm">
              {t('createdBy')}{' '}
              <span className="text-gray-200 font-medium">
                {t('authorName')}
              </span>
            </p>

            {/* Social Icons Row */}
            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="text-gray-400 hover:text-mystery-purple transition-colors duration-200 p-2 hover:bg-gray-800 rounded-lg"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="border-t border-gray-800 bg-dark-gray">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-gray-500 text-xs sm:text-sm text-center leading-relaxed">
            {t('disclaimer')}
          </p>
          <p className="text-gray-600 text-xs text-center mt-2">
            &copy; {currentYear} {t('authorName')}. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
