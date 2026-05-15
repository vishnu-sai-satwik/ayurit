import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ─── Google Fonts & Global Styles ──────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { scroll-behavior: smooth; width: 100%; height: 100%; overflow-x: hidden; background: #F7F3EE; }

    /* Force full viewport bleed — break out of any artifact wrapper */
    #ayurit-root {
      position: fixed;
      top: 0; left: 0;
      width: 100vw;
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      z-index: 0;
      background: #F7F3EE;
    }

    :root {
      --teal-deep: #0D4A4A;
      --teal-mid: #0F6B6B;
      --emerald: #134E3A;
      --mint: #3ECFB2;
      --gold: #C9A84C;
      --cream: #F7F3EE;
      --beige: #EDE8DF;
      --warm-gray: #8B857D;
      --text-dark: #1A1714;
      --text-mid: #3D3730;
    }

    .gradient-text {
      background: linear-gradient(135deg, #0D4A4A 0%, #0F6B6B 50%, #3ECFB2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .btn-mint {
      background: linear-gradient(135deg, #3ECFB2, #2BB89D);
      color: #0D4A4A;
      font-weight: 600;
      letter-spacing: 0.01em;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 4px 24px rgba(62,207,178,0.35);
    }
    .btn-mint:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 32px rgba(62,207,178,0.5);
    }

    .feature-card {
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
    }
    .feature-card:hover {
      transform: translateY(-8px) rotate(0.3deg);
      box-shadow: 0 24px 60px rgba(13,74,74,0.12);
    }

    .nav-link {
      position: relative;
      color: var(--text-mid);
      font-weight: 500;
      font-size: 0.875rem;
      letter-spacing: 0.02em;
      transition: color 0.2s;
    }
    .nav-link::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 1.5px;
      background: var(--mint);
      transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .nav-link:hover { color: var(--teal-deep); }
    .nav-link:hover::after { width: 100%; }

    .divider-ornament {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
    }
    .divider-ornament::before,
    .divider-ornament::after {
      content: '';
      flex: 1;
      max-width: 80px;
      height: 1px;
      background: linear-gradient(to right, transparent, #C9A84C);
    }
    .divider-ornament::after {
      background: linear-gradient(to left, transparent, #C9A84C);
    }

    .floating { animation: float 6s ease-in-out infinite; }
    .floating-delay-1 { animation-delay: 1s; }
    .floating-delay-2 { animation-delay: 2s; }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }

    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    .pulse-dot::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: rgba(62,207,178,0.4);
      animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }

    .dash-bar {
      border-radius: 3px;
      animation: growUp 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      transform-origin: bottom;
      transform: scaleY(0);
    }
    @keyframes growUp { to { transform: scaleY(1); } }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .capability-grid { grid-template-columns: 1fr !important; gap: 40px !important; direction: ltr !important; }
      .capability-grid > div { direction: ltr !important; }
      .footer-grid { grid-template-columns: 1fr 1fr !important; }
      .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }

    @media (max-width: 768px) {
      .hero-content { padding: 0 20px !important; padding-top: 90px !important; max-width: 100% !important; }
      .hero-h1 { font-size: 2.2rem !important; }
      .hero-desc { font-size: 0.9rem !important; }
      .hero-tabs { display: none !important; }
      .hero-arrows { display: none !important; }
      .hero-slide-dots { right: 16px !important; }
      .nav-desktop-links { display: none !important; }
      .nav-desktop-btns { display: none !important; }
      .nav-mobile-btn { display: flex !important; }
      .section-title { font-size: 1.8rem !important; }
      .features-grid { grid-template-columns: 1fr !important; }
      .stats-grid { grid-template-columns: 1fr !important; }
      .footer-grid { grid-template-columns: 1fr !important; }
      .footer-bottom { flex-direction: column !important; gap: 8px !important; text-align: center; }
      .cta-row { flex-direction: column !important; }
      .cta-row input, .cta-row button { width: 100% !important; }
      .stat-value { font-size: 3rem !important; }
      .badge-row { flex-wrap: wrap; gap: 8px; }
    }

    @media (max-width: 480px) {
      .hero-h1 { font-size: 1.9rem !important; }
      .hero-ctas { flex-direction: column !important; }
      .hero-ctas button { width: 100% !important; justify-content: center; }
    }

    input::placeholder { color: #B5AFA8; }
  `}</style>
);

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", prefix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 2.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [inView, target]);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function ModalOverlay({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#F7F3EE] rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl relative border border-white/20">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-xl text-gray-600 transition-colors z-10" style={{ border: 'none', cursor: 'pointer' }}>×</button>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RequestDemoModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "clamp(24px, 5vw, 48px)", fontFamily: "'Poppins', sans-serif" }}>
        {!submitted ? (
          <>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 600, color: "#0D4A4A", marginBottom: 8 }}>Request a Demo</h2>
            <p style={{ color: "#8B857D", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>See how AyurIT can transform your practice. Fill out the details below and our team will schedule a personalized walkthrough.</p>
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, color: "#8B857D", marginBottom: 6 }}>First Name</label>
                  <input required type="text" placeholder="Dr. Arjun" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #EDE8DF", background: "#fff", fontFamily: "'Poppins', sans-serif", fontSize: 14, outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, color: "#8B857D", marginBottom: 6 }}>Last Name</label>
                  <input required type="text" placeholder="Mehta" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #EDE8DF", background: "#fff", fontFamily: "'Poppins', sans-serif", fontSize: 14, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, color: "#8B857D", marginBottom: 6 }}>Clinic Name</label>
                <input required type="text" placeholder="Veda Health Clinic" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #EDE8DF", background: "#fff", fontFamily: "'Poppins', sans-serif", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, color: "#8B857D", marginBottom: 6 }}>Work Email</label>
                <input required type="email" placeholder="arjun@vedahealth.com" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #EDE8DF", background: "#fff", fontFamily: "'Poppins', sans-serif", fontSize: 14, outline: "none" }} />
              </div>
              <button type="submit" className="btn-mint" style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: 15, marginTop: 8, border: "none", cursor: "pointer" }}>Request Personalized Demo</button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 80, height: 80, background: "#E1F5EE", color: "#3ECFB2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px" }}>✓</div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#0D4A4A", marginBottom: 8 }}>Request Received</h2>
            <p style={{ color: "#8B857D", fontSize: 14, lineHeight: 1.6 }}>Thank you! An AyurIT specialist will contact you shortly to schedule your demo.</p>
            <button onClick={onClose} style={{ marginTop: 32, background: "none", border: "none", color: "#0F6B6B", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Close Window</button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

// ─── HERO SLIDES ──────────────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: "rasa", label: "Rasa · Taste", tagline: "The Six Tastes.", sub: "Pure balance.",
    headline: "Every flavour is medicine.",
    desc: "AyurIT maps all six Rasas — sweet, sour, salty, pungent, bitter, astringent — to every ingredient, so each meal prescription heals as it nourishes.",
    stats: [{ val: "6", unit: "Rasas" }, { val: "8K+", unit: "Foods" }, { val: "100%", unit: "Accuracy" }],
    sceneA: "radial-gradient(ellipse at 60% 40%, #0A5C5C 0%, #062E2E 55%, #030F0F 100%)",
    sceneB: "radial-gradient(ellipse at 30% 70%, #0F7070 0%, #083535 50%, #020C0C 100%)",
    sceneC: "radial-gradient(ellipse at 50% 50%, #134E3A 0%, #051C15 100%)",
    accent: "#3ECFB2",
    orb1: { color: "rgba(62,207,178,0.18)", size: 520, x: "65%", y: "30%" },
    orb2: { color: "rgba(62,207,178,0.08)", size: 300, x: "20%", y: "70%" },
    symbol: "◈",
  },
  {
    id: "virya", label: "Virya · Potency", tagline: "Heating or cooling.", sub: "Thermal intelligence.",
    headline: "The fire within every food.",
    desc: "Track Ushna (heating) and Sheeta (cooling) potency across every meal plan. AyurIT calculates the cumulative thermal effect on each patient's Dosha state.",
    stats: [{ val: "2", unit: "Virya Types" }, { val: "↑60%", unit: "Speed" }, { val: "HIPAA", unit: "Compliant" }],
    sceneA: "radial-gradient(ellipse at 50% 30%, #7A4A08 0%, #3D2004 55%, #120A00 100%)",
    sceneB: "radial-gradient(ellipse at 70% 60%, #8C5210 0%, #4A2808 55%, #100600 100%)",
    sceneC: "radial-gradient(ellipse at 40% 55%, #6B3D06 0%, #2A1400 100%)",
    accent: "#E8A93A",
    orb1: { color: "rgba(232,169,58,0.2)", size: 500, x: "55%", y: "25%" },
    orb2: { color: "rgba(201,120,20,0.1)", size: 350, x: "25%", y: "65%" },
    symbol: "⬡",
  },
  {
    id: "vipaka", label: "Vipaka · Digestion", tagline: "Post-digestive effect.", sub: "Long-term wisdom.",
    headline: "What happens after the meal.",
    desc: "Most apps stop at calories. AyurIT tracks Vipaka — the long-term post-digestive transformation that governs how food truly affects tissue, metabolism and mind.",
    stats: [{ val: "3", unit: "Vipaka Types" }, { val: "98%", unit: "Precision" }, { val: "EHR", unit: "Cloud Sync" }],
    sceneA: "radial-gradient(ellipse at 45% 35%, #2D1B5E 0%, #160D30 55%, #060310 100%)",
    sceneB: "radial-gradient(ellipse at 65% 55%, #361E6E 0%, #1A0D38 55%, #050210 100%)",
    sceneC: "radial-gradient(ellipse at 50% 50%, #1E1050 0%, #080318 100%)",
    accent: "#A78BFA",
    orb1: { color: "rgba(167,139,250,0.18)", size: 480, x: "60%", y: "35%" },
    orb2: { color: "rgba(139,92,246,0.1)", size: 280, x: "15%", y: "60%" },
    symbol: "⟁",
  },
  {
    id: "guna", label: "Guna · Quality", tagline: "20 universal qualities.", sub: "Complete profiling.",
    headline: "Heavy or light. Oily or dry.",
    desc: "The 20 Gunas define the subtle qualities of everything that exists. AyurIT auto-profiles every food across all 20 pairs so you prescribe with true Ayurvedic depth.",
    stats: [{ val: "20", unit: "Gunas" }, { val: "AI", unit: "Powered" }, { val: "500+", unit: "Waitlist" }],
    sceneA: "radial-gradient(ellipse at 40% 40%, #0C3D20 0%, #061A0E 55%, #010805 100%)",
    sceneB: "radial-gradient(ellipse at 60% 60%, #0F4A27 0%, #071E10 55%, #010604 100%)",
    sceneC: "radial-gradient(ellipse at 50% 50%, #0A3018 0%, #030E06 100%)",
    accent: "#4ADE80",
    orb1: { color: "rgba(74,222,128,0.15)", size: 500, x: "58%", y: "28%" },
    orb2: { color: "rgba(34,197,94,0.08)", size: 320, x: "22%", y: "68%" },
    symbol: "✦",
  },
];

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const container = document.getElementById("ayurit-root");
  if (container) {
    const top = el.offsetTop - 80;
    container.scrollTo({ top, behavior: "smooth" });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

// ─── SlideVisual ──────────────────────────────────────────────────────────────
function SlideVisual({ slide, isActive }) {
  const { accent } = slide;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <motion.div
        key={slide.id + "-symbol"}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isActive ? { opacity: 0.07, scale: 1 } : { opacity: 0 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute", fontSize: "clamp(200px, 28vw, 440px)",
          color: accent, lineHeight: 1, userSelect: "none", fontWeight: 700,
          right: "3%", top: "50%", transform: "translateY(-50%)",
          filter: `drop-shadow(0 0 80px ${accent}40)`,
        }}
      >{slide.symbol}</motion.div>

      <motion.div
        key={slide.id + "-orb1"}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        style={{
          position: "absolute",
          width: slide.orb1.size, height: slide.orb1.size, borderRadius: "50%",
          background: `radial-gradient(circle, ${slide.orb1.color} 0%, transparent 70%)`,
          left: slide.orb1.x, top: slide.orb1.y, transform: "translate(-50%, -50%)", filter: "blur(2px)",
        }}
      />
      <motion.div
        key={slide.id + "-orb2"}
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute",
          width: slide.orb2.size, height: slide.orb2.size, borderRadius: "50%",
          background: `radial-gradient(circle, ${slide.orb2.color} 0%, transparent 70%)`,
          left: slide.orb2.x, top: slide.orb2.y, transform: "translate(-50%, -50%)",
        }}
      />

      {isActive && [1, 2, 3].map((ring) => (
        <motion.div
          key={slide.id + "-ring-" + ring}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.15, 0], scale: [0.4, 1.8, 2.4] }}
          transition={{ duration: 3.5, delay: ring * 0.7, repeat: Infinity, ease: "easeOut" }}
          style={{
            position: "absolute", right: "10%", top: "50%", transform: "translate(50%, -50%)",
            width: 300, height: 300, borderRadius: "50%", border: `1px solid ${accent}`,
          }}
        />
      ))}

      <motion.div
        key={slide.id + "-pill"}
        initial={{ opacity: 0, y: 20 }}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute", top: "18%", right: "6%",
          background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)",
          border: `1px solid ${accent}30`, borderRadius: 14, padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 10, pointerEvents: "none",
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 10px ${accent}` }} />
        <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Gemini AI Active</span>
      </motion.div>

      <motion.div
        key={slide.id + "-card"}
        initial={{ opacity: 0, y: 30, scale: 0.92 }}
        animate={isActive ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0 }}
        transition={{ duration: 0.9, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute", bottom: "16%", right: "5%",
          background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px 20px",
          minWidth: 200, pointerEvents: "none",
        }}
      >
        <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{slide.label}</div>
        {slide.stats.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: i < 2 ? 8 : 0 }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{s.unit}</div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 700, color: accent }}>{s.val}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const container = document.getElementById("ayurit-root") || window;
    const handler = () => {
      const scrollTop = container === window ? window.scrollY : container.scrollTop;
      setScrolled(scrollTop > 20);
    };
    container.addEventListener("scroll", handler);
    return () => container.removeEventListener("scroll", handler);
  }, []);

  const NAV_LINKS = [
    { label: "Features", id: "features" },
    { label: "How It Works", id: "how-it-works" },
    { label: "Stats", id: "stats" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "sticky", top: 0, left: 0, right: 0, zIndex: 100,
          padding: scrolled ? "10px 0" : "16px 0",
          background: scrolled ? "rgba(247,243,238,0.96)" : "rgba(0,0,0,0.12)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(13,74,74,0.08)" : "1px solid rgba(255,255,255,0.07)",
          transition: "all 0.4s ease",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "0 clamp(16px, 4vw, 48px)", display: "flex", alignItems: "center", gap: 24 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }} onClick={() => scrollToSection("ayurit-root")}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0D4A4A, #3ECFB2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 12px rgba(13,74,74,0.25)", flexShrink: 0 }}>
              <span style={{ color: "#fff" }}>✦</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: scrolled ? "#0D4A4A" : "#ffffff", lineHeight: 1 }}>AyurIT</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 9, color: scrolled ? "#8B857D" : "rgba(255,255,255,0.5)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Cloud Practice Suite</div>
            </div>
          </div>

          {/* Desktop links */}
          <div className="nav-desktop-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} onClick={() => scrollToSection(id)} className="nav-link"
                style={{ fontFamily: "'Poppins', sans-serif", background: "none", border: "none", cursor: "pointer", padding: 0, color: scrolled ? undefined : "rgba(255,255,255,0.8)" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Desktop buttons */}
          <div className="nav-desktop-btns" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => navigate('/login')} style={{ fontFamily: "'Poppins', sans-serif", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, background: scrolled ? "transparent" : "rgba(255,255,255,0.1)", border: scrolled ? "1.5px solid #0D4A4A" : "1px solid rgba(255,255,255,0.25)", color: scrolled ? "#0D4A4A" : "rgba(255,255,255,0.85)", transition: "all 0.3s ease" }}>Sign In</button>
            <button onClick={() => navigate('/signup')} className="btn-mint" style={{ fontFamily: "'Poppins', sans-serif", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, border: "none" }}>Get Started</button>
          </div>

          {/* Mobile hamburger */}
          <button className="nav-mobile-btn" onClick={() => setMenuOpen(o => !o)}
            style={{ display: "none", background: "none", border: "none", cursor: "pointer", flexDirection: "column", gap: 5, padding: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 24, height: 2, background: scrolled ? "#0D4A4A" : "#fff", borderRadius: 2, transition: "all 0.3s ease",
                transform: menuOpen ? (i === 0 ? "rotate(45deg) translate(5px, 5px)" : i === 2 ? "rotate(-45deg) translate(5px, -5px)" : "scaleX(0)") : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: "sticky", top: 0, left: 0, right: 0, zIndex: 99, background: "rgba(247,243,238,0.98)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(13,74,74,0.1)", padding: "20px clamp(16px,4vw,48px) 24px" }}>
          {NAV_LINKS.map(({ label, id }) => (
            <button key={id} onClick={() => { scrollToSection(id); setMenuOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 500, color: "#1A1714", background: "none", border: "none", cursor: "pointer", padding: "12px 0", borderBottom: "1px solid rgba(13,74,74,0.06)" }}>
              {label}
            </button>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => navigate('/login')} style={{ flex: 1, fontFamily: "'Poppins', sans-serif", padding: "11px", borderRadius: 8, cursor: "pointer", fontSize: 14, border: "1.5px solid #0D4A4A", color: "#0D4A4A", background: "transparent" }}>Sign In</button>
            <button className="btn-mint" onClick={() => navigate('/signup')} style={{ flex: 1, fontFamily: "'Poppins', sans-serif", padding: "11px", borderRadius: 8, cursor: "pointer", fontSize: 14, border: "none" }}>Get Started</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ onOpenDemo }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoRef = useRef(null);
  const sceneCycleRef = useRef(null);
  const slide = HERO_SLIDES[activeSlide];
  const navigate = useNavigate();

  useEffect(() => {
    sceneCycleRef.current = setInterval(() => setSceneIndex(s => (s + 1) % 3), 2500);
    return () => clearInterval(sceneCycleRef.current);
  }, [activeSlide]);

  useEffect(() => {
    autoRef.current = setInterval(goNext, 8000);
    return () => clearInterval(autoRef.current);
  }, [activeSlide]);

  function resetTimers() {
    clearInterval(autoRef.current);
    clearInterval(sceneCycleRef.current);
    setSceneIndex(0);
  }

  function goNext() {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveSlide(s => (s + 1) % HERO_SLIDES.length);
    setSceneIndex(0);
    setTimeout(() => setIsTransitioning(false), 900);
  }

  function goPrev() {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveSlide(s => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    setSceneIndex(0);
    setTimeout(() => setIsTransitioning(false), 900);
  }

  function goTo(i) {
    if (i === activeSlide || isTransitioning) return;
    resetTimers();
    setIsTransitioning(true);
    setActiveSlide(i);
    setTimeout(() => setIsTransitioning(false), 900);
    autoRef.current = setInterval(goNext, 8000);
    sceneCycleRef.current = setInterval(() => setSceneIndex(s => (s + 1) % 3), 2500);
  }

  return (
    <section style={{ position: "relative", width: "100%", height: "100vh", minHeight: 600, overflow: "hidden" }}>

      {/* Backgrounds */}
      {HERO_SLIDES.map((s, i) => (
        <div key={s.id} style={{ position: "absolute", inset: 0, transition: "opacity 1s ease", opacity: i === activeSlide ? 1 : 0, zIndex: 0 }}>
          {[s.sceneA, s.sceneB, s.sceneC].map((bg, si) => (
            <div key={si} style={{ position: "absolute", inset: 0, background: bg, transition: "opacity 1.2s ease", opacity: i === activeSlide && si === sceneIndex ? 1 : 0 }} />
          ))}
          <div style={{ position: "absolute", inset: 0, zIndex: 1, opacity: 0.04, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", zIndex: 2, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "65%", zIndex: 2, background: "linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 100%)" }} />
        </div>
      ))}

      {/* Visual layer */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3 }}>
        <SlideVisual slide={slide} isActive={true} />
      </div>

      {/* Content */}
      <div className="hero-content" style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 clamp(20px, 6vw, 80px)", paddingBottom: 160,
        maxWidth: 700,
      }}>
        <motion.div key={slide.id + "-badge"} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${slide.accent}18`, border: `1px solid ${slide.accent}40`, borderRadius: 24, padding: "6px 16px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: slide.accent, boxShadow: `0 0 8px ${slide.accent}` }} />
            <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, color: slide.accent, textTransform: "uppercase", letterSpacing: "0.14em" }}>{slide.label}</span>
          </div>
        </motion.div>

        <motion.p key={slide.id + "-tagline"} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>
          {slide.tagline} &nbsp;·&nbsp; {slide.sub}
        </motion.p>

        <motion.h1 className="hero-h1" key={slide.id + "-h1"} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(2.2rem, 5vw, 5rem)", fontWeight: 700, lineHeight: 1.05, color: "#ffffff", marginBottom: 22, letterSpacing: "-0.02em" }}>
          {slide.headline}
        </motion.h1>

        <motion.p className="hero-desc" key={slide.id + "-desc"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(0.88rem, 1.2vw, 1rem)", fontWeight: 300, color: "rgba(255,255,255,0.62)", lineHeight: 1.75, marginBottom: 36, maxWidth: 520 }}>
          {slide.desc}
        </motion.p>

        <motion.div className="hero-ctas" key={slide.id + "-cta"} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.52, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => onOpenDemo()}
            style={{ fontFamily: "'Poppins', sans-serif", padding: "13px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", background: slide.accent, color: "#0A0A0A", display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: `0 4px 28px ${slide.accent}55` }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; }}>
            ▶ &nbsp;Book a Demo
          </button>
          <button onClick={() => navigate('/signup')}
            style={{ fontFamily: "'Poppins', sans-serif", padding: "13px 28px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", transition: "all 0.3s ease" }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}>
            Start Your Practice Free →
          </button>
        </motion.div>
      </div>

      {/* Arrows */}
      {["‹", "›"].map((arrow, ai) => (
        <button key={arrow} className="hero-arrows" onClick={() => { resetTimers(); ai === 0 ? goPrev() : goNext(); }}
          style={{ position: "absolute", [ai === 0 ? "left" : "right"]: 24, top: "50%", transform: "translateY(-50%)", zIndex: 20, width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.08)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}>
          {arrow}
        </button>
      ))}

      {/* Tab selector */}
      <div className="hero-tabs" style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 50, padding: 5 }}>
        {HERO_SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => goTo(i)}
            style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: i === activeSlide ? 600 : 400, padding: "9px 20px", borderRadius: 40, border: "none", cursor: "pointer", background: i === activeSlide ? s.accent : "transparent", color: i === activeSlide ? "#0A0A0A" : "rgba(255,255,255,0.55)", transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)", whiteSpace: "nowrap", boxShadow: i === activeSlide ? `0 2px 16px ${s.accent}55` : "none" }}>
            {s.id.charAt(0).toUpperCase() + s.id.slice(1)}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.08)", zIndex: 20 }}>
        <motion.div key={activeSlide} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 8, ease: "linear" }} style={{ height: "100%", background: slide.accent, opacity: 0.7 }} />
      </div>

      {/* Dot nav */}
      <div className="hero-slide-dots" style={{ position: "absolute", top: "50%", right: 28, transform: "translateY(-50%)", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ width: i === activeSlide ? 3 : 2, height: i === activeSlide ? 28 : 12, borderRadius: 2, background: i === activeSlide ? slide.accent : "rgba(255,255,255,0.25)", border: "none", cursor: "pointer", transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)", padding: 0 }} />
        ))}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="feature-card" style={{ background: "#FFFFFF", borderRadius: 20, padding: "clamp(20px,3vw,28px)", border: `1px solid ${accent}22`, boxShadow: "0 4px 24px rgba(13,74,74,0.06)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `${accent}10`, pointerEvents: "none" }} />
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${accent}20, ${accent}10)`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.15rem", fontWeight: 600, color: "#1A1714", marginBottom: 10 }}>{title}</h3>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "#5C564F", lineHeight: 1.7, fontWeight: 300 }}>{desc}</p>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6, color: accent, fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500 }}>
        <span>Learn more</span><span>→</span>
      </div>
    </motion.div>
  );
}

function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const features = [
    { icon: "🌿", title: "Rasa & Taste Analysis", desc: "Go beyond macros. Automatically classify foods by their six Rasas — Madhura, Amla, Lavana, Katu, Tikta, Kashaya — for true Ayurvedic balance.", accent: "#3ECFB2" },
    { icon: "🔥", title: "Virya & Thermal Mapping", desc: "Track the heating (Ushna) or cooling (Sheeta) potency of every meal. Essential for managing Vata, Pitta, and Kapha imbalances.", accent: "#C9A84C" },
    { icon: "⚗️", title: "Vipaka Post-Digestion", desc: "Understand how foods transform after digestion. AyurIT maps long-term effects on Dosha that standard apps completely ignore.", accent: "#0F6B6B" },
    { icon: "🌀", title: "Guna Quality Profiling", desc: "Classify every food by its 20 Gunas — heavy/light, oily/dry, hot/cold — and auto-generate recommendations tailored to each patient.", accent: "#3ECFB2" },
    { icon: "📊", title: "Macro + Ayurveda Unified", desc: "The first platform to show calories, protein, carbs, and fat alongside Ayurvedic metrics in one unified, beautiful dashboard.", accent: "#C9A84C" },
    { icon: "🧬", title: "Prakriti Intelligence", desc: "Input a patient's constitutional type and receive AI-curated diet plans that honour both modern science and ancient wisdom.", accent: "#0F6B6B" },
  ];

  return (
    <section id="features" style={{ background: "#F0EBE3", padding: "clamp(60px,8vw,100px) 0", position: "relative", overflow: "hidden" }}>
      <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)" }}>
        <div ref={ref} style={{ textAlign: "center", marginBottom: "clamp(40px,6vw,72px)" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <div className="divider-ornament" style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.16em" }}>The AyurIT Difference</span>
            </div>
            <h2 className="section-title" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(1.8rem, 4vw, 3.2rem)", fontWeight: 600, color: "#1A1714", marginBottom: 16, lineHeight: 1.2 }}>
              Standard apps track <span style={{ fontStyle: "italic", color: "#8B857D", textDecoration: "line-through" }}>only calories.</span><br />
              AyurIT tracks <span className="gradient-text" style={{ fontStyle: "italic" }}>everything that matters.</span>
            </h2>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(0.9rem,1.2vw,1rem)", color: "#5C564F", maxWidth: 560, margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
              Your patients deserve care that honours their unique constitution. Bridge the gap between modern nutritional science and 5,000 years of Ayurvedic wisdom.
            </p>
          </motion.div>
        </div>
        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: "clamp(14px,2vw,24px)" }}>
          {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 0.08} />)}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────────
function CapabilityVisual1() {
  return (
    <div className="floating" style={{ background: "linear-gradient(135deg, #0D4A4A, #134E3A)", borderRadius: 20, padding: "clamp(18px,3vw,28px)", boxShadow: "0 24px 60px rgba(13,74,74,0.2)" }}>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>Food Database Search</div>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>🔍</span>
        <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Search 8,000+ foods...</span>
      </div>
      {[
        { name: "Ashwagandha Root", kcal: 245, rasa: "Tikta • Kashaya", vip: "Madhura", em: "🌿" },
        { name: "Turmeric (Haridra)", kcal: 312, rasa: "Tikta • Katu", vip: "Katu", em: "🟡" },
        { name: "Ghee (Clarified)", kcal: 898, rasa: "Madhura", vip: "Madhura", em: "🫙" },
        { name: "Triphala Churna", kcal: 98, rasa: "All 5 Rasas", vip: "Madhura", em: "⚫" },
      ].map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: i === 1 ? "rgba(62,207,178,0.15)" : "rgba(255,255,255,0.04)", borderRadius: 8, marginBottom: 5, border: i === 1 ? "1px solid rgba(62,207,178,0.25)" : "1px solid transparent" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{item.em}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#fff", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{item.rasa}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#3ECFB2", fontWeight: 600 }}>{item.kcal} kcal</div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{item.vip}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CapabilityVisual2() {
  return (
    <div className="floating floating-delay-1" style={{ background: "#fff", borderRadius: 20, padding: "clamp(18px,3vw,28px)", boxShadow: "0 24px 60px rgba(13,74,74,0.1)", border: "1px solid #EDE8DF" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, fontWeight: 600, color: "#1A1714" }}>Patient EHR Cloud</div>
        <div style={{ background: "rgba(62,207,178,0.1)", color: "#0F6B6B", fontSize: 11, fontFamily: "'Poppins', sans-serif", fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>HIPAA Secure ✓</div>
      </div>
      {[
        { name: "Meera Joshi", dosha: "Vata", status: "Active", sessions: 8, grad: "linear-gradient(135deg,#3ECFB2,#0F6B6B)" },
        { name: "Arjun Mehta", dosha: "Pitta", status: "Follow-up", sessions: 3, grad: "linear-gradient(135deg,#C9A84C,#E8C97A)" },
        { name: "Sunita Rao", dosha: "Kapha", status: "New", sessions: 1, grad: "linear-gradient(135deg,#0D4A4A,#134E3A)" },
      ].map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "#F7F3EE", borderRadius: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "'Poppins', sans-serif", flexShrink: 0 }}>{p.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1714" }}>{p.name}</div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#8B857D" }}>{p.dosha} · {p.sessions} sessions</div>
          </div>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, color: p.status === "Active" ? "#3ECFB2" : p.status === "Follow-up" ? "#C9A84C" : "#8B857D", background: p.status === "Active" ? "rgba(62,207,178,0.1)" : p.status === "Follow-up" ? "rgba(201,168,76,0.1)" : "rgba(139,133,125,0.1)", padding: "2px 8px", borderRadius: 12, flexShrink: 0 }}>{p.status}</div>
        </div>
      ))}
    </div>
  );
}

function CapabilityVisual3() {
  return (
    <div className="floating floating-delay-2" style={{ background: "linear-gradient(135deg, #0D4A4A, #0F6B6B)", borderRadius: 20, padding: "clamp(18px,3vw,28px)", boxShadow: "0 24px 60px rgba(13,74,74,0.25)" }}>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Gemini AI Recommendation</div>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, color: "#fff", marginBottom: 18, fontWeight: 600 }}>7-Day Pitta Protocol</div>
      {[
        { meal: "Breakfast", food: "Coconut rice + Mint chutney", kcal: 380, score: 94 },
        { meal: "Lunch", food: "Moong dal + Basmati + Ghee", kcal: 620, score: 97 },
        { meal: "Dinner", food: "Vegetable khichdi + Buttermilk", kcal: 520, score: 91 },
        { meal: "Snack", food: "Amla + Pomegranate seeds", kcal: 120, score: 99 },
      ].map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 2, textTransform: "uppercase" }}>{m.meal}</div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#fff", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.food}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{m.kcal} kcal</div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#3ECFB2", fontWeight: 700 }}>{m.score}% match</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CapabilityRow({ icon, subtitle, title, desc, bullets, visual, reverse }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="capability-grid"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(32px,5vw,80px)", alignItems: "center", marginBottom: "clamp(60px,8vw,100px)", direction: reverse ? "rtl" : "ltr" }}>
      <div style={{ direction: "ltr" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(62,207,178,0.08)", border: "1px solid rgba(62,207,178,0.2)", borderRadius: 20, padding: "4px 14px" }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, color: "#0F6B6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>{subtitle}</span>
        </div>
        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 600, color: "#1A1714", marginBottom: 16, lineHeight: 1.2 }}>{title}</h3>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(0.88rem,1.1vw,0.95rem)", color: "#5C564F", lineHeight: 1.8, marginBottom: 24, fontWeight: 300 }}>{desc}</p>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ color: "#3ECFB2", fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "#3D3730", fontWeight: 400 }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ direction: "ltr" }}>{visual}</div>
    </motion.div>
  );
}

function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="how-it-works" style={{ background: "#F7F3EE", padding: "clamp(60px,8vw,100px) 0" }}>
      <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)" }}>
        <div ref={ref} style={{ textAlign: "center", marginBottom: "clamp(40px,6vw,80px)" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <div className="divider-ornament" style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.16em" }}>Core Capabilities</span>
            </div>
            <h2 className="section-title" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(1.8rem, 4vw, 3.2rem)", fontWeight: 600, color: "#1A1714", lineHeight: 1.2 }}>
              Everything your Ayurvedic<br />practice needs, <span className="gradient-text" style={{ fontStyle: "italic" }}>unified.</span>
            </h2>
          </motion.div>
        </div>
        <CapabilityRow icon="🌿" subtitle="Food Intelligence" title="8,000+ Food Database with Ayurvedic Metadata" desc="The most comprehensive Ayurvedic nutrition database ever assembled. Every food comes enriched with Rasa, Virya, Vipaka, and Guna attributes alongside complete macro and micronutrient profiles." bullets={["Search by Dosha, Rasa, or ingredient name", "Full macro + Ayurvedic property fusion", "Seasonal and regional food variants included", "Continuously updated by Ayurvedic scholars"]} visual={<CapabilityVisual1 />} reverse={false} />
        <CapabilityRow icon="☁️" subtitle="EHR Cloud Sync" title="Secure Patient Records Accessible Anywhere" desc="HIPAA-compliant cloud storage means your patients' constitutions, treatment histories, and diet plans are always at your fingertips — from any device, anywhere in the world." bullets={["End-to-end encrypted patient records", "Multi-device access — desktop, tablet, mobile", "One-click session notes and progress tracking", "Automatic backup and version history"]} visual={<CapabilityVisual2 />} reverse={true} />
        {/* Updated below capability to explicitly feature Gemini AI */}
        <CapabilityRow icon="🤖" subtitle="AI Recommendations" title="Predictive Diet Planning Powered by Google Gemini" desc="Feed in a patient's Prakriti, current imbalances, and goals — AyurIT's Gemini-powered AI generates a complete, balanced meal plan that satisfies both clinical nutrition standards and Ayurvedic principles." bullets={["Generates 7-day and 30-day protocols instantly", "Natural Language chat for Dosha/Diet queries", "Cross-references contraindications automatically", "Explains reasoning in plain language for patients"]} visual={<CapabilityVisual3 />} reverse={false} />
      </div>
    </section>
  );
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const stats = [
    { value: 60, suffix: "%", label: "Faster Diet Planning", sub: "vs. traditional manual methods", icon: "⚡" },
    { value: 8000, suffix: "+", label: "Ayurvedic Foods Indexed", sub: "the largest database of its kind", icon: "🌿" },
    { value: 98, suffix: "%", label: "Nutrient Calculation Accuracy", sub: "validated by clinical experts", icon: "🎯" },
    { value: 100, suffix: "%", label: "HIPAA & Data Compliant", sub: "enterprise-grade security, always", icon: "🔒" },
  ];

  return (
    <section id="stats" style={{ background: "linear-gradient(135deg, #0D4A4A 0%, #134E3A 100%)", padding: "clamp(60px,8vw,100px) 0", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-100px", right: "-100px", width: 400, height: 400, borderRadius: "50%", background: "rgba(62,207,178,0.05)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: 300, height: 300, borderRadius: "50%", background: "rgba(201,168,76,0.05)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)" }}>
        <div ref={ref} style={{ textAlign: "center", marginBottom: "clamp(40px,5vw,64px)" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <div className="divider-ornament" style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.16em" }}>Data-Backed Results</span>
            </div>
            <h2 className="section-title" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
              Trusted by practitioners who demand<br />
              <span style={{ fontStyle: "italic", color: "#3ECFB2" }}>both tradition and precision.</span>
            </h2>
          </motion.div>
        </div>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(14px,2vw,24px)" }}>
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: "linear-gradient(135deg, #0D4A4A 0%, #134E3A 100%)", borderRadius: 20, padding: "clamp(24px,3vw,36px)", border: "1px solid rgba(62,207,178,0.15)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-50%", right: "-20%", width: 200, height: 200, borderRadius: "50%", background: "rgba(62,207,178,0.08)" }} />
              <div style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</div>
              <div className="stat-value" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(2.5rem, 4.5vw, 4rem)", fontWeight: 600, color: "#3ECFB2", lineHeight: 1, marginBottom: 8 }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <footer style={{ background: "#1A1714", color: "#fff" }}>
      <div id="contact" style={{ background: "linear-gradient(135deg, #EDE8DF, #F7F3EE)", padding: "clamp(60px,8vw,100px) 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 30% 50%, rgba(62,207,178,0.06) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(201,168,76,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div ref={ref} style={{ width: "100%", maxWidth: 760, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)", textAlign: "center", position: "relative" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <div className="divider-ornament" style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>✦</span>
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(2rem, 5vw, 3.6rem)", fontWeight: 600, color: "#1A1714", lineHeight: 1.15, marginBottom: 16 }}>
              Transform your Ayurvedic<br />
              <span className="gradient-text" style={{ fontStyle: "italic" }}>Practice today.</span>
            </h2>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: "clamp(0.9rem,1.2vw,1rem)", color: "#5C564F", marginBottom: 36, lineHeight: 1.7, fontWeight: 300 }}>
              Join 500+ Ayurvedic practitioners on the waitlist. Be the first to access the platform that finally respects your practice's depth.
            </p>
            {!submitted ? (
              <div className="cta-row" style={{ display: "flex", gap: 12, maxWidth: 500, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address"
                  style={{ flex: 1, minWidth: 220, padding: "13px 18px", borderRadius: 10, border: "1.5px solid #DDD6CA", fontFamily: "'Poppins', sans-serif", fontSize: 14, background: "#fff", color: "#1A1714", outline: "none" }} />
                <button className="btn-mint" onClick={() => email && setSubmitted(true)}
                  style={{ fontFamily: "'Poppins', sans-serif", padding: "13px 24px", borderRadius: 10, fontSize: 14, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                  Join Waitlist →
                </button>
              </div>
            ) : (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(62,207,178,0.1)", border: "1px solid rgba(62,207,178,0.3)", borderRadius: 12, padding: "14px 28px", color: "#0F6B6B", fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                <span style={{ fontSize: 20 }}>✓</span> You're on the list! We'll be in touch.
              </motion.div>
            )}
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#B5AFA8", marginTop: 16 }}>No spam. Unsubscribe anytime. Free early access for waitlist members.</p>
          </motion.div>
        </div>
      </div>

      <div style={{ padding: "clamp(40px,6vw,60px) 0 clamp(24px,3vw,32px)" }}>
        <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "clamp(24px,4vw,48px)", marginBottom: "clamp(32px,4vw,48px)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0F6B6B, #3ECFB2)", display: "flex", alignItems: "center", justifyItems: "center", fontSize: 16, flexShrink: 0 }}><span>✦</span></div>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 600, color: "#fff" }}>AyurIT</span>
              </div>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "#8B857D", lineHeight: 1.8, maxWidth: 280, fontWeight: 300 }}>Cloud-based practice management and nutrition intelligence software built for Ayurvedic clinics.</p>
            </div>
            {[
              { heading: "Product", links: ["Features", "Changelog", "Roadmap"] },
              { heading: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { heading: "Legal", links: ["Privacy Policy", "Terms of Service", "HIPAA Policy", "Cookie Policy"] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 700, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>{col.heading}</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l}><a href="#/" onClick={(e) => e.preventDefault()} style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "#8B857D", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "#3ECFB2"} onMouseOut={e => e.target.style.color = "#8B857D"}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyItems: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#5C564F" }}>© 2025 AyurIT. Built with care for the Ayurvedic healing tradition.</div>
            <div style={{ display: "flex", gap: 20 }}>
              {["Twitter", "LinkedIn", "GitHub"].map(s => (
                <a key={s} href="#/" onClick={(e) => e.preventDefault()} style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#5C564F", textDecoration: "none" }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div id="ayurit-root">
      <FontLoader />
      <Navbar onOpenDemo={() => setShowDemoModal(true)} />
      <Hero onOpenDemo={() => setShowDemoModal(true)} />
      <Features />
      <HowItWorks />
      <Stats />
      <Footer />

      {/* Demo Modal overlay rendered at root level */}
      <RequestDemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </div>
  );
}