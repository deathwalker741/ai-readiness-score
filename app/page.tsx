"use client"

import { useState } from "react"
import { CVUpload } from "@/components/cv-upload"
import { ScoreDisplay } from "@/components/score-display"
import { Sparkles, Brain, Zap, Shield } from "lucide-react"
import type { EvaluationResult } from "@/lib/types"

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<"data_science" | "digital_marketing" | null>(null)
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (content: string, file?: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      if (file) {
        console.debug("[client] submitting file:", file.name, "size:", file.size)
        formData.append("cv", file)
      } else {
        console.debug("[client] submitting text content length:", content.length)
        formData.append("text", content)
      }
      
      // Add the selected role to the request
      if (selectedRole) {
        formData.append("role", selectedRole)
      }

      const response = await fetch("/api/evaluate", {
        method: "POST",
        body: formData,
      })

      let data: any = null
      try {
        data = await response.json()
      } catch (e) {
        console.error("[client] failed to parse JSON response", e)
        throw new Error("Invalid JSON response from server")
      }

      console.debug("[client] response status:", response.status, "ok:", response.ok)
      console.debug("[client] response data (truncated):", JSON.stringify(data).slice(0, 2000))

      if (!response.ok) {
        // include debug info if present
        const msg = data?.error || data?.debug || "Failed to evaluate CV"
        throw new Error(msg)
      }

      setResult(data)
    } catch (err) {
      console.error("[client] evaluation error:", err)
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setSelectedRole(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                AI Readiness Score
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#matrix" className="text-muted-foreground hover:text-foreground transition-colors">
                Evaluation Matrix
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {result ? (
          <ScoreDisplay result={result} onReset={handleReset} />
        ) : (
          <div className="space-y-16">
            {/* Hero Section */}
            <section className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
                <Zap className="w-4 h-4" />
                Evaluate candidate AI proficiency
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                Measure AI Readiness, Not Just Task Proficiency
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
                Move beyond traditional CV screening. Our AI-powered evaluation scores
                candidates on their ability to leverage AI tools for strategic outcomes,
                not just manual execution.
              </p>
            </section>

            {/* Role Selection Section */}
            <section className="max-w-2xl mx-auto">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground text-center">Select Candidate Role</h2>
                <p className="text-center text-muted-foreground">Choose the role the candidate is applying for</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Data Science Option */}
                  <button
                    onClick={() => setSelectedRole("data_science")}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedRole === "data_science"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">Data Science</h3>
                        <p className="text-sm text-muted-foreground">ML, AI tools, deployment</p>
                      </div>
                    </div>
                  </button>

                  {/* Digital Marketing Option */}
                  <button
                    onClick={() => setSelectedRole("digital_marketing")}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedRole === "digital_marketing"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">Digital Marketing</h3>
                        <p className="text-sm text-muted-foreground">SEO, automation, campaigns</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* Upload Section */}
            <section className="max-w-2xl mx-auto">
              {!selectedRole ? (
                <div className="p-6 rounded-lg bg-secondary/50 border border-border text-center text-muted-foreground">
                  Please select a role above to continue
                </div>
              ) : (
                <>
                  <CVUpload onSubmit={handleSubmit} isLoading={isLoading} />
                  {error && (
                    <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-center">
                      {error}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Features Section */}
            <section id="features" className="pt-8">
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Context-Aware Analysis
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Validates skills in work experience and projects, not just skills
                    lists. Proves real-world application.
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Experience-Adapted Scoring
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Different criteria for freshers vs experienced professionals.
                    Fair evaluation at every career stage.
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Anti-Gaming Protection
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Detects keyword stuffing and penalizes stale, automatable skill
                    sets. Rewards genuine AI adoption.
                  </p>
                </div>
              </div>
            </section>

            {/* Matrix Section */}
            <section id="matrix" className="pt-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-foreground text-center mb-8">
                  Evaluation Matrix
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Data Science */}
                  <div className="p-6 rounded-xl bg-card border border-border space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-chart-1/20 flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Data Science & Analytics
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-sm font-medium text-foreground">
                          Modern Tool Stack (40%)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Transformers, LangChain, Vector DBs, MLOps vs Legacy tools
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-sm font-medium text-foreground">
                          Deployment & Application (60%)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Production APIs, business impact vs isolated modeling
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Digital Marketing */}
                  <div className="p-6 rounded-xl bg-card border border-border space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-chart-2/20 flex items-center justify-center">
                        <span className="text-lg">📈</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Digital Marketing
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-sm font-medium text-foreground">
                          AI-Augmented Workflow (50%)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Programmatic SEO, automation, GenAI vs manual processes
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-sm font-medium text-foreground">
                          Outcome Density / ROI (50%)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          CAC, LTV, ROAS, revenue attribution vs vanity metrics
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            AI Readiness Score evaluates candidates based on their ability to leverage AI tools
            for strategic outcomes.
          </p>
        </div>
      </footer>
    </div>
  )
}
