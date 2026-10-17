import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Copy,
  Download,
  RotateCw,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Check,
  Lightbulb,
  Upload,
  FileText,
  X,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';
import axios from 'axios';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState, EmptyState, ErrorState } from '../components/PageState';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const FEATURES = [
  'Deep semantic summarization',
  'Raw lecture text or PDF upload',
  'Large PDF support (up to 25MB)',
  'Instant clipboard copy & TXT export',
  'Automated key concept extraction'
];

const formatSummaryBlocks = (summary) => {
  if (!summary) return [];
  return summary.split(/\n{2,}|\n(?=[-•*]|\d+\.)/).map((b) => b.trim()).filter(Boolean);
};

export default function SummaryPanel() {
  const { isAuthenticated } = useAuth();
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [fontSize, setFontSize] = useState(100);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [inputMode, setInputMode] = useState('text');
  const pdfInputRef = useRef(null);

  const textLength = inputText.length;

  const clearPdf = () => {
    setPdfFile(null);
    setPdfMeta(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('PDF file exceeds the 25MB limit');
      return;
    }
    setError('');
    setPdfFile(file);
    setInputMode('pdf');
    setSummary('');
  };

  const handleGenerateSummary = async () => {
    if (!isAuthenticated) {
      setError('Authentication required. Please log in to use this feature.');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setPdfMeta(null);

    try {
      if (inputMode === 'pdf' && pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        if (maxLength) formData.append('max_length', maxLength);

        const response = await axios.post(
          `${API_URL}/api/ai/summarize-pdf`,
          formData,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 180000
          }
        );

        setSummary(response.data.summary);
        setPdfMeta({
          file_name: response.data.file_name,
          page_count: response.data.page_count,
          truncated: response.data.truncated,
          original_length: response.data.original_length
        });
      } else {
        if (!inputText.trim()) {
          setError('Please enter some text or upload a PDF to summarize');
          setLoading(false);
          return;
        }

        if (textLength < 100) {
          setError('Please enter at least 100 characters for meaningful analysis');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          `${API_URL}/api/ai/summarize`,
          {
            text: inputText,
            max_length: maxLength || undefined
          },
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
          }
        );

        setSummary(response.data.summary);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate summary. Please try again.';
      setError(errorMessage);
      console.error('Summary error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const handleDownloadSummary = () => {
    const element = document.createElement('a');
    const file = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = pdfMeta?.file_name
      ? `${pdfMeta.file_name.replace(/\.pdf$/i, '')}-summary.txt`
      : 'eduhive-study-summary.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClearAll = () => {
    setInputText('');
    setSummary('');
    setError('');
    setMaxLength('');
    setPdfMeta(null);
    clearPdf();
    setInputMode('text');
  };

  const canGenerate = inputMode === 'pdf' ? !!pdfFile : !!inputText.trim();

  return (
    <AppLayout title="Summary Panel">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: easeOut }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="eh-badge-honey text-[10px]">Academic Digest Tool</span>
            <span className="text-xs text-muted-foreground">• Fast Comprehension Engine</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground flex items-center gap-3"
            data-testid="summary-panel-title"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-amber-500 text-primary-foreground shadow-lift-sm">
              <Sparkles size={20} strokeWidth={2.2} />
            </span>
            Document Digest & Summarizer
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-body mt-1">
            Transform dense research papers, textbook chapters, and lecture notes into actionable executive digests.
          </p>
        </motion.div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            {/* Input Mode Selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setInputMode('text'); setError(''); }}
                className={`relative h-10 px-4 rounded-xl text-xs font-bold font-heading uppercase tracking-wider transition-all duration-150 ${
                  inputMode === 'text'
                    ? 'bg-primary text-primary-foreground shadow-lift-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                data-testid="summary-mode-text"
              >
                Paste Study Text
              </button>
              <button
                type="button"
                onClick={() => { setInputMode('pdf'); setError(''); }}
                className={`relative h-10 px-4 rounded-xl text-xs font-bold font-heading uppercase tracking-wider transition-all duration-150 flex items-center gap-2 ${
                  inputMode === 'pdf'
                    ? 'bg-primary text-primary-foreground shadow-lift-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                data-testid="summary-mode-pdf"
              >
                <Upload size={14} strokeWidth={2} />
                Upload PDF (Up to 25MB)
              </button>
            </div>

            {/* Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04, duration: 0.2, ease: easeOut }}
              className="eh-card-glow rounded-2xl p-6 shadow-lift border border-border"
            >
              {inputMode === 'text' ? (
                <>
                  <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                    <label className="text-xs font-bold font-heading text-foreground uppercase tracking-wider">
                      Study Text / Article Content
                    </label>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 tabular-nums">
                      {textLength} characters
                    </span>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste textbook excerpt, lecture notes, or syllabus content here... (minimum 100 characters)"
                    data-testid="summary-panel-text-input"
                    className="eh-input h-64 resize-none rounded-xl p-4 text-xs sm:text-sm leading-relaxed"
                  />
                  <div className="mt-3 text-[11px] text-muted-foreground font-body">
                    💡 Tip: Include main theorems, code snippets, or definitions to get structured key takeaways.
                  </div>
                </>
              ) : (
                <>
                  <label className="text-xs font-bold font-heading text-foreground uppercase tracking-wider mb-3 block">
                    Upload Lecture Slides or Research PDF
                  </label>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handlePdfSelect}
                    className="hidden"
                    data-testid="summary-panel-pdf-input"
                  />
                  {!pdfFile ? (
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="w-full h-64 border border-dashed border-border rounded-xl bg-card hover:bg-primary/5 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-3 group"
                      data-testid="summary-panel-pdf-dropzone"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                        <FileText size={24} strokeWidth={2} />
                      </span>
                      <div className="text-center">
                        <span className="text-sm font-bold font-heading text-foreground block">
                          Click to select a PDF or drag file here
                        </span>
                        <span className="text-xs text-muted-foreground font-body mt-1 block">
                          Maximum file size 25MB • Clean text PDFs yield best summaries
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0 shadow-lift-sm">
                          <FileCheck size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold font-heading text-foreground truncate">{pdfFile.name}</p>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">
                            {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI Extraction
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearPdf}
                        className="eh-btn-ghost p-2 rounded-lg text-muted-foreground hover:text-destructive"
                        aria-label="Remove PDF"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <div className="mt-3 text-[11px] text-muted-foreground font-body">
                    EduHive parses document headers, figures, and text streams up to 25MB on the server.
                  </div>
                </>
              )}
            </motion.div>

            {/* Config & Action Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateSummary}
                disabled={loading || !canGenerate}
                data-testid="summary-panel-generate-button"
                className="eh-btn-primary flex-1 h-12 text-xs font-bold rounded-xl shadow-lift disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCw className="animate-spin" size={16} />
                    <span>{inputMode === 'pdf' ? 'Parsing PDF & Digesting…' : 'Synthesizing Summary…'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Structured Summary</span>
                  </>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleClearAll}
                data-testid="summary-panel-clear-button"
                className="eh-btn-outline h-12 px-5 text-xs font-semibold rounded-xl"
              >
                Clear All
              </motion.button>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <ErrorState
                    title="Could not process content"
                    description={error}
                    testId="summary-panel-error"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Information Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.2, ease: easeOut }}
            className="space-y-4"
          >
            <div className="eh-card-glow rounded-2xl p-5 sm:p-6 shadow-lift border border-border">
              <h3 className="eh-section-title mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-primary" />
                Capabilities
              </h3>
              <div className="space-y-2.5 text-xs font-body">
                {FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={2.4} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="eh-card-glow rounded-2xl p-5 sm:p-6 bg-muted/30 border border-border">
              <h3 className="eh-section-title mb-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-primary" />
                Study Strategies
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground font-body leading-relaxed">
                <li>• Upload multi-chapter PDFs before exams for high-yield digests</li>
                <li>• Paste conference papers to extract methodology and results</li>
                <li>• Save the output to your Study Notes to earn +5 XP</li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Summary Output Container */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingState label={inputMode === 'pdf' ? 'Extracting PDF text and generating key takeaways...' : 'Analyzing text and synthesizing core concepts...'} />
            </motion.div>
          ) : summary ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
            >
              <div className="eh-card-glow rounded-3xl p-6 sm:p-8 shadow-lift border border-border" data-testid="summary-panel-result">
                
                {/* Result Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60 gap-4 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5 font-heading">
                      <Sparkles className="text-primary" size={18} />
                      Synthesized Knowledge Digest
                    </h2>
                    {pdfMeta && (
                      <p className="text-xs text-muted-foreground mt-1 font-body">
                        Extracted from <strong className="text-foreground">{pdfMeta.file_name}</strong>
                        {pdfMeta.page_count ? ` · ${pdfMeta.page_count} pages analyzed` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-muted/60 rounded-xl p-1 border border-border/50">
                      <button
                        onClick={() => setFontSize(Math.max(80, fontSize - 10))}
                        className="eh-btn-ghost h-8 w-8 p-0"
                        title="Decrease text size"
                        data-testid="summary-panel-font-decrease"
                      >
                        <ZoomOut size={15} />
                      </button>
                      <span className="text-xs font-mono font-bold w-10 text-center tabular-nums">
                        {fontSize}%
                      </span>
                      <button
                        onClick={() => setFontSize(Math.min(150, fontSize + 10))}
                        className="eh-btn-ghost h-8 w-8 p-0"
                        title="Increase text size"
                        data-testid="summary-panel-font-increase"
                      >
                        <ZoomIn size={15} />
                      </button>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleCopyToClipboard}
                      className={`eh-btn h-9 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 ${
                        copiedToClipboard
                          ? 'bg-emerald-500 text-white'
                          : 'eh-btn-outline'
                      }`}
                      data-testid="summary-panel-copy-button"
                    >
                      {copiedToClipboard ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedToClipboard ? 'Copied' : 'Copy Digest'}</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleDownloadSummary}
                      className="eh-btn-outline h-9 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5"
                      data-testid="summary-panel-download-button"
                    >
                      <Download size={14} />
                      <span>Export TXT</span>
                    </motion.button>
                  </div>
                </div>

                {/* Formatted Text Content */}
                <div
                  className="bg-muted/30 border border-border/70 rounded-2xl p-6 sm:p-7 min-h-64 shadow-lift-sm"
                  style={{ fontSize: `${fontSize}%` }}
                >
                  <div className="text-foreground leading-relaxed font-body space-y-4">
                    {formatSummaryBlocks(summary).map((block, idx) => (
                      <p key={idx} className="whitespace-pre-wrap leading-relaxed">
                        {block}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border/60">
                  <div className="text-center p-3 rounded-xl bg-card border border-border/50">
                    <div className="text-xl font-extrabold text-foreground font-heading tabular-nums">
                      {summary.split(/\s+/).length}
                    </div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-heading mt-0.5">
                      Words
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-card border border-border/50">
                    <div className="text-xl font-extrabold text-foreground font-heading tabular-nums">
                      {formatSummaryBlocks(summary).length}
                    </div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-heading mt-0.5">
                      Key Takeaways
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-card border border-border/50">
                    <div className="text-xl font-extrabold text-foreground font-heading tabular-nums">
                      ~{Math.max(1, Math.ceil(summary.split(/\s+/).length / 200))} min
                    </div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-heading mt-0.5">
                      Est. Read Time
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState
                icon={Sparkles}
                title="Digest will appear here"
                description="Paste lecture content or drop a PDF document above to extract high-yield study points."
                testId="summary-panel-empty"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
