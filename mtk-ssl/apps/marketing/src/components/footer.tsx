"use client";

import Link from "next/link";
import { Twitter, Github, Mail, Phone } from "lucide-react";

interface FooterProps {
  tenantBranding?: {
    tenant?: any;
    branding?: any;
  } | null;
}

export function Footer({ tenantBranding }: FooterProps) {
  // Hide Malik Tech branding if white-label is enabled
  const hideMalikTechBranding = tenantBranding?.branding?.hideSslBranding || false;
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-xl mb-4">Shakir Super League</h3>
            <p className="text-sm mb-4">
              Pakistan&apos;s #1 Cricket Tournament & League Management Platform
            </p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com/ShakirSuperL"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/maliktech/shakir-super-league"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="hover:text-emerald-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-emerald-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-emerald-400 transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-emerald-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a
                  href="mailto:support@ssl.cricket"
                  className="hover:text-emerald-400 transition-colors"
                >
                  support@ssl.cricket
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+92 300 1234567</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          {!hideMalikTechBranding && (
            <p>
              Software made by <strong className="text-white">Malik Tech</strong> • Offered by SSL • Developed by Muhammad Kashif •{" "}
              <a href="mailto:kaash054@gmail.com" className="hover:text-emerald-400 transition-colors">
                kaash054@gmail.com
              </a>
            </p>
          )}
          <p className="mt-2">
            © 2025-2026 {tenantBranding?.branding?.appName || "Shakir Super League"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

