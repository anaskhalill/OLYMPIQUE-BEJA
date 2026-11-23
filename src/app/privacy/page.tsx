import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy of Olympique de Beja - How we collect, use, and protect your personal data.",
};

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Last updated: September 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to the official Olympique de Beja website. We respect
              your privacy and are committed to protecting your personal data.
              This privacy policy will inform you as to how we look after your
              personal data when you visit our website and tell you about your
              privacy rights and how the law protects you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              2. The Data We Collect About You
            </h2>
            <p className="mb-4">
              We may collect, use, store and transfer different kinds of
              personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Identity Data:</strong> includes first name, last name,
                username or similar identifier.
              </li>
              <li>
                <strong>Contact Data:</strong> includes email address and
                telephone numbers.
              </li>
              <li>
                <strong>Technical Data:</strong> includes internet protocol (IP)
                address, your login data, browser type and version, time zone
                setting and location.
              </li>
              <li>
                <strong>Usage Data:</strong> includes information about how you
                use our website, products and services.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              3. How We Use Your Personal Data
            </h2>
            <p className="mb-4">
              We will only use your personal data when the law allows us to.
              Most commonly, we will use your personal data in the following
              circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                Where we need to perform the contract we are about to enter
                into or have entered into with you.
              </li>
              <li>
                Where it is necessary for our legitimate interests (or those
                of a third party) and your interests and fundamental rights do
                not override those interests.
              </li>
              <li>
                Where we need to comply with a legal obligation.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p className="mb-4">
              We have put in place appropriate security measures to prevent your
              personal data from being accidentally lost, used or accessed in an
              unauthorised way, altered or disclosed. In addition, we limit
              access to your personal data to those employees, agents,
              contractors and other third parties who have a business need to
              know.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Cookies</h2>
            <p className="mb-4">
              Our website uses cookies to distinguish you from other users of
              our website. This helps us to provide you with a good experience
              when you browse our website and also allows us to improve our
              site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
            <p className="mb-4">
              Under certain circumstances, you have rights under data protection
              laws in relation to your personal data, including the right to
              access, correct, or delete your personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this privacy policy or our privacy
              practices, please contact us at the official Olympique de Beja
              channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
