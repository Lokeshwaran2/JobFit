import Groq from "groq-sdk";

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
      console.error("JSON Parse Error:", error);
      console.error("Raw Text:", text);
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
      max_tokens: 8192,
    });

    return this.parseJsonFromOutput(response.choices[0].message.content || "{}");
  }

  static async analyzeJobDescription(jdText: string) {
    const groq = this.getClient();
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const prompt = `
      You are a Hiring Manager. Analyze this Job Description.
      
      Job Description:
      """
      ${jdText.slice(0, 10000)}
      """

      IMPORTANT: Output strictly valid JSON. Do not include any introductory text, markdown formatting, or code blocks. The first character of your response must be '{'.

      Output Schema (Strict JSON):
      {
        "role": "string",
        "keywords": ["string"],
        "requiredSkills": ["string"],
        "coreResponsibilities": ["string"],
        "seniorityLevel": "string"
      }
    `;

    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "system", content: "You are an API that outputs strictly valid JSON. Do not output anything else. Do not wrap in markdown code blocks. Start your response with '{'." }, { role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 8192,
    });

    return this.parseJsonFromOutput(response.choices[0].message.content || "{}");
  }

  static async rewriteResume(currentResume: any, jdAnalysis: any) {
    const groq = this.getClient();
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const prompt = `
      You are an expert Resume Writer & ATS Optimizer.
      
      Task: Rewrite the candidate's experience to align with the Target Job.
      
      Target Job Profile:
      Role: ${jdAnalysis.role}
      Keywords to Integrate: ${(jdAnalysis.keywords || []).join(", ")}
      
      Candidate Resume (JSON):
      ${JSON.stringify(currentResume)}
      
      Instructions:
      1. FORCE Job Title Match: You MUST replace "personalInfo.title" with the EXACT target role title from the JD. This is critical for ATS.
      2. Rewrite "summary" to be punchy, relevant, and contain keywords.
      3. Rewrite "experience" bullet points (CRITICAL):
         - MUST QUANTIFY IMPACT: Every single bullet point must include a number, percentage ($), or time metric. 
         - If exact numbers are not in the source, ESTIMATE reasonable metrics (e.g. "Improved performance by ~20%", "Reduced load time by 30%").
         - INJECT SOFT SKILLS: Ensure at least 1-2 bullets mention "Collaborated with", "Led", or "Mentored".
         - Use Google X-Y-Z formula.
         - Set "isOptimized" to true for every rewritten bullet.
      4. Skills Section Optimization:
         - Reorder existing candidate "hard" skills to align with JD.
         - DO NOT auto-inject unmentioned skills into candidate's hard skills array. Put all missing JD skills into the "missingSkills" array so the candidate can interactively select and add them via UI buttons.
         - USE SYNONYMS: If a skill has a common synonym (e.g. "React" / "React.js"), use the format "Term / Synonym" to capture both.
         - EXTRACT TOOLS: Populate a separate "tools" array in the skills object with specific tools (Git, Docker, VS Code, Jira, etc.).
      5. GENERATE GENUINE IMPROVEMENT STATS:
         - Calculate "originalScore": Estimate candidate's original raw resume score against the JD before optimization (0-100) based on missing keywords, title mismatch, and non-quantified bullets.
         - Calculate "atsScore": The new optimized score (target 90-99).
         - Calculate "scoreGain": atsScore - originalScore.
         - Calculate "percentageGain": Math.round(((atsScore - originalScore) / originalScore) * 100).
         - Count how many experience bullet points were genuinely rewritten.
         - List key target keywords identified from the job description.
         - List strong action verbs used.
      6. PERFORM 95+ SCORE ANALYSIS:
         - Keep response output compact and valid JSON.
      
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

    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "system", content: "You are an expert resume writer API. Output strictly valid JSON. Do not output anything else. Do not wrap in markdown code blocks. Start your response with '{'." }, { role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 8192,
    });

    return this.parseJsonFromOutput(response.choices[0].message.content || "{}");
  }
}
