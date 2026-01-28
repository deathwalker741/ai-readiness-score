"use client"

import { useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BarChart3,
  Target,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { EvaluationResult } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ScoreDisplayProps {
  result: EvaluationResult
  onReset: () => void
}

export function ScoreDisplay({ result, onReset }: ScoreDisplayProps) {
  const scoreColor = useMemo(() => {
    if (result.overallScore >= 70) return "text-success"
    if (result.overallScore >= 40) return "text-warning"
    return "text-destructive"
  }, [result.overallScore])

  const scoreLabel = useMemo(() => {
    if (result.overallScore >= 80) return "Excellent"
    if (result.overallScore >= 70) return "Good"
    if (result.overallScore >= 50) return "Moderate"
    if (result.overallScore >= 30) return "Developing"
    return "Low"
  }, [result.overallScore])

  const scoreBgColor = useMemo(() => {
    if (result.overallScore >= 70) return "bg-success/10 border-success/30"
    if (result.overallScore >= 40) return "bg-warning/10 border-warning/30"
    return "bg-destructive/10 border-destructive/30"
  }, [result.overallScore])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header with Score */}
      <div className="text-center space-y-4">
        <div
          className={cn(
            "inline-flex items-center justify-center w-40 h-40 rounded-full border-4",
            scoreBgColor
          )}
        >
          <div className="text-center">
            <span className={cn("text-5xl font-bold", scoreColor)}>
              {result.overallScore}
            </span>
            <p className="text-sm text-muted-foreground mt-1">/ 100</p>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{scoreLabel} AI Readiness</h2>
          <p className="text-muted-foreground mt-1">
            {result.functionLabel} • {result.yearsOfExperience} years experience
          </p>
        </div>
        {result.riskPenaltyApplied && (
          <Badge variant="destructive" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            -20 Risk Penalty Applied
          </Badge>
        )}
      </div>

      {/* Summary Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <BarChart3 className="w-5 h-5 text-primary" />
            Evaluation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{result.summary}</p>
        </CardContent>
      </Card>

      {/* Parameter Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Target className="w-5 h-5 text-primary" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {result.parameters.map((param, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{param.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Weight: {param.weight}%
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-foreground">
                    {param.score}
                  </span>
                  <span className="text-muted-foreground">/100</span>
                  <p className="text-sm text-muted-foreground">
                    Weighted: {param.weightedScore.toFixed(1)}
                  </p>
                </div>
              </div>
              <Progress value={param.score} className="h-2" />
              <p className="text-sm text-muted-foreground">{param.reasoning}</p>

              {/* Indicators */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-success flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Positive Indicators
                  </p>
                  {param.positiveIndicators.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {param.positiveIndicators.map((indicator, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs bg-success/10 border-success/30 text-success whitespace-normal"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">None</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" />
                    Areas for Improvement
                  </p>
                  {param.negativeIndicators.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {param.negativeIndicators.map((indicator, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs bg-destructive/10 border-destructive/30 text-destructive whitespace-normal"
                        >
                          <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">None</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Validation Notes */}
      {result.validationNotes.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Zap className="w-5 h-5 text-primary" />
              Context Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.validationNotes.map((note, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-primary mt-1">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Risk Penalty */}
      {result.riskPenaltyApplied && result.riskPenaltyReason && (
        <Card className="bg-destructive/5 border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Risk Penalty Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{result.riskPenaltyReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Lightbulb className="w-5 h-5 text-warning" />
            Recommendations to Improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-muted-foreground">{rec}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onReset}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Evaluate Another CV
        </button>
      </div>
    </div>
  )
}
