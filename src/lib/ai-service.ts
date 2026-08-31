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
          // Fall back to candidate search if outer parse fails
        }
      }

      // 4. Fallback search for outer valid JSON candidate
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
         - Reorder "hard" skills to match JD.
         - USE SYNONYMS: If a skill has a common synonym (e.g. "React" / "React.js"), use the format "Term / Synonym" to capture both.
         - EXTRACT TOOLS: Populate a separate "tools" array in the skills object with specific tools (Git, Docker, VS Code, Jira, etc.).
      5. GENERATE IMPROVEMENT STATS:
         - Count how many bullet points were rewritten.
         - List specific keywords added.
         - Identify new action verbs used.
      6. PERFORM 95+ SCORE ANALYSIS (Strict 10-point check on the NEWLY GENERATED content):
         - Analyze against these 10 factors:
           1. Job Title Alignment: Exact match to JD title?
           2. Keyword Placement: Keywords in Title/Experience/Summary?
           3. Quantified Impact: Do at least 3 bullets have metrics?
           4. Action Verb Diversity: Are verbs varied?
           5. Skill Synonyms: Are synonyms used?
           6. Tools Section: Is there a Tools & Environment section?
           7. Project Tech Stack: Do projects list tech stack?
           8. Soft Skills: Are leadership/collab terms present?
           9. Location/Availability: Included?
           10. Section Order: Summary -> Skills -> Experience -> Projects -> Education?
      
      7. CALCULATE FINAL ATS SCORE (CRITICAL):
         - SCORE LOGIC: Start with a base of 85.
         - Add +1.5 points for every PASSED check in the 10-point analysis above.
         - If Job Title, Metrics, and Tools checks pass, the score MUST be above 95. Max score: 99.
      8. OUTPUT MUST BE VALID JSON ONLY. NO MARKDOWN. NO CODE BLOCKS.
      
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
        "keywordMatch": 90,
        "improvementStats": {
            "bulletPointsRewritten": 1,
            "keywordsAdded": ["string"],
            "actionVerbsUsed": ["string"],
            "summaryOptimized": true
        },
        "scoreBreakdown": {
            "jobTitleMatch": true,
            "metricsCount": 1,
            "actionVerbDiversity": true,
            "keywordPlacement": true,
            "skillsSynonyms": true,
            "toolsSection": true,
            "projectTechStack": true,
            "softSkills": true,
            "sectionOrder": true,
            "locationAvailability": true,
            "checklist": [ { "label": "string", "passed": true, "impact": "string" } ]
        }
      }
    `;

    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "system", content: "You are an expert resume writer API. Output strictly valid JSON. Do not output anything else. Do not wrap in markdown code blocks. Start your response with '{'." }, { role: "user", content: prompt }],
      temperature: 0,
    });

    return this.parseJsonFromOutput(response.choices[0].message.content || "{}");
  }
}
