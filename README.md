# Zyler - Your AI Coding Companion 🤖

Struggling to understand a new codebase? Zyler is your AI-powered assistant that helps developers navigate and understand code like a pro. Built with Next.js 15, TypeScript, and featuring advanced AI capabilities through Gemini 1.5 Flash with vector search.

![Zyler Demo](public/logo.png)

## 🧠 AI-Powered Intelligence

- **🔮 Gemini 1.5 Flash Integration**:

  - Advanced code understanding with real-time streaming responses
  - Context-aware code analysis with vector similarity search
  - Multi-modal capabilities for processing code, images, and markdown
  - Custom prompt engineering for developer-focused responses

- **🎯 Vector Search Capabilities**:
  - PostgreSQL with pgvector for semantic code search
  - File-level embeddings for intelligent code retrieval
  - Context-aware question answering
  - Real-time code pattern matching

## 🎯 Perfect for Junior Developers

- **🔍 Ask Anything About the Code**: Don't understand a function? Ask Zyler! It explains code in simple terms
- **📚 Learn as You Code**: Get real-time explanations and best practices while you work
- **🤝 Never Feel Lost Again**: Connect with your team and get AI-powered answers instantly
- **🎓 Accelerate Your Learning**: Perfect for bootcamp grads and self-taught developers

## ✨ Key Features

- **💡 Smart Code Analysis**:

  - Real-time code explanations with context
  - Semantic understanding of codebases
  - File reference tracking and visualization
  - Intelligent code navigation

- **🎥 Meeting Assistant**:

  - Audio meeting transcription and summarization
  - Automatic issue extraction and categorization
  - Timeline-based meeting navigation
  - Action item tracking

- **🔄 GitHub Integration**:

  - Automatic repository analysis
  - Commit history tracking with summaries
  - Team collaboration features
  - Project-based organization

- **👥 Team Features**:
  - Shared project workspaces
  - Team member invitations
  - Collaborative Q&A history
  - Knowledge base building

## 🏗️ Technical Architecture

### AI & Database Stack

- **Gemini Integration**:

  ```typescript
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  // Streaming responses with context
  const { textStream } = await streamText({
    model: google("gemini-1.5-flash"),
    prompt: `[Custom prompt with context]`,
  });
  ```

- **Vector Search**:

  ```sql
  CREATE EXTENSION vector;

  -- Embeddings for code search
  CREATE TABLE "SourceCodeEmbedding" (
    "fileName" TEXT,
    "sourceCode" TEXT,
    "summary" TEXT,
    "summaryEmbedding" vector(1536),
    "projectId" TEXT
  );
  ```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ with pgvector extension
- Gemini API key
- GitHub account
- Clerk account (for authentication)
- AssemblyAI API key (for meeting transcription)

### Environment Setup

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zyler"
GEMINI_API_KEY="your-gemini-api-key"
CLERK_SECRET_KEY="your-clerk-secret"
ASSEMBLY_AI_KEY="your-assembly-ai-key"
STRIPE_SECRET_KEY="your-stripe-key"
```

### Quick Start

1. Clone and setup:

```bash
git clone https://github.com/abujobayer0/Zyler.git
cd Zyler
```

2. Install dependencies:

```bash
bun i   # or: npm install
```

3. Setup database:

```bash
bun prisma db push
```

4. Start development:

```bash
bun dev
```

## 📦 Project Structure

```bash
src/
├── app/
│ ├── (protected)/     # Auth protected routes
│ │ ├── dashboard/    # Main dashboard
│ │ ├── meetings/     # Meeting management
│ │ └── qa/          # Q&A interface
│ ├── api/           # API routes
│ └── page.tsx       # Landing page
├── components/       # UI components
├── lib/             # Utilities
│ ├── gemini/       # AI integration
│ ├── assembly/     # Meeting processing
│ └── stripe/       # Payments
└── server/          # Backend logic
```

## 🛠️ Technology Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [PostgreSQL](https://www.postgresql.org/) + [pgvector](https://github.com/pgvector/pgvector) - Vector database
- [Gemini 1.5 Flash](https://deepmind.google/technologies/gemini/) - AI engine
- [AssemblyAI](https://www.assemblyai.com/) - Meeting transcription
- [Clerk](https://clerk.dev/) - Authentication
- [Stripe](https://stripe.com/) - Payments
- [tRPC](https://trpc.io/) - Type-safe APIs
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## 🤝 Want to Help?

We love contributions! Even if you're new to open source:

1. Fork it
2. Create your branch: `git checkout -b feature/CoolNewThing`
3. Make your changes
4. Push to your branch: `git push origin feature/CoolNewThing`
5. Open a Pull Request!

## 📝 License

MIT License - do cool stuff with it! See [LICENSE](LICENSE) for details.

## 🙏 Thanks To

- [Lucide Icons](https://lucide.dev/) - Pretty icons
- [Geist Font](https://vercel.com/font) - Nice typography
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful UI components

---

Author ❤️ [Abu Jobayer](https://www.linkedin.com/in/abutalhamdjobayer)

Need help? [Open an Issue](https://github.com/abujobayer0/Zyler/issues)
