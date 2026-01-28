export type FunctionType = "data_science" | "digital_marketing"

export type ExperienceLevel = "fresher" | "experienced"

export interface ParameterScore {
  name: string
  weight: number
  score: number
  weightedScore: number
  positiveIndicators: string[]
  negativeIndicators: string[]
  reasoning: string
}

export interface EvaluationResult {
  overallScore: number
  function: FunctionType
  functionLabel: string
  experienceLevel: ExperienceLevel
  yearsOfExperience: number
  parameters: ParameterScore[]
  validationNotes: string[]
  riskPenaltyApplied: boolean
  riskPenaltyReason: string | null
  summary: string
  recommendations: string[]
}
