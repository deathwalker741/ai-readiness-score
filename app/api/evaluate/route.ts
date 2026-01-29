import { z } from "zod"
import mammoth from "mammoth"

// Get API key from environment variables (set in .env.local for local development)
const GEMINI_API_KEY = process.env.AI_GATEWAY_API_KEY || process.env.GOOGLE_API_KEY || ""

if (!GEMINI_API_KEY) {
  console.error("[evaluate] ERROR: No API key found. Set AI_GATEWAY_API_KEY in .env.local")
}

// Make the key available to any libraries that read the env var
process.env.GOOGLE_API_KEY = GEMINI_API_KEY
process.env.AI_GATEWAY_API_KEY = GEMINI_API_KEY
console.debug("[evaluate] AI_GATEWAY_API_KEY set:", !!process.env.AI_GATEWAY_API_KEY)

const evaluationSchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe("The final AI readiness score from 0-100"),
  function: z
    .enum(["data_science", "digital_marketing"])
    .describe("The detected primary function of the candidate"),
  functionLabel: z
    .string()
    .describe("Human readable label for the function"),
  experienceLevel: z
    .enum(["fresher", "experienced"])
    .describe("fresher for 0-2 years, experienced for 3+ years"),
  yearsOfExperience: z
    .number()
    .describe("Estimated years of experience from the CV"),
  parameters: z.array(
    z.object({
      name: z.string().describe("Name of the parameter being evaluated"),
      weight: z
        .number()
        .describe("Weight percentage for this parameter (e.g., 40 for 40%)"),
      score: z
        .number()
        .min(0)
        .max(100)
        .describe("Raw score for this parameter before weighting"),
      weightedScore: z
        .number()
        .describe("Score multiplied by weight percentage"),
      positiveIndicators: z
        .array(z.string())
        .describe("Positive keywords/evidence found in valid sections"),
      negativeIndicators: z
        .array(z.string())
        .describe("Negative/legacy keywords found"),
      reasoning: z.string().describe("Explanation of how score was determined"),
    })
  ),
  validationNotes: z
    .array(z.string())
    .describe(
      "Notes about context validation - what was found in valid vs invalid sections"
    ),
  riskPenaltyApplied: z
    .boolean()
    .describe("Whether the -20 stale factor penalty was applied"),
  riskPenaltyReason: z
    .string()
    .nullable()
    .describe("Reason for risk penalty if applied, null otherwise"),
  summary: z
    .string()
    .describe("2-3 sentence summary of the candidate AI readiness"),
  recommendations: z
    .array(z.string())
    .describe("3-5 specific recommendations for the candidate to improve"),
})

const getSystemPrompt = (role: "data_science" | "digital_marketing") => {
  return `You are an AI Readiness Evaluator. Analyze CVs for the ${role === "data_science" ? "Data Science" : "Digital Marketing"} role and output ONLY valid JSON matching this exact schema. Do not add markdown, comments, or explanations.

## OUTPUT SCHEMA (Required - All fields must be present)
{
  "overallScore": number (0-100),
  "function": "${role}",
  "functionLabel": "string",
  "experienceLevel": "fresher" | "experienced",
  "yearsOfExperience": number,
  "parameters": [
    {
      "name": "string",
      "weight": number (percentage),
      "score": number (0-100),
      "weightedScore": number,
      "positiveIndicators": [string],
      "negativeIndicators": [string],
      "reasoning": "string"
    }
  ],
  "validationNotes": [string],
  "riskPenaltyApplied": boolean,
  "riskPenaltyReason": string | null,
  "summary": "string",
  "recommendations": [string]
}

${role === "data_science" ? `## DATA SCIENCE EVALUATION RULES

**Parameter 1: Modern Tool Stack (40% weight)**
- Positive: Transformers, Hugging Face, LangChain, Vertex AI, MLOps, Vector DBs, OpenAI API, Claude API, RAG, fine-tuning, PyTorch, TensorFlow
- Negative Indicators to ALWAYS capture (if absent):
  * No mention of modern ML frameworks (Transformers, PyTorch, TensorFlow, Scikit-learn)
  * Reliance on Excel-based models or business intelligence tools
  * No evidence of LLM/GenAI experience (ChatGPT, Claude, Gemini APIs)
  * Missing vector database or semantic search experience
  * No ML operations or model deployment experience
  * Outdated tools: SAS, SPSS, R without modern frameworks
- Score based on evidence in Work Experience or Projects ONLY (Skills lists get 80% discount)

**Parameter 2: Deployment & Application (60% weight)**
- Positive: Deployed API, Streamlit/Gradio/FastAPI apps, CI/CD pipelines, Production ML, user-facing impact, revenue metrics, A/B testing
- Negative Indicators to ALWAYS capture (if absent):
  * No deployed models or applications mentioned
  * Only training/analysis with no real-world application
  * No evidence of production environment experience
  * Missing quantified business impact (revenue, cost savings, user metrics)
  * No CI/CD or DevOps practices mentioned
  * Purely academic/theoretical projects without deployment
  * No evidence of handling production data at scale
- Score based on evidence in Work Experience or Projects ONLY

**Experience-Based Rules:**
- Fresher (0-2 years): Score personal projects and hackathons. Ignore lack of enterprise impact. Look for learning velocity.
- Experienced (3+ years): Penalize high "legacy skill" density without recent AI adoption. Expect production experience.

**Risk Penalty:** If >50% of CV bullets describe fully automatable tasks (data cleaning, reporting, dashboards), deduct 20 points.` : `## DIGITAL MARKETING EVALUATION RULES

**Parameter 1: AI-Augmented Workflow (50% weight)**
- Positive: Programmatic SEO, Automation (Zapier/Make), GenAI for content, Dynamic Creative, AI copywriting, Predictive analytics
- Negative Indicators to ALWAYS capture (if absent):
  * Manual campaign management with no automation tools
  * No use of AI/ML for content creation or optimization
  * Missing programmatic advertising or dynamic creative optimization
  * No automation platforms (Zapier, Make, HubSpot automation)
  * Purely manual keyword bidding without smart bidding strategies
  * No GenAI tools (ChatGPT, Claude, etc.) for content or strategy
  * No mention of predictive analytics or audience modeling
- Score based on evidence in Work Experience or Projects ONLY

**Parameter 2: Outcome Density/ROI (50% weight)**
- Positive: CAC, LTV, ROAS, Revenue Attribution, Conversion Rate, CPA, CLTV, Growth %, specific quantified metrics
- Negative Indicators to ALWAYS capture (if absent):
  * Vanity metrics only (Reach, Impressions, Likes, Followers)
  * No revenue or business impact mentioned
  * Missing conversion rate optimization focus
  * No customer acquisition cost (CAC) or lifetime value (LTV) tracking
  * Vague descriptions without specific KPIs or results
  * No A/B testing or experimentation mentioned
  * No measurable ROI or cost-per-acquisition data
- Score based on evidence in Work Experience or Projects ONLY

**Experience-Based Rules:**
- Fresher (0-2 years): Score campaign management, social media growth, and personal brand work. Ignore lack of enterprise impact.
- Experienced (3+ years): Penalize missing AI adoption, metrics-driven approach, and quantified business results in recent roles.

**Risk Penalty:** If >50% of CV bullets describe purely manual tasks (manual posting, manual bidding, manual reporting), deduct 20 points.`}

## INDICATOR GENERATION RULES (IMPORTANT)
For BOTH positive and negative indicators:
- Always generate 3-5 indicators per parameter (even if score is low/high)
- Negative indicators should highlight specific GAPS or MISSING SKILLS
- Be specific: instead of "No modern tools", say "No Transformers/LangChain/Vector DB experience"
- If candidate has weakness in a parameter, list what's MISSING vs what they have
- Never leave negativeIndicators empty just because score is high
- Never leave positiveIndicators empty if there's ANY relevant experience

## OUTPUT INSTRUCTIONS
1. Extract years of experience
2. For each parameter, ALWAYS generate both positive and negative indicators
3. Find VALID evidence (Work Experience/Projects only)
4. Calculate parameter scores and weighted scores
5. Compute overall score = sum of weighted scores
6. Provide validation notes and recommendations
7. Output ONLY the JSON object, no markdown, no backticks, no explanations.`
}

export async function POST(req: Request) {
  try {
    console.debug("[evaluate] POST received")
    const formData = await req.formData()
    console.debug("[evaluate] formData keys:", Array.from(formData.keys()))
    const file = formData.get("cv") as File | null
    const textContent = formData.get("text") as string | null
    const selectedRole = formData.get("role") as string | null

    let cvContent = ""

    if (file) {
      console.debug("[evaluate] received file:", file.name, "type:", file.type, "size:", file.size)
      
      try {
        // Convert File to Buffer (required for parsing libraries)
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.debug("[evaluate] file converted to buffer, buffer size:", buffer.length, "bytes")

        // Switch logic based on file type
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          // Handle PDF
          console.debug("[evaluate] parsing PDF file")
          console.debug("[evaluate] buffer size for PDF:", buffer.length, "bytes")
          
          try {
            // 1. Load the library
            let pdfModule: any
            try {
              // Use standard require, relying on serverExternalPackages in next.config
              const req = eval('require')
              pdfModule = req("pdf-parse")
            } catch (e) {
              // Fallback for some environments
              pdfModule = await import("pdf-parse")
            }

            console.debug("[evaluate] pdfModule loaded. Type:", typeof pdfModule)
            
            // 2. Get the PDFParse class
            // The module exports PDFParse as a class (constructor)
            const PDFParse = pdfModule.PDFParse || pdfModule.default
            
            if (typeof PDFParse !== 'function') {
              throw new Error(`PDFParse class not found. Available keys: ${Object.keys(pdfModule).join(", ")}`)
            }
            
            console.debug("[evaluate] PDFParse class found, instantiating...")
            
            // 3. Create instance and parse
            const parser = new PDFParse({ data: buffer })
            console.debug("[evaluate] PDFParse instance created, calling getText()...")
            
            const textResult = await parser.getText()
            cvContent = textResult.text || ""
            
            // Clean up
            await parser.destroy()
            
            console.debug("[evaluate] PDF parsed successfully")
            console.debug("[evaluate] extracted text length:", cvContent.length, "characters")
            console.debug("[evaluate] first 200 chars:", cvContent.substring(0, 200))
          } catch (pdfError: any) {
            console.error("[evaluate] PDF parsing failed:", pdfError.message)
            console.error("[evaluate] error stack:", pdfError.stack)
            // Fallback: ask user to use DOCX instead
            return Response.json(
              { error: "PDF parsing failed. Please try uploading a .docx file instead." },
              { status: 400 }
            )
          }
          
        } else if (
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
          file.name.endsWith(".docx")
        ) {
          // Handle DOCX (Word)
          console.debug("[evaluate] parsing DOCX file")
          console.debug("[evaluate] buffer size for DOCX:", buffer.length, "bytes")
          console.debug("[evaluate] calling mammoth.extractRawText...")
          const result = await mammoth.extractRawText({ buffer: buffer })
          cvContent = result.value
          console.debug("[evaluate] DOCX parsed successfully")
          console.debug("[evaluate] extracted text length:", cvContent.length, "characters")
          console.debug("[evaluate] first 200 chars:", cvContent.substring(0, 200))
          
        } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          // Handle TXT
          console.debug("[evaluate] parsing TXT file")
          console.debug("[evaluate] buffer size for TXT:", buffer.length, "bytes")
          cvContent = buffer.toString("utf-8")
          console.debug("[evaluate] TXT parsed successfully")
          console.debug("[evaluate] extracted text length:", cvContent.length, "characters")
          console.debug("[evaluate] first 200 chars:", cvContent.substring(0, 200))
          
        } else {
          // Unsupported file type
          console.error("[evaluate] unsupported file type:", file.type, "name:", file.name)
          return Response.json(
            { error: "Unsupported file type. Please upload a .pdf, .docx, or .txt file." },
            { status: 400 }
          )
        }

        console.debug("[evaluate] file parsing complete, total content length:", cvContent.length)

      } catch (e: any) {
        console.error("[evaluate] file parsing error:", e.name, e.message)
        console.error("[evaluate] error stack:", e.stack)
        return Response.json(
          { error: "Failed to read file content.", debug: e.message || String(e) },
          { status: 400 }
        )
      }
    } else if (textContent) {
      console.debug("[evaluate] using pasted text content, length:", textContent.length)
      cvContent = textContent
    } else {
      console.error("[evaluate] no file or text content provided")
      return Response.json({ error: "No CV content provided" }, { status: 400 })
    }

    console.debug("[evaluate] CV content ready, final length:", cvContent.length, "characters")

    if (cvContent.length < 100) {
      return Response.json(
        { error: "CV content too short. Please provide a complete CV." },
        { status: 400 }
      )
    }

    if (!selectedRole || (selectedRole !== "data_science" && selectedRole !== "digital_marketing")) {
      return Response.json(
        { error: "Please select a valid role: data_science or digital_marketing" },
        { status: 400 }
      )
    }

    console.debug("[evaluate] CV content length:", cvContent.length, "selected role:", selectedRole)
    const modelId = "google/gemini-1.5"
    const systemPrompt = getSystemPrompt(selectedRole as "data_science" | "digital_marketing")
    console.debug(`[evaluate] calling model=${modelId} systemPromptLength=${systemPrompt.length}`)
    console.debug("[evaluate] AI_GATEWAY_API_KEY present at call time:", !!process.env.AI_GATEWAY_API_KEY)

    let result
    const start = Date.now()
    
    // Try using the Google Generative AI SDK directly instead of through the ai gateway
    try {
      console.debug("[evaluate] attempting to import @google/generative-ai")
      const { GoogleGenerativeAI } = await import("@google/generative-ai")
      console.debug("[evaluate] @google/generative-ai imported successfully")
      
      console.debug("[evaluate] creating GoogleGenerativeAI instance with API key (length:", GEMINI_API_KEY.length, ")")
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      console.debug("[evaluate] GoogleGenerativeAI instance created")
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
      console.debug("[evaluate] model selected: gemini-1.5-pro")
      
      // Build a simpler prompt first to test
      const testPrompt = `${systemPrompt}\n\n---CV START---\n${cvContent}\n---CV END---\n\nRespond with valid JSON only, no markdown.`
      console.debug("[evaluate] prompt length:", testPrompt.length, "bytes")
      
      console.debug("[evaluate] calling generateContent...")
      const response = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: testPrompt }]
          }
        ]
      })
      
      console.debug("[evaluate] generateContent returned, checking response...")
      
      if (!response || !response.response) {
        console.error("[evaluate] response object malformed:", response)
        return Response.json({ error: "Malformed response from Gemini", debug: { response: String(response).slice(0, 200) } }, { status: 500 })
      }
      
      const responseText = response.response.text()
      console.debug("[evaluate] Gemini response text length:", responseText.length, "first 200 chars:", responseText.slice(0, 200))
      
      // Clean the response: Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim()
      console.debug("[evaluate] cleaned response length:", cleanedText.length)
      
      // Parse the JSON response
      let jsonOutput
      try {
        jsonOutput = JSON.parse(cleanedText)
        console.debug("[evaluate] JSON parsed successfully, keys:", Object.keys(jsonOutput).slice(0, 5))
      } catch (parseErr: any) {
        console.error("[evaluate] failed to parse JSON response:", parseErr.message)
        console.error("[evaluate] response text was:", responseText.slice(0, 500))
        return Response.json({ 
          error: "Failed to parse model response as JSON", 
          debug: { 
            message: parseErr.message, 
            responseLength: responseText.length,
            responseSample: responseText.slice(0, 300) 
          } 
        }, { status: 500 })
      }
      
      // Validate against schema
      try {
        console.debug("[evaluate] validating against schema...")
        const validated = evaluationSchema.parse(jsonOutput)
        console.debug("[evaluate] schema validation succeeded")
        return Response.json(validated)
      } catch (validateErr: any) {
        console.error("[evaluate] schema validation failed:", validateErr.message)
        console.error("[evaluate] validation errors:", validateErr.errors?.slice(0, 3))
        // Log what we actually got to help debug
        console.error("[evaluate] actual response structure:", JSON.stringify(jsonOutput).slice(0, 500))
        return Response.json({ 
          error: "Model output does not match expected schema", 
          debug: { 
            message: validateErr.message, 
            firstError: validateErr.errors?.[0],
            receivedKeys: Object.keys(jsonOutput)
          } 
        }, { status: 500 })
      }
      
    } catch (e: any) {
      const duration = Date.now() - start
      console.error(`[evaluate] error after ${duration}ms:`, e)
      console.error("[evaluate] error details - name:", e?.name)
      console.error("[evaluate] error details - message:", e?.message)
      console.error("[evaluate] error details - code:", e?.code)
      if (e?.stack) console.error("[evaluate] stack:", e.stack.split('\n').slice(0, 5).join('\n'))
      
      const debugInfo: any = {
        name: e?.name,
        message: e?.message,
        code: e?.code,
      }
      
      return Response.json({ error: "Model call failed", debug: debugInfo }, { status: 500 })
    }
  } catch (error) {
    console.error("[evaluate] top-level error:", error)
    return Response.json(
      { error: "Failed to evaluate CV. Please try again.", debug: String(error) },
      { status: 500 }
    )
  }
}
