import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  scriptureRefs?: string[];
}

interface Props {
  variant?: "landing" | "dashboard";
  apiEndpoint?: string;
  apiKey?: string;
}



const SYSTEM_PROMPT = `You are the Divine Mentor — a warm, knowledgeable guide for Christ India Disciple (CID), a Christian discipleship web platform. You help users with two things: navigating the app and answering biblical questions.

**ABOUT CHRIST INDIA DISCIPLE**
Christ India Disciple (CID) is a structured Christian discipleship platform for India believers. It offers tiered learning (Basic → Intermediate → Senior), live Google Meet sessions with tutors, scripture-based lessons with video/PDF/PPT resources, quizzes and tests, and a community of fellow disciples.

**HOW TO GET STARTED**
If someone asks "how do I start", "how do I use this app", "how do I learn", walk them through these steps:

STEP 1 — CREATE AN ACCOUNT / LOG IN
On the homepage, click "Get Started" or "Sign In" in the top navigation bar. New user? Click "Create Account" → enter your full name, email address, and a password → check your email and verify your account. Already have an account? Enter your email and password and click "Sign In". After login you are automatically taken to your personal Candidate Dashboard.

STEP 2 — CHOOSE A SUBSCRIPTION PLAN
You must have an active plan to access lessons. Without a plan all course content is locked. In your dashboard, click "Plans" in the left sidebar. There are 3 tiers: Basic (Foundation of faith, best for new believers), Intermediate (Deeper truth and theology, for growing disciples), and Senior (The sacred summit, mastery of the divine path, for advanced disciples). Each tier has Monthly and One-Time (lifetime) billing options. Click "Purchase" on the plan you want → complete checkout → your plan activates immediately. You can hold multiple tier plans at the same time.

STEP 3 — START LEARNING
Click "Learn" in the left sidebar. You will see the 3 Tiers: Basic, Intermediate, Senior. Click a tier you have an active plan for → you see all courses in that tier. Click a course → you see the list of lessons in order. Click a lesson to open the Lesson Viewer. Lessons unlock sequentially — complete lesson 1 to unlock lesson 2, and so on.

STEP 4 — INSIDE A LESSON
Each lesson can contain: VIDEO (embedded YouTube, watch inside the app), PDF (scripture notes, study guides, opens in-browser), and PPT/SLIDES (presentation slides, view inside the app). Scroll through all resources at your own pace. When done, click "Mark as Complete" at the bottom to record your progress. If the lesson has a test, a "Take Test" button will appear after marking complete.

STEP 5 — TAKE TESTS
Tests appear after completing a lesson if the admin has attached one. Click "Take Test" → answer all questions → submit. You will see your score and pass/fail status immediately. Results are saved to your Achievements page.

STEP 6 — ATTEND LIVE MEETINGS (Google Meet)
Click "Meetings" in the left sidebar. Your tutor or admin schedules Google Meet sessions and adds you as a participant. Each meeting shows the title, scheduled date and time, who created it, and notes. When it's time, click "Join Meeting" → opens Google Meet in a new tab. If you don't see any meetings yet, your tutor has not scheduled one — message them via the Messages tab.

STEP 7 — MESSAGES
Click "Messages" in the sidebar to chat directly with your assigned tutor. Use this to ask questions, get feedback, or request a meeting.

STEP 8 — ACHIEVEMENTS
Click "Achievements" to see all your test attempts — passed, failed, and pending. Passed tests earn you a Trophy. Keep going!

STEP 9 — OVERVIEW / DASHBOARD
The main Overview page shows: lessons completed, tests passed, average score, levels unlocked, your overall progress bar, your assigned tutor's details, and active subscription status.

**COMMON QUESTIONS**

Q: Content is locked / I see a lock icon — You need an active subscription for that tier. Go to Plans in the sidebar and purchase the relevant tier.

Q: I can't see any meetings — Meetings are scheduled by your tutor or admin. Reach out via Messages to request one.

Q: How do I change my password or profile? — Click your name or avatar in the top-right corner of the dashboard.

Q: Is there a free tier? — Admins can grant free access overrides to specific candidates. Contact your admin or tutor via Messages if you believe you qualify.

Q: What devices can I use? — CID works on any modern browser — desktop, tablet, or mobile.

**BIBLICAL GUIDANCE**
For all spiritual and scripture questions: always cite specific Bible verses (book, chapter:verse). Be warm, pastoral, and encouraging like a trusted elder. Use gender-neutral terms like "dear child", "beloved", or "dear one". Keep answers to 1–2 paragraphs maximum. Always end with one encouraging Bible verse. If a question is outside biblical or CID topics, gently redirect: "That's a little beyond my calling, beloved — but I'd love to bring you back to God's Word."`;

const FALLBACK_RESPONSES: Record<string, string> = {
  "how to be good": `A beautiful question, precious soul.

The Scriptures teach us that true goodness flows not from mere human effort, but from a heart transformed by God's love.

Mark 10:18 — Jesus Himself said, "No one is good except God alone." This reveals that goodness is divine in origin.

Yet consider these sacred truths:

Psalm 34:14 — "Turn from evil and do good; seek peace and pursue it."

Micah 6:8 — "He has shown you, O mortal, what is good. And what does the LORD require of you? To act justly and to love mercy and to walk humbly with your God."

Galatians 5:22-23 — The fruit of the Spirit is "love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control."

Theological Insight:
Augustine taught that true virtue is impossible without charity (love of God). The Reformers emphasized that even our best works are tainted by sin, yet through Christ's imputed righteousness, we are enabled to walk in true goodness.

Practical Steps:
1. Surrender to Christ — Good works without love profit nothing (1 Corinthians 13:1-3)
2. Study Scripture — Let God's Word reshape your desires (Psalm 119:11)
3. Serve Others — In serving the least, you serve Christ Himself (Matthew 25:40)
4. Pray Continually — Ask the Holy Spirit to produce His fruit in you

Closing Blessing:
"May the Lord direct your hearts into God's love and Christ's perseverance." — 2 Thessalonians 3:5`,

  "love grace": `The Depths of Divine Love

Beloved, you've touched upon the very heart of Scripture!

John 3:16 — "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."

1 John 4:8 — "Whoever does not love does not know God, because God is love."

Romans 5:8 — "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us."

Grace is God's unmerited favor — a gift we cannot earn, only receive. As Paul writes in Ephesians 2:8-9: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast."

Theological Depth:
The Greek word charis (grace) implies not just forgiveness but empowerment. As Chrysostom noted, grace transforms the recipient. It is not merely God's pardon but His enabling presence.

Closing Blessing: May you rest in the boundless love of Christ that surpasses all understanding. Ephesians 3:18-19`,

  "pray prayer": `The Sacred Art of Prayer

Prayer is the breath of the soul, precious one — our direct communion with the living God.

Philippians 4:6-7 — "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."

The Lord's Prayer (Matthew 6:9-13) gives us the perfect model:
1. Adoration — "Hallowed be your name"
2. Submission — "Your kingdom come"
3. Provision — "Give us today our daily bread"
4. Confession — "Forgive us our debts"
5. Protection — "Lead us not into temptation"

1 Thessalonians 5:17 — "Pray without ceasing."

Wisdom from the Fathers:
The desert fathers taught that prayer is not asking for what we want but aligning our will with God's. As Evagrius Ponticus wrote, "Prayer is the communion of the intellect with God."

Start small, speak from your heart, and remember: The Spirit intercedes for us with wordless groans (Romans 8:26).`,

  "faith believe trust": `The Substance of Faith

Hebrews 11:1 — "Now faith is confidence in what we hope for and assurance about what we do not see."

Dear child of God, faith is not blind — it is trust placed in the trustworthy God who has revealed Himself through Scripture, creation, and ultimately through His Son, Jesus Christ.

Hebrews 11:6 — "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him."

Mark 9:24 — The father's cry echoes our own: "I do believe; help me overcome my unbelief!"

Remember: Even faith as small as a mustard seed can move mountains (Matthew 17:20). God honors your seeking heart!

2 Corinthians 5:7 — "For we live by faith, not by sight."`,

  "anxiety worry fear": `Perfect Peace in Troubled Times

Beloved, the Lord knows the weight upon your heart.

Isaiah 26:3 — "You will keep in perfect peace those whose minds are steadfast, because they trust in you."

Matthew 6:25-34 — Jesus teaches us not to worry about tomorrow, for "each day has enough trouble of its own."

1 Peter 5:7 — "Cast all your anxiety on him because he cares for you."

Philippians 4:6-7 — "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."

Practical Counsel:
When anxiety rises, practice the ancient discipline of lectio divina — slowly read Psalm 23, allowing each phrase to settle in your soul. Remember: courage is not the absence of fear but the presence of faith.

Closing: May the peace of Christ, which surpasses all understanding, guard your heart and mind. Philippians 4:7`,

  "how to start": `Welcome to Christ India Disciple!

Let me walk you through getting started, dear child.

Step 1 — Create an Account
On the homepage, click "Get Started" or "Sign In". New user? Click "Create Account" → enter your full name, email, and password → verify your email. Already have an account? Just sign in. You'll land on your personal Candidate Dashboard.

Step 2 — Choose a Plan
Click "Plans" in the left sidebar. Pick from:
• Basic — Foundation of faith (best for new believers)
• Intermediate — Deeper truth and theology
• Senior — The sacred summit, mastery of the divine path

Each has Monthly or One-Time (lifetime) options. Click "Purchase" → checkout → instant activation.

Step 3 — Start Learning
Click "Learn" in the sidebar → pick your tier → pick a course → click a lesson. Lessons unlock one by one. Complete lesson 1 to open lesson 2.

Inside each lesson: watch videos, read PDFs, view PPT slides. Click "Mark as Complete" when done. Tests appear after completion if the admin has set one.

Step 4 — Live Meetings & Messages
Click "Meetings" to join scheduled Google Meet sessions. Click "Messages" to chat with your tutor directly.

Step 5 — Track Progress
Your Overview dashboard shows lessons completed, tests passed, average score, and overall progress.

Need help? Message your tutor anytime. Welcome to the journey!`,

  "default": `Wisdom from the Sacred Texts

I understand you're seeking guidance, beloved. Let me share what Scripture teaches.

James 1:5 — "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you."

Key Scripture for Your Journey:
Proverbs 3:5-6 — "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."

What would you like to explore more deeply?
- Walking in faith during trials
- Understanding God's love and grace
- Finding peace in prayer
- Growing in spiritual maturity

May the Lord bless you and keep you. The Spirit is always near, ready to guide.`
};

const containerVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.92, filter: "blur(16px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 28,
      stiffness: 260,
      staggerChildren: 0.06
    }
  },
  exit: {
    opacity: 0,
    y: 60,
    scale: 0.92,
    filter: "blur(16px)",
    transition: { duration: 0.25 }
  }
};

const messageVariants = {
  hidden: { opacity: 0, x: -24, scale: 0.94, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 22, stiffness: 320 }
  }
};

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

function highlightScriptures(text: string): Array<{ type: 'text' | 'scripture'; content: string }> {
  const scripturePattern = /([1-3]?\s*[A-Za-z]+\s+\d+[:\d\-\s,]*)/g;
  const parts: Array<{ type: 'text' | 'scripture'; content: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = scripturePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'scripture', content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

export const BiblicalChatbot = ({
  variant = "landing",
  apiEndpoint = "/api/groq/openai/v1/chat/completions",
  apiKey
}: Props) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dark = useDarkMode();

  const t = useMemo(() => dark ? {
    bg: "linear-gradient(160deg, #0a0908 0%, #1c1917 50%, #0f0e0d 100%)",
    surface: "rgba(28, 25, 23, 0.92)",
    surfaceHover: "rgba(41, 37, 36, 0.95)",
    border: "rgba(212, 175, 55, 0.12)",
    borderGlow: "rgba(212, 175, 55, 0.25)",
    borderActive: "rgba(212, 175, 55, 0.45)",
    text: "#faf6f1",
    textMuted: "#a8a29e",
    textSubtle: "#78716c",
    accent: "#d4af37",
    accentLight: "#f3d572",
    accentDark: "#b8960f",
    accentMuted: "rgba(212, 175, 55, 0.15)",
    accentGradient: "linear-gradient(135deg, #d4af37 0%, #f3d572 50%, #d4af37 100%)",
    accentGlow: "0 0 40px rgba(212, 175, 55, 0.15)",
    shadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.08)",
    shadowHover: "0 50px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.15)",
    bubbleUser: "linear-gradient(135deg, #d4af37 0%, #b8960f 100%)",
    bubbleUserText: "#0c0a09",
    bubbleAi: "linear-gradient(160deg, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 100%)",
    inputBg: "rgba(28, 25, 23, 0.98)",
    inputBorder: "rgba(212, 175, 55, 0.2)",
    inputBorderFocus: "rgba(212, 175, 55, 0.5)",
    glow: "0 0 30px rgba(212,175,55,0.12)",
    premiumGradient: "linear-gradient(160deg, #1c1917, #0a0908)",
    scriptureBg: "rgba(212, 175, 55, 0.1)",
    scriptureBorder: "rgba(212, 175, 55, 0.2)",
    divider: "rgba(212, 175, 55, 0.08)",
  } : {
    bg: "linear-gradient(160deg, #fafaf9 0%, #f5f5f4 50%, #e7e5e4 100%)",
    surface: "rgba(255, 255, 255, 0.88)",
    surfaceHover: "rgba(250, 250, 249, 0.95)",
    border: "rgba(120, 113, 108, 0.1)",
    borderGlow: "rgba(184, 134, 11, 0.2)",
    borderActive: "rgba(184, 134, 11, 0.4)",
    text: "#1c1917",
    textMuted: "#78716c",
    textSubtle: "#a8a29e",
    accent: "#b45309",
    accentLight: "#d97706",
    accentDark: "#92400e",
    accentMuted: "rgba(180, 83, 9, 0.08)",
    accentGradient: "linear-gradient(135deg, #b45309 0%, #d97706 50%, #b45309 100%)",
    accentGlow: "0 0 40px rgba(180, 83, 9, 0.1)",
    shadow: "0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(120,113,108,0.08)",
    shadowHover: "0 50px 100px rgba(0,0,0,0.15), 0 0 0 1px rgba(180,83,9,0.1)",
    bubbleUser: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
    bubbleUserText: "#ffffff",
    bubbleAi: "linear-gradient(160deg, rgba(180,83,9,0.04) 0%, rgba(180,83,9,0.01) 100%)",
    inputBg: "rgba(255, 255, 255, 0.95)",
    inputBorder: "rgba(120, 113, 108, 0.15)",
    inputBorderFocus: "rgba(180, 83, 9, 0.4)",
    glow: "0 0 30px rgba(180,83,9,0.08)",
    premiumGradient: "linear-gradient(160deg, #fafaf9, #f5f5f4)",
    scriptureBg: "rgba(180, 83, 9, 0.06)",
    scriptureBorder: "rgba(180, 83, 9, 0.12)",
    divider: "rgba(120, 113, 108, 0.06)",
  }, [dark]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      if (messages.length === 0) {
        setMessages([{
          role: "assistant",
          content: `Greetings, precious soul.\n\nI am the Divine Mentor — your celestial guide through the sacred scriptures and the Christ India Disciple platform. Whether you need help getting started with the app, seek wisdom from the Psalms, or guidance for daily walking with Christ, I am here.\n\n"Your word is a lamp to my feet and a light to my path." — Psalm 119:105\n\nHow may I illuminate your journey today?`,
          timestamp: new Date()
        }]);
      }
    }
  }, [open, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const getFallbackResponse = useCallback((userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    const scores: Record<string, number> = {};

    const categories = [
      { key: "how to be good", keywords: ["good", "righteous", "holy", "virtue", "moral"] },
      { key: "love grace", keywords: ["love", "grace", "mercy", "compassion", "kindness"] },
      { key: "pray prayer", keywords: ["pray", "prayer", "intercede", "petition", "supplication"] },
      { key: "faith believe trust", keywords: ["faith", "believe", "trust", "confidence", "assurance"] },
      { key: "anxiety worry fear", keywords: ["anxious", "worry", "fear", "stress", "peace", "calm"] },
      { key: "how to start", keywords: ["start", "begin", "get started", "how to use", "how do i", "new user", "first time", "tutorial", "guide", "help me"] },
    ];

    categories.forEach(cat => {
      scores[cat.key] = cat.keywords.reduce((sum, kw) =>
        sum + (lowerInput.includes(kw) ? 1 : 0), 0
      );
    });

    const bestMatch = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return bestMatch && bestMatch[1] > 0
      ? FALLBACK_RESPONSES[bestMatch[0]]
      : FALLBACK_RESPONSES.default;
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey && { "Authorization": `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1200,
          temperature: 0.65,
          top_p: 0.9,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...newMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      let reply = data?.choices?.[0]?.message?.content ?? getFallbackResponse(text);
      reply = reply.replace(/\*\*(.*?)\*\*/g, '*$1*');

      const scriptureMatches = reply.match(/([1-3]?\s*[A-Za-z]+\s+\d+[:\d\-\s,]*)/g) || [];

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: reply,
        timestamp: new Date(),
        scriptureRefs: [...new Set(scriptureMatches)]
      }]);
    } catch (error) {
      console.error("API Error, using fallback:", error);
      const fallbackReply = getFallbackResponse(text);
      const scriptureMatches = fallbackReply.match(/([1-3]?\s*[A-Za-z]+\s+\d+[:\d\-\s,]*)/g) || [];
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: fallbackReply,
        timestamp: new Date(),
        scriptureRefs: [...new Set(scriptureMatches)]
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, apiEndpoint, apiKey, getFallbackResponse]);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const speakText = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking === index) {
        window.speechSynthesis.cancel();
        setIsSpeaking(null);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        utterance.pitch = 1.05;
        utterance.onend = () => setIsSpeaking(null);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(index);
      }
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickTopics = [
    { label: "Get Started", query: "How do I get started with this app?" },
    { label: "Spiritual Growth", query: "How can I grow spiritually?" },
    { label: "Finding Peace", query: "How do I find peace in difficult times?" },
    { label: "God's Will", query: "How do I know God's will for my life?" },
  ];

  const renderMessageContent = (content: string) => {
    const parts = highlightScriptures(content);
    return parts.map((part, idx) => {
      if (part.type === 'scripture') {
        return (
          <span
            key={idx}
            className="inline-flex items-center align-baseline px-1.5 py-0 rounded mx-0.5 font-semibold text-[13px] tracking-wide leading-none"
            style={{
              background: t.scriptureBg,
              color: t.accent,
              border: `1px solid ${t.scriptureBorder}`,
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
            }}
          >
            {part.content}
          </span>
        );
      }
      return part.content.split(/(\*[^*]+\*)/g).map((subPart, subIdx) =>
        subPart.startsWith('*') && subPart.endsWith('*') ? (
          <strong key={`${idx}-${subIdx}`} style={{ color: t.accent, fontWeight: 700 }}>
            {subPart.slice(1, -1)}
          </strong>
        ) : (
          <span key={`${idx}-${subIdx}`}>{subPart}</span>
        )
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button — SINGLE ICON ONLY */}
      <motion.button
        initial={{ scale: 0, opacity: 0, rotateZ: -180 }}
        animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
        transition={{
          delay: variant === "landing" ? 1.2 : 0.4,
          type: "spring",
          stiffness: 220,
          damping: 14
        }}
        whileHover={{
          y: -4,
          scale: 1.06,
          boxShadow: `0 20px 50px ${t.accent}50, 0 0 30px ${t.accent}30`
        }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        aria-label="Open Divine Mentor"
        style={{
          background: t.accentGradient,
          border: `1.5px solid ${t.accentLight}`,
          boxShadow: `0 12px 40px ${t.accent}40, 0 0 25px ${t.accent}20, inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-7 py-4 rounded-full group"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={22} className="text-white" />
        </motion.div>
        <span className="text-white font-semibold tracking-widest text-sm hidden sm:inline uppercase" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
          Divine Mentor
        </span>
      </motion.button>

      <AnimatePresence mode="wait">
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ background: dark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)" }}
            />

            {/* Chat Panel */}
            <motion.div
              key="chatpanel"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                background: t.bg,
                border: `1px solid ${t.borderGlow}`,
                boxShadow: t.shadow,
                backdropFilter: "blur(24px)",
              }}
              className={`fixed bottom-24 right-4 sm:right-8 z-[70] w-[calc(100vw-2rem)] sm:w-[520px] flex flex-col rounded-[36px] overflow-hidden transition-all duration-500 ${isExpanded ? 'h-[85vh] sm:h-[800px]' : 'h-[680px]'}`}
            >
              {/* Top accent line */}
              <motion.div
                animate={{
                  background: [
                    `linear-gradient(90deg, transparent 0%, ${t.accent}20 50%, transparent 100%)`,
                    `linear-gradient(90deg, transparent 0%, ${t.accentLight}30 50%, transparent 100%)`,
                    `linear-gradient(90deg, transparent 0%, ${t.accent}20 50%, transparent 100%)`
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 inset-x-0 h-[2px]"
              />
              {/* Bottom accent line */}
              <motion.div
                animate={{
                  background: [
                    `linear-gradient(270deg, transparent 0%, ${t.accent}15 50%, transparent 100%)`,
                    `linear-gradient(270deg, transparent 0%, ${t.accentLight}25 50%, transparent 100%)`,
                    `linear-gradient(270deg, transparent 0%, ${t.accent}15 50%, transparent 100%)`
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute bottom-0 inset-x-0 h-[2px]"
              />

              {/* Side glow lines */}
              <div className="absolute left-0 top-20 bottom-20 w-[1px]" style={{ background: `linear-gradient(180deg, transparent, ${t.accent}15, transparent)` }} />
              <div className="absolute right-0 top-20 bottom-20 w-[1px]" style={{ background: `linear-gradient(180deg, transparent, ${t.accent}15, transparent)` }} />

              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                style={{ borderBottom: `1px solid ${t.divider}` }}
                className="px-7 py-6 flex items-center justify-between shrink-0 relative"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.15 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    style={{
                      background: t.accentGradient,
                      boxShadow: `0 4px 25px ${t.accent}50, 0 0 15px ${t.accent}30`
                    }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  >
                    <Sparkles size={28} color="#fff" />
                  </motion.div>
                  <div>
                    <p style={{ color: t.text, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }} className="font-bold text-xl leading-tight tracking-wide">
                      Divine Mentor
                    </p>
                    <div className="flex items-center gap-2.5 mt-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <p style={{ color: t.textMuted, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }} className="text-[11px] font-semibold tracking-[0.2em] uppercase">
                        Sacred Wisdom · Alive
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ color: t.textMuted }}
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-all"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setOpen(false)}
                    style={{ color: t.textMuted }}
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-all"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </motion.div>

              {/* Scripture Reference Bar */}
              <AnimatePresence>
                {messages.length > 0 && messages[messages.length - 1].scriptureRefs && messages[messages.length - 1].scriptureRefs!.length > 0 && messages[messages.length - 1].role === "assistant" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ borderBottom: `1px solid ${t.divider}`, background: t.surfaceHover }}
                    className="px-7 py-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sparkles size={13} color={t.accent} />
                      <span style={{ color: t.textMuted, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }} className="text-[11px] font-semibold uppercase tracking-wider mr-2">
                        Scriptures:
                      </span>
                      {messages[messages.length - 1].scriptureRefs!.map((ref, i) => (
                        <motion.span
                          key={i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide leading-none"
                          style={{
                            background: t.scriptureBg,
                            color: t.accent,
                            border: `1px solid ${t.scriptureBorder}`,
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
                          }}
                        >
                          {ref}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-7 py-7 space-y-6 min-h-0 custom-scrollbar">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className={`group flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-3`}
                  >
                    {msg.role === "assistant" && (
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        style={{
                          background: t.accentGradient,
                          boxShadow: `0 4px 15px ${t.accent}40`
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-5"
                      >
                        <Sparkles size={16} color="#fff" />
                      </motion.div>
                    )}

                    <div className="relative max-w-[80%]">
                      <div
                        style={msg.role === "user"
                          ? {
                              background: t.bubbleUser,
                              color: t.bubbleUserText,
                              boxShadow: `0 4px 20px ${t.accent}30`
                            }
                          : {
                              background: t.bubbleAi,
                              color: t.text,
                              border: `1px solid ${t.border}`,
                              boxShadow: `0 2px 12px rgba(0,0,0,0.04)`
                            }}
                        className={`px-6 py-5 text-[15px] leading-[1.7] whitespace-pre-wrap shadow-lg backdrop-blur-sm ${
                          msg.role === "user"
                            ? "rounded-[24px] rounded-tr-sm font-medium"
                            : "rounded-[24px] rounded-tl-sm"
                        }`}
                      >
                        <span style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                          {renderMessageContent(msg.content)}
                        </span>
                      </div>

                      <div
                        className={`mt-2 text-[10px] font-medium tracking-wider uppercase ${msg.role === "user" ? "text-right mr-2" : "ml-2"}`}
                        style={{ color: t.textSubtle, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                      >
                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      {msg.role === "assistant" && (
                        <div className="absolute -bottom-10 right-0 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyToClipboard(msg.content, i)}
                            className="p-2 rounded-xl backdrop-blur-md transition-all"
                            style={{
                              background: t.surfaceHover,
                              color: t.textMuted,
                              border: `1px solid ${t.border}`
                            }}
                          >
                            {copiedIndex === i ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => speakText(msg.content, i)}
                            className="p-2 rounded-xl backdrop-blur-md transition-all"
                            style={{
                              background: t.surfaceHover,
                              color: isSpeaking === i ? t.accent : t.textMuted,
                              border: `1px solid ${t.border}`
                            }}
                          >
                            {isSpeaking === i ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                            )}
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {msg.role === "user" && (
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        style={{
                          background: t.accentGradient,
                          boxShadow: `0 4px 15px ${t.accent}40`
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-5"
                      >
                        <Sparkles size={16} color="#fff" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-3"
                  >
                    <div
                      style={{
                        background: t.accentGradient,
                        boxShadow: `0 4px 15px ${t.accent}40`
                      }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-5"
                    >
                      <Sparkles size={16} color="#fff" />
                    </div>
                    <div
                      style={{
                        background: t.bubbleAi,
                        border: `1px solid ${t.border}`,
                        boxShadow: `0 2px 12px rgba(0,0,0,0.04)`
                      }}
                      className="px-7 py-6 rounded-[24px] rounded-tl-sm"
                    >
                      <div className="flex gap-2 items-center">
                        <motion.span
                          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 rounded-full"
                          style={{ background: t.accent }}
                        />
                        <motion.span
                          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                          className="w-2 h-2 rounded-full"
                          style={{ background: t.accent }}
                        />
                        <motion.span
                          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                          className="w-2 h-2 rounded-full"
                          style={{ background: t.accent }}
                        />
                      </div>
                      <p style={{ color: t.textMuted, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }} className="text-[11px] mt-3 font-medium tracking-wider uppercase">
                        Seeking wisdom...
                      </p>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Topics */}
              <AnimatePresence>
                {messages.length <= 1 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="px-7 pb-4"
                  >
                    <p style={{ color: t.textSubtle, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }} className="text-[10px] font-semibold uppercase tracking-[0.25em] mb-3">
                      Quick Topics
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {quickTopics.map((topic, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.03, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setInput(topic.query);
                            setTimeout(() => sendMessage(), 50);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                          style={{
                            background: t.surfaceHover,
                            color: t.textMuted,
                            border: `1px solid ${t.border}`,
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
                          }}
                        >
                          <Sparkles size={14} color={t.accent} />
                          {topic.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                style={{ borderTop: `1px solid ${t.divider}` }}
                className="px-7 pb-7 pt-5 shrink-0"
              >
                <div className="relative flex items-stretch group">
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      boxShadow: `0 0 0 2px ${t.accent}30, 0 0 20px ${t.accent}15`,
                      borderRadius: "20px"
                    }}
                  />
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask for divine wisdom..."
                    disabled={loading}
                    style={{
                      background: t.inputBg,
                      color: t.text,
                      border: `1.5px solid ${t.inputBorder}`,
                      caretColor: t.accent,
                      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
                    }}
                    className="w-full text-base rounded-[20px] pl-6 pr-[68px] py-[18px] outline-none transition-all placeholder:opacity-30 disabled:opacity-50 focus:border-opacity-100"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = t.inputBorderFocus;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = t.inputBorder;
                    }}
                  />
                  <motion.button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    whileHover={!(!input.trim() || loading) ? { scale: 1.08 } : {}}
                    whileTap={!(!input.trim() || loading) ? { scale: 0.93 } : {}}
                    style={{
                      background: t.accentGradient,
                      boxShadow: `0 4px 20px ${t.accent}40`
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-xl text-white hover:brightness-110 transition-all disabled:opacity-20 disabled:shadow-none"
                  >
                    {loading ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                    ) : (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    )}
                  </motion.button>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.35 }}
                  style={{ color: t.textMuted, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  className="text-center text-[10px] font-bold uppercase tracking-[0.35em] mt-4"
                >
                  ✦ Scripture Intelligence · Divine Mentor ✦
                </motion.p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${t.accent}25;
          border-radius: 20px;
          transition: background 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${t.accent}45;
        }
      `}</style>
    </>
  );
};

export default BiblicalChatbot;