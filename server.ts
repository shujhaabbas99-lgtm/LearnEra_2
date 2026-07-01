import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  const PORT = 5000;

  // Initialize Gemini client on server side
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Custom AI generation will fail.");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Robust AI generation helper with exponential backoff and automatic stable model fallback for high availability
  async function generateWithRetry(options: {
    model: string;
    contents: any;
    config?: any;
  }, maxRetries = 3): Promise<any> {
    const modelOrder = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let attempt = 0;
    let delay = 1000;
    
    let modelIndex = modelOrder.indexOf(options.model);
    if (modelIndex === -1) {
      modelIndex = 0;
    }

    while (attempt < maxRetries) {
      const currentModel = modelOrder[modelIndex] || "gemini-3.5-flash";
      try {
        console.log(`[Gemini API] Requesting ${currentModel} (Attempt ${attempt + 1}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          ...options,
          model: currentModel
        });
        return {
          text: response.text || "",
          modelUsed: currentModel
        };
      } catch (error: any) {
        attempt++;
        const errMsg = error.message || String(error);
        const errMsgLower = errMsg.toLowerCase();

        const isQuotaOrOverload = errMsgLower.includes("429") ||
                                  errMsgLower.includes("quota") ||
                                  errMsgLower.includes("limit") ||
                                  errMsgLower.includes("exhausted") ||
                                  errMsgLower.includes("503") || 
                                  errMsgLower.includes("unavailable") || 
                                  errMsgLower.includes("overloaded") ||
                                  errMsgLower.includes("demand");

        const hasFallbackAvailable = modelIndex < modelOrder.length - 1;

        if (isQuotaOrOverload && hasFallbackAvailable) {
          modelIndex++;
          const nextModel = modelOrder[modelIndex];
          console.log(`[Gemini API] Model ${currentModel} returned temporary status (Attempt ${attempt}/${maxRetries}). Transitioning immediately to fallback model: '${nextModel}'...`);
        } else {
          console.warn(`[Gemini API] Attempt ${attempt} on model ${currentModel} declined:`, errMsg);
        }

        if (attempt >= maxRetries) {
          throw error;
        }

        console.log(`[Gemini API] Pausing ${delay}ms before next trial...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    throw new Error("Failed to generate content after retries");
  }

  // Helper: summarize oversized uploadedContent into a structural outline when it exceeds 4,000 words
  async function buildSourceOutlineIfNeeded(
    rawText: string,
    topicName: string,
    subjectName: string
  ): Promise<{ content: string; wasOutlined: boolean }> {
    const words = rawText.trim().split(/\s+/).filter((w: string) => w.length > 0);
    if (words.length <= 4000) return { content: rawText, wasOutlined: false };
    const sampleText = words.slice(0, 5000).join(" ");
    const outlineResp = await generateWithRetry({
      model: "gemini-3.5-flash",
      contents: `Create a dense structural outline of the following source text.
Topic: "${topicName}" — Subject: "${subjectName}"
Include ALL key definitions, mechanisms, processes, named examples, and technical details in condensed outline form.
Preserve domain-specific terminology exactly. Target 600–900 words.

Source Text:
"""
${sampleText}
"""`,
      config: {
        systemInstruction:
          "You are a technical academic summarizer. Create dense outlines preserving all key academic concepts.",
      },
    });
    return {
      content: `[STRUCTURAL OUTLINE — derived from source material]\n\n${outlineResp.text || ""}`,
      wasOutlined: true,
    };
  }

  // API Route to generate structured curricula
  app.post("/api/generate-curriculum", async (req: any, res: any) => {
    try {
      const { topic, difficulty, detailLevel } = req.body;
      if (!topic) {
         return res.status(400).json({ error: "Topic description is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Secrets registry. Please add your key to run generation." 
        });
      }

      const prompt = `
        You are an expert syllabus designer. Draft a highly organized, comprehensive custom learning curriculum for this topic: "${topic}".
        Use difficulty level: "${difficulty || 'Intermediate'}" and detail level: "${detailLevel || 'Comprehensive'}".

        Return the result as a strict JSON object matching this schema exactly. Do not wrap the JSON in Markdown formatting (such as \`\`\`json ... \`\`\`), return raw text only so that it parses as JSON immediately.
        
        The JSON schema MUST be:
        {
          "title": "A highly readable, elegant title for this curriculum",
          "description": "A refined, high-level summary overview of what the student will learn and master",
          "category": "Technology, Humanities, Science, Arts, Business, or Languages",
          "modules": [
            {
              "id": "m1",
              "title": "Module Title",
              "description": "Clear conceptual overview for this specific module",
              "lessons": [
                {
                  "id": "m1-l1",
                  "title": "Lesson title (short and descriptive)",
                  "description": "Specific sub-topics and practical objectives to learn in this lesson",
                  "estimatedMinutes": 45,
                  "tasks": [
                    { "id": "m1-l1-t1", "text": "Review core conceptual materials and outline key notes", "completed": false },
                    { "id": "m1-l1-t2", "text": "Synthesize learning with an interactive checklist task or exercise", "completed": false },
                    { "id": "m1-l1-t3", "text": "Execute self-testing using active recall filters or flashcards", "completed": false }
                  ]
                }
              ]
            }
          ]
        }

        Requirements:
        1. Create 3 to 4 logical modules.
        2. Create 3 to 4 targeted lessons per module.
        3. Make the estimatedMinutes a realistic duration (e.g., 30, 45, 60, or 90 minutes).
        4. Give highly specific, descriptive task items that align beautifully with the specific lesson topic, so it doesn't look like general filler content. This is a personalized customized syllabus.
        5. Ensure the text returned is clean, direct raw JSON, valid and easily parses. Ensure all string IDs are unique.
      `;

      // Use robust retry wrapper
      const response = await generateWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      let responseText = response.text || "";
      responseText = responseText.trim();
      
      // Sanitization: Strip Markdown formatting wrapper if generated
      if (responseText.startsWith("```json")) {
         responseText = responseText.substring(7);
         if (responseText.endsWith("```")) {
            responseText = responseText.substring(0, responseText.length - 3);
         }
      } else if (responseText.startsWith("```")) {
         responseText = responseText.substring(3);
         if (responseText.endsWith("```")) {
            responseText = responseText.substring(0, responseText.length - 3);
         }
      }
      responseText = responseText.trim();

      const curriculumData = JSON.parse(responseText);
      curriculumData.modelUsed = response.modelUsed;
      res.setHeader("x-model-used", response.modelUsed);
      res.json(curriculumData);
    } catch (error: any) {
      console.error("Gemini custom curriculum generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate learning path. Please try again." });
    }
  });

  // API Route to generate structured learning materials (explanation, example, and recap)
  app.post("/api/generate-learning-material", async (req: any, res: any) => {
    try {
      const { subject, topic, difficulty = "beginner", curriculumLevel = "", uploadedContent = "", learningGoal = "deep_understanding", detailLevel = "standard" } = req.body;
      if (!subject || !topic) {
        return res.status(400).json({ error: "Subject and Topic are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Secrets registry. Please add your key to run generation." 
        });
      }

      let academicToneInstruction = "";
      if (difficulty === "intermediate") {
        academicToneInstruction = "Use intermediate level: build on intermediate concepts, utilize highly technical and precise academic terminology, investigate deeper underlying mechanisms, and assume the student already possesses a strong baseline awareness of the core topic definitions.";
      } else if (difficulty === "advanced") {
        academicToneInstruction = "Use advanced level: provide deep research-grade technical depth, subtle academic/factual nuances, explore structural edge cases or formal theoretical considerations, and assume a complete, strong foundational mastery of the subject matter.";
      } else {
        academicToneInstruction = "Use beginner level: write in an introductory style *within* the context of this curriculum level. Focus on explaining foundational core attributes, defining primary mechanisms of study, and explaining conceptual boundaries clearly without resorting to overly simplistic analogies.";
      }

      let curriculumInstruction = "";
      if (curriculumLevel) {
        curriculumInstruction = `This explanation is for a ${curriculumLevel} student at ${difficulty} difficulty within that level. Do not simplify below what is appropriate for ${curriculumLevel} — even at beginner difficulty, maintain ${curriculumLevel}-appropriate terminology, depth, and rigor. Beginner only means foundational within this level, not generically easy.
        Avoid overly cautious or oversimplified explanations. Assume the student is capable of handling proper academic depth appropriate to their level. Do not water down content to seem more accessible than the curriculum level warrants.
        E.g., Grade 9 matches primary high school standards, while Undergraduate standard MUST assume advanced university-level reading comprehension, use rigorous academic vocabulary, utilize standard mathematical/scientific notation if relevant, and analyze formal structures or proofs.`;
      } else {
        curriculumInstruction = `This explanation is at ${difficulty} difficulty. Scale all vocabulary, rigor, and assumed knowledge to match a standard general level. Avoid overly cautious or oversimplified explanations. Do not water down content.`;
      }

      let groundingPrompt = "";
      if (uploadedContent) {
        const uploadedWords = uploadedContent.trim().split(/\s+/).filter((w: string) => w.length > 0);
        let processedContent: string;
        let groundingInstruction: string;

        if (uploadedWords.length > 4000) {
          // Summarize to a structural outline — too large for a single explanation pass
          try {
            const { content } = await buildSourceOutlineIfNeeded(uploadedContent, topic, subject);
            processedContent = content;
          } catch (_) {
            // Fallback: truncate to 4,000 words if outline generation itself fails
            processedContent = uploadedWords.slice(0, 4000).join(" ") + "\n[Content condensed for length.]";
          }
          groundingInstruction = `Base your explanation on the structural outline below derived from the source material. Instruction: "Base your explanation on this outline derived from the source material."`;
        } else {
          processedContent = uploadedContent;
          groundingInstruction = `Base your explanation strictly on the provided source text. Do not introduce outside information not present in this text.`;
        }

        groundingPrompt = `
        CRITICAL SOURCE-GROUNDING DIRECTIVE:
        ${groundingInstruction}
        You MUST base all generated explanations, sub-concepts, connections, examples, and recap points STRICTLY and EXCLUSIVELY on the facts, concepts, and content present within the provided text segment below.
        Do NOT use general knowledge or introduce any external facts, details, or extra concepts that are not explicitly present in the provided text segment. Keep it perfectly grounded.

        Provided Topic Source Segment:
        """
        ${processedContent}
        """
        `;
      }

      let learningGoalPrompt = "";
      if (learningGoal === "exam_prep") {
        learningGoalPrompt = `
        CRITICAL LEARNING GOAL DIRECTIVE:
        This student is preparing for an exam. Prioritize a concise, fact-dense explanation, a substantial bank of direct short Q&A pairs (NOT multiple choice), and key conceptual pointers over narrative depth.
        - You must write a leaner, much more focused explanation that targets core definitions and key facts only, with less narrative depth.
        - Generate exactly 8 to 12 high-quality short Study Q&A Pairs inside the 'examQAs' array. Each pair must contain a challenging conceptual 'question', and a written 'answer' consisting of exactly 1 to 3 concise sentences explaining the answer (no options, no correctAnswerIndex, just a direct answer).
        - Generate exactly 4 to 6 "Key Conceptual Pointers" inside the 'conceptualPointers' array: a short list of conceptual angles, distinctions, and pitfalls the student should understand deeply for this topic. These must NOT be framed as questions or direct answers, but as advisory pedagogical highlights (e.g. "Understand why X causes Y, not just that it does" or "Common confusion: notice the difference between mechanism A and B").
        - Keep the 'practiceQuestions' array empty in this specific response.
        `;
      } else {
        learningGoalPrompt = `
        CRITICAL LEARNING GOAL DIRECTIVE:
        This student wants a deep understanding of the topic.
        - Keep the standard explanation style with narrative depth, elaborate explanations of sub-concepts, misconceptions, real-world application, and recap.
        - Keep the 'practiceQuestions' array empty, the 'examQAs' array empty, and the 'conceptualPointers' array empty.
        `;
      }

      let wordRange = "500-1000";
      if (detailLevel === "concise") {
        wordRange = "300-500";
      } else if (detailLevel === "comprehensive") {
        wordRange = "1000+";
      }

      const contentStructurePrompt = `
        CRITICAL EXPLANATION CONTENT DISTRIBUTION DIRECTIVE:
        You MUST structure the returned core 'explanation' to explicitly adhere to this precise content distribution:
        - 60% core concept — definition, mechanisms, causation, key principles, nuance, contested interpretations where they exist, and technical depth appropriate to the student's curriculum level (${curriculumLevel || "General Study"}) and difficulty level.
        - 20% real-world understanding — name specific industries, events, institutions, or documented applications (not hypothetical scenarios), explaining why it matters and how it functions.
        - 20% examples — named, specific, historically or scientifically documented examples with enough detail to be intellectually useful, not just illustrative.

        Generate approximately ${wordRange} words total.

        PRECISE ACADEMIC DENSITY DIRECTIVES:
        - Do not pad content to meet word count. Every sentence must carry distinct informational value — no repetition, no filler, no restating what was just said in different words. Write at the density of a university textbook or academic journal article appropriate to ${curriculumLevel || "General Study"}.
        - Specifically:
          * Use precise technical terminology without over-explaining basic terms to someone at ${curriculumLevel || "General Study"}.
          * Include specific named examples, real historical figures, documented cases, or empirical data points where relevant — avoid vague generic examples ('for instance, consider a situation where...').
          * For the 60% concept section: go beyond definition into mechanisms, causation, nuance, and contested interpretations where they exist.
          * For the 20% real-world section: name specific industries, events, institutions, or documented applications — not hypothetical scenarios.
          * For the 20% examples section: use named, specific, historically or scientifically documented examples with enough detail to be intellectually useful, not just illustrative.
          * Word count targets mean minimum substantive content, not total character count including filler. If ${wordRange} words cannot be reached with dense content, it is acceptable to be slightly under rather than pad.

        Additionally, for topics where case studies are relevant (sciences, medicine, psychology, history, economics, etc.), you must provide a brief, historically accurate real case study inside the 'caseStudy' field.
        Case study guideline: "If this topic has well-known associated case studies, include one brief real case study (named, specific, historically accurate) that illustrates the concept in practice."
        If no relevant historically accurate real case study is applicable for this concept, set 'caseStudy' to null.
      `;

      const prompt = `
        You are an elite academic lecturer, syllabus designer, and subject matter expert.
        Cover the topic "${topic}" in the field of "${subject}" exactly the way a high-quality academic syllabus would.

        Student Academic Level & Difficulty Combo Instruction:
        ${curriculumInstruction}

        Student's relative difficulty tier: "${difficulty.toUpperCase()}"
        Difficulty adaptation guidelines: ${academicToneInstruction}

        ${groundingPrompt}

        ${learningGoalPrompt}

        ${contentStructurePrompt}

        Please structure the educational content comprehensively to cover:
        1. A core conceptual explanation (matching the designated learning goal directive, content distribution guidelines, and academic level in depth, vocabulary, and assumed prior knowledge perfectly).
        2. Key sub-concepts or core components that comprise this topic (return exactly 2 to 4 key sub-concept objects, each with a 'name' and educational 'description').
        3. Syllabus Connections: Explicitly outline how this topic connects conceptually to other related fields, prerequisite topics, or broader domains. (summarize in a single paragraph).
        4. Common Misconceptions: Identify exactly 2 to 3 common misconceptions or common student errors associated with this topic, and correct them clearly (return an array of clear strings).
        5. One high-quality practical real-world application or industry case study demonstrating the concept in active use in the 'example' field (this is separate from the 'caseStudy' field).
        6. A concise, key takeaway recap consisting of exactly 2 to 3 high-impact summary bullets.
        7. If under exam prep, a list of 8 to 12 high quality short Q&A pairs in 'examQAs' and 4 to 6 highlights in 'conceptualPointers', else keep them empty.
        8. A nullable 'caseStudy' field representing a real named historically accurate case study, or null.
        9. A 'wordCount' field containing the accurate total word count of the generated explanation.
      `;

      // Use robust retry wrapper
      const response = await generateWithRetry({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an elite academic lecturer, syllabus designer, and domain expert who writes dense, rigorous, information-packed explanations at the level of advanced textbooks or journal articles appropriate to the student's curriculum level. You strictly avoid fluff, padding, repetition, or over-simplification.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: {
                type: Type.STRING,
                description: "Core definition and detailed general explanation of the topic matching the level, containing 3 to 4 comprehensive paragraphs or key bullet groups separated by double newlines (\\n\\n)."
              },
              subConcepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the sub-concept or component." },
                    description: { type: Type.STRING, description: "Detailed educational description of this sub-concept." }
                  },
                  required: ["name", "description"]
                },
                description: "Key sub-concepts or components that make up this topic."
              },
              connections: {
                type: Type.STRING,
                description: "A solid paragraph outlining how this topic connects conceptually to other related fields or broader subject domains."
              },
              commonMisconceptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 2 to 3 common misconceptions or fallacies with short, clear corrections."
              },
              example: {
                type: Type.STRING,
                description: "A highly relevant real-world application, demonstration, or case study of the concept in action."
              },
              recap: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 2 to 3 concise, high-impact bullet points summarizing the core lessons."
              },
              caseStudy: {
                type: Type.STRING,
                description: "A brief real-world case study representing a real named historically accurate instance/experiment/discovery in practice, or null if not relevant.",
                nullable: true
              },
              wordCount: {
                type: Type.INTEGER,
                description: "The total word count of the generated explanation."
              },
              practiceQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "The practice question text." },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 options to choose." },
                    correctAnswerIndex: { type: Type.INTEGER, description: "0-based correct answer index (0 to 3)." },
                    reason: { type: Type.STRING, description: "Clear explanation reason for the correct answer." }
                  },
                  required: ["question", "options", "correctAnswerIndex", "reason"]
                },
                description: "Array of practice questions (empty if examQAs are returned instead)."
              },
              examQAs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "The exam preparation study question." },
                    answer: { type: Type.STRING, description: "A concise 1-3 sentence direct answer to this study question." }
                  },
                  required: ["question", "answer"]
                },
                description: "Array of exactly 8 to 12 high-utility short Q&A pairs for Exam Prep mode."
              },
              conceptualPointers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 4 to 6 conceptual pointers or pitfalls standard for exam-preparation audits."
              }
            },
            required: [
              "explanation", "subConcepts", "connections", "commonMisconceptions", "example", 
              "recap", "practiceQuestions", "caseStudy", "wordCount", "examQAs", "conceptualPointers"
            ]
          }
        }
      });

      const responseText = response.text || "";
      const learningMaterial = JSON.parse(responseText.trim());
      learningMaterial.modelUsed = response.modelUsed;
      res.setHeader("x-model-used", response.modelUsed);
      res.json(learningMaterial);
    } catch (error: any) {
      console.error("Gemini learning material generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate learning material. Please try again." });
    }
  });

  // API Route to generate expanded long answers for the same questions shown during Exam Prep
  app.post("/api/generate-long-answers", async (req: any, res: any) => {
    try {
      const { subject, topic, difficulty = "beginner", curriculumLevel = "", questions = [], uploadedContent = "" } = req.body;
      if (!subject || !topic || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "Subject, Topic, and a non-empty array of Questions are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Secrets registry. Please add your key to run generation." 
        });
      }

      let groundingPrompt = "";
      if (uploadedContent) {
        const maxChars = 20000;
        const processedContent = uploadedContent.length > maxChars 
          ? uploadedContent.substring(0, maxChars) + "\n[Content truncated for length limitations...]"
          : uploadedContent;
        groundingPrompt = `
        CRITICAL SOURCE-GROUNDING DIRECTIVE:
        Base your expanded answers strictly on the provided source text. Do not introduce outside information not present in this text.
        You MUST base all generated expanded long answers STRICTLY and EXCLUSIVELY on the facts, concepts, and content present within the provided text segment below.
        
        Provided Topic Source Segment:
        """
        ${processedContent}
        """
        `;
      }

      const prompt = `
        You are an elite academic lecturer, syllabus designer, and subject matter expert.
        The student is preparing for an exam on the topic "${topic}" in "${subject}".
        They have already been shown a list of study questions, and they need comprehensive, expanded "Long Answers" (a full detailed paragraph of 4-6 sentences per question) to reinforce their deep conceptual understanding.

        Difficulty level: ${difficulty.toUpperCase()}
        Curriculum level: ${curriculumLevel}

        ${groundingPrompt}

        Below are the specific questions that you MUST answer with full paragraphs:
        ${questions.map((q: string, idx: number) => `${idx + 1}. Question: "${q}"`).join("\n")}

        Generate a single detailed paragraph of 4 to 6 sentences for each of the above ${questions.length} questions.
        The answer must match the requested curriculum level and difficulty in academic depth and rigor.
        Do not change the questions; answer them exactly, in order.
      `;

      const response = await generateWithRetry({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an educational tutor that provides elaborate, comprehensive long paragraph answers to study questions, returning structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              longAnswers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "The original question string verbatim." },
                    longAnswer: { type: Type.STRING, description: "The detailed, expanded paragraph answer (4-6 sentences) for this question." }
                  },
                  required: ["question", "longAnswer"]
                },
                description: `Exactly ${questions.length} objects corresponding to each question provided, containing the question and its long paragraph answer.`
              }
            },
            required: ["longAnswers"]
          }
        }
      });

      const responseText = response.text || "";
      const result = JSON.parse(responseText.trim());
      result.modelUsed = response.modelUsed;
      res.setHeader("x-model-used", response.modelUsed);
      res.json(result);
    } catch (error: any) {
      console.error("Gemini long answer generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate long answers. Please try again." });
    }
  });

  // API Route to generate a high quality space multiple choice quiz (length dynamically altered by learningGoal)
  app.post("/api/generate-quiz", async (req: any, res: any) => {
    try {
      const { subject, topic, difficulty = "beginner", curriculumLevel = "", uploadedContent = "", learningGoal = "deep_understanding" } = req.body;
      if (!subject || !topic) {
        return res.status(400).json({ error: "Subject and Topic are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Secrets registry. Please add your key to run generation." 
        });
      }

      const isExamPrep = learningGoal === "exam_prep";
      const questionCount = isExamPrep ? 12 : 5;

      let quizDifficultyInstruction = "";
      if (difficulty === "intermediate") {
        quizDifficultyInstruction = "The assessment questions must be constructed for an INTERMEDIATE-level academic checkpoint. Include questions testing deeper mechanisms, multi-step conceptual interactions, and active functional application rather than basic terminology recall.";
      } else if (difficulty === "advanced") {
        quizDifficultyInstruction = "The assessment questions must be constructed for an ADVANCED-level scholarly audit. Focus on highly specific technical nuances, challenging problem-solving scenarios, unusual edge cases, and deep structural or mathematical deductions.";
      } else {
        quizDifficultyInstruction = "The assessment questions must be constructed for a BEGINNER-level entry point. Focus questions around foundational core definitions, structural relationships, and primary principles without sacrificing curriculum-level rigor.";
      }

      let curriculumInstruction = "";
      if (curriculumLevel) {
        curriculumInstruction = `This examination is for a ${curriculumLevel} student at ${difficulty} difficulty within that level. Do not simplify below what is appropriate for ${curriculumLevel} — even at beginner difficulty, maintain ${curriculumLevel}-appropriate terminology, depth, and rigor. Beginner only means foundational or introductory within this level, not generically easy.
        Avoid overly cautious or oversimplified questions. Assume the student is capable of handling proper academic depth appropriate to their level. Do not water down content or vocabulary to seem more accessible than the curriculum level warrants.
        Ensure quiz questions reflect actual exam-style rigor appropriate to ${curriculumLevel}, rather than generic, overly easy/simple questions.`;
      } else {
        curriculumInstruction = `This examination is calibrated for ${difficulty} difficulty. Tailor all question vocabulary, complexity, and baselines to match a standard general level. Avoid overly cautious or oversimplified items.`;
      }

      let groundingPrompt = "";
      if (uploadedContent) {
        const maxChars = 20000;
        const processedContent = uploadedContent.length > maxChars 
          ? uploadedContent.substring(0, maxChars) + "\n[Content truncated for length limitations...]"
          : uploadedContent;
        groundingPrompt = `
        CRITICAL ASSESSMENT GROUNDING DIRECTIVE:
        Base your quiz questions strictly on the provided source text. Do not introduce outside information not present in this text.
        You MUST construct all multiple-choice questions, option variables, correct answers, and feedback explanation reasoning STRICTLY and EXCLUSIVELY from the factual assertions, data, and lessons contained in the provided text segment below.
        Do NOT compile questions about general facts, concepts, or details that are omitted from this provided text segment. Keep everything perfectly grounded.

        Provided Topic Source Segment:
        """
        ${processedContent}
        """
        `;
      }

      const prompt = `
        You are an elite academic lecturer and professional examiner. Create exactly ${questionCount} intellectually engaging, separate multiple choice questions (MCQ) testing comprehension of the topic "${topic}" within "${subject}".
        
        Student Academic Level & Difficulty Combo Instruction:
        ${curriculumInstruction}

        Review Difficulty Tier: "${difficulty.toUpperCase()}"
        Adaptation Guidelines: ${quizDifficultyInstruction}
        
        ${groundingPrompt}

        Guidelines:
        1. Ensure each question tests distinct vital content or details of this specific topic.
        2. Provide exactly 4 unique options per question. Only one must be strictly correct.
        3. Index the correct option with a 0-based integer index (from 0 to 3).
        4. Provide a brief, supportive, and clear educational explanation ('reason') on why that option is correct.
      `;

      // Use robust retry wrapper
      const response = await generateWithRetry({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a professional educational assessor that writes high-validity examination quizzes, outputting responses strictly in JSON formats.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                      description: "The clear educational question statement."
                    },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Exactly 4 plausible options for the candidate."
                    },
                    correctAnswerIndex: {
                      type: Type.INTEGER,
                      description: "0-based pointer to the correct option index (0, 1, 2, or 3)."
                    },
                    reason: {
                      type: Type.STRING,
                      description: "Brief academic reason justifying the correctness of the option."
                    }
                  },
                  required: ["question", "options", "correctAnswerIndex", "reason"]
                },
                description: "Array containing exactly " + questionCount + " high quality interactive checkpoint questions."
              }
            },
            required: ["questions"]
          }
        }
      });

      const responseText = response.text || "";
      const quizData = JSON.parse(responseText.trim());
      quizData.modelUsed = response.modelUsed;
      res.setHeader("x-model-used", response.modelUsed);
      res.json(quizData);
    } catch (error: any) {
      console.error("Gemini quiz generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate checkpoint quiz. Please retry." });
    }
  });

  // API Route to generate flashcards based on subject, topic, and prioritized missed questions
  app.post("/api/generate-flashcards", async (req: any, res: any) => {
    try {
      const { subject, topic, missedQuestions, curriculumLevel = "", uploadedContent = "" } = req.body;
      if (!subject || !topic) {
        return res.status(400).json({ error: "Subject and Topic are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Secrets registry. Please add your key to run generation." 
        });
      }

      let levelInstruction = "";
      if (curriculumLevel) {
        levelInstruction = `Student's current target education level is "${curriculumLevel}". Phrasing, vocab, details, and level of rigor must be constructed perfectly for this level.`;
      }

      const missedText = missedQuestions && missedQuestions.length > 0 
        ? `The user struggled with these concepts in the recent checkpoint quiz:\n${JSON.stringify(missedQuestions)}\nPrioritize addressing these specific misconception areas in the flashcards!`
        : `Focus generally on building 5 to 8 cards covering core terminology, laws, and equations associated with this lesson topic.`;

      let groundingPrompt = "";
      if (uploadedContent) {
        const maxChars = 20000;
        const processedContent = uploadedContent.length > maxChars 
          ? uploadedContent.substring(0, maxChars) + "\n[Content truncated for length limitations...]"
          : uploadedContent;
        groundingPrompt = `
        CRITICAL GROUNDING DIRECTIVE:
        Base your flashcard reviews strictly on the provided source text. Do not introduce outside information not present in this text.
        You MUST construct all flashcards (front terms and back definitions) STRICTLY and EXCLUSIVELY based on the facts and information provided in the text segment below.
        Do NOT ask about or define concepts not explicitly mentioned in this provided text segment. Keep everything perfectly grounded.

        Provided Topic Source Segment:
        """
        ${processedContent}
        """
        `;
      }

      const prompt = `
        You are an elite academic lecturer. Create 5 to 8 rigorous yet highly concise and memorable review flashcards for study topic "${topic}" within discipline "${subject}".
        
        Tailoring Instructions:
        ${missedText}
        ${levelInstruction}
        
        ${groundingPrompt}
        
        Guidelines:
        1. Keep the card front (term/concept/question) precise and engaging.
        2. Keep the card back (definition/answer/explanation) highly clear, scannable, and explanatory.
      `;

      // Use robust retry wrapper
      const response = await generateWithRetry({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an educational tutor that crafts clear and high-impact active recall flashcards, returning structured JSON datasets.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: {
                      type: Type.STRING,
                      description: "The term, conceptual question, or prompt to challenge recall."
                    },
                    back: {
                      type: Type.STRING,
                      description: "The definition, concise answer, formula, or breakdown details."
                    }
                  },
                  required: ["front", "back"]
                },
                description: "List containing 5 to 8 curated interactive memory review flashcards."
              }
            },
            required: ["flashcards"]
          }
        }
      });

      const responseText = response.text || "";
      const flashcardData = JSON.parse(responseText.trim());
      flashcardData.modelUsed = response.modelUsed;
      res.setHeader("x-model-used", response.modelUsed);
      res.json(flashcardData);
    } catch (error: any) {
      console.error("Gemini flashcard generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate review flashcards. Please retry." });
    }
  });

  // API Route for dynamic student progress insights (Praise + Nudge chatbot/mascot messages)
  app.post("/api/generate-progress-insight", async (req: any, res: any) => {
    try {
      const { 
        userName, 
        curriculumLevel, 
        quizHistory = [], 
        subjectDifficulties = {}, 
        totalTimeStudied = 0, 
        timeSpentPerTopic = {}, 
        streakDays = 0
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Secrets registry. Please add your key to run generation." 
        });
      }

      // Analyze weak topics or low scores
      const weakSpots: Array<{ subject: string; topic: string; score: number; totalQuestions: number; percentage: number }> = [];
      const strengths: Array<{ subject: string; topic: string; score: number; totalQuestions: number; percentage: number }> = [];

      quizHistory.forEach((q: any) => {
        if (q.totalQuestions > 0) {
          const pct = (q.score / q.totalQuestions) * 100;
          if (pct < 70) {
            weakSpots.push({
              subject: q.subject,
              topic: q.topic,
              score: q.score,
              totalQuestions: q.totalQuestions,
              percentage: pct
            });
          } else if (pct >= 85) {
            strengths.push({
              subject: q.subject,
              topic: q.topic,
              score: q.score,
              totalQuestions: q.totalQuestions,
              percentage: pct
            });
          }
        }
      });

      // Construct a summary of user's state
      const textSummaryParts = [];
      textSummaryParts.push(`User Name: ${userName || "Student"}`);
      textSummaryParts.push(`Curriculum Level: ${curriculumLevel || "Not set"}`);
      textSummaryParts.push(`Total Time Studied: ${Math.round(totalTimeStudied / 60)} minutes (${totalTimeStudied} seconds)`);
      textSummaryParts.push(`Current Streak: ${streakDays} days`);
      
      if (strengths.length > 0) {
        textSummaryParts.push(`Strength Topics (Mastered >= 85%): ${strengths.slice(0, 3).map(s => `"${s.topic}" in ${s.subject} (${Math.round(s.percentage)}%)`).join(", ")}`);
      }
      if (weakSpots.length > 0) {
        textSummaryParts.push(`Weak Topics / Trouble spots (< 70%): ${weakSpots.slice(0, 3).map(w => `"${w.topic}" in ${w.subject} (${Math.round(w.percentage)}%)`).join(", ")}`);
      }

      const totalTimePerSubject: Record<string, number> = {};
      Object.entries(timeSpentPerTopic).forEach(([key, secs]: [string, any]) => {
        const parts = key.split("::");
        const sub = parts[0] || "General";
        totalTimePerSubject[sub] = (totalTimePerSubject[sub] || 0) + secs;
      });
      if (Object.keys(totalTimePerSubject).length > 0) {
        textSummaryParts.push(`Subject study times: ${Object.entries(totalTimePerSubject).map(([sub, secs]) => `${sub}: ${Math.round(secs / 60)} minutes`).join(", ")}`);
      }

      const dataSummary = textSummaryParts.join("\n");

      const prompt = `
        You are "Lernera Guide", a nurturing, context-aware academic mentor/mascot representing an ambient AI companion.
        We are generating a highly personalized, contextual progress insight message for the student based on their actual usage data.

        Here is the user's current progress dataset:
        """
        ${dataSummary}
        """

        CRITICAL OUTPUT CONSTRAINTS & INSTRUCTIONS:
        1. Keep the message EXTREMELY SHORT — strictly 1 or 2 sentences maximum.
        2. Give either:
           - A warm "positive reinforcement" celebrating a strength, progress, streak milestone, or high study duration.
           - OR a helpful "constructive nudge" suggesting review for a weak topic, mentioning a specific topic they scored under 70% in, or gently encouraging them because study logs are currently light.
        3. Do NOT make up fake activities. Look at the data provided. If there are no quizzes, comment on starting their first study room lesson or setting up subjects.
        4. Use a warm, highly encouraging, and natural conversational tone (no corporate lingo, no "Gemini" branding, no robotic filler).
        5. Speak specifically about their topics (e.g. refer by name, but keep it brief).
        6. Return ONLY a single JSON object with the following structure:
        {
          "message": "The generated 1-2 sentence warm insight string here",
          "category": "positive_reinforcement" or "constructive_nudge"
        }
      `;

      const response = await generateWithRetry({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an educational tutor representing a friendly study companion. Return responses strictly in JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
              category: { type: Type.STRING, enum: ["positive_reinforcement", "constructive_nudge"] }
            },
            required: ["message", "category"]
          }
        }
      });

      const responseText = response.text || "";
      const insight = JSON.parse(responseText.trim());
      res.json(insight);
    } catch (error: any) {
      console.error("Failed to generate progress insight message:", error);
      res.status(500).json({ error: error.message || "Failed to generate dynamic mentor insight." });
    }
  });

  // API Route to generate a structured list of topics from an uploaded document
  app.post("/api/generate-document-topics", async (req: any, res: any) => {
    try {
      const { text, focus = "" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Document text content is required" });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: "Gemini API key is not configured in Secrets registry. Please add your key to run generation.",
        });
      }

      const allWords = text.trim().split(/\s+/).filter((w: string) => w.length > 0);
      const wordCount = allWords.length;

      // Routing: standard (<8k), outline (8k-20k), large-capped fallback (>20k)
      let processingMode: "standard" | "outline" | "large_capped";
      let processedText: string;
      let modeInstruction = "";

      if (wordCount < 8000) {
        processingMode = "standard";
        processedText = text;
      } else if (wordCount <= 20000) {
        processingMode = "outline";
        processedText = text; // Gemini Flash supports 1M tokens — full text is fine at this size
        modeInstruction = `
        STRUCTURAL ANALYSIS PRIORITY: This is a moderately long document.
        Step 1 — Identify ALL chapter headings, section titles, numbered headings (e.g. 1.1, 1.2), and major structural dividers present in the text.
        Step 2 — Use ONLY these structural markers as topic boundaries. Do not split on subject-matter shifts alone.
        Each returned topic MUST correspond to a clearly delimited, structurally-marked section of the document.`;
      } else {
        // Document exceeds 20k words — frontend should use chunked endpoint instead
        processingMode = "large_capped";
        processedText = allWords.slice(0, 20000).join(" ");
        modeInstruction = `NOTE: This document was capped at 20,000 words. Use chunked processing for the complete document.`;
      }

      const prompt = `
        You are an expert document analyzer and syllabus structure parser.
        Your task is to analyze the following document content and identify distinct, logical study topics, chapters, or sections within it.
        ${modeInstruction}

        Document Content:
        """
        ${processedText}
        """

        Focus area requested by user (if any):
        "${focus || "Standard full parsing"}"

        INSTRUCTIONS:
        1. Parse the document and identify distinct structural markers if present (chapter titles, section headings, numbered headings). Use these to define topic boundaries.
        2. If no clear headings exist, split based on logical subject-matter shifts.
        3. Aim to produce roughly 5 to 10 distinct topics. For short documents, 2 to 4 is acceptable.
        4. CRITICAL: For each topic, extract the EXACT verbatim slice of source text belonging to it into the 'sourceText' field.
        5. DO NOT SUMMARIZE OR PARAPHRASE the sourceText. It must be a direct sequential subset of the original document text.
        6. Provide an elegant name, short high-level description, and realistic study duration (e.g. '15m', '20m', '30m') for each topic.
      `;

      const response = await generateWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You are an educational tutor that organizes course topics by tracking and extracting structural sections of source documents, returning answers formatted in structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name/title of the topic, section, or chapter." },
                    description: { type: Type.STRING, description: "Elegant description summarizing the topic focus based ONLY on its content." },
                    duration: { type: Type.STRING, description: "Realistic estimated study duration (e.g., '15m', '20m', '30m')." },
                    sourceText: { type: Type.STRING, description: "The EXACT slice of original source text belonging to this topic. Do not condense, summarize, or paraphrase." },
                  },
                  required: ["name", "description", "duration", "sourceText"],
                },
                description: "List of identified distinct topics with their source text boundaries.",
              },
            },
            required: ["topics"],
          },
        },
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.trim());

      // Cap each topic's sourceText at 4,000 words so downstream explanation requests stay within limits
      const SOURCE_WORD_CAP = 4000;
      for (const topic of parsedData.topics || []) {
        if (topic.sourceText) {
          const stWords = topic.sourceText.trim().split(/\s+/);
          if (stWords.length > SOURCE_WORD_CAP) {
            topic.sourceText = stWords.slice(0, SOURCE_WORD_CAP).join(" ");
            topic.sourceTextCapped = true;
          }
        }
      }

      parsedData.modelUsed = response.modelUsed;
      parsedData.wordCount = wordCount;
      parsedData.processingMode = processingMode;
      res.setHeader("x-model-used", response.modelUsed);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Gemini document topic generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to parse document topics. Please check your document and try again." });
    }
  });

  // API Route: process a single chunk from a large document (>20,000 words)
  app.post("/api/process-document-chunk", async (req: any, res: any) => {
    const { chunkIndex } = req.body;
    try {
      const { chunk, totalChunks, focus = "" } = req.body;
      if (!chunk) {
        return res.status(400).json({ error: "Chunk text content is required", chunkIndex });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: "Gemini API key is not configured in Secrets registry.",
          chunkIndex,
        });
      }

      const prompt = `
        You are analyzing CHUNK ${(chunkIndex ?? 0) + 1} of ${totalChunks ?? "?"} from a large document.
        The text at the very start and very end of this chunk may overlap with adjacent chunks — focus only on topics that are substantially present in the MIDDLE portion of this chunk.

        Document Chunk ${(chunkIndex ?? 0) + 1}/${totalChunks ?? "?"}:
        """
        ${chunk}
        """

        Focus area (if any): "${focus || "Standard full parsing"}"

        INSTRUCTIONS:
        1. Identify 2 to 5 distinct study topics clearly and substantially present in this chunk.
        2. Skip any topic that appears cut off at the very start (incomplete at chunk beginning) or very end — it will be captured by the adjacent chunk.
        3. For each complete topic, extract the EXACT verbatim source text slice from this chunk into 'sourceText'.
        4. Provide an elegant topic name, short description, and realistic study duration.
      `;

      const response = await generateWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You are an educational tutor that identifies study topics from document chunks, returning structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    sourceText: { type: Type.STRING },
                  },
                  required: ["name", "description", "duration", "sourceText"],
                },
              },
            },
            required: ["topics"],
          },
        },
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.trim());

      // Cap sourceText at 4,000 words
      const SOURCE_WORD_CAP = 4000;
      for (const topic of parsedData.topics || []) {
        if (topic.sourceText) {
          const stWords = topic.sourceText.trim().split(/\s+/);
          if (stWords.length > SOURCE_WORD_CAP) {
            topic.sourceText = stWords.slice(0, SOURCE_WORD_CAP).join(" ");
            topic.sourceTextCapped = true;
          }
        }
      }

      res.json({ topics: parsedData.topics || [], chunkIndex, modelUsed: response.modelUsed });
    } catch (error: any) {
      console.error(`Chunk ${chunkIndex ?? "?"} processing failed:`, error);
      res.status(500).json({
        error: error.message || "Failed to process document chunk.",
        chunkIndex: chunkIndex ?? -1,
      });
    }
  });

  // API Route to generate a structured list of study topics using AI for a subject (no source material)
  app.post("/api/generate-ai-topics", async (req: any, res: any) => {
    try {
      const { subject, curriculumLevel = "General Audience" } = req.body;
      if (!subject) {
        return res.status(400).json({ error: "Subject name is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Secrets registry. Please add your key to run generation." 
        });
      }

      const prompt = `
        You are an elite educational therapist and curriculum designer. 
        Your task is to design a logical, highly sensible topic learning curriculum for the subject: "${subject}".
        This curriculum must be tailored precisely for a student at the curriculum/education level: "${curriculumLevel}".
        
        INSTRUCTIONS:
        1. Design exactly 8 to 12 topics.
        2. Order these topics in a highly logical learning progression (e.g., foundational and basic topics first, building gradually toward advanced topics), similar in scope and depth to a comprehensive course syllabus.
        3. For each topic, provide:
           - A clear, elegant name/title (e.g. "Laws of Thermodynamics", "Fundamental Vector Calculus").
           - A concise, high-impact one-line description summarizing the topic focus under 30 words.
           - A realistic estimated study duration (e.g., "15m", "20m", "30m", "45m").
      `;

      // Use robust retry wrapper
      const response = await generateWithRetry({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an educational curriculum designer that organizes course topics into a logically ordered syllabus, returning answers strictly in JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name or title of the chapter/topic." },
                    description: { type: Type.STRING, description: "Concise one-line summary explanation of what is studied here under 30 words." },
                    duration: { type: Type.STRING, description: "Estimated study duration of the topic, e.g., '15m', '20m', '30m'." }
                  },
                  required: ["name", "description", "duration"]
                },
                description: "Array of 8 to 12 logically ordered curriculum topics."
              }
            },
            required: ["topics"]
          }
        }
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.trim());
      parsedData.modelUsed = response.modelUsed;
      res.setHeader("x-model-used", response.modelUsed);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Gemini AI topics generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate subject topics. Please try again." });
    }
  });

  // API Route to generate structured slides for a custom Presentation
  app.post("/api/generate-presentation", async (req: any, res: any) => {
    try {
      const { title, sourceType, sourceContent = "", slideCount = 10, lookStyle = "balanced", headingStyle = "standard" } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Presentation title/topic is required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Secrets registry. Please add your key to run generation." 
        });
      }

      let stylePrompt = "";
      if (lookStyle === "visual_minimal") {
        stylePrompt += "\n- STYLE PREFERENCE: Generate slides in Visual & Minimal style: big bold headings (max 5 words), maximum 2 punchy sentences per slide, generous white space. Do not use bullet points.";
      } else if (lookStyle === "info_dense") {
        stylePrompt += "\n- STYLE PREFERENCE: Generate slides in Information Dense style: detailed bullet points (4-6 per slide), comprehensive coverage of each concept.";
      } else {
        stylePrompt += "\n- STYLE PREFERENCE: Generate slides in Balanced style. Moderate headings, 3-4 concise, clear, and informative points per slide. Well-spaced, easy to read, but informative.";
      }

      if (headingStyle === "bold_large") {
        stylePrompt += "\n- HEADING INSTRUCTION: Large & Bold heading. The title heading must dominate the slide as the massive focus of attention, with minimal supporting text.";
      } else if (headingStyle === "content_first") {
        stylePrompt += "\n- HEADING INSTRUCTION: Content-First heading. Keep titles smaller to let body bullet text and core concepts take top visual priority.";
      } else {
        stylePrompt += "\n- HEADING INSTRUCTION: Standard heading. Title heading and body content text should have roughly equal weight and balanced visual alignment.";
      }

      let systemInstruction = "You are an expert presentation designer. Organize slides in a clear, logically structured format and return answers strictly in JSON.";
      let prompt = "";

      if (sourceType === "document") {
        prompt = `
          You are designing a professional presentation deck.
          
          PRESENTATION DETAILS:
          - Title/Topic: "${title}"
          - Slide Count Required: exactly ${slideCount} slides
          - Material Source type: "document" (reference document contents provided below)
          
          CRITICAL INSTRUCTIONS:
          1. Base ALL slide content strictly on the ACTUAL material and facts provided in the "REFERENCE DOCUMENT" below. Do not use external or general knowledge.
          2. Create EXACTLY ${slideCount} slides in a logical learning flow matching your source.
          3. Keep each slide extremely concise and presentation-oriented (3 to 5 clear bullet points per slide, not long essays).
          4. Follow these style preferences exactly: ${stylePrompt}
          
          REFERENCE DOCUMENT:
          ---
          ${sourceContent}
          ---
        `;
      } else if (sourceType === "description") {
        prompt = `
          You are designing a professional presentation deck.
          
          PRESENTATION DETAILS:
          - Title/Topic: "${title}"
          - Slide Count Required: exactly ${slideCount} slides
          - Material Source type: "description" (user defined requirements provided below)
          
          CRITICAL INSTRUCTIONS:
          1. Design the slides based on the custom description and scope requirements provided by the user below.
          2. Create EXACTLY ${slideCount} slides.
          3. Keep each slide extremely concise and presentation-oriented (3 to 5 clear bullet points per slide, not long essays).
          4. Follow these style preferences exactly: ${stylePrompt}
          
          USER DESCRIPTION / SCOPE:
          ---
          ${sourceContent}
          ---
        `;
      } else {
        // "Let AI decide"
        prompt = `
          You are designing a professional presentation deck.
          
          PRESENTATION DETAILS:
          - Title/Topic: "${title}"
          - Slide Count Required: exactly ${slideCount} slides
          - Material Source type: "Let AI decide" (design a logical, well-organized presentation flow dynamically)
          
          CRITICAL INSTRUCTIONS:
          1. Design a logical, well-structured presentation flow appropriate to the given title: starting with an informative introduction slide, building up with core content slides in a coherent developmental sequence, and concluding with a strong summary/conclusion slide.
          2. Create EXACTLY ${slideCount} slides total.
          3. Keep each slide extremely concise and presentation-oriented (3 to 5 clear bullet points per slide, not long essays).
          4. Follow these style preferences exactly: ${stylePrompt}
        `;
      }

      const response = await generateWithRetry({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Title of the individual slide" },
                    bullets: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "List of concise, bulleted details for the slide (3 to 5 items)"
                    }
                  },
                  required: ["title", "bullets"]
                },
                description: `Array of exactly ${slideCount} slides.`
              }
            },
            required: ["slides"]
          }
        }
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.trim());
      res.json({
        slides: parsedData.slides || [],
        modelUsed: response.modelUsed
      });
    } catch (error: any) {
      console.error("Gemini presentation generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate presentation slides. Please try again." });
    }
  });

  // API Route to generate a short, personalized AI insight based on study metrics
  app.post("/api/generate-insight", async (req: any, res: any) => {
    try {
      const { 
        userName = "Learner", 
        quizHistory = [], 
        totalTimeStudied = 0, 
        streakDays = 0, 
        savedFlashcardsCount = 0, 
        difficultyLevel = "beginner", 
        curriculumLevel = "",
        timeSpentPerTopic = {}
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in Secrets registry." 
        });
      }

      // Format simple stats summaries for the Gemini prompt
      const totalTimeMinutes = Math.round(totalTimeStudied / 60);
      const lowScoresList: string[] = [];
      const highScoresList: string[] = [];
      const topicsAttemptedMap: Record<string, { topic: string; scorePct: number }> = {};

      quizHistory.forEach((q: any) => {
        if (q.topic) {
          const pct = Math.round((q.score / (q.totalQuestions || 5)) * 100);
          topicsAttemptedMap[q.topic.trim().toLowerCase()] = { topic: q.topic, scorePct: pct };
        }
      });

      Object.values(topicsAttemptedMap).forEach((elem: any) => {
        if (elem.scorePct < 60) {
          lowScoresList.push(`${elem.topic} (${elem.scorePct}%)`);
        } else if (elem.scorePct >= 80) {
          highScoresList.push(`${elem.topic} (${elem.scorePct}%)`);
        }
      });

      // Group active subject study minutes
      const timeSpentPerSubject: Record<string, number> = {};
      Object.entries(timeSpentPerTopic || {}).forEach(([key, secs]) => {
        const parts = key.split("::");
        const sub = parts[0] ? parts[0].trim() : "General";
        timeSpentPerSubject[sub] = (timeSpentPerSubject[sub] || 0) + (secs as number);
      });

      const subjectStudiesStr = Object.entries(timeSpentPerSubject)
        .map(([subj, secs]) => `${subj}: ${Math.round(secs / 60)} minutes`)
        .join(", ");

      const prompt = `
        You are an upbeat, encouraging, and highly observant academic companion designed to help the student "${userName}" optimize their learning.
        Analyze the student's study metrics and generate a short, specific insight.

        RULES:
        1. Keep the generated message extremely SHORT: 1 to 2 sentences maximum.
        2. Tone MUST be warm, empathetic, motivational, and highly personalized.
        3. Do NOT use generic high-level motivational filler or cliché greetings. It MUST refer to their real data (specific numbers or subjects if any).
        4. Dynamically decide between showing:
           - A positive reinforcement celebration (e.g., if they have high scores, a good streak, flashcards saved, or lots of active study minutes).
           - A constructive, gentle academic nudge (e.g., if they have weak topics, low quiz scores, need review, or if study time has dropped off).
        5. Do NOT include any JSON syntax or boilerplate headers inside the response. Return a clean, simple, plain text response containing only the 1-2 sentence message.

        STUDENT STATS:
        - Name: ${userName}
        - Current Difficulty Level Setting: ${difficultyLevel}
        - Curriculum/Academic Grade Goal: ${curriculumLevel || "General Studies"}
        - Accumulated Active Study Duration: ${totalTimeMinutes} minutes total
        - Active Study Streak: ${streakDays} days consecutive
        - SAVED Memory Flashcards: ${savedFlashcardsCount} items
        - Exceptional Performance Topics (Scores >= 80%): ${highScoresList.length > 0 ? highScoresList.join(", ") : "None yet"}
        - High Urgency Topics to Review (Scores < 60%): ${lowScoresList.length > 0 ? lowScoresList.join(", ") : "None yet"}
        - Time Spent Studying per Subject Area: ${subjectStudiesStr || "No hours logged yet"}
      `;

      const response = await generateWithRetry({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an encouraging academic companion. Always return plain text with exactly 1 or 2 sentences maximum of personalized feedback.",
          temperature: 0.8
        }
      });

      const responseText = (response.text || "").trim();
      res.json({ insight: responseText, modelUsed: response.modelUsed });
    } catch (error: any) {
      console.error("Gemini insight generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate dynamic insights." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error-catching middleware — returns structured JSON instead of crashing
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled server error:", err?.message || err);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({
      error: err?.message || "An unexpected server error occurred.",
      code: err?.code || "INTERNAL_ERROR",
    });
  });

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

return app;
}

const appPromise = startServer();
export default async (req: any, res: any) => {
const app = await appPromise;
app(req, res);
};
