"use client"

import * as React from "react"
import Link from "next/link"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { BookOpen, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/80 backdrop-blur-md border-b border-border/50' 
        : 'bg-background border-b border-border'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-3xl font-bold text-foreground font-serif-elegant">
              kido
            </span>
          </Link>

          {/* Desktop Navigation - Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="outline">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button>
                  Get Started
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button>
                  Dashboard
                </Button>
              </Link>
              <UserButton />
            </SignedIn>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-border bg-background py-4">
            <div className="flex flex-col space-y-3">
              <SignedOut>
                <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">
                    Get Started
                  </Button>
                </Link>
              </SignedOut>

              <SignedIn>
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">
                    Dashboard
                  </Button>
                </Link>
                <div className="flex justify-center pt-2">
                  <UserButton />
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


