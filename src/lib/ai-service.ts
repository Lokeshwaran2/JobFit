import Groq from "groq-sdk";
import { StructuredJobDescriptionSchema, StructuredJobDescription } from "./matching/types";

export class AiService {
  private static getClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is missing in environment variables.");
    }
    return new Groq({ apiKey });
  }

  private static parseJsonFromOutput(text: string) {
    try {
      let cleaned = text;

      // 1. If </think> tag exists (e.g. reasoning models), discard all thought output
      const lastThinkEnd = cleaned.lastIndexOf('</think>');
      if (lastThinkEnd !== -1) {
        cleaned = cleaned.substring(lastThinkEnd + 8);
      }

      // 2. Strip markdown code fences if present
      cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

      // 3. Try parsing the outer-most JSON object first
      const startIndex = cleaned.indexOf('{');
      const endIndex = cleaned.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const candidate = cleaned.substring(startIndex, endIndex + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // Fall back if exact outer parse fails
        }
      }

      // 4. Auto-repair truncated JSON (e.g. missing trailing brackets/braces from token limit)
      if (startIndex !== -1) {
        try {
          let repaired = cleaned.substring(startIndex).trim();
          const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
          if (quoteCount % 2 !== 0) {
            repaired += '"';
          }
          repaired = repaired.replace(/,\s*$/, "");

          const openBraces = (repaired.match(/\{/g) || []).length;
          const closeBraces = (repaired.match(/\}/g) || []).length;
          const openBrackets = (repaired.match(/\[/g) || []).length;
          const closeBrackets = (repaired.match(/\]/g) || []).length;

          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            repaired += "]";
          }
          for (let i = 0; i < openBraces - closeBraces; i++) {
            repaired += "}";
          }

          const parsed = JSON.parse(repaired);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // Fall back to candidate search
        }
      }

      // 5. Fallback search for outer valid JSON candidate
      const rightIndices: number[] = [];
      for (let i = cleaned.length - 1; i >= 0; i--) {
        if (cleaned[i] === '}') rightIndices.push(i);
      }

      for (const endIdx of rightIndices) {
        const startIdx = cleaned.indexOf('{');
        if (startIdx !== -1 && startIdx < endIdx) {
          const candidate = cleaned.substring(startIdx, endIdx + 1);
          try {
            const parsed = JSON.parse(candidate);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
              return parsed;
            }
          } catch {
            // continue candidate search
          }
        }
      }

      throw new Error("No valid JSON object found in response");
    } catch (error) {
      console.error("JSON Parse Error in AI output parsing:", {
        error: error instanceof Error ? error.message : "Unknown error",
        textLength: text?.length || 0,
      });
      throw new Error("Failed to parse AI response as JSON");
    }
  }

  static async extractResumeFromText(text: string) {
    const groq = this.getClient();
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const prompt = `
      You are an expert ATS Resume Parser. 
      Task: Convert the unstructured resume text below into a structured JSON format.
      
      Resume Text:
      """
      ${text.slice(0, 20000)}
      """

      Requirements:
      - Clean up formatting issues (e.g. remove page numbers).
      - "hard" skills are technical skills (e.g. Python, AWS).
      - "soft" skills are interpersonal (e.g. Leadership, Communication).
      - Ensure dates are normalized if possible.
      - IMPORTANT: Output strictly valid JSON. Do not include any introductory text, markdown formatting, or code blocks. The first character of your response must be '{'.
      
      Output Schema (Strict JSON):
      {
        "personalInfo": { "name": "string", "email": "string", "phone": "string", "linkedin": "string", "title": "string" },
        "summary": "string",
        "skills": { "hard": ["string"], "soft": ["string"], "tools": ["string"] },
        "experience": [ 
          { 
            "company": "string", 
            "role": "string", 
            "startDate": "string", 
            "endDate": "string", 
            "description": ["string"] 
          } 
        ],
        "projects": [ { "name": "string", "description": "string", "link": "string" } ],
        "education": [ { "institution": "string", "degree": "string", "year": "string" } ]
      }
    `;

    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "system", content: "You are an API that outputs strictly valid JSON. Do not output anything else. Do not wrap in markdown code blocks. Start your response with '{'." }, { role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 3500,
    });

    return this.parseJsonFromOutput(response.choices[0].message.content || "{}");
  }

  static async analyzeJobDescription(jdText: string): Promise<StructuredJobDescription> {
    const groq = this.getClient();
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const prompt = `
      You are an expert Job Description Intelligence Analyzer. Analyze this Job Description.
      
      Job Description:
      """
      ${jdText.slice(0, 8000)}
      """

      CRITICAL EXTRACTION RULES:
      1. NEVER INVENT MISSING REQUIREMENTS:
         - If the company name is not explicitly identified in the text, set "company": null.
         - If minimum or maximum years of experience are not explicitly stated, set "minYearsExperience": null and "maxYearsExperience": null. NEVER guess.
         - If education requirements are not specified, set "educationRequirements": [].
         - If certifications are not specified, set "certifications": [].
         - If workplaceType is not specified as remote, hybrid, or onsite, set "workplaceType": null.
         - If jobType is not specified as full-time, part-time, contract, or internship, set "jobType": null.
         - If seniorityLevel is not specified, set "seniorityLevel": null.
      2. DISTINGUISH REQUIRED VS PREFERRED SKILLS:
         - "requiredSkills": Concrete mandatory technical skills, programming languages, frameworks, or databases (e.g. 'TypeScript', 'React', 'Node.js', 'PostgreSQL').
         - "preferredSkills": Desired, preferred, nice-to-have, or bonus skills (e.g. 'AWS', 'Docker', 'Kubernetes').
         - "tools": Specific developer tools and software mentioned (e.g. 'Git', 'Jira', 'Postman', 'Figma').
         - NEVER include geographic locations (e.g. 'Bengaluru', 'Remote') or generic workplace fluff (e.g. 'fast-paced', 'self-starter', 'high volume applications') in requiredSkills.
      3. CORE RESPONSIBILITIES:
         - Extract key responsibility items from the JD as concise strings.
      4. KEYWORDS:
         - Extract core industry, architecture, and technology keywords.

      IMPORTANT: Output strictly valid JSON. Do not include any introductory text, markdown formatting, or code blocks. The first character of your response must be '{'.

      Output Schema (Strict JSON):
      {
        "company": "string or null",
        "role": "string",
        "location": "string or null",
        "workplaceType": "remote | hybrid | onsite | null",
        "jobType": "full-time | part-time | contract | internship | null",
        "seniorityLevel": "string or null",
        "minYearsExperience": "number or null",
        "maxYearsExperience": "number or null",
        "requiredSkills": ["string"],
        "preferredSkills": ["string"],
        "tools": ["string"],
        "coreResponsibilities": ["string"],
        "educationRequirements": ["string"],
        "certifications": ["string"],
        "keywords": ["string"]
      }
    `;

    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "system", content: "You are an API that outputs strictly valid JSON. Do not output anything else. Do not wrap in markdown code blocks. Start your response with '{'." }, { role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 2500,
    });

    const raw = this.parseJsonFromOutput(response.choices[0].message.content || "{}");
    return StructuredJobDescriptionSchema.parse(raw);
  }

  static getRewritePrompt(currentResume: any, jdAnalysis: any): string {
    return `
      You are an expert Resume Writer & Career Alignment Specialist.
      
      Task: Tailor the candidate's experience to align authentically with the Target Job without fabricating facts.
      
      Target Job Profile:
      Role: ${jdAnalysis.role}
      Keywords to Integrate: ${(jdAnalysis.keywords || []).slice(0, 15).join(", ")}
      
      Candidate Resume (JSON):
      ${JSON.stringify(currentResume).slice(0, 8000)}
      
      CRITICAL SOURCE-OF-TRUTH & INTEGRITY RULES:
      1. RESUME FACTS ARE AUTHORITATIVE:
         - The candidate's resume represents actual historical experience.
         - The job description describes job REQUIREMENTS, NOT candidate experience.
         - NEVER transfer job requirements into the candidate's experience or skills as if the candidate already possesses them.
         - If a requirement in the JD is missing from the resume, do NOT claim it in the tailored experience.
      
      2. PRESERVE CANDIDATE JOB TITLES:
         - Do NOT overwrite or change the candidate's actual job title in "personalInfo.title" or employment roles in "experience[].role" to match the target job title.
         - Preserve the candidate's factual employment history and job titles exactly as provided.
      
      3. ZERO FABRICATION & STRICT METRICS INTEGRITY:
         - The AI must NEVER fabricate candidate facts, technologies, certifications, achievements, responsibilities, or employers.
         - PRESERVE SOURCE TECHNOLOGIES & TOOLS:
           * Do NOT strip or remove candidate technologies, frameworks, tools, or architectural layers mentioned in the original bullet (e.g. Angular, .NET APIs, database layers, REST APIs).
           * Retain the candidate's authentic technical stack and evidence.
         - DO NOT INVENT UNSUPPORTED TECHNICAL MECHANISMS:
           * Never invent specific technical techniques or implementation details (e.g. "query tuning", "caching", "code refactoring", "hot-fixes", "sharding", "indexing") unless they are explicitly present in the original bullet or candidate resume.
         - METRIC RULES:
           * If the original resume contains a real metric (e.g., numbers, percentages, dollar amounts, team sizes, latency figures), you may preserve or rephrase it.
           * If NO metric is present in the source resume:
             - DO NOT invent a metric.
             - DO NOT estimate a metric (e.g. NEVER generate fake numbers like "37%", "20%", "$2.4M", or "team of 10").
             - DO NOT create fake percentages or timeframes.
             - Instead, write a strong, professional QUALITATIVE achievement focusing on action, methodology, and outcome without inventing unmentioned techniques.
         - You may improve clarity, reorder information, emphasize existing experience, align existing experience with job terminology, and improve bullet structure using strong action verbs.
         - Set "isOptimized" to true for every improved bullet.

      4. SKILLS SECTION & MISSING SKILLS GAP:
         - Reorder existing candidate "hard" skills to highlight alignment with the JD.
         - NEVER auto-inject unmentioned skills into candidate's hard skills array or experience bullets.
         - Put all missing JD skills strictly into the "missingSkills" array so the candidate can review and add them if they actually possess them.
         - "missingSkills" MUST strictly be concrete technical skills, tools, or languages (e.g. 'PostgreSQL', 'Docker', 'Redis'). NEVER output locations (e.g. 'Bengaluru', 'Remote'), years of experience, or non-skills (e.g. 'High volume applications', 'Fast paced environment').
         - USE SYNONYMS: If an existing candidate skill has a common synonym requested in the JD (e.g. "React" / "React.js"), use the format "Term / Synonym".
         - Extract candidate-verified tools into a separate "tools" array (Git, Docker, VS Code, Jira, etc.).

      5. REALISTIC JOB MATCH STATS (NO ARTIFICIAL SCORE INFLATION):
         - Calculate "originalScore": Objective baseline match score (0-100) before tailoring based on keyword overlap, role alignment, and bullet clarity.
         - Calculate "atsScore": Objective Job Match Score (0-100) after tailoring based on truthful keyword and experience alignment. Do NOT force a fake 90-99 score.
         - Calculate "scoreGain": Math.max(0, atsScore - originalScore).
         - Calculate "percentageGain": originalScore > 0 ? Math.round(((atsScore - originalScore) / originalScore) * 100) : 0.
         - Count how many experience bullet points were genuinely rewritten.
         - List key target keywords identified from the job description that were genuinely aligned.
         - List strong action verbs used.
      
      Output Schema (Strict JSON):
      {
        "structuredData": { 
             "personalInfo": { "name": "string", "email": "string", "phone": "string", "linkedin": "string", "title": "string" },
             "summary": "string",
             "skills": { 
                "hard": ["string"], 
                "soft": ["string"], 
                "tools": ["string"] 
             },
             "experience": [ 
               { 
                 "company": "string", 
                 "role": "string", 
                 "startDate": "string", 
                 "endDate": "string", 
                 "description": [ { "text": "string", "isOptimized": true } ] 
               } 
             ],
             "projects": [ { "name": "string", "description": "string", "link": "string" } ],
             "education": [ { "institution": "string", "degree": "string", "year": "string" } ]
        },
        "missingSkills": ["string"],
        "atsScore": 95,
        "originalScore": 52,
        "keywordMatch": 90,
        "improvementStats": {
            "originalScore": 52,
            "atsScore": 95,
            "scoreGain": 43,
            "percentageGain": 83,
            "bulletPointsRewritten": 4,
            "keywordsAdded": ["string"],
            "actionVerbsUsed": ["string"],
            "summaryOptimized": true
        },
        "scoreBreakdown": {
            "jobTitleMatch": true,
            "metricsCount": true,
            "actionVerbDiversity": true,
            "keywordPlacement": true,
            "skillsSynonyms": true,
            "toolsSection": true,
            "projectTechStack": true,
            "softSkills": true
        }
      }
    `;
  }

  static async rewriteResume(currentResume: any, jdAnalysis: any) {
    const groq = this.getClient();
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const prompt = this.getRewritePrompt(currentResume, jdAnalysis);

    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "system", content: "You are an expert resume writer API. Output strictly valid JSON. Do not output anything else. Do not wrap in markdown code blocks. Start your response with '{'." }, { role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 3500,
    });

    return this.parseJsonFromOutput(response.choices[0].message.content || "{}");
  }
}
