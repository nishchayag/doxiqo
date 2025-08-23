"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Zap, Shield, Clock } from "lucide-react";

// Simple Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "lg";
}

const Button = ({
  className = "",
  variant = "default",
  size = "default",
  children,
  ...props
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variantClasses = {
    default:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-600",
    ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-600",
  };

  const sizeClasses = {
    default: "h-10 px-4 py-2 text-sm",
    lg: "h-11 px-8 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Doxiqo</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-blue-600"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-32 pt-16 sm:pt-60 lg:px-8 lg:pt-32">
          <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
            <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Transform Your Code Into
                <span className="text-blue-600"> Perfect Documentation</span>
              </h1>
              <p className="relative mt-6 text-lg leading-8 text-gray-600 sm:max-w-md lg:max-w-none">
                Upload your project files and let AI generate comprehensive,
                professional documentation in seconds. Say goodbye to manual
                documentation writing and hello to instant, accurate docs.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    Start Documenting
                    <ArrowRight
                      className={`ml-2 h-5 w-5 transition-transform duration-200 ${
                        isHovered ? "translate-x-1" : ""
                      }`}
                    />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 py-3 text-lg"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
              <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                <div className="relative">
                  <div className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 shadow-lg"></div>
                </div>
              </div>
              <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                <div className="relative">
                  <div className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 shadow-lg"></div>
                </div>
                <div className="relative">
                  <div className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 shadow-lg"></div>
                </div>
              </div>
              <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                <div className="relative">
                  <div className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 shadow-lg"></div>
                </div>
                <div className="relative">
                  <div className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 shadow-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for perfect documentation
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Powerful AI-driven features that make documentation effortless and
              professional.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  AI-Powered Generation
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Upload your code files and our advanced AI analyzes your
                  project structure, functions, and logic to generate
                  comprehensive documentation automatically.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  Lightning Fast
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  What used to take hours or days now takes minutes. Get
                  professional-grade documentation for your entire project in
                  under 5 minutes.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  Multiple Formats
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Generate documentation in Markdown, PDF, HTML, or any format
                  you need. Perfect for GitHub, internal wikis, or client
                  deliverables.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  Secure & Private
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Your code is processed securely and never stored permanently.
                  We respect your intellectual property and maintain the highest
                  security standards.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your documentation workflow?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join thousands of developers who have already streamlined their
              documentation process with Doxiqo.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold"
                >
                  Get Started for Free
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-gray-600">© 2025 Doxiqo. All rights reserved.</p>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Doxiqo</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
