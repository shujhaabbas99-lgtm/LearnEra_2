import React, { useState } from "react";
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Loader2, 
  Settings, 
  Brain, 
  BookOpen, 
  Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppState, SubjectItem, TopicInfo } from "../types";

interface TopicSourceSelectionStateViewProps {
  selectedSubject: string | null;
  setSelectedSubject: (subject: string | null) => void;
  setSelectedTopic: (topic: string | null) => void;
  customSubjects: SubjectItem[];
  setCustomSubjects: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
  curriculumLevel: string;
  onBack: () => void;
  onNext: () => void;
  setCurrentState: (state: AppState) => void;
}

enum SubSelectionMethod {
  NONE = "NONE",
  MANUAL = "MANUAL",
  UPLOAD = "UPLOAD",
  AI = "AI"
}

export default function TopicSourceSelectionStateView({
  selectedSubject,
  setSelectedSubject,
  setSelectedTopic,
  customSubjects,
  setCustomSubjects,
  curriculumLevel,
  onBack,
  onNext,
  setCurrentState
}: TopicSourceSelectionStateViewProps) {
  const [method, setMethod] = useState<SubSelectionMethod>(SubSelectionMethod.NONE);
  
  // Method 1: Manual Topics State
  const [manualTopics, setManualTopics] = useState<TopicInfo[]>([
    { name: "Introduction to the Topic", description: "Foundational concepts, primary models, and baseline definitions.", duration: "15m" },
    { name: "Core Structural Mechanisms", description: "Underlying frameworks, key functional laws, and active attributes.", duration: "20m" }
  ]);
  const [manualSaveError, setManualSaveError] = useState("");

  // Method 2: Document Upload State
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uplName, setUplName] = useState("");
  const [uplFocus, setUplFocus] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Method 3: AI Curriculum Generation state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedTopics, setAiGeneratedTopics] = useState<TopicInfo[] | null>(null);
  const [aiGenError, setAiGenError] = useState("");

  const handleAiTopicsGeneration = async () => {
    if (!selectedSubject) return;
    setIsAiGenerating(true);
    setAiGenError("");
    setAiGeneratedTopics(null);

    try {
      const response = await fetch("/api/generate-ai-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject,
          curriculumLevel: curriculumLevel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate AI custom topics.");
      }

      const data = await response.json();
      const generated = data.topics || [];
      if (generated.length === 0) {
        throw new Error("No topics were returned by the custom syllabus model.");
      }
      setAiGeneratedTopics(generated);
    } catch (err: any) {
      console.error(err);
      setAiGenError(err.message || "An unexpected issue occurred while requesting custom topics. Please check your credentials.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const confirmAiTopics = () => {
    if (!selectedSubject || !aiGeneratedTopics) return;

    const cleanSubjectItem: SubjectItem = {
      id: "sub_" + Date.now(),
      name: selectedSubject,
      description: `Course syllabus tailored beautifully for ${curriculumLevel} using Gemini AI.`,
      colorClass: "from-violet-500/10 to-fuchsia-500/5 hover:border-violet-500/40 text-violet-700",
      topics: aiGeneratedTopics
    };

    setCustomSubjects(prev => {
      const filtered = prev.filter(s => s.name.trim().toLowerCase() !== selectedSubject.trim().toLowerCase());
      return [...filtered, cleanSubjectItem];
    });

    // Reset state & redirect to deck selection
    setSelectedTopic(null);
    setCurrentState(AppState.SUBJECT_SELECTION_STATE);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError("");
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setUplName(cleanName);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setUplName(cleanName);
    }
  };

  const extractTextContent = async (file: File): Promise<string> => {
    const fileType = file.type || "";
    const fileName = file.name || "";
    
    if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
          try {
            if (!(window as any).pdfjsLib) {
              await new Promise<void>((res, rej) => {
                const script = document.createElement("script");
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
                script.onload = () => res();
                script.onerror = () => rej(new Error("Unable to load PDF reader helper dynamically."));
                document.head.appendChild(script);
              });
            }
            
            const pdfjsLib = (window as any).pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
            
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            let extractedText = "";
            const maxPages = Math.min(pdf.numPages, 30);
            
            for (let i = 1; i <= maxPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(" ");
              extractedText += pageText + "\n";
            }
            
            if (!extractedText.trim()) {
              reject(new Error("Verify text layer - this document appears to contain scanned image content without extracted text."));
            } else {
              resolve(extractedText);
            }
          } catch (err: any) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Unable to decode the binary schema of this document."));
        reader.readAsArrayBuffer(file);
      });
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = () => reject(new Error("Failed reading the text content of this file."));
        reader.readAsText(file);
      });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedSubject) return;
    
    setIsExtracting(true);
    setUploadError("");
    
    try {
      const text = await extractTextContent(uploadFile);
      if (!text || text.trim().length === 0) {
        throw new Error("Unable to process: Document contains no parsable text content.");
      }

      const response = await fetch("/api/generate-document-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, focus: uplFocus.trim() })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed generating study deck topics from this document.");
      }
      
      const data = await response.json();
      const generatedTopics: TopicInfo[] = data.topics || [];
      
      if (generatedTopics.length === 0) {
        throw new Error("Syllabus structure extraction failed. Please try a different text format.");
      }

      // 1. Save standard document entry to mock/support getActiveUploadedContent()
      const docId = "doc_" + Date.now();
      const newDoc = {
        id: docId,
        name: selectedSubject, // Use exact selectedSubject name so getActiveUploadedContent finds it!
        content: text,
        focus: uplFocus.trim(),
        topics: generatedTopics
      };
      
      const savedDocsStr = localStorage.getItem("uploadedDocuments");
      const currentDocs = savedDocsStr ? JSON.parse(savedDocsStr) : [];
      localStorage.setItem("uploadedDocuments", JSON.stringify([newDoc, ...currentDocs]));

      // 2. Converge on clean customSubjects entry
      const cleanSubjectItem: SubjectItem = {
        id: "sub_" + Date.now(),
        name: selectedSubject,
        description: uplFocus.trim() || `Course based on uploaded: ${uplName || uploadFile.name}`,
        colorClass: "from-teal-500/10 to-emerald-500/5 hover:border-emerald-500/40 text-emerald-800",
        topics: generatedTopics
      };

      setCustomSubjects(prev => {
        const filtered = prev.filter(s => s.name.trim().toLowerCase() !== selectedSubject.trim().toLowerCase());
        return [...filtered, cleanSubjectItem];
      });

      // Navigate back to selection state showing newly built curriculum!
      setSelectedTopic(null);
      setCurrentState(AppState.SUBJECT_SELECTION_STATE);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed extracting words or generating topics from this document. Please ensure it contains copyable text.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Method 1 Action Handling: Add/Remove manually entered rows
  const addManualRow = () => {
    setManualTopics(prev => [
      ...prev,
      { name: "", description: "", duration: "15m" }
    ]);
  };

  const removeManualRow = (index: number) => {
    setManualTopics(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const updateManualField = (index: number, field: keyof TopicInfo, val: string) => {
    setManualTopics(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: val
      };
      return copy;
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualSaveError("");

    if (!selectedSubject) return;

    // Filter and sanitize entries
    const cleaned = manualTopics
      .map(t => ({
        name: t.name.trim(),
        description: t.description.trim() || `Introduction and baseline details for ${t.name.trim() || "topic"}.`,
        duration: t.duration.trim() || "15m"
      }))
      .filter(t => t.name.length > 0);

    if (cleaned.length === 0) {
      setManualSaveError("You must specify at least one valid topic row name.");
      return;
    }

    const cleanSubjectItem: SubjectItem = {
      id: "sub_" + Date.now(),
      name: selectedSubject,
      description: `Course syllabus featuring custom user-defined topics.`,
      colorClass: "from-indigo-500/10 to-violet-500/5 hover:border-indigo-500/40 text-indigo-700",
      topics: cleaned
    };

    setCustomSubjects(prev => {
      const filtered = prev.filter(s => s.name.trim().toLowerCase() !== selectedSubject.trim().toLowerCase());
      return [...filtered, cleanSubjectItem];
    });

    // Reset topic lists and route back to pick topics!
    setSelectedTopic(null);
    setCurrentState(AppState.SUBJECT_SELECTION_STATE);
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 text-left" id="topic-source-selection-container">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <button
          onClick={method !== SubSelectionMethod.NONE ? () => setMethod(SubSelectionMethod.NONE) : onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold transition-all cursor-pointer"
          id="btn-method-back"
        >
          <ArrowLeft size={13} />
          <span>{method !== SubSelectionMethod.NONE ? "Choose Another Method" : "Back to Subjects"}</span>
        </button>
        
        <div>
          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-405 font-mono tracking-widest uppercase block text-left sm:text-right mb-0.5">
            CURRENT SUBJECT
          </span>
          <span className="text-xs font-extrabold text-slate-905 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 px-2.5 py-1 rounded-lg">
            {selectedSubject}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {method === SubSelectionMethod.NONE && (
          /* OPTIONS DIALOG SELECTION */
          <motion.div
            key="topic-method-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="space-y-1.5">
              <h3 className="font-sans font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                How should we populate your syllabus?
              </h3>
              <p className="text-xs text-slate-505 font-medium leading-relaxed">
                Choose the resource route below to configure the topics, goals, and content coordinates for <strong className="text-slate-800">{selectedSubject}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3" id="method-options-grid">
              
              {/* Option 1: Manual */}
              <div
                onClick={() => setMethod(SubSelectionMethod.MANUAL)}
                className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-6 text-left cursor-pointer transition-all hover:shadow-xs group flex flex-col justify-between"
                id="method-card-manual"
              >
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-indigo-50 border border-indigo-100/70 rounded-xl flex items-center justify-center text-indigo-650 shadow-3xs group-hover:scale-105 transition-transform">
                    <Edit3 size={18} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-extrabold text-sm text-slate-800 group-hover:text-slate-900">
                      I'll list my own topics
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                      Type in custom chapter or segment names manually. Best if you already have a syllabus outline in mind.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-650 font-bold font-mono mt-6 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Enter Syllabus &rarr;
                </span>
              </div>

              {/* Option 2: Document */}
              <div
                onClick={() => setMethod(SubSelectionMethod.UPLOAD)}
                className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-6 text-left cursor-pointer transition-all hover:shadow-xs group flex flex-col justify-between"
                id="method-card-upload"
              >
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-indigo-50 border border-indigo-100/70 rounded-xl flex items-center justify-center text-indigo-650 shadow-3xs group-hover:scale-105 transition-transform">
                    <Upload size={18} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-extrabold text-sm text-slate-800 group-hover:text-slate-900">
                      Upload a book or document
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                      Provide a textbook PDF, reading list, or markdown study notes. AI will extract and structure the topics automatically.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-650 font-bold font-mono mt-6 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Add Document &rarr;
                </span>
              </div>

              {/* Option 3: AI Grid */}
              <div
                onClick={() => setMethod(SubSelectionMethod.AI)}
                className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-6 text-left cursor-pointer transition-all hover:shadow-xs group flex flex-col justify-between"
                id="method-card-ai"
              >
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-indigo-50 border border-indigo-100/70 rounded-xl flex items-center justify-center text-indigo-650 shadow-3xs group-hover:scale-105 transition-transform">
                    <Sparkles size={18} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-extrabold text-sm text-slate-800 group-hover:text-slate-900">
                      Let AI design curriculum
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                      Enter the coarse subject name. The system will design a robust, structured academic list tuned for {curriculumLevel}.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-650 font-bold font-mono mt-6 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Generate Curriculum &rarr;
                </span>
              </div>

            </div>
          </motion.div>
        )}

        {method === SubSelectionMethod.MANUAL && (
          /* MANUAL TOPIC FORM ROWS */
          <motion.div
            key="manual-topic-form-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h3 className="font-sans font-extrabold text-lg text-slate-900 tracking-tight">
                Define Course Syllabus Manually
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Add each topic or chapter name that belongs to <span className="text-indigo-650 font-bold">{selectedSubject}</span>.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4" id="form-manual-topics">
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1" id="manual-rows-container">
                {manualTopics.map((topic, index) => (
                  <div 
                    key={index}
                    className="flex flex-col sm:flex-row gap-3.5 p-4 bg-slate-50/50 border border-slate-200 rounded-xl items-start sm:items-center justify-between"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3.5 w-full">
                      <div className="sm:col-span-4 space-y-1 text-left">
                        <label className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400 font-mono">
                          Topic Name (Row {index + 1})
                        </label>
                        <input
                          type="text"
                          required
                          value={topic.name}
                          onChange={(e) => updateManualField(index, "name", e.target.value)}
                          placeholder="e.g. Fundamental Mechanics"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      
                      <div className="sm:col-span-6 space-y-1 text-left">
                        <label className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400 font-mono">
                          Short Goal / Summary
                        </label>
                        <input
                          type="text"
                          value={topic.description}
                          onChange={(e) => updateManualField(index, "description", e.target.value)}
                          placeholder="What is studied here?"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-xs text-slate-700 placeholder-slate-405"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1 text-left">
                        <label className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-400 font-mono">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={topic.duration}
                          onChange={(e) => updateManualField(index, "duration", e.target.value)}
                          placeholder="e.g. 15m"
                          className="w-full px-2 py-2 bg-white border border-slate-205 focus:border-indigo-500 rounded-lg text-xs text-slate-700 font-mono text-center"
                        />
                      </div>
                    </div>

                    {manualTopics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeManualRow(index)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent rounded-lg transition-all shrink-0 mt-5 sm:mt-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {manualSaveError && (
                <p className="text-xs font-semibold text-red-655" id="manual-error-lbl">
                  ⚠️ {manualSaveError}
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={addManualRow}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                  id="btn-add-manual-row"
                >
                  <Plus size={13} className="text-slate-500" />
                  <span>Add Topic Row</span>
                </button>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setMethod(SubSelectionMethod.NONE)}
                    className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-200 hover:bg-slate-55 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    id="btn-manual-topics-submit"
                  >
                    <span>Save &amp; Build Syllabus</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {method === SubSelectionMethod.UPLOAD && (
          /* DOCUMENT UPLOAD FORM */
          <motion.div
            key="upload-topic-form-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h3 className="font-sans font-extrabold text-lg text-slate-900 tracking-tight">
                Upload Reference Study Sheets
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Provide content documents (PDF, TXT, or markdown notes) below. We will segment them into distinct focus modules based on sub-topics.
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-3xs" id="form-upload-topics">
              <div className="space-y-2">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive 
                      ? "border-indigo-500 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/20" 
                      : "border-slate-300 dark:border-slate-700 hover:border-slate-450 dark:hover:border-slate-600 bg-slate-50/20 dark:bg-slate-950/20"
                  }`}
                  id="upload-topics-target"
                >
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isExtracting}
                    id="input-file-topics"
                  />
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-3xs">
                      <Upload size={18} className={dragActive ? "animate-bounce" : ""} />
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {uploadFile ? (
                        <span className="text-indigo-650 dark:text-indigo-400 flex items-center justify-center gap-1">
                          <FileText size={13} />
                          Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                        </span>
                      ) : (
                        <span>Drag reference file here, or <span className="text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer">browse filesystem</span></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {uploadFile && (
                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold uppercase font-mono tracking-wide text-slate-400 dark:text-slate-500">
                      Study Sheet Title
                    </label>
                    <input
                      type="text"
                      required
                      value={uplName}
                      onChange={(e) => setUplName(e.target.value)}
                      placeholder="e.g. Chapter 4 - Atomic Structure"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-sans shadow-3xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold uppercase font-mono tracking-wide text-slate-400 dark:text-slate-500">
                      Primary extraction focus (optional)
                    </label>
                    <input
                      type="text"
                      value={uplFocus}
                      onChange={(e) => setUplFocus(e.target.value)}
                      placeholder="e.g. prioritize chemical bonds, omit history of discovery"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-707 dark:text-slate-300 placeholder-slate-405 dark:placeholder-slate-550 font-sans shadow-3xs"
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-xs font-semibold text-red-655" id="upload-error-lbl">
                  ⚠️ {uploadError}
                </p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadFile(null);
                    setUplName("");
                    setUplFocus("");
                    setUploadError("");
                    setMethod(SubSelectionMethod.NONE);
                  }}
                  disabled={isExtracting}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isExtracting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white font-sans font-bold text-xs rounded-xl shadow-3xs cursor-pointer transition-all disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-indigo-600" />
                      <span>Parsing Document &amp; Building Syllabus...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Document &amp; Generate Syllabus</span>
                      <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {method === SubSelectionMethod.AI && (
          <motion.div
            key="ai-curriculum-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-3xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/60 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-3xs">
                    <Brain size={20} className={isAiGenerating ? "animate-spin" : "animate-pulse"} />
                  </div>
                  <div>
                    <h4 className="font-sans font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                      AI Curriculum Designer
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-none">
                      Generates optimized study structures with Gemini 3.5 Flash
                    </p>
                  </div>
                </div>
                <div className="inline-flex flex-col items-end gap-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                    Syllabus Level
                  </span>
                  <span className="px-2.5 py-1 bg-violet-50 dark:bg-violet-955/40 border border-violet-100 dark:border-violet-900 rounded-full text-violet-800 dark:text-violet-300 text-[10px] font-bold">
                    {curriculumLevel || "General Audience"}
                  </span>
                </div>
              </div>

              {/* Status and Actions Panel */}
              {!isAiGenerating && !aiGeneratedTopics && !aiGenError && (
                <div className="space-y-4 max-w-md mx-auto text-center py-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    Ready to design a comprehensive syllabus for <strong className="text-slate-800 dark:text-slate-100 font-extrabold">{selectedSubject}</strong>. We'll outline 
                    8 to 12 logically sequenced topics tailored perfectly for the <strong className="text-violet-605 dark:text-violet-300 font-bold">{curriculumLevel}</strong> standard, ordered from foundational fundamentals to advanced lessons.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMethod(SubSelectionMethod.NONE)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-605 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Choose Other Method
                    </button>
                    <button
                      type="button"
                      onClick={handleAiTopicsGeneration}
                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>Generate Topics Syllabus</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State with reassurance text */}
              {isAiGenerating && (
                <div className="py-8 text-center space-y-4 max-w-sm mx-auto">
                  <div className="inline-flex p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shadow-3xs animate-bounce">
                    <Loader2 size={18} className="animate-spin text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-800">
                      Assembling Custom Curriculum...
                    </h5>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed text-center">
                      Gemini is researching learning milestones, ordering topics systematically (foundations first), and preparing one-line objective descriptions for <span className="text-indigo-600 font-bold">{selectedSubject}</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {aiGenError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-red-800 font-semibold leading-relaxed">
                    <span>⚠️</span>
                    <div className="space-y-1">
                      <p className="font-extrabold text-red-900">Custom Syllabus Generation Failed</p>
                      <p className="text-[11px] text-red-750 font-medium">{aiGenError}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAiGenError("");
                        setMethod(SubSelectionMethod.NONE);
                      }}
                      className="px-3 py-1.5 border border-red-200 hover:bg-red-100/50 text-red-850 text-[11px] font-bold rounded-lg transition-all"
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      onClick={handleAiTopicsGeneration}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition-all"
                    >
                      Retry Generation
                    </button>
                  </div>
                </div>
              )}

              {/* Success View: Display List of Dynamic Topics */}
              {aiGeneratedTopics && (
                <div className="space-y-6">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[9px] font-extrabold uppercase font-mono tracking-wide text-slate-400 block">
                      Target Curriculum Breakdown
                    </span>
                    <h5 className="font-sans font-extrabold text-sm text-slate-800">
                      We found {aiGeneratedTopics.length} core learning topics for {selectedSubject} matching {curriculumLevel} expectations:
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Review your learning path before confirming. Once finalized, you can start studying them immediately under Subjects.
                    </p>
                  </div>

                  <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 max-h-[300px] overflow-y-auto bg-slate-50/50 shadow-3xs p-1">
                    {aiGeneratedTopics.map((topic, index) => (
                      <div key={index} className="p-3.5 flex items-start gap-3.5 hover:bg-white rounded-lg transition-colors group">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-50 border border-indigo-100/60 font-mono text-[10px] font-extrabold text-indigo-700 shrink-0">
                          {index + 1}
                        </span>
                        <div className="space-y-1 text-left flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h6 className="text-[12px] font-extrabold text-slate-800 tracking-tight truncate group-hover:text-indigo-605 transition-colors">
                              {topic.name}
                            </h6>
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-250 rounded text-slate-600 font-mono text-[9px] font-bold shrink-0">
                              ⏱️ {topic.duration || "20m"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                            {topic.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAiGeneratedTopics(null);
                        setAiGenError("");
                        setMethod(SubSelectionMethod.NONE);
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                    >
                      Choose Other Method
                    </button>
                    
                    <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleAiTopicsGeneration}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        <Sparkles size={11} className="text-indigo-600" />
                        <span>Regenerate Breakdown</span>
                      </button>
                      <button
                        type="button"
                        onClick={confirmAiTopics}
                        className="flex items-center justify-center gap-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        id="btn-confirm-ai-topics"
                      >
                        <span>Looks good, start learning</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
