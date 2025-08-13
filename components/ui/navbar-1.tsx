"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X, BookOpen } from "lucide-react"
import Link from "next/link"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <div className="flex justify-center w-full py-6 px-4 bg-white">
      <div className="flex items-center justify-between px-6 py-3 bg-white rounded-full shadow-lg w-full max-w-5xl relative z-10 border border-gray-100">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-blue-900">
            KIDO
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-sm text-gray-900 hover:text-blue-600 transition-colors font-semibold">
            Home
          </Link>
          <Link href="#about" className="text-sm text-gray-900 hover:text-blue-600 transition-colors font-semibold">
            About Us
          </Link>
          <Link href="#programs" className="text-sm text-gray-900 hover:text-blue-600 transition-colors font-semibold">
            Programs
          </Link>
          <Link href="#contact" className="text-sm text-gray-900 hover:text-blue-600 transition-colors font-semibold">
            Contact
          </Link>
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center space-x-2">
          <SignedOut>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center px-5 py-2 text-sm text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-5 py-2 text-sm text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-5 py-2 text-sm text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors font-medium mr-2"
            >
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden flex items-center" onClick={toggleMenu}>
          <Menu className="h-6 w-6 text-gray-900" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-white z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-900" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              {[
                { name: "Home", href: "/" },
                { name: "About Us", href: "#about" },
                { name: "Programs", href: "#programs" },
                { name: "Contact", href: "#contact" }
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Link href={item.href} className="text-base text-gray-900 font-medium" onClick={toggleMenu}>
                    {item.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6 space-y-4"
              >
                <SignedOut>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-blue-600 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors font-medium"
                    onClick={toggleMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-colors font-medium"
                    onClick={toggleMenu}
                  >
                    Get Started
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-colors font-medium"
                    onClick={toggleMenu}
                  >
                    Dashboard
                  </Link>
                </SignedIn>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { Navbar1 }