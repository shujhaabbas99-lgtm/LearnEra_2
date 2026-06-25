import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { 
  Presentation, 
  Plus, 
  Trash2, 
  Calendar, 
  Layers, 
  FileText, 
  Sparkles, 
  Keyboard, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle,
  FileCheck,
  Compass,
  FileUp,
  Sliders,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Grid,
  Monitor,
  Eye,
  BookOpen,
  X,
  Loader
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PresentationItem, PresentationSourceType, SlideItem } from "../types";

const themeConfigs = {
  dark: {
    containerClass: "bg-slate-900 border-slate-950 text-white",
    headerBg: "border-b border-white/5",
    headerText: "text-slate-400",
    slideTitle: "text-white border-l-4 border-indigo-500",
    bulletText: "text-slate-200",
    bulletMarker: "from-indigo-400 to-cyan-400",
    counterBadge: "bg-white/10 text-white border border-white/10",
    footerBg: "border-t border-white/5 bg-slate-950/30",
    btnStyles: "border-white/10 text-white hover:bg-white/10 disabled:opacity-30",
    dotActive: "bg-indigo-500 scale-125 border border-indigo-400",
    dotInactive: "bg-white/20 hover:bg-white/40"
  },
  cream: {
    containerClass: "bg-[#fdfbf7] border-amber-200 text-amber-950",
    headerBg: "border-b border-amber-200/60",
    headerText: "text-amber-800",
    slideTitle: "text-amber-950 border-l-4 border-amber-700",
    bulletText: "text-amber-900/90",
    bulletMarker: "from-amber-700 to-amber-850",
    counterBadge: "bg-amber-100 text-amber-900 border border-amber-200",
    footerBg: "border-t border-amber-200/60 bg-amber-50/50",
    btnStyles: "border-amber-250 text-amber-900 hover:bg-amber-50 disabled:opacity-35",
    dotActive: "bg-amber-800 scale-125 border border-amber-600",
    dotInactive: "bg-amber-200/60 hover:bg-amber-250"
  },
  ocean: {
    containerClass: "bg-sky-950 border-sky-900 text-sky-100",
    headerBg: "border-b border-white/5",
    headerText: "text-sky-300",
    slideTitle: "text-sky-50 border-l-4 border-teal-400",
    bulletText: "text-slate-200",
    bulletMarker: "from-teal-400 to-sky-400",
    counterBadge: "bg-white/10 text-sky-250 border border-white/5",
    footerBg: "border-t border-white/5 bg-sky-900/40",
    btnStyles: "border-white/10 text-sky-100 hover:bg-white/5 disabled:opacity-30",
    dotActive: "bg-teal-400 scale-125 border border-teal-300",
    dotInactive: "bg-white/20 hover:bg-white/40"
  },
  light: {
    containerClass: "bg-white border-slate-200 text-slate-850",
    headerBg: "border-b border-slate-250/60",
    headerText: "text-slate-600",
    slideTitle: "text-slate-900 border-l-4 border-indigo-650",
    bulletText: "text-slate-700",
    bulletMarker: "from-indigo-600 to-indigo-700",
    counterBadge: "bg-slate-200/65 text-slate-800 border border-slate-300",
    footerBg: "border-t border-slate-250/60 bg-white",
    btnStyles: "border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30",
    dotActive: "bg-indigo-650 scale-125 border border-indigo-550",
    dotInactive: "bg-slate-200 hover:bg-slate-300"
  }
};

export interface PresentationsStateViewProps {
  onExit: () => void;
}

export default function PresentationsStateView({ onExit }: PresentationsStateViewProps) {
  // Key state for presentations list (loaded from localStorage)
  const [presentations, setPresentations] = useState<PresentationItem[]>(() => {
    try {
      const saved = localStorage.getItem("lernera_presentations");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    
    // Prepopulate with a mock presentation containing slides to demonstrate layout
    return [
      {
        id: "mock-pres-1",
        title: "Introduction to Quantum Computing Concepts",
        sourceType: "ai_decides",
        sourceContent: "Auto-generated introduction detailing qubits, superposition, entanglement, and quantum gates.",
        slideCount: 4,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3).toISOString(), // 3 days ago
        slides: [
          {
            title: "What is Quantum Computing?",
            bullets: [
              "A new paradigm of computation based on quantum mechanics principles",
              "Uses quantum states instead of binary signals to perform complex operations on data",
              "Historically theorized by Richard Feynman to simulate quantum physics accurately",
              "Capable of solving specific mathematical problems exponentially faster than supercomputers"
            ]
          },
          {
            title: "Classical Bits vs Quantum Qubits",
            bullets: [
              "Classical bits are strictly binary: restricted to being either 0 or 1 at any moment",
              "Qubits can exist in a superposition state, representing both 0 and 1 simultaneously",
              "This superposition expands computational capacity exponentially with every active qubit",
              "Requires specialized control mechanisms (lasers or microwaves) to write and read data"
            ]
          },
          {
            title: "The Mystery of Entanglement",
            bullets: [
              "A unique physics phenomenon where multiple qubits become deeply correlated",
              "The state of one qubit instantaneously determines the state of its entangled partner",
              "Albert Einstein famously described this phenomenon as 'spooky action at a distance'",
              "Enables ultra-secure communication channels and coordinated parallel processing"
            ]
          },
          {
            title: "Practical Quantum Applications",
            bullets: [
              "Cryptographic defense systems: Designing unbreakable encryption keys and auditing codes",
              "Algorithmic optimization: Perfecting complex global logistics, routing, and supply chains",
              "Molecular simulator structures: Fast-tracking vaccine discovery and new safe materials",
              "High-frequency financial simulation: Analyzing market portfolios with extreme precision"
            ]
          }
        ]
      },
      {
        id: "mock-pres-2",
        title: "Modern European History: Post-War Reconstruction",
        sourceType: "description",
        sourceContent: "A deep dive into the Marshall Plan, the formation of the EU, and the division/unification of Berlin.",
        slideCount: 4,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1).toISOString(), // Yesterday
        slides: [
          {
            title: "Post-War Europe (1945)",
            bullets: [
              "Widespread physical destruction, infrastructure collapse, and severe food shortages",
              "Significant decline of traditional European colonial empires due to financial ruin",
              "Shifting geographical boundaries and millions of displaced people seeking home regions",
              "Emergence of the United States and Soviet Union as the two dominant global superpowers"
            ]
          },
          {
            title: "The Marshall Plan",
            bullets: [
              "Officially passed as the European Recovery Program (ERP) active from 1948",
              "Distributed over $13 billion in economic support directly to Western European nations",
              "Explicitly designed to rebuild broken industries, stabilize currencies, and boost trade",
              "Actively served as a political barrier to contain communist expansion in allied sectors"
            ]
          },
          {
            title: "European Economic Integration",
            bullets: [
              "Establishment of the European Coal and Steel Community (ECSC) signed in 1951",
              "Created a shared market to make future conflicts between France and West Germany impossible",
              "Pioneered supranacional political integration beyond simple trade agreements",
              "Laid the structural and economic path for the modern European Union (EU)"
            ]
          },
          {
            title: "The Strategic Division of Berlin",
            bullets: [
              "Berlin division into four distinct military sectors run by Western allies and Soviets",
              "Soviets instituted the Berlin Blockade in 1948 to cut off land access to the city",
              "Western powers sustained Berlin via constant round-the-clock airlift supplies for 11 months",
              "Solidified the physical partition and division lines of the resulting Cold War"
            ]
          }
        ]
      }
    ];
  });

  // Flow State
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<PresentationSourceType>("ai_decides");
  const [description, setDescription] = useState("");
  const [slideCount, setSlideCount] = useState<number>(8); // default to 8
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [lookStyle, setLookStyle] = useState<"visual_minimal" | "balanced" | "info_dense">("balanced");
  const [headingStyle, setHeadingStyle] = useState<"bold_large" | "standard" | "content_first">("standard");
  
  // Document Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Selected Presentation for inspection/slideshow
  const [selectedPresentation, setSelectedPresentation] = useState<PresentationItem | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewerMode, setViewerMode] = useState<"slideshow" | "grid">("slideshow");
  const [slideTheme, setSlideTheme] = useState<"dark" | "cream" | "ocean" | "light">("dark");
  const [layoutCentered, setLayoutCentered] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  const handleDownloadPDF = async () => {
    if (!selectedPresentation) return;
    setIsDownloadingPDF(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4" // 297mm x 210mm
      });

      const slides = selectedPresentation.slides || [];
      
      // Determine the colors to use on PDF based on slideTheme
      let bgColor = "#0f172a"; // default slate-900 (dark)
      let titleColor = "#ffffff";
      let textColor = "#cbd5e1"; // slate-300
      let accentColor = "#6366f1"; // indigo-500
      let dotColor = "#818cf8"; // indigo-400

      if (slideTheme === "cream") {
        bgColor = "#fdfbf7";
        titleColor = "#451a03"; // amber-950
        textColor = "#78350f"; // amber-900
        accentColor = "#b45309"; // amber-700
        dotColor = "#d97706"; // amber-600
      } else if (slideTheme === "ocean") {
        bgColor = "#082f49"; // sky-950
        titleColor = "#f0f9ff"; // sky-50
        textColor = "#cbd5e1"; // slate-200
        accentColor = "#2dd4bf"; // teal-400
        dotColor = "#38bdf8"; // sky-400
      } else if (slideTheme === "light") {
        bgColor = "#ffffff";
        titleColor = "#0f172a"; // slate-900
        textColor = "#334155"; // slate-700
        accentColor = "#4f46e5"; // indigo-600
        dotColor = "#6366f1"; // indigo-500
      }

      // Iterate slides and render each page
      slides.forEach((slide, index) => {
        if (index > 0) {
          doc.addPage("a4", "landscape");
        }

        const pageWidth = doc.internal.pageSize.getWidth(); // 297
        const pageHeight = doc.internal.pageSize.getHeight(); // 210

        // 1. Draw Page Background
        doc.setFillColor(bgColor);
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        // 2. Draw Decorative subtle background visual accents
        doc.setFillColor(accentColor);
        doc.rect(0, 0, pageWidth, 4, "F"); // top accent thin line

        // 3. Draw Header/Footer context information
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(dotColor);
        // Header: Presentation title truncated if long
        const headerTitle = selectedPresentation.title.toUpperCase();
        const truncatedHeader = headerTitle.length > 55 ? headerTitle.substring(0, 55) + "..." : headerTitle;
        doc.text(truncatedHeader, 15, 14);

        // Footer: Page / Slide Index counter (e.g. "3 / 10")
        doc.setFontSize(10);
        doc.setTextColor(dotColor);
        const counterText = `${index + 1} / ${slides.length}`;
        doc.text(counterText, pageWidth - 15, pageHeight - 12, { align: "right" });

        // Branding or study guide badge
        doc.setFontSize(8);
        doc.setTextColor(textColor);
        doc.text("L E R N E R A   S T U D Y   D E C K", 15, pageHeight - 12);

        // 4. Slide Title
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(titleColor);

        // Let's support centering if layoutCentered is active
        const titleText = slide.title || "Untitled Slide";
        const titleY = 38;

        if (layoutCentered) {
          // Draw centered title
          doc.text(titleText, pageWidth / 2, titleY, { align: "center", maxWidth: pageWidth - 40 });
          
          // Draw a sub-line below the title to make it beautiful
          doc.setFillColor(accentColor);
          const textWidth = Math.min(doc.getTextWidth(titleText), pageWidth - 40);
          doc.rect((pageWidth - textWidth) / 2, titleY + 3, textWidth, 1.2, "F");
        } else {
          // Draw left title with accent vertical line indicator
          doc.setFillColor(accentColor);
          doc.rect(15, titleY - 7, 3, 9, "F"); // vertical indicator block
          doc.text(titleText, 22, titleY, { maxWidth: pageWidth - 40 });
        }

        // 5. Slide Bullet items - Wrapped beautifully
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(13);
        doc.setTextColor(textColor);

        let currentY = 62;
        const bullets = slide.bullets || [];
        const contentMaxWidth = pageWidth - 50; // let margins be 25mm left and right

        bullets.forEach((bullet, bIdx) => {
          // Split text to fit within page bounds
          const wrappedLines = doc.splitTextToSize(bullet, contentMaxWidth);
          
          wrappedLines.forEach((line: string, lineIdx: number) => {
            // Guard against overflow
            if (currentY > pageHeight - 25) {
              return; // skip or clamp if it exceeds landscape page bounds
            }

            // If center format, align center
            if (layoutCentered) {
              if (lineIdx === 0) {
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(accentColor);
                doc.text(`[ DETAIL ${bIdx + 1} ]`, pageWidth / 2, currentY, { align: "center" });
                currentY += 5;
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(12);
                doc.setTextColor(textColor);
              }
              doc.text(line, pageWidth / 2, currentY, { align: "center" });
            } else {
              if (lineIdx === 0) {
                // Draw matching bullet list accent dot
                doc.setFillColor(dotColor);
                doc.circle(20, currentY - 1.2, 1.3, "FD"); // nice small circle
              }
              doc.text(line, 26, currentY);
            }
            currentY += 7.5; // line height
          });

          currentY += 4.5; // space between different bullet paragraphs
        });

      });

      // Save and download representation
      const sanitizedTitle = selectedPresentation.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      doc.save(`${sanitizedTitle || "presentation"}.pdf`);
      
      setSuccessToast("PDF Presentation Deck successfully exported!");
    } catch (error: any) {
      console.error("PDF generation error: ", error);
      setUploadError("PDF design failed during export compiling. Please retry.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };


  // Set up keyboard listeners for slide navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedPresentation || viewerMode !== "slideshow") return;
      const slidesLength = selectedPresentation.slides?.length || selectedPresentation.slideCount;

      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(prev + 1, slidesLength - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPresentation, viewerMode]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    const slidesLength = selectedPresentation?.slides?.length || selectedPresentation?.slideCount || 0;

    // Swipe Threshold 50px
    if (diff > 50) {
      // Swiped Left -> Next Slide
      setCurrentSlideIndex((prev) => Math.min(prev + 1, slidesLength - 1));
    } else if (diff < -50) {
      // Swiped Right -> Prev Slide
      setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
    }
    touchStartRef.current = null;
  };

  // Sync list changes to localStorage
  useEffect(() => {
    localStorage.setItem("lernera_presentations", JSON.stringify(presentations));
  }, [presentations]);

  // Toast auto-clear
  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [successToast]);

  // Handle deletion
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this presentation?")) {
      const updated = presentations.filter(p => p.id !== id);
      setPresentations(updated);
      if (selectedPresentation?.id === id) {
        setSelectedPresentation(null);
      }
      setSuccessToast("Presentation deleted successfully.");
    }
  };

  // PDF Text extraction logic (reused from TopicSourceSelectionStateView style)
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
                script.onerror = () => rej(new Error("Unable to load PDF reader module. Ensure internet connection."));
                document.head.appendChild(script);
              });
            }
            
            const pdfjsLib = (window as any).pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
            
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            let extracted = "";
            const maxPages = Math.min(pdf.numPages, 30);
            
            for (let i = 1; i <= maxPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(" ");
              extracted += pageText + "\n";
            }
            
            if (!extracted.trim()) {
              reject(new Error("This PDF seems to contain scanned images rather than highlightable text. Please use plain text description."));
            } else {
              resolve(extracted);
            }
          } catch (err: any) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Decryption error parsing file upload."));
        reader.readAsArrayBuffer(file);
      });
    } else {
      // Plain text, markdown, etc.
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = () => reject(new Error("Failed reading the text file."));
        reader.readAsText(file);
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const processUploadedFile = async (file: File) => {
    setUploadFile(file);
    setUploadName(file.name);
    setIsExtracting(true);
    setUploadError("");
    setExtractedText("");

    try {
      const parsedText = await extractTextContent(file);
      if (!parsedText || parsedText.trim().length === 0) {
        throw new Error("Syllabus reading failed: document has no extractable text content.");
      }
      setExtractedText(parsedText);
    } catch (err: any) {
      setUploadError(err.message || "Decoding error when parsing this document.");
      setUploadFile(null);
      setUploadName("");
    } finally {
      setIsExtracting(false);
    }
  };

  // Drag and drop events
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setUploadError("");
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processUploadedFile(file);
    }
  };

  // Click handler to open hidden file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleNextToStep2 = () => {
    if (!title.trim()) {
      setUploadError("Please provide a representative presentation title or topic.");
      return;
    }

    if (sourceType === "description" && !description.trim()) {
      setUploadError("Please describe the slide structure content or scope you require.");
      return;
    }

    if (sourceType === "document" && !extractedText.trim()) {
      setUploadError("Please upload a clean document first to pull content slides.");
      return;
    }

    setUploadError("");
    setFormStep(2);
  };

  // Form validation & Real API Generation Flow!
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formStep === 1) {
      handleNextToStep2();
      return;
    }
    
    if (!title.trim()) {
      setUploadError("Please provide a representative presentation title or topic.");
      return;
    }

    let sourceContent = "";
    if (sourceType === "description") {
      if (!description.trim()) {
        setUploadError("Please describe the slide structure content or scope you require.");
        return;
      }
      sourceContent = description.trim();
    } else if (sourceType === "document") {
      if (!extractedText.trim()) {
        setUploadError("Please upload a clean document first to pull content slides.");
        return;
      }
      sourceContent = extractedText.trim();
    } else {
      sourceContent = `Direct AI Presentation structure for: ${title.trim()}`;
    }

    setIsGenerating(true);
    setUploadError("");

    try {
      const res = await fetch("/api/generate-presentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title.trim(),
          sourceType,
          sourceContent,
          slideCount,
          lookStyle,
          headingStyle
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const responseData = await res.json();
      const generatedSlides: SlideItem[] = responseData.slides || [];

      if (generatedSlides.length === 0) {
        throw new Error("No slides returned. The model configuration output was empty.");
      }

      // Format complete details and persist to local database layer
      const newPresentation: PresentationItem = {
        id: "pres-" + Date.now().toString(36),
        title: title.trim(),
        sourceType,
        sourceContent,
        fileName: sourceType === "document" ? uploadName : undefined,
        slideCount: generatedSlides.length,
        createdAt: new Date().toISOString(),
        slides: generatedSlides,
        lookStyle,
        headingStyle
      };

      setPresentations([newPresentation, ...presentations]);
      
      // Clean up forms
      setTitle("");
      setSourceType("ai_decides");
      setDescription("");
      setSlideCount(8);
      setUploadFile(null);
      setUploadName("");
      setExtractedText("");
      setFormStep(1);
      setLookStyle("balanced");
      setHeadingStyle("standard");
      setIsCreating(false);

      // Open new presentation immediately in viewer
      setSelectedPresentation(newPresentation);
      setCurrentSlideIndex(0);
      setViewerMode("slideshow");

      setSuccessToast(`"${newPresentation.title}" successfully designed & created!`);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Network failure or API error generating presentation slide contents.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper date formatting
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (_) {
      return "Recently";
    }
  };

  return (
    <div className="w-full text-slate-850 font-sans min-h-[500px]" id="presentations-state-view">
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-12 right-12 md:left-auto md:right-12 bg-emerald-600 text-white rounded-2xl p-4 shadow-xl flex items-center gap-3 z-50 text-xs font-bold leading-normal md:max-w-md border border-emerald-500"
            id="presentation-success-toast"
          >
            <CheckCircle size={18} className="shrink-0 text-white animate-bounce" />
            <span className="flex-1">{successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-100 hover:text-white font-extrabold focus:outline-none text-[10px]">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polish Absolute Loader Overlay during Generation */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-6 text-center"
            id="presentation-loading-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white max-w-md w-full rounded-2xl border border-slate-200/50 p-8 shadow-2xl flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin flex items-center justify-center"></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-600 pl-0.5">
                  <Presentation size={24} className="animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-black tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                  Designing Modern Decks
                </span>
                <h3 className="font-black text-slate-950 text-md sm:text-lg tracking-tight">
                  AI Crafting Selected Topic
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Structuring optimal outline progressions, checking source metrics, and compiling slides formatting into clean, concise notes. Please wait...
                </p>
              </div>

              {/* Dynamic educational suggestion prompt */}
              <div className="w-full bg-slate-50 border border-slate-150 p-4 rounded-xl text-left space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Pro-Tip
                </span>
                <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                  We verify structure outputs for readability. Once complete, you will be directed straight to the slide presentation deck viewer tool!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Active Inspection Slider Viewer when selected */}
        {selectedPresentation ? (
          <div className="space-y-6">
            
            {/* Slide Header tools row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedPresentation(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all focus:outline-none"
                  id="btn-back-to-decks-list"
                >
                  <ArrowLeft size={14} className="stroke-[2.5]" />
                  <span>Return to presentations list</span>
                </button>
                <h1 className="text-md sm:text-lg font-black text-slate-900 tracking-tight leading-normal max-w-2xl">
                  {selectedPresentation.title}
                </h1>
                <p className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                  <span>Created: {formatDate(selectedPresentation.createdAt)}</span>
                  <span>•</span>
                  <span className="capitalize">Source: {selectedPresentation.sourceType.replace("_", " ")}</span>
                  {selectedPresentation.fileName && (
                    <>
                      <span>•</span>
                      <span>File: {selectedPresentation.fileName}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Action buttons (viewer mode & PDF export) */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
                {/* Toggle slideshow mode/grid layout */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewerMode("slideshow")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                      viewerMode === "slideshow"
                        ? "bg-white text-indigo-700 shadow-3xs border border-indigo-100"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Slideshow View"
                  >
                    <Monitor size={14} />
                    <span>Slideshow</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewerMode("grid");
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                      viewerMode === "grid"
                        ? "bg-white text-indigo-700 shadow-3xs border border-indigo-100"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Grid View"
                  >
                    <Grid size={14} />
                    <span>Grid Outline</span>
                  </button>
                </div>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-400 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all border border-indigo-500 hover:border-indigo-600 active:scale-95 disabled:pointer-events-none"
                  title="Download presentation as PDF"
                  id="btn-download-pdf-deck"
                >
                  {isDownloadingPDF ? (
                    <Loader size={14} className="animate-spin" />
                  ) : (
                    <FileUp size={14} className="stroke-[2.5]" />
                  )}
                  <span>PDF Export</span>
                </button>
              </div>
            </div>

            {/* Slideshow view layout */}
            {viewerMode === "slideshow" ? (
              <div className="space-y-6">
                
                {/* Visual Settings control panel */}
                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">
                      Presentation Theme:
                    </span>
                    <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
                      {(["dark", "cream", "ocean", "light"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSlideTheme(t)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg capitalize transition-all cursor-pointer ${
                            slideTheme === t
                              ? "bg-slate-900 text-white shadow-3xs"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">
                      Text Layout:
                    </span>
                    <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
                      <button
                        onClick={() => setLayoutCentered(false)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          !layoutCentered
                            ? "bg-indigo-600 text-white shadow-3xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Left-Aligned
                      </button>
                      <button
                        onClick={() => setLayoutCentered(true)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          layoutCentered
                            ? "bg-indigo-600 text-white shadow-3xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Centered Format
                      </button>
                    </div>
                  </div>
                </div>

                {/* 16:9 Structured Canvas Display Box */}
                <div 
                  className={`w-full aspect-[16/9] min-h-[260px] sm:min-h-[420px] rounded-2xl relative shadow-lg flex flex-col justify-between overflow-hidden border transition-colors duration-250 ${themeConfigs[slideTheme].containerClass}`}
                  id="slideshow-frame-canvas"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  
                  {/* Absolute subtle background decorative circle depending on selectedTheme */}
                  {slideTheme === "dark" && (
                    <>
                      <div className="absolute top-[-30%] right-[-10%] w-[60%] aspect-square rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
                      <div className="absolute bottom-[-15%] left-[-5%] w-[45%] aspect-square rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
                    </>
                  )}
                  {slideTheme === "ocean" && (
                    <>
                      <div className="absolute top-[-30%] right-[-10%] w-[60%] aspect-square rounded-full bg-teal-500/8 blur-[120px] pointer-events-none" />
                      <div className="absolute bottom-[-15%] left-[-5%] w-[45%] aspect-square rounded-full bg-sky-500/8 blur-[100px] pointer-events-none" />
                    </>
                  )}
                  {slideTheme === "cream" && (
                    <>
                      <div className="absolute top-[-30%] right-[-10%] w-[60%] aspect-square rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
                      <div className="absolute bottom-[-15%] left-[-5%] w-[45%] aspect-square rounded-full bg-orange-300/5 blur-[100px] pointer-events-none" />
                    </>
                  )}
                  {slideTheme === "light" && (
                    <>
                      <div className="absolute top-[-30%] right-[-10%] w-[60%] aspect-square rounded-full bg-indigo-200/10 blur-[120px] pointer-events-none" />
                      <div className="absolute bottom-[-15%] left-[-5%] w-[45%] aspect-square rounded-full bg-blue-100/10 blur-[100px] pointer-events-none" />
                    </>
                  )}

                  {/* Canvas Header */}
                  <div className={`p-4 sm:p-6 flex items-center justify-between z-10 ${themeConfigs[slideTheme].headerBg}`}>
                    <div className="flex items-center gap-2">
                      <Presentation size={18} className="text-indigo-400 stroke-[2]" />
                      <span className={`text-[10px] uppercase tracking-wider font-mono font-black max-w-[200px] sm:max-w-xs truncate ${themeConfigs[slideTheme].headerText}`}>
                        {selectedPresentation.title}
                      </span>
                    </div>
                    <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${themeConfigs[slideTheme].counterBadge}`}>
                      {currentSlideIndex + 1} / {selectedPresentation.slides?.length || selectedPresentation.slideCount}
                    </span>
                  </div>

                  {/* Slide Content Space with Animation transitions */}
                  {(() => {
                    const lookStyleUsed = selectedPresentation.lookStyle || "balanced";
                    const containerPaddingClass = 
                      lookStyleUsed === "visual_minimal" 
                        ? "p-8 sm:p-20 py-12 sm:py-20" 
                        : lookStyleUsed === "info_dense" 
                          ? "p-4 sm:p-8 py-4 sm:py-6" 
                          : "p-6 sm:p-12";
                          
                    return (
                      <div className={`flex-1 ${containerPaddingClass} flex flex-col justify-center max-w-4xl mx-auto w-full z-10 overflow-y-auto`}>
                        {selectedPresentation.slides && selectedPresentation.slides[currentSlideIndex] ? (() => {
                          const headingStyleUsed = selectedPresentation.headingStyle || "standard";

                          const titleSizesClass = 
                            headingStyleUsed === "bold_large" 
                              ? "text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight" 
                              : headingStyleUsed === "content_first" 
                                ? "text-sm sm:text-xl font-bold opacity-75" 
                                : "text-xl sm:text-3xl font-extrabold";

                          const ulSpacingClass = 
                            lookStyleUsed === "visual_minimal" 
                              ? "space-y-6 sm:space-y-7 pt-4" 
                              : lookStyleUsed === "info_dense" 
                                ? "space-y-1.5 pt-0.5" 
                                : "space-y-4 pt-2";

                          const liTextSizesClass = 
                            lookStyleUsed === "visual_minimal" 
                              ? "text-sm sm:text-lg font-medium tracking-wide" 
                              : lookStyleUsed === "info_dense" 
                                ? "text-[11px] sm:text-[13px] leading-normal" 
                                : "text-xs sm:text-base";

                          return (
                            <motion.div
                              key={currentSlideIndex}
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.22 }}
                              className={`space-y-6 sm:space-y-8 ${layoutCentered ? "text-center items-center flex flex-col" : "text-left"}`}
                            >
                              <h2 className={`${titleSizesClass} tracking-tight leading-snug pl-3 ${themeConfigs[slideTheme].slideTitle} ${layoutCentered ? "border-l-0 pl-0 border-b-2 pb-2 inline-block border-indigo-500" : ""}`}>
                                {selectedPresentation.slides[currentSlideIndex].title}
                              </h2>

                              <ul className={`${ulSpacingClass} w-full max-w-2xl ${layoutCentered ? "flex flex-col items-center justify-center text-center" : "text-left"}`}>
                                {selectedPresentation.slides[currentSlideIndex].bullets.map((bullet, idx) => (
                                  <motion.li
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    key={idx}
                                    className={`flex gap-3 ${liTextSizesClass} leading-relaxed ${themeConfigs[slideTheme].bulletText} ${layoutCentered ? "flex-col items-center justify-center text-center" : "items-start text-left"}`}
                                  >
                                    {!layoutCentered && lookStyleUsed !== "visual_minimal" && (
                                      <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${themeConfigs[slideTheme].bulletMarker} mt-2 shrink-0`} />
                                    )}
                                    {layoutCentered && (
                                      <span className="text-xs font-black font-mono tracking-widest text-indigo-500 uppercase">
                                        Detail {idx + 1}
                                      </span>
                                    )}
                                    <span className={`${layoutCentered ? "font-medium text-center" : "flex-1"}`}>
                                      {bullet}
                                    </span>
                                  </motion.li>
                                ))}
                              </ul>
                            </motion.div>
                          );
                        })() : (
                          <div className="text-center py-8 text-xs text-slate-400">
                            Error displaying slide content data layers.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Canvas Footer Controls */}
                  <div className={`p-4 sm:p-6 z-10 flex items-center justify-between ${themeConfigs[slideTheme].footerBg}`}>
                    <button
                      disabled={currentSlideIndex === 0}
                      onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer shrink-0 flex items-center gap-1.5 select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${themeConfigs[slideTheme].btnStyles}`}
                      id="btn-slide-prev"
                    >
                      <ChevronLeft size={16} />
                      <span>Prev Slide</span>
                    </button>

                    {/* Dot indicators */}
                    <div className="hidden sm:flex items-center gap-2">
                      {Array.from({ length: selectedPresentation.slides?.length || selectedPresentation.slideCount }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`w-3 h-3 rounded-full transition-all focus:outline-none cursor-pointer ${
                            idx === currentSlideIndex 
                              ? themeConfigs[slideTheme].dotActive
                              : themeConfigs[slideTheme].dotInactive
                          }`}
                          title={`Select Slide ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      disabled={currentSlideIndex === (selectedPresentation.slides?.length || selectedPresentation.slideCount) - 1}
                      onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer shrink-0 flex items-center gap-1.5 select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${themeConfigs[slideTheme].btnStyles}`}
                      id="btn-slide-next"
                    >
                      <span>Next Slide</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Keyboard & gesture guide list */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex flex-col md:flex-row items-center gap-4 text-xs text-slate-500 font-mono justify-between">
                  <div className="flex items-center gap-2.5">
                    <Keyboard size={15} className="stroke-[2] text-slate-400 shrink-0" />
                    <span>Use keyboard <kbd className="bg-slate-200 px-1 py-0.5 rounded border text-[10px]">Arrow Keys</kbd> or <kbd className="bg-slate-200 px-1 py-0.5 rounded border text-[10px]">Spacebar</kbd> for quick navigation.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Swipe left or right on mobile to change slides!</span>
                  </div>
                </div>

              </div>
            ) : (
              /* Grid representation of all slides at once */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPresentation.slides?.map((slide, index) => (
                    <div 
                      key={index} 
                      onClick={() => {
                        setCurrentSlideIndex(index);
                        setViewerMode("slideshow");
                      }}
                      className={`border p-5 rounded-2xl cursor-pointer transition-all duration-200 text-left relative flex flex-col justify-between h-[180px] bg-white group ${
                        index === currentSlideIndex 
                          ? "border-indigo-500 ring-1 ring-indigo-100 bg-indigo-50/5" 
                          : "border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            Slide {index + 1}
                          </span>
                          <span className="text-[9px] text-slate-400 group-hover:block hidden font-medium">Click to slide edit view →</span>
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-950 tracking-tight leading-snug line-clamp-1">
                          {slide.title}
                        </h3>
                        <ul className="space-y-1.5 pl-1.5">
                          {slide.bullets.slice(0, 3).map((bullet, idx) => (
                            <li key={idx} className="text-[10px] text-slate-500 leading-tight flex items-start gap-2.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0" />
                              <span className="flex-1 truncate">{bullet}</span>
                            </li>
                          ))}
                          {slide.bullets.length > 3 && (
                            <span className="text-[8px] font-mono text-slate-400 pl-3">
                              +{slide.bullets.length - 3} more bullet details
                            </span>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Deck dashboard overview or Form creations view */
          <div className="space-y-6">
            
            {/* Navigation back and header layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-150">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 mb-1 font-bold">
                  <Presentation size={20} className="stroke-[2.5]" />
                  <span className="text-[10px] uppercase tracking-wider font-mono">Presentations Module</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Presentation Master Deck
                </h1>
                <p className="text-xs text-slate-400 mt-1 leading-normal max-w-lg">
                  Manage existing files and design slides from descriptions or reference textbooks.
                </p>
              </div>
              <button
                onClick={onExit}
                className="sm:self-center flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold bg-slate-100 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer shadow-3xs"
                id="btn-pres-exit-syllabus"
              >
                <ArrowLeft size={14} className="stroke-[2.5]" />
                <span>Back to Desk</span>
              </button>
            </div>

            {/* Dashboard and Flow Switching states */}
            {!isCreating ? (
              <div className="space-y-6">
                
                {/* Header info bar */}
                <div className="p-4 bg-indigo-50 border border-indigo-100/60 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white text-indigo-600 rounded-xl border border-indigo-155 shadow-3xs shrink-0">
                      <Compass size={20} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-indigo-900">Custom Standalone Utility</h3>
                      <p className="text-[10px] text-indigo-700 leading-normal max-w-md mt-0.5">
                        This section functions separate from user progress metrics. Upload text or summarize any topic on demand without touching active quiz history records.
                      </p>
                    </div>
                  </div>
                  
                  {/* Highlight Call-to-action button */}
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 hover:from-indigo-700 hover:to-indigo-800 transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    id="btn-pres-create-new-trigger"
                  >
                    <Plus size={16} className="stroke-[2.5]" />
                    <span>Create New Presentation</span>
                  </button>
                </div>

                {/* Existing Presentations list section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest pl-1 font-mono">
                      Captured Decks ({presentations.length})
                    </h2>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      Active List
                    </span>
                  </div>

                  {presentations.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
                      <Presentation size={36} className="text-slate-300 stroke-[1.5]" />
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-slate-700">No Custom Presentations Captured</h3>
                        <p className="text-[10px] text-slate-400 max-w-sm leading-relaxed">
                          Capture dynamic structures easily. Toggle the custom action panel above to design a presentation format instantly.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCreating(true)}
                        className="mt-1 px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl font-bold text-xs transition-all border border-slate-200 hover:border-indigo-100"
                      >
                        Generate Initial Setup
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {presentations.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPresentation(p);
                            setCurrentSlideIndex(0);
                            setViewerMode("slideshow");
                          }}
                          className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all duration-250 p-5 rounded-2xl relative flex flex-col justify-between gap-4 cursor-pointer group"
                          id={`pres-card-${p.id}`}
                        >
                          {/* Delete icon */}
                          <button
                            onClick={(e) => handleDelete(p.id, e)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg border border-transparent text-slate-350 hover:text-rose-650 hover:bg-rose-50 hover:border-rose-100 cursor-pointer transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                            title="Delete presentation"
                            id={`btn-del-pres-${p.id}`}
                          >
                            <Trash2 size={13} />
                          </button>

                          {/* Info layout */}
                          <div className="space-y-3 pr-4 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase font-mono ${
                                p.sourceType === "ai_decides" 
                                  ? "bg-purple-50 border-purple-100 text-purple-700"
                                  : p.sourceType === "document"
                                    ? "bg-cyan-50 border-cyan-100 text-cyan-700"
                                    : "bg-blue-50 border-blue-100 text-blue-700"
                              }`}>
                                {p.sourceType === "ai_decides" ? "AI Decides" : p.sourceType === "document" ? "Reference PDF" : "User Prompted"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-semibold">
                                {p.slides?.length || p.slideCount} Slides
                              </span>
                            </div>

                            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-650 tracking-tight leading-snug">
                              {p.title}
                            </h3>

                            {/* Slide representation miniatures visually matching count */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {Array.from({ length: Math.min(p.slides?.length || p.slideCount, 12) }).map((_, idx) => (
                                <div 
                                  key={idx} 
                                  className={`w-4 h-3 rounded-xs border transition-colors ${
                                    idx === 0 
                                      ? "bg-indigo-650 border-indigo-600" 
                                      : "bg-slate-50 border-slate-200 group-hover:bg-slate-100"
                                  }`} 
                                />
                              ))}
                              {(p.slides?.length || p.slideCount) > 12 && (
                                <span className="text-[8px] font-mono font-bold text-slate-400 pl-1">
                                  +{(p.slides?.length || p.slideCount) - 12} more
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-500 leading-normal line-clamp-2 italic bg-slate-50 border border-slate-100/60 p-2 rounded-xl group-hover:bg-slate-100/50">
                              {p.sourceContent.length > 150 ? `${p.sourceContent.substring(0, 150)}...` : p.sourceContent}
                            </p>
                          </div>

                          {/* Footer time details */}
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono border-t border-slate-100 pt-3">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {formatDate(p.createdAt)}
                            </span>
                            <span className="text-[10px] text-indigo-500 group-hover:translate-x-1 transition-transform block font-bold flex items-center gap-1">
                              <span>Open Slides</span>
                              <ArrowRight size={11} className="stroke-[2.5]" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* Creating Flow Form State */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 shadow-sm rounded-2xl text-left"
                id="pres-creation-form-panel"
              >
                {/* Header section in form */}
                <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg">
                      <Sparkles size={14} className="stroke-[2.5]" />
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">
                      Design New Presentation Format
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setUploadError("");
                    }}
                    className="p-1 px-2.5 text-[10px] font-black tracking-wider text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
                    id="btn-pres-close-form"
                  >
                    Cancel
                  </button>
                </div>

                {/* Error banner */}
                {uploadError && (
                  <div className="m-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span className="flex-1">{uploadError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitNew} className="p-5 space-y-6">
                  {formStep === 1 ? (
                    <>
                      {/* Step 1: Presentation title/topic */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-0.5">
                      1. Presentation Title or Primary Topic
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          setUploadError("");
                        }}
                        placeholder="e.g. Introduction to Renewable Energy Sources"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-850 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        id="input-pres-title"
                      />
                      <div className="absolute right-3.5 top-3.5 text-[9px] font-mono text-slate-350">
                        {title.length}/100
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-0.5 font-medium">
                      Keep it clear and focused so the design elements align properly.
                    </p>
                  </div>

                  {/* Step 2: Source selection (Describe, PDF, AI decides) */}
                  <div className="space-y-3">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-0.5">
                      2. Select Material Source
                    </label>
                    
                    {/* Visual Cards selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      {/* Option A: Describe scope */}
                      <button
                        type="button"
                        onClick={() => {
                          setSourceType("description");
                          setUploadError("");
                        }}
                        className={`p-4 text-left border rounded-xl flex flex-col gap-2.5 cursor-pointer hover:border-indigo-400 hover:bg-slate-50/50 transition-all ${
                          sourceType === "description"
                            ? "border-indigo-500 bg-indigo-50/30 text-indigo-900"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                        id="btn-choice-desc"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="p-1.5 rounded-lg bg-indigo-100/50 text-indigo-700">
                            <Keyboard size={15} />
                          </div>
                          {sourceType === "description" && (
                            <span className="bg-indigo-600 text-white rounded-full p-0.5">
                              <Check size={8} className="stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs">Describe what you want</h4>
                          <p className="text-[9px] text-slate-400 leading-relaxed mt-0.5">
                            Type custom text parameters or custom flow descriptions.
                          </p>
                        </div>
                      </button>

                      {/* Option B: Reference Document */}
                      <button
                        type="button"
                        onClick={() => {
                          setSourceType("document");
                          setUploadError("");
                        }}
                        className={`p-4 text-left border rounded-xl flex flex-col gap-2.5 cursor-pointer hover:border-indigo-400 hover:bg-slate-50/50 transition-all ${
                          sourceType === "document"
                            ? "border-indigo-500 bg-indigo-50/30 text-indigo-900"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                        id="btn-choice-doc"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="p-1.5 rounded-lg bg-cyan-100/50 text-cyan-700">
                            <FileText size={15} />
                          </div>
                          {sourceType === "document" && (
                            <span className="bg-indigo-600 text-white rounded-full p-0.5">
                              <Check size={8} className="stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs">Use reference document</h4>
                          <p className="text-[9px] text-slate-400 leading-relaxed mt-0.5">
                            Upload plain text files or PDF study syllabus data.
                          </p>
                        </div>
                      </button>

                      {/* Option C: Let AI Decide */}
                      <button
                        type="button"
                        onClick={() => {
                          setSourceType("ai_decides");
                          setUploadError("");
                        }}
                        className={`p-4 text-left border rounded-xl flex flex-col gap-2.5 cursor-pointer hover:border-indigo-400 hover:bg-slate-50/50 transition-all ${
                          sourceType === "ai_decides"
                            ? "border-indigo-500 bg-indigo-50/30 text-indigo-900"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                        id="btn-choice-aidecide"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="p-1.5 rounded-lg bg-purple-100/50 text-purple-700">
                            <Sparkles size={15} />
                          </div>
                          {sourceType === "ai_decides" && (
                            <span className="bg-indigo-600 text-white rounded-full p-0.5">
                              <Check size={8} className="stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs">Let AI decide</h4>
                          <p className="text-[9px] text-slate-400 leading-relaxed mt-0.5">
                            AI organizes content matching solely your title topic details.
                          </p>
                        </div>
                      </button>

                    </div>

                    {/* Sub-panels for selected option */}
                    <div className="mt-3">
                      
                      {sourceType === "description" && (
                        <div className="space-y-1.5 p-4 border border-indigo-100 rounded-xl bg-slate-50/50">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                            Describe Slide Outline Contents
                          </label>
                          <textarea
                            required
                            value={description}
                            onChange={(e) => {
                              setDescription(e.target.value);
                              setUploadError("");
                            }}
                            placeholder="Please detail slides structure. (e.g. Slide 1: Welcome title; Slide 2: Main thesis; Slide 3: Challenges; Slide 4: Strategic solution...)"
                            rows={4}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-850 placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            id="textarea-pres-description"
                          />
                        </div>
                      )}

                      {sourceType === "document" && (
                        <div className="space-y-3 p-4 border border-cyan-150 rounded-xl bg-slate-50/50">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                            Upload Reference Reading Material
                          </label>
                          
                          {/* Drag Area Box */}
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={triggerFileInput}
                            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                              isDragOver 
                                ? "border-indigo-500 bg-indigo-50/40" 
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                            id="pres-file-dropzone"
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".pdf,.txt,.md,.json"
                              className="hidden"
                            />
                            
                            {isExtracting ? (
                              <div className="space-y-2 py-2">
                                <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                                <p className="text-[10px] font-bold text-indigo-600 font-sans">
                                  Reading text structure layout from PDF layers...
                                </p>
                              </div>
                            ) : uploadFile ? (
                              <div className="space-y-2 py-1 flex flex-col items-center">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                  <FileCheck size={20} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800 break-all p-1">
                                    {uploadName}
                                  </p>
                                  <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-0.5 rounded-full font-mono font-bold">
                                    {extractedText.trim().split(/\s+/).length} Words Read Successfully
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400 hover:underline hover:text-indigo-600 block pt-1 font-bold">
                                  Touch or drag elsewhere to change reading source file.
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2 py-1">
                                <div className="mx-auto w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400">
                                  <FileUp size={20} />
                                </div>
                                <p className="text-xs font-bold text-slate-700">
                                  Choose textbook or study material document
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  Drag & Drop PDF or Plain Text file here, or <span className="text-indigo-600 font-bold hover:underline">browse files</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {sourceType === "ai_decides" && (
                        <div className="p-4 border border-purple-100 rounded-xl bg-purple-50/30 flex items-start gap-3">
                          <Sparkles className="text-purple-600 mt-0.5 shrink-0" size={15} />
                          <div className="space-y-1">
                            <h4 className="text-xs font-extrabold text-purple-900">Let AI design layout</h4>
                            <p className="text-[10px] text-purple-700 leading-relaxed">
                              AI will search presentation structures matching the title dynamically. Perfect for exploring quick brainstorming and visual deck flows.
                            </p>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Step 3: Slide count input choices */}
                  <div className="space-y-3.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-0.5">
                        3. Desired Slides Deck Count
                      </label>
                      <span className="text-xs font-black text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                        {slideCount} Slides total
                      </span>
                    </div>

                    {/* Preset presets selection */}
                    <div className="flex gap-2.5">
                      {[4, 6, 8, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSlideCount(num)}
                          className={`flex-1 py-2 text-xs font-black rounded-xl border cursor-pointer transition-all ${
                            slideCount === num
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-3xs"
                              : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-slate-50/30"
                          }`}
                        >
                          {num} {num === 4 ? "Brief (4)" : num === 6 ? "Medium (6)" : num === 8 ? "Standard (8)" : "Deep (10)"}
                        </button>
                      ))}
                    </div>

                    {/* Slider input custom adjustments */}
                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <Sliders size={14} className="text-slate-400 shrink-0" />
                      <input
                        type="range"
                        min={3}
                        max={15}
                        value={slideCount}
                        onChange={(e) => setSlideCount(parseInt(e.target.value, 10))}
                        className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-400 select-none">
                        Min (3) - Max (15)
                      </span>
                    </div>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setUploadError("");
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleNextToStep2}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                      id="btn-pres-next-step"
                    >
                      <span>Choose Style Preferences</span>
                      <ArrowRight size={14} className="stroke-[2.5]" />
                    </button>
                  </div>

                    </>
                  ) : (
                    <>
                      {/* Step 2: Presentation Visual Style Preferences */}
                      <div className="space-y-6 animate-slide-up font-sans text-left">
                        <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 text-indigo-950 rounded-xl space-y-1">
                          <h4 className="text-xs font-bold text-indigo-900">Custom Slide Preferences</h4>
                          <p className="text-[10px] text-indigo-800 leading-normal">
                            Tailor the aesthetic design, content layout, and typographic pairing of your slides. These rules explicitly instruct the AI core visual compiler.
                          </p>
                        </div>

                        {/* Slide display look layout */}
                        <div className="space-y-3">
                          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-0.5">
                            How should the slides look?
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            
                            {/* Option A: Visual & Minimal */}
                            <button
                              type="button"
                              onClick={() => setLookStyle("visual_minimal")}
                              className={`p-4 text-left border rounded-xl flex flex-col gap-3.5 cursor-pointer hover:border-indigo-400 hover:bg-slate-50/20 transition-all ${
                                lookStyle === "visual_minimal"
                                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-950 ring-1 ring-indigo-500"
                                  : "border-slate-200 bg-white text-slate-700"
                              }`}
                              id="btn-choice-look-minimal"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-extrabold text-xs">Visual &amp; Minimal</span>
                                {lookStyle === "visual_minimal" && (
                                  <span className="bg-indigo-600 text-white rounded-full p-0.5">
                                    <Check size={8} className="stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                                Big headings, short punchy text (max 2 sentences per slide), lots of white space. Value theme impact and concept brevity over details.
                              </p>
                              {/* Layout conceptual preview */}
                              <div className="border border-slate-150 rounded-lg p-2.5 bg-slate-50/80 flex flex-col gap-1.5 pointer-events-none mt-auto">
                                <div className="h-2 w-10 bg-indigo-400 rounded-sm"></div>
                                <div className="h-1 w-full bg-slate-300 rounded-sm"></div>
                                <div className="h-1 w-2/3 bg-slate-300 rounded-sm"></div>
                              </div>
                            </button>

                            {/* Option B: Balanced */}
                            <button
                              type="button"
                              onClick={() => setLookStyle("balanced")}
                              className={`p-4 text-left border rounded-xl flex flex-col gap-3.5 cursor-pointer hover:border-indigo-400 hover:bg-slate-50/20 transition-all ${
                                lookStyle === "balanced"
                                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-950 ring-1 ring-indigo-500"
                                  : "border-slate-200 bg-white text-slate-700"
                              }`}
                              id="btn-choice-look-balanced"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-extrabold text-xs">Balanced Layout</span>
                                {lookStyle === "balanced" && (
                                  <span className="bg-indigo-600 text-white rounded-full p-0.5">
                                    <Check size={8} className="stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                                Moderate headings with 3 to 4 concise bullet points per slide. Informative but clean, presenting information in a comfortable format.
                              </p>
                              {/* Layout conceptual preview */}
                              <div className="border border-slate-150 rounded-lg p-2.5 bg-slate-50/80 flex flex-col gap-1.5 pointer-events-none mt-auto">
                                <div className="h-2 w-14 bg-indigo-400 rounded-sm"></div>
                                <div className="flex items-start gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-0.5 shrink-0"></div>
                                  <div className="h-1 w-full bg-slate-300 rounded-sm"></div>
                                </div>
                                <div className="flex items-start gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-0.5 shrink-0"></div>
                                  <div className="h-1 w-11/12 bg-slate-300 rounded-sm"></div>
                                </div>
                                <div className="flex items-start gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-0.5 shrink-0"></div>
                                  <div className="h-1 w-5/6 bg-slate-300 rounded-sm"></div>
                                </div>
                              </div>
                            </button>

                            {/* Option C: Information Dense */}
                            <button
                              type="button"
                              onClick={() => setLookStyle("info_dense")}
                              className={`p-4 text-left border rounded-xl flex flex-col gap-3.5 cursor-pointer hover:border-indigo-400 hover:bg-slate-50/20 transition-all ${
                                lookStyle === "info_dense"
                                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-950 ring-1 ring-indigo-500"
                                  : "border-slate-200 bg-white text-slate-700"
                              }`}
                              id="btn-choice-look-dense"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-extrabold text-xs">Information Dense</span>
                                {lookStyle === "info_dense" && (
                                  <span className="bg-indigo-600 text-white rounded-full p-0.5">
                                    <Check size={8} className="stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                                Smaller headings and detailed explanation points. Maximizes text density and study contents, ideal for reference materials and notes.
                              </p>
                              {/* Layout conceptual preview */}
                              <div className="border border-slate-150 rounded-lg p-2 bg-slate-50 flex flex-col gap-1 pointer-events-none mt-auto">
                                <div className="h-1.5 w-16 bg-indigo-400 rounded-sm mb-0.5"></div>
                                <div className="h-1 w-full bg-slate-300 rounded-sm"></div>
                                <div className="h-1 w-full bg-slate-300 rounded-sm"></div>
                                <div className="h-1 w-11/12 bg-slate-300 rounded-sm"></div>
                                <div className="h-1 w-5/6 bg-slate-300 rounded-sm"></div>
                                <div className="h-1 w-2/3 bg-slate-300 rounded-sm"></div>
                              </div>
                            </button>

                          </div>
                        </div>

                        {/* Heading structure size looks */}
                        <div className="space-y-3">
                          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-0.5">
                            What's the heading style?
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            
                            {/* Option A: Bold & Large */}
                            <button
                              type="button"
                              onClick={() => setHeadingStyle("bold_large")}
                              className={`p-4 text-left border rounded-xl flex flex-col gap-2.5 cursor-pointer hover:border-indigo-400 hover:bg-slate-50/20 transition-all ${
                                headingStyle === "bold_large"
                                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-950 ring-1 ring-indigo-500"
                                  : "border-slate-200 bg-white text-slate-755"
                              }`}
                              id="btn-choice-heading-bold"
                            >
                              <div className="flex items-center justify-between w-full font-sans">
                                <span className="font-extrabold text-xs">Bold &amp; Large</span>
                                {headingStyle === "bold_large" && (
                                  <span className="bg-indigo-600 text-white rounded-full p-0.5">
                                    <Check size={8} className="stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                                Title headings dominate the slide canvas acting as the massive focal anchor. Bullet contents are kept minimal.
                              </p>
                            </button>

                            {/* Option B: Standard */}
                            <button
                              type="button"
                              onClick={() => setHeadingStyle("standard")}
                              className={`p-4 text-left border rounded-xl flex flex-col gap-2.5 cursor-pointer hover:border-indigo-400 hover:bg-slate-50/20 transition-all ${
                                headingStyle === "standard"
                                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-950 ring-1 ring-indigo-500"
                                  : "border-slate-200 bg-white text-slate-755"
                              }`}
                              id="btn-choice-heading-standard"
                            >
                              <div className="flex items-center justify-between w-full font-sans">
                                <span className="font-extrabold text-xs">Standard Weight</span>
                                {headingStyle === "standard" && (
                                  <span className="bg-indigo-600 text-white rounded-full p-0.5">
                                    <Check size={8} className="stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                                Slide titles and body bullet text blocks share balanced visual weight and clean neutral alignment.
                              </p>
                            </button>

                            {/* Option C: Content First */}
                            <button
                              type="button"
                              onClick={() => setHeadingStyle("content_first")}
                              className={`p-4 text-left border rounded-xl flex flex-col gap-2.5 cursor-pointer hover:border-indigo-400 hover:bg-slate-50/20 transition-all ${
                                headingStyle === "content_first"
                                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-950 ring-1 ring-indigo-500"
                                  : "border-slate-200 bg-white text-slate-755"
                              }`}
                              id="btn-choice-heading-contentfirst"
                            >
                              <div className="flex items-center justify-between w-full font-sans">
                                <span className="font-extrabold text-xs">Content-First</span>
                                {headingStyle === "content_first" && (
                                  <span className="bg-indigo-600 text-white rounded-full p-0.5">
                                    <Check size={8} className="stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                                Heading sizes are kept smaller, prioritizing core study outlines and descriptive explanations.
                              </p>
                            </button>

                          </div>
                        </div>
                      </div>

                      {/* Step 2 buttons */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setFormStep(1);
                            setUploadError("");
                          }}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 focus:outline-none"
                          id="btn-pres-back-to-step1"
                        >
                          <ArrowLeft size={14} className="stroke-[2.5]" />
                          <span>Back to Source</span>
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreating(false);
                              setFormStep(1);
                              setUploadError("");
                            }}
                            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-150 text-slate-500 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isExtracting}
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            id="btn-pres-capture-submit"
                          >
                            <CheckCircle size={15} />
                            <span>Design &amp; Generate Presentation</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                </form>

              </motion.div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
