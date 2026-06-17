import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  FileText,
  Target,
  Workflow,
  Cpu,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  TrendingUp,
  Download,
  Copy,
  Check,
  History,
  RotateCcw,
  BookMarked
} from "lucide-react";
import { ResearchPlan, SavedPlan } from "./types";

export default function App() {
  // Input states
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active generated research plan
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  
  // Storage for previously generated plans
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  
  // Section toggle state (true = expanded)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    problemStatement: true,
    objectives: true,
    researchQuestions: true,
    methodology: true,
    techniques: true,
    literatureReview: true,
    keywords: true,
    futureDirections: true
  });

  // UI state for clipboard copy notification
  const [copied, setCopied] = useState<string | null>(null);

  // Load sample placeholder text
  const SAMPLE_TOPIC = "Trustworthy AI for Decision Support Systems";
  const SAMPLE_QUESTION = "How can explainable AI improve trust in high-stakes decision-making environments?";

  // Setup sample presets
  const PRESETS = [
    {
      label: "Explainable Decision Support Systems",
      topic: "Trustworthy AI for Decision Support Systems",
      question: "How can explainable AI improve trust in high-stakes decision-making environments?"
    },
    {
      label: "Causal ML in Digital Health",
      topic: "Causal Inference and Machine Learning for Personalized Treatment Strategies",
      question: "In what ways can causal graphs reduce bias in heterogeneous treatment effect estimations using observational health records?"
    },
    {
      label: "Privacy-Preserving Federated Learning",
      topic: "Efficient Privacy-Preserving Techniques in Decentralized Federated Learning",
      question: "How can we optimize the trade-off between differential privacy noise levels and high-accuracy model convergence across heterogeneous edge nodes?"
    }
  ];

  // Load saved plans from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai_research_saved_plans");
      if (stored) {
        setSavedPlans(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved research plans", e);
    }
  }, []);

  // Sync state back to local storage
  const savePlansToStorage = (updatedList: SavedPlan[]) => {
    try {
      localStorage.setItem("ai_research_saved_plans", JSON.stringify(updatedList));
      setSavedPlans(updatedList);
    } catch (e) {
      console.error("Failed to persist saved research plans", e);
    }
  };

  // Quick fill placeholder
  const handleQuickFill = (topicVal: string, questionVal: string) => {
    setTopic(topicVal);
    setQuestion(questionVal);
    setError(null);
  };

  // Toggle single section
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Expand or collapse all
  const toggleAllSections = (expand: boolean) => {
    setExpandedSections({
      problemStatement: expand,
      objectives: expand,
      researchQuestions: expand,
      methodology: expand,
      techniques: expand,
      literatureReview: expand,
      keywords: expand,
      futureDirections: expand
    });
  };

  // Connect to API to generate plan
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please key in a valid research topic first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic: topic.trim(),
          question: question.trim() || undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate research plan.");
      }

      const generatedPlan: ResearchPlan = await response.json();
      setPlan(generatedPlan);

      // Automatically auto-save to local workspace list
      const newSaved: SavedPlan = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        topic: topic.trim(),
        question: question.trim(),
        createdAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        plan: generatedPlan
      };

      const updatedHistory = [newSaved, ...savedPlans];
      savePlansToStorage(updatedHistory);
      
      // Auto-expand all for fresh results
      toggleAllSections(true);

    } catch (err: any) {
      console.error("Generation Error:", err);
      setError(err.message || "An unexpected error occurred. Please verify your GEMINI_API_KEY in the Secrets panel.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete saved plan from history
  const handleDeletePlan = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedPlans.filter(p => p.id !== idToDelete);
    savePlansToStorage(filtered);
    if (plan && savedPlans.find(p => p.id === idToDelete)?.plan === plan) {
      // Clear out active display if it was deleted
      setPlan(null);
    }
  };

  // Retrieve an old plan
  const handleLoadSavedPlan = (saved: SavedPlan) => {
    setTopic(saved.topic);
    setQuestion(saved.question);
    setPlan(saved.plan);
    setError(null);
    toggleAllSections(true);
  };

  // Copy plan to clipboard in clean Markdown format
  const copyAsMarkdown = () => {
    if (!plan) return;

    let md = `# Research Proposal: ${plan.suggestedTitle}\n\n`;
    md += `## Original Research Topic\n${topic}\n\n`;
    if (question) {
      md += `## Central Research Question\n${question}\n\n`;
    }

    md += `## 1. Research Problem Statement\n${plan.problemStatement}\n\n`;
    
    md += `## 2. Research Objectives\n`;
    plan.objectives.forEach((obj, idx) => {
      md += `${idx + 1}. ${obj}\n`;
    });
    md += `\n`;

    md += `## 3. Secondary Research Questions\n`;
    plan.researchQuestions.forEach((q, idx) => {
      md += `- ${q}\n`;
    });
    md += `\n`;

    md += `## 4. Research Methodology\n${plan.methodology}\n\n`;

    md += `## 5. Suggested AI, ML, & Data Science Techniques\n`;
    plan.techniques.forEach((tech) => {
      md += `- **${tech.name}**: ${tech.description}\n`;
    });
    md += `\n`;

    md += `## 6. Preliminary Literature Review Outline\n`;
    plan.literatureReviewOutline.forEach((section) => {
      md += `### ${section.sectionTitle}\n`;
      section.bulletPoints.forEach((pt) => {
        md += `- ${pt}\n`;
      });
      md += `\n`;
    });

    md += `## 7. Recommended Academic Database Search Keywords\n`;
    md += plan.searchKeywords.map(k => `\`${k}\``).join(", ") + "\n\n";

    md += `## 8. Potential Future Research Directions\n`;
    plan.futureDirections.forEach((dir, idx) => {
      md += `- ${dir}\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied("markdown");
    setTimeout(() => setCopied(null), 3000);
  };

  // Trigger browser print to easily Export as PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-800 font-sans selection:bg-stone-200 selection:text-stone-900">
      
      {/* Top Elegant Primary Header */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center text-stone-100 shadow-sm">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 id="app-title" className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
                AI Research Assistant
              </h1>
              <p id="app-subtitle" className="text-xs text-stone-500 font-normal tracking-wide">
                Research Planning and Idea Development Tool
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stone-100/90 text-stone-600 border border-stone-200">
              Gemini 3.5
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Callout with Quick Presets */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-2xl p-6 sm:p-8 text-stone-200 mb-8 shadow-md">
          <div className="max-w-3xl">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-700/60 text-stone-200 mb-4 border border-stone-600/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Elevate Academic Rigor</span>
            </span>
            <h2 className="text-2xl sm:text-3.5xl font-serif text-white tracking-tight leading-tight">
              Transform raw thesis ideas into fully structured academic research blueprints.
            </h2>
            <p className="text-stone-300 mt-2 text-sm sm:text-base leading-relaxed">
              Designed for doctoral researchers and scholars. The reasoning assistant maps academic landscapes, identifies literature gaps, suggests methodologies, and formulas techniques.
            </p>
            
            {/* Elegant Quick-Preset Selection */}
            <div className="mt-6 pt-6 border-t border-stone-700/60">
              <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold mb-3">
                Select a Quick Academic Preset:
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickFill(p.topic, p.question)}
                    className="text-xs bg-stone-800 hover:bg-stone-700 hover:text-white text-stone-300 border border-stone-700/50 rounded-lg px-3.5 py-2 transition-all duration-200 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-500"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Form & History */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Input Form Panel */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden" id="input-section">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-stone-700 via-stone-900 to-stone-700"></div>
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-stone-500" />
                  Define Scope of Inquiry
                </h3>
                <button
                  type="button" 
                  onClick={() => handleQuickFill(SAMPLE_TOPIC, SAMPLE_QUESTION)}
                  className="text-xs font-medium text-stone-550 hover:text-stone-900 flex items-center gap-1.5 px-2 py-1 rounded bg-stone-50 border border-stone-200 transition-colors"
                  title="Load pre-configured sample text"
                >
                  <RotateCcw className="w-3 h-3" />
                  Load Sample
                </button>
              </div>

              <form onSubmit={handleGeneratePlan} className="space-y-5">
                
                {/* Topic Input */}
                <div>
                  <label htmlFor="topic-input" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Research Topic <span className="text-amber-600 font-bold">*</span></span>
                    <span className="text-[10px] text-stone-400 lowercase font-normal">Required</span>
                  </label>
                  <textarea
                    id="topic-input"
                    rows={3}
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Trustworthy AI for Decision Support Systems"
                    className="w-full text-sm rounded-lg border border-stone-250 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 bg-stone-50/20 text-stone-800 placeholder-stone-400 font-sans transition-all resize-none shadow-inner"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Explain your target discipline or domain of research.
                  </p>
                </div>

                {/* Central Question Input */}
                <div>
                  <label htmlFor="question-input" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Research Question</span>
                    <span className="text-[10px] text-stone-400 lowercase font-normal">Optional</span>
                  </label>
                  <textarea
                    id="question-input"
                    rows={3}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. How can explainable AI improve trust in high-stakes decision-making environments?"
                    className="w-full text-sm rounded-lg border border-stone-250 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 bg-stone-50/20 text-stone-800 placeholder-stone-400 font-sans transition-all resize-none shadow-inner"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Central research inquiry. If omitted, the model will suggest a core direction automatically.
                  </p>
                </div>

                {/* Status/Error Messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs flex items-start space-x-2">
                    <span className="font-bold shrink-0">⚠️ Error:</span>
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                {/* Action button */}
                <button
                  type="submit"
                  id="generate-btn"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold tracking-wide text-white transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                    isLoading 
                      ? "bg-stone-400 cursor-not-allowed" 
                      : "bg-stone-900 hover:bg-stone-800 hover:scale-[1.01] active:scale-[0.99]"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Assembling Hypothesis Outline...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Generate Research Plan
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Local History Sidebar Section */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm">
              <h4 className="font-serif text-md font-bold text-stone-900 mb-4 flex items-center gap-2 font-semibold">
                <History className="w-4 h-4 text-stone-500" />
                Your Saved Blueprints ({savedPlans.length})
              </h4>
              
              {savedPlans.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/20">
                  <BookMarked className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs text-stone-500 font-sans">
                    No generated blueprints stored offline.
                  </p>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Your generated proposals will populate here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                  {savedPlans.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadSavedPlan(item)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 group relative ${
                        plan && plan.suggestedTitle === item.plan.suggestedTitle
                          ? "border-stone-900 bg-stone-100/50 shadow-xs"
                          : "border-stone-100 hover:border-stone-300 hover:bg-stone-50/30"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider font-mono text-stone-400 block mb-1">
                          {item.createdAt}
                        </span>
                        <h5 className="text-xs font-serif font-bold text-stone-900 line-clamp-1 group-hover:text-stone-700">
                          {item.plan.suggestedTitle}
                        </h5>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2 italic">
                          "{item.topic}"
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeletePlan(item.id, e)}
                        className="text-stone-300 hover:text-red-600 transition-colors self-center p-1 cursor-pointer hover:bg-stone-100 rounded opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete from local index"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Structured Guide / Academic Tip Box */}
            <div className="bg-stone-100/80 border border-stone-200 rounded-xl p-4.5">
              <h5 className="text-xs font-bold font-serif text-stone-900 flex items-center gap-1.5 uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                Researcher Instructions
              </h5>
              <div className="mt-2 text-[11px] text-stone-600 leading-relaxed space-y-1.5 list-disc pl-3 font-medium">
                <p>
                  • Ensure the primary research topic contains clear thematic bounds to maximize literary accuracy.
                </p>
                <p>
                  • Keep context clean — avoid adding operational tags, markdown symbols, or URLs.
                </p>
                <p>
                  • Generated drafts are mapped to academic guidelines and can be copied or printed to PDF as required.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Execution Output Plan */}
          <div className="lg:col-span-7">
            
            {/* If no plan generated yet, show academic layout placeholder */}
            {!plan && !isLoading && (
              <div className="bg-white border border-stone-200/80 rounded-2xl p-8 text-center min-h-[480px] flex flex-col items-center justify-center shadow-xs">
                <div className="w-16 h-16 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center border border-stone-150 mb-4 animate-pulse">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-lg text-stone-950 font-bold mb-2">
                  Academic Research Blueprint Generator
                </h3>
                <p className="text-stone-500 max-w-md text-xs sm:text-sm leading-relaxed mb-6">
                  Input your core thesis question or research field on the left, then trigger <strong className="text-stone-800">"Generate Research Plan"</strong>. The system will leverage a server-side Gemini 3.5 model to reconstruct a formal PhD proposal overview.
                </p>
                
                {/* Instant Try-out Alert */}
                <div className="text-xs text-stone-500 bg-stone-50 px-4 py-3 border border-stone-200/60 rounded-xl">
                  <span>No ideas? Click </span>
                  <button 
                    onClick={() => {
                      handleQuickFill(SAMPLE_TOPIC, SAMPLE_QUESTION);
                      const el = document.getElementById("input-section");
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="text-stone-900 underline hover:text-stone-700 cursor-pointer font-bold"
                  >
                    Load trustworthy explainable AI sample
                  </button>
                  <span> to start immediately.</span>
                </div>
              </div>
            )}

            {/* Loader Preview Structure */}
            {isLoading && (
              <div className="bg-white border border-stone-200/80 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[480px] shadow-sm">
                <div className="relative flex items-center justify-center w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-stone-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-stone-900 animate-spin"></div>
                  <Sparkles className="w-5 h-5 text-stone-600 animate-pulse" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-stone-400">
                  Academic Processing Engine
                </span>
                <h4 className="font-serif text-md font-bold text-stone-900 mt-2">
                  Synthesizing Academic Literature and Methodology
                </h4>
                <div className="max-w-sm mt-3 text-center space-y-1.5">
                  <p className="text-xs text-stone-550 leading-relaxed">
                    Deducing knowledge gap boundaries, outlining methodology frameworks, matching AI techniques, and querying major catalogs.
                  </p>
                  <p className="text-[10px] text-stone-400 italic">
                    This typically takes 4–8 seconds to construct the deep structural outline.
                  </p>
                </div>
              </div>
            )}

            {/* Generated Plan Workspace */}
            {plan && !isLoading && (
              <div id="results-container" className="space-y-6 printable-area">
                
                {/* Proposal Title Header Block */}
                <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-stone-950"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest bg-stone-100 text-stone-600 px-2.5 py-1 rounded border border-stone-250 font-semibold">
                        Formulated Proposal Blueprint
                      </span>
                      <h2 className="text-2xl sm:text-3.5xl font-serif font-black tracking-tight text-stone-950 leading-tight mt-3">
                        {plan.suggestedTitle}
                      </h2>
                    </div>
                    
                    {/* Share & Copy utility toolbar */}
                    <div className="flex items-center space-x-2 shrink-0 self-start">
                      <button
                        onClick={copyAsMarkdown}
                        className="text-xs font-medium bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copy as Markdown document"
                      >
                        {copied === "markdown" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-green-700 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                            <span>Copy MD</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handlePrint}
                        className="text-xs font-medium bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Print / Export as high-quality PDF document"
                      >
                        <Download className="w-3.5 h-3.5 text-stone-500" />
                        <span>Print Proposal</span>
                      </button>
                    </div>
                  </div>

                  {/* Context of the topic */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-xs">
                    <div>
                      <span className="font-semibold text-stone-500 uppercase tracking-wide block mb-0.5">
                        Focus Domain:
                      </span>
                      <span className="text-stone-800 font-sans leading-relaxed block">
                        {topic}
                      </span>
                    </div>
                    {question && (
                      <div>
                        <span className="font-semibold text-stone-500 uppercase tracking-wide block mb-0.5">
                          Inquiry Anchor:
                        </span>
                        <span className="text-stone-850 font-sans italic leading-relaxed block">
                          "{question}"
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Group header controls */}
                <div className="flex items-center justify-between">
                  <h4 className="text-stone-500 text-xs uppercase tracking-widest font-bold">
                    Research Plan Elements
                  </h4>
                  <div className="space-x-3 text-xs">
                    <button
                      onClick={() => toggleAllSections(true)}
                      className="text-stone-600 hover:text-stone-950 hover:underline cursor-pointer font-bold"
                    >
                      Expand All
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      onClick={() => toggleAllSections(false)}
                      className="text-stone-600 hover:text-stone-950 hover:underline cursor-pointer font-bold"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                {/* 1. Research Problem Statement */}
                <div className="border border-stone-200/80 bg-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => toggleSection("problemStatement")}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <div className="w-8 h-8 rounded bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[15px] font-bold text-stone-900">
                          1. Research Problem Statement
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Identifying the target gap and societal or industrial contextual relevance.
                        </p>
                      </div>
                    </div>
                    {expandedSections.problemStatement ? (
                      <ChevronUp className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    )}
                  </button>

                  {expandedSections.problemStatement && (
                    <div className="p-5 pt-0 border-t border-stone-100 text-sm leading-relaxed text-stone-700 space-y-3 font-sans">
                      {plan.problemStatement.split("\n\n").map((para, i) => (
                        <p key={i} className="text-stone-700">
                          {para}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Research Objectives */}
                <div className="border border-stone-200/80 bg-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => toggleSection("objectives")}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[15px] font-bold text-stone-900">
                          2. Research Objectives
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Actionable targets mapped with rigorous academic execution verbs.
                        </p>
                      </div>
                    </div>
                    {expandedSections.objectives ? (
                      <ChevronUp className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    )}
                  </button>

                  {expandedSections.objectives && (
                    <div className="p-5 pt-0 border-t border-stone-100 text-sm">
                      <ol className="divide-y divide-stone-100 font-sans">
                        {plan.objectives.map((obj, i) => (
                          <li key={i} className="py-3 flex items-start space-x-3">
                            <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-800 py-0.5 px-1.5 rounded shrink-0 mt-0.5">
                              O{i + 1}
                            </span>
                            <span className="text-stone-700 leading-relaxed font-sans">{obj}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* 3. Research Questions */}
                <div className="border border-stone-200/80 bg-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => toggleSection("researchQuestions")}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <div className="w-8 h-8 rounded bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[15px] font-bold text-stone-900">
                          3. Secondary Research Questions
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Guiding questions structured to form hypotheses checkpoints.
                        </p>
                      </div>
                    </div>
                    {expandedSections.researchQuestions ? (
                      <ChevronUp className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    )}
                  </button>

                  {expandedSections.researchQuestions && (
                    <div className="p-5 pt-0 border-t border-stone-100 text-sm">
                      <ul className="divide-y divide-stone-100 font-sans">
                        {plan.researchQuestions.map((q, i) => (
                          <li key={i} className="py-3.5 flex items-start space-x-3">
                            <span className="text-sky-600 font-bold shrink-0 font-serif mt-0.5">Q{i + 1}.</span>
                            <span className="text-stone-700 leading-relaxed font-sans font-medium">{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 4. Research Methodology */}
                <div className="border border-stone-200/80 bg-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => toggleSection("methodology")}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <div className="w-8 h-8 rounded bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                        <Workflow className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[15px] font-bold text-stone-900">
                          4. Research Methodology
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Study paradigm, analytical strategy, data collection process and parameters.
                        </p>
                      </div>
                    </div>
                    {expandedSections.methodology ? (
                      <ChevronUp className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    )}
                  </button>

                  {expandedSections.methodology && (
                    <div className="p-5 pt-0 border-t border-stone-100 text-sm leading-relaxed text-stone-700 space-y-3 font-sans">
                      {plan.methodology.split("\n\n").map((para, i) => (
                        <p key={i} className="text-stone-700 font-sans animate-fadeIn">
                          {para}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Suggested AI, ML, or Data Science Techniques */}
                <div className="border border-stone-200/80 bg-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => toggleSection("techniques")}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[15px] font-bold text-stone-900">
                          5. AI, Machine Learning, or Data Science Techniques
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Advanced technological mechanics recommended to model datasets.
                        </p>
                      </div>
                    </div>
                    {expandedSections.techniques ? (
                      <ChevronUp className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    )}
                  </button>

                  {expandedSections.techniques && (
                    <div className="p-5 pt-0 border-t border-stone-100 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {plan.techniques.map((tech, i) => (
                          <div key={i} className="p-4 rounded-xl bg-stone-50/50 border border-stone-200/60 flex items-start space-x-3 transition-shadow hover:shadow-xs">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono py-1 px-1.5 shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <div>
                              <h4 className="font-semibold text-stone-950 text-sm">
                                {tech.name}
                              </h4>
                              <p className="text-stone-600 mt-1 text-xs leading-relaxed font-sans">
                                {tech.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Literature Review Outline */}
                <div className="border border-stone-200/80 bg-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => toggleSection("literatureReview")}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <div className="w-8 h-8 rounded bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[15px] font-bold text-stone-900">
                          6. Literature Review Outline
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Preliminary literature review themes, theoretical foundations, and core debates.
                        </p>
                      </div>
                    </div>
                    {expandedSections.literatureReview ? (
                      <ChevronUp className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    )}
                  </button>

                  {expandedSections.literatureReview && (
                    <div className="p-5 pt-0 border-t border-stone-100 text-sm">
                      <div className="space-y-5 mt-4">
                        {plan.literatureReviewOutline.map((section, idx) => (
                          <div key={idx} className="p-4.5 rounded-xl bg-stone-50/40 border border-stone-150">
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1 font-mono">
                              Theme Outline {idx + 1}
                            </span>
                            <h4 className="font-serif text-sm font-bold text-stone-950 mb-2.5">
                              {section.sectionTitle}
                            </h4>
                            <ul className="space-y-1.5 pl-4 list-disc text-xs text-stone-700 font-sans leading-relaxed">
                              {section.bulletPoints.map((item, i) => (
                                <li key={i} className="font-sans">{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Potential Keywords for searches */}
                <div className="border border-stone-200/80 bg-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => toggleSection("keywords")}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <div className="w-8 h-8 rounded bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Search className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[15px] font-bold text-stone-900">
                          7. Scholar Database Query Strings & Keywords
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Highly descriptive phrases perfect for indexed academic search engines.
                        </p>
                      </div>
                    </div>
                    {expandedSections.keywords ? (
                      <ChevronUp className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    )}
                  </button>

                  {expandedSections.keywords && (
                    <div className="p-5 pt-0 border-t border-stone-100 text-sm">
                      <p className="text-xs text-stone-500 mt-4 mb-3">
                        Use these strings in databases like Google Scholar, IEEE Xplore, or ACM DL:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {plan.searchKeywords.map((tag, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center bg-stone-50 text-stone-800 border border-stone-200 font-mono text-[11px] py-1.5 px-3 rounded-lg group select-all hover:bg-stone-100 transition-colors"
                          >
                            <span>{tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. Future Directions */}
                <div className="border border-stone-200/80 bg-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={() => toggleSection("futureDirections")}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <div className="w-8 h-8 rounded bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[15px] font-bold text-stone-900">
                          8. Future Research Directions
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Prospective longitudinal developments and next-stage academic dimensions.
                        </p>
                      </div>
                    </div>
                    {expandedSections.futureDirections ? (
                      <ChevronUp className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                    )}
                  </button>

                  {expandedSections.futureDirections && (
                    <div className="p-5 pt-0 border-t border-stone-100 text-sm">
                      <ul className="space-y-3 pt-4 font-sans">
                        {plan.futureDirections.map((dir, i) => (
                          <li key={i} className="flex items-start space-x-2.5">
                            <ArrowRight className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                            <span className="text-stone-700 text-sm leading-relaxed">
                              {dir}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </main>

      {/* Styled Footer */}
      <footer className="border-t border-stone-200 mt-20 py-8 bg-stone-50 text-stone-500 text-xs sm:text-sm font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-stone-500 text-[11px]">
            &copy; {new Date().getFullYear()} AI Research Assistant. Built for academic knowledge modeling.
          </p>
          <div className="flex space-x-4 text-[11px] text-stone-400 font-mono">
            <span>Powered by Gemini 3.5</span>
            <span>•</span>
            <span>Offline Saved States</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
