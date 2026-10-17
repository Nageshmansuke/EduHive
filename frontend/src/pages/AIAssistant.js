import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState, InlineSpinner } from '../components/PageState';
import {
  Brain,
  Send,
  FileText,
  HelpCircle,
  Trash2,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Award,
  Copy,
  Check,
  Zap,
  ArrowRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const easeOut = [0.23, 1, 0.32, 1];

const TABS = [
  { id: 'chat', label: 'AI Tutor', icon: Brain, badge: 'Conversational' },
  { id: 'summarize', label: 'Summarizer', icon: FileText, badge: 'Digest' },
  { id: 'quiz', label: 'Quiz Generator', icon: HelpCircle, badge: 'Practice' }
];

const SUGGESTED_PROMPTS = [
  'Explain time complexity in Big-O notation with examples',
  'Summarize the core principles of thermodynamic systems',
  'How do I earn XP and unlock Platinum tier in EduHive?',
  'Give me 3 practice tips for preparing a software interview'
];

const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <AppLayout title="AI Assistant">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: easeOut }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="eh-badge-honey text-[10px]">Gemini-Powered Intelligence</span>
            <span className="text-xs text-muted-foreground">• 24/7 Academic Study Copilot</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-foreground flex items-center gap-3"
            data-testid="ai-title"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-amber-500 text-primary-foreground shadow-lift-sm">
              <Brain size={20} strokeWidth={2.2} />
            </span>
            AI Academic Assistant
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-body mt-1">
            Get instant contextual answers, summarize dense materials, and generate interactive quizzes.
          </p>
        </motion.div>

        {/* Tab Controls */}
        <div className="relative flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`ai-tab-${tab.id}`}
                className={`relative h-11 px-4 rounded-xl text-xs font-bold font-heading uppercase tracking-wider transition-all duration-150 flex items-center gap-2.5 whitespace-nowrap ${
                  isActive
                    ? 'text-primary-foreground shadow-lift-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="ai-tab-active-pill"
                    className="absolute inset-0 rounded-xl bg-primary"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                  />
                )}
                <Icon size={16} strokeWidth={2} className="relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                <span
                  className={`relative z-10 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.badge}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Viewport */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: easeOut }}
          >
            {activeTab === 'chat' && <ChatTab />}
            {activeTab === 'summarize' && <SummarizeTab />}
            {activeTab === 'quiz' && <QuizTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

const ChatTab = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (presetText) => {
    const textToSend = presetText || input;
    if (!textToSend.trim() || sending) return;
    const userMsg = { role: 'user', content: textToSend.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!presetText) setInput('');
    setSending(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/ai/chat`,
        {
          message: userMsg.content,
          session_id: sessionId
        },
        { withCredentials: true }
      );

      if (!sessionId) setSessionId(res.data.session_id);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again in a moment.' }
      ]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  return (
    <div className="eh-card-glow rounded-2xl overflow-hidden shadow-lift border border-border flex flex-col" data-testid="ai-chat-container">
      {/* Chat Messages Log */}
      <div className="h-[480px] overflow-y-auto p-5 sm:p-6 space-y-4 bg-muted/20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Sparkles size={24} />
            </span>
            <h3 className="text-base font-bold font-heading text-foreground mb-1">
              What would you like to learn today?
            </h3>
            <p className="text-xs text-muted-foreground font-body mb-6">
              Ask anything about computer science, mathematics, natural sciences, or your EduHive course modules.
            </p>

            {/* Prompt presets */}
            <div className="w-full space-y-2 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block text-center">
                Suggested Prompts
              </span>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left p-2.5 rounded-xl border border-border/70 bg-card hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{prompt}</span>
                  <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: easeOut }}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lift-sm mt-0.5">
                    <Bot size={15} strokeWidth={2.2} />
                  </span>
                )}
                <div
                  className={`max-w-[82%] px-4 py-3 font-body rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-lift-sm'
                      : 'bg-card border border-border/80 text-foreground rounded-tl-none shadow-lift-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {isUser && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground mt-0.5">
                    <User size={15} strokeWidth={2} />
                  </span>
                )}
              </motion.div>
            );
          })
        )}

        {sending && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bot size={15} />
            </span>
            <div className="bg-card border border-border/80 px-4 py-3 rounded-2xl rounded-tl-none shadow-lift-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3.5 sm:p-4 border-t border-border bg-card flex items-center gap-2">
        {messages.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={clearChat}
            className="eh-btn-ghost h-10 w-10 p-0 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive"
            data-testid="clear-chat-button"
            title="Reset conversation"
          >
            <Trash2 size={16} />
          </motion.button>
        )}
        <input
          type="text"
          placeholder="Ask a question or request a concept breakdown…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          data-testid="chat-input"
          className="eh-input flex-1 h-11 text-xs sm:text-sm rounded-xl"
        />
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          data-testid="send-message-button"
          className="eh-btn-primary h-11 w-11 p-0 rounded-xl flex items-center justify-center shadow-lift-sm disabled:opacity-50"
        >
          <Send size={16} strokeWidth={2.2} />
        </motion.button>
      </div>
    </div>
  );
};

const SummarizeTab = () => {
  const [text, setText] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setSummary('');
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/summarize`,
        {
          text: text.trim(),
          max_length: maxLength ? parseInt(maxLength) : undefined
        },
        { withCredentials: true }
      );
      setSummary(res.data.summary);
    } catch (error) {
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4" data-testid="summarize-container">
      <div className="eh-card-glow rounded-2xl p-6 shadow-lift border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="eh-section-title flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            Study Text Summarizer
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums font-mono">
            {text.length} characters
          </span>
        </div>
        <textarea
          placeholder="Paste lecture notes, study articles, or textbook chapters here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid="summarize-text-input"
          className="eh-input h-48 resize-none rounded-xl p-4 text-xs sm:text-sm leading-relaxed"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Word Limit:
            </label>
            <input
              type="number"
              placeholder="e.g. 150"
              value={maxLength}
              onChange={(e) => setMaxLength(e.target.value)}
              data-testid="summarize-max-length"
              className="eh-input w-28 h-9 text-xs rounded-lg py-1.5"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSummarize}
            disabled={!text.trim() || loading}
            data-testid="summarize-submit-button"
            className="eh-btn-primary h-10 px-5 text-xs font-bold rounded-xl shadow-lift-sm disabled:opacity-50"
          >
            {loading && <InlineSpinner size={15} className="text-primary-foreground" />}
            <span>{loading ? 'Analyzing & Digesting…' : 'Generate Summary'}</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingState label="Extracting core arguments and bulleted digests..." compact />
          </motion.div>
        ) : summary ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="eh-card-glow rounded-2xl p-6 shadow-lift border border-border"
            data-testid="summary-result"
          >
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/60">
              <h3 className="eh-section-title flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                Key Insights Digest
              </h3>
              <button
                onClick={copySummary}
                className="eh-btn-outline h-8 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-body">
              {summary}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const QuizTab = () => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/generate-questions`,
        {
          topic: topic.trim(),
          num_questions: numQuestions,
          difficulty
        },
        { withCredentials: true }
      );
      setQuestions(res.data.questions);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qIndex, optionIndex) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const checkAnswers = () => setShowResults(true);

  const getScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) correct++;
    });
    return correct;
  };

  return (
    <div className="space-y-4" data-testid="quiz-container">
      <div className="eh-card-glow rounded-2xl p-6 shadow-lift border border-border">
        <h3 className="eh-section-title mb-4 flex items-center gap-2">
          <HelpCircle size={18} className="text-primary" />
          Interactive Quiz Generator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1 font-heading">
              Subject or Topic *
            </label>
            <input
              type="text"
              placeholder="e.g. Distributed Consensus, Organic Chemistry"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              data-testid="quiz-topic-input"
              className="eh-input rounded-xl py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1 font-heading">
              Question Count
            </label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              data-testid="quiz-num-questions"
              className="eh-input rounded-xl py-2 text-xs"
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground mb-1 font-heading">
              Difficulty Tier
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              data-testid="quiz-difficulty"
              className="eh-input rounded-xl py-2 text-xs"
            >
              <option value="easy">Easy (Foundational)</option>
              <option value="medium">Medium (Standard)</option>
              <option value="hard">Hard (Advanced)</option>
            </select>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={generateQuiz}
          disabled={!topic.trim() || loading}
          data-testid="generate-quiz-button"
          className="eh-btn-primary h-11 px-6 text-xs font-bold rounded-xl shadow-lift-sm disabled:opacity-50"
        >
          {loading && <InlineSpinner size={16} className="text-primary-foreground" />}
          <span>{loading ? 'Synthesizing Questions…' : 'Generate Practice Quiz'}</span>
        </motion.button>
      </div>

      {loading && <LoadingState label="Drafting tailored questions and distractors..." compact />}

      {!loading && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <motion.div
              key={qIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: qIndex * 0.04, ease: easeOut }}
              className="eh-card-glow rounded-2xl p-5 sm:p-6 shadow-lift-sm border border-border"
              data-testid={`quiz-question-${qIndex}`}
            >
              <p className="font-bold text-sm sm:text-base text-foreground mb-4 font-heading flex items-start gap-2">
                <span className="text-primary font-mono">Q{qIndex + 1}.</span>
                <span>{q.question}</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIndex) => {
                  const isSelected = answers[qIndex] === optIndex;
                  const isCorrect = showResults && optIndex === q.correct_answer;
                  const isWrong = showResults && isSelected && optIndex !== q.correct_answer;
                  return (
                    <motion.button
                      key={optIndex}
                      whileTap={!showResults ? { scale: 0.98 } : {}}
                      onClick={() => selectAnswer(qIndex, optIndex)}
                      data-testid={`quiz-option-${qIndex}-${optIndex}`}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium font-body transition-all flex items-center justify-between gap-3 ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : isWrong
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-lift-sm ring-1 ring-primary/30'
                          : 'border-border/80 bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-muted text-[11px] font-bold font-mono flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {isCorrect && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                      {isWrong && <XCircle size={16} className="text-rose-500 shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground bg-muted/40 p-3.5 rounded-xl font-body flex items-start gap-2.5"
                  >
                    <Lightbulb size={16} className="text-primary shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{q.explanation}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {!showResults ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={checkAnswers}
              disabled={Object.keys(answers).length < questions.length}
              data-testid="check-answers-button"
              className="eh-btn-primary w-full h-12 rounded-xl text-sm font-bold shadow-lift"
            >
              Verify Answers ({Object.keys(answers).length}/{questions.length} Completed)
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="eh-card-glow rounded-2xl p-8 text-center bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border border-primary/30 shadow-lift"
              data-testid="quiz-score"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lift mx-auto mb-3">
                <Award size={28} />
              </span>
              <p className="text-4xl font-extrabold text-foreground mb-1 font-heading tabular-nums tracking-tight">
                {getScore()} / {questions.length}
              </p>
              <p className="text-sm font-bold text-foreground font-heading mb-1">
                {getScore() === questions.length
                  ? '🏆 Perfect Mastery!'
                  : getScore() >= questions.length / 2
                  ? '✨ Strong Comprehension!'
                  : '📚 Review the concepts and try again!'}
              </p>
              <p className="text-xs text-muted-foreground font-body">
                Earned +{Math.round((getScore() / questions.length) * 20)} XP toward your next tier ranking.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
