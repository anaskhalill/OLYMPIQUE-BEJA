import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for the official Olympique de Beja website.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-foreground pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black mb-8 italic uppercase tracking-tight">
          Terms of Service
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Last updated: September 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">
              By accessing our website, you agree to be bound by these Terms of
              Service and to comply with all applicable laws and regulations. If
              you do not agree with any of these terms, you are prohibited from
              using or accessing this site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
            <p className="mb-4">
              Permission is granted to temporarily download one copy of the
              materials (information or software) on Olympique de Beja&apos;s
              website for personal, non-commercial transitory viewing only.
            </p>
            <p className="mb-4">
              This is the grant of a license, not a transfer of title, and
              under this license you may not:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Modify or copy the materials;</li>
              <li>
                Use the materials for any commercial purpose, or for any public
                display (commercial or non-commercial);
              </li>
              <li>
                Attempt to decompile or reverse engineer any software contained
                on the website;
              </li>
              <li>
                Remove any copyright or other proprietary notations from the
                materials;
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              3. Shop and Ticket Purchases
            </h2>
            <p className="mb-4">
              All purchases through our site or other transactions for the sale
              of goods/tickets formed through the Website or resulting from
              visits made by you are governed by our Terms of Sale.
            </p>
            <p className="mb-4">
              You must be at least 18 years of age to make purchases through
              the official store or ticketing portal. Age verification may be
              required.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. User Conduct</h2>
            <p className="mb-4">
              You agree not to use the website for any unlawful purpose or any
              purpose prohibited under this agreement. You agree not to use the
              website in any way that could damage the website or impair anyone
              else&apos;s use of it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Limitations</h2>
            <p className="mb-4">
              In no event shall Olympique de Beja or its suppliers be liable
              for any damages (including, without limitation, damages for loss
              of data or profit, or due to business interruption) arising out
              of the use or inability to use the materials on the website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Modifications</h2>
            <p className="mb-4">
              Olympique de Beja may revise these terms of service at any time
              without notice. By using this website you are agreeing to be
              bound by the then current version of these Terms of Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Governing Law</h2>
            <p className="mb-4">
              These terms and conditions are governed by and construed in
              accordance with the laws of Tunisia and you irrevocably submit to
              the exclusive jurisdiction of the courts in that State or
              location.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
