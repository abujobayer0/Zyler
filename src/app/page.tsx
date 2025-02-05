import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Github,
  Bot,
  ArrowRight,
  Sparkles,
  Presentation,
  Braces,
  MessagesSquare,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Animated SVG Background */}
      <div className="fixed inset-0 -z-10">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
        >
          <defs>
            <pattern
              id="grid-pattern"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              {/* Dots at intersections */}
              <circle
                cx="30"
                cy="30"
                r="1.5"
                fill="currentColor"
                className="text-gray-300"
              >
                <animate
                  attributeName="r"
                  values="1.5;2.5;1.5"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.5;0.8;0.5"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Diagonal lines */}
              <path
                d="M0 0L60 60 M60 0L0 60"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-200"
                opacity="0.8"
              >
                <animate
                  attributeName="stroke-width"
                  values="0.5;1;0.5"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Grid lines */}
              <path
                d="M0 30h60M30 0v60"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-200"
              >
                <animate
                  attributeName="stroke-width"
                  values="0.8;1.2;0.8"
                  dur="5s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Small corner accents */}
              <circle
                cx="0"
                cy="0"
                r="1"
                fill="currentColor"
                className="text-primary/20"
              />
              <circle
                cx="60"
                cy="0"
                r="1"
                fill="currentColor"
                className="text-primary/20"
              />
              <circle
                cx="0"
                cy="60"
                r="1"
                fill="currentColor"
                className="text-primary/20"
              />
              <circle
                cx="60"
                cy="60"
                r="1"
                fill="currentColor"
                className="text-primary/20"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] animate-pulse rounded-full bg-primary/20 opacity-20 blur-[100px]" />
        <div className="absolute right-0 top-1/4 -z-10 h-[310px] w-[310px] animate-pulse rounded-full bg-purple-500/20 opacity-20 blur-[100px] delay-700" />
        <div className="absolute bottom-1/4 left-0 -z-10 h-[310px] w-[310px] animate-pulse rounded-full bg-primary/20 opacity-20 blur-[100px] delay-1000" />
      </div>

      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-6xl py-24 sm:py-32 lg:py-40">
          <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/10 backdrop-blur-sm transition-colors hover:bg-primary/10">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Now with Gemini 1.5 Flash
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Your AI-Powered
                <span className="relative mt-2 block">
                  <span className="text-primary">Development Assistant</span>
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Transform your development workflow with AI-powered code
                understanding and meeting summaries. Perfect for teams who want
                to move faster.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                <Link href="/create">
                  <Button
                    size="lg"
                    className="group gap-2 px-8 transition-all hover:shadow-lg"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold leading-6 text-gray-900 transition-colors hover:text-primary"
                >
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* Animated Hero Visual */}
            <div className="perspective-1000 relative">
              <div className="absolute -inset-4 animate-pulse rounded-full bg-gradient-to-r from-primary to-primary opacity-10 blur-3xl" />
              <div className="hover:rotate-y-12 relative flex flex-col gap-y-4 rounded-2xl bg-white/30 p-6 ring-1 ring-gray-900/5 backdrop-blur-lg transition-transform duration-500">
                <div className="animate-float-1 rounded-lg bg-white p-4 shadow-lg transition-transform hover:scale-105">
                  <Github className="h-8 w-8 text-primary" />
                </div>
                <div className="animate-float-2 rounded-lg bg-white p-4 shadow-lg transition-transform hover:scale-105">
                  <Bot className="h-8 w-8 text-purple-500" />
                </div>
                <div className="animate-float-3 rounded-lg bg-white p-4 shadow-lg transition-transform hover:scale-105">
                  <Presentation className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative bg-white/50 py-24 backdrop-blur-sm sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to accelerate development
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Powerful AI features to help your team understand code and
              communicate effectively.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  icon: Braces,
                  title: "Code Understanding",
                  description:
                    "Get instant, accurate explanations about any part of your codebase with AI-powered analysis",
                },
                {
                  icon: Presentation,
                  title: "Meeting Summaries",
                  description:
                    "Upload meeting recordings and get AI-generated summaries to save time and stay focused",
                },
                {
                  icon: MessagesSquare,
                  title: "Team Collaboration",
                  description:
                    "Share insights and knowledge with your entire development team in real-time",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative flex flex-col rounded-2xl bg-white/50 p-8 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold text-gray-900">
                    <div className={`rounded-lg bg-primary p-2 text-white`}>
                      <feature.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    </div>
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
