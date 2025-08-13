"use client";

import Link from "next/link";
import { BookOpen, Mail, Heart } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";

const navigation = {
  sections: [
    {
      name: "About",
      items: [
        { name: "About Us", href: "/about" },
        { name: "How It Works", href: "/how-it-works" },
        { name: "Safety", href: "/safety" },
      ],
    },
    {
      name: "Features",
      items: [
        { name: "Interactive Videos", href: "/features/videos" },
        { name: "Educational Games", href: "/features/games" },
        { name: "Progress Tracking", href: "/features/tracking" },
      ],
    },
    {
      name: "Programs",
      items: [
        { name: "Early Learning", href: "/programs/early" },
        { name: "Math & Science", href: "/programs/math" },
        { name: "Arts & Creativity", href: "/programs/arts" },
      ],
    },
    {
      name: "Support",
      items: [
        { name: "Help Center", href: "/help" },
        { name: "Contact Us", href: "/contact" },
        { name: "Parent Resources", href: "/resources" },
      ],
    },
    {
      name: "Legal",
      items: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Child Safety", href: "/child-safety" },
      ],
    },
  ],
};

const Underline = `hover:-translate-y-1 border border-dotted border-gray-300 rounded-xl p-2.5 transition-transform hover:border-blue-300`;

export function Footer() {
  return (
    <footer className="border-gray-200 mx-auto w-full border-b border-t px-2 bg-white dark:bg-gray-900">
      <div className="relative mx-auto grid max-w-7xl items-center justify-center gap-6 p-10 pb-0 md:flex">
        <Link href="/">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-900 dark:text-blue-400">KIDO</span>
          </div>
        </Link>
        <p className="bg-transparent text-center text-xs leading-4 text-gray-600 dark:text-gray-400 md:text-left max-w-2xl">
          Welcome to KIDO, where safe learning meets fun! We're passionate about transforming screen time into 
          meaningful educational experiences for children. Our mission is to provide parents with the tools they 
          need to ensure their kids have access to high-quality, age-appropriate content that both entertains 
          and educates. Every video is carefully curated and AI-analyzed to meet our strict safety and educational standards.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="border-b border-dotted border-gray-200 dark:border-gray-700"></div>
        <div className="py-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 leading-6">
            {navigation.sections.map((section) => (
              <div key={section.name}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  {section.name}
                </h3>
                <ul role="list" className="flex flex-col space-y-2">
                  {section.items.map((item) => (
                    <li key={item.name} className="flow-root">
                      <Link
                        href={item.href}
                        className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-b border-dotted border-gray-200 dark:border-gray-700"></div>
      </div>

      <div className="flex flex-wrap justify-center gap-y-6 py-6">
        <div className="flex flex-wrap items-center justify-center gap-6 gap-y-4 px-6">
          <Link
            aria-label="Contact us"
            href="mailto:support@kido.com"
            rel="noreferrer"
            target="_blank"
            className={Underline}
          >
            <Mail strokeWidth={1.5} className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
        </div>
        <ThemeToggle />
      </div>

      <div className="mx-auto mb-10 mt-10 flex flex-col justify-between text-center text-xs md:max-w-7xl">
        <div className="flex flex-row items-center justify-center gap-1 text-gray-600 dark:text-gray-400">
          <span>©</span>
          <span>{new Date().getFullYear()}</span>
          <span>Made with</span>
          <Heart className="text-red-500 mx-1 h-4 w-4 animate-pulse fill-current" />
          <span>for families by</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            <Link aria-label="KIDO" className="hover:text-blue-700 dark:hover:text-blue-300" href="/">
              KIDO Team
            </Link>
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Safe • Educational • Fun
        </div>
      </div>
    </footer>
  );
}