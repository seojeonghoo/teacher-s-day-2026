import { FormEvent, KeyboardEvent, Ref, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { toPng } from "html-to-image";
import { ArrowLeft, Download, MailOpen, Sparkles } from "lucide-react";
import { Teacher, teachers } from "./data/teachers";

const PIN_LENGTH = 4;
const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = 1697;
const blankPin = () => Array.from({ length: PIN_LENGTH }, () => "");

function normalizeName(value: string) {
  return value
    .replaceAll(" ", "")
    .replaceAll("　", "")
    .replaceAll("선생님", "")
    .replaceAll("쌤", "")
    .replaceAll("님", "")
    .replace(/[.,!?]/g, "")
    .toLowerCase();
}

function onlyDigits(value: string) {
  return Array.from(value)
    .filter((char) => char >= "0" && char <= "9")
    .join("");
}

function findTeacher(name: string, pin: string) {
  const normalized = normalizeName(name);

  return teachers.find((teacher) => {
    const aliasMatch = teacher.aliases.some((alias) => normalizeName(alias) === normalized);
    return aliasMatch && teacher.pin === pin;
  });
}

function toSafeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").replace(/-께$/, "");
}

function getLetterDensity(body: string) {
  if (body.length > 760) return "dense";
  if (body.length > 560) return "compact";
  return "standard";
}

// Ambient decorative floating marks removed

function Envelope({
  open,
  className = "",
  initial = false,
}: {
  open: boolean;
  className?: string;
  initial?: false | "closed";
}) {
  return (
    <motion.div
      className={`envelope-scene ${className}`.trim()}
      aria-hidden="true"
      animate={open ? "open" : "closed"}
      initial={initial}
      variants={{
        closed: { y: 0, rotate: 0 },
        open: { y: [-1, -12, -7], rotate: [0, -1.8, 1.2] },
      }}
      transition={{ duration: 1.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="envelope-shadow" />
      <div className="envelope-base" />
      <motion.div
        className="envelope-letter"
        variants={{
          closed: { y: 42, opacity: 0, rotate: 0 },
          open: { y: -76, opacity: 1, rotate: -1.4 },
        }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <span />
        <span />
        <span />
      </motion.div>
      <motion.div
        className="envelope-flap"
        variants={{
          closed: { rotateX: 0 },
          open: { rotateX: 182 },
        }}
        transition={{ delay: 0.18, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="envelope-front">
        <span className="fold fold-left" />
        <span className="fold fold-right" />
        <span className="fold fold-bottom" />
      </div>
      <motion.div
        className="seal"
        variants={{
          closed: { scale: 1, opacity: 1 },
          open: { scale: [1, 1.12, 0.2], opacity: [1, 1, 0], y: [0, 1, 12] },
        }}
        transition={{ duration: 0.48, ease: "easeOut" }}
      >
        <span />
      </motion.div>
    </motion.div>
  );
}

function OpeningOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="opening-overlay"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <motion.div
            className="opening-card"
            initial={{ y: 18, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -16, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="opening-envelope-wrap">
              <Envelope open className="opening-envelope" initial="closed" />
            </div>
            <motion.p
              className="opening-text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72, duration: 0.42 }}
            >
              편지를 꺼내는 중
            </motion.p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function LoginScreen({
  name,
  pin,
  error,
  opening,
  onNameChange,
  onPinChange,
  onPinKeyDown,
  onPinPaste,
  onSubmit,
  pinRefs,
}: {
  name: string;
  pin: string[];
  error: string;
  opening: boolean;
  onNameChange: (value: string) => void;
  onPinChange: (index: number, value: string) => void;
  onPinKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void;
  onPinPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pinRefs: React.MutableRefObject<Array<HTMLInputElement | null>>;
}) {
  return (
    <motion.section
      className="login-screen"
      key="login"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45 }}
    >
      <div className="login-paper">
        <div className="login-copy">
          <p className="quiet-label">Teacher's Day Letter</p>
          <h1>선생님께 도착한 작은 편지</h1>
          <p className="intro">
            이름과 4자리 PIN을 입력하면, 선생님께만 준비한 편지가 조용히 열립니다.
          </p>

          <form className="login-form" autoComplete="off" onSubmit={onSubmit}>
            <label className="field">
              <span>선생님 성함</span>
              <input
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                className="text-input"
                type="text"
                inputMode="text"
                placeholder="예: 홍길동"
                aria-invalid={Boolean(error && !name.trim())}
              />
            </label>

            <div className="field">
              <span>4자리 PIN</span>
              <div className="pin-row" aria-label="4자리 PIN 입력">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      pinRefs.current[index] = node;
                    }}
                    value={digit}
                    onChange={(event) => onPinChange(index, event.target.value)}
                    onKeyDown={(event) => onPinKeyDown(index, event)}
                    onPaste={onPinPaste}
                    className="pin-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`PIN ${index + 1}번째 자리`}
                  />
                ))}
              </div>
            </div>

            <button className="primary-button" type="submit" disabled={opening}>
              <MailOpen size={18} aria-hidden="true" />
              <span>{opening ? "편지를 여는 중" : "편지 열어보기"}</span>
            </button>

            <AnimatePresence initial={false}>
              {error ? (
                <motion.p
                  className="error"
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <p className="form-hint">성함은 띄어쓰기 없이 입력해도 괜찮아요. 예: 홍길동, 홍길동쌤, 홍길동 선생님</p>
          </form>
        </div>

        <aside className="login-visual" aria-label="편지 봉투">
          <motion.div
            className="home-envelope-asset"
            animate={opening ? { opacity: 0.34, scale: 0.96, y: -8 } : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          >
            <img src="/home-envelope.png" alt="" />
          </motion.div>
          <div className="visual-caption">
            <Sparkles size={16} aria-hidden="true" />
            <span>2026. 05. 15 · 스승의 날</span>
          </div>
        </aside>
      </div>
    </motion.section>
  );
}

function LetterPaper({
  teacher,
  className = "",
  paperRef,
}: {
  teacher: Teacher;
  className?: string;
  paperRef?: Ref<HTMLDivElement>;
}) {
  const density = getLetterDensity(teacher.body);

  return (
    <div ref={paperRef} className={`letter-paper-sheet letter-paper-sheet--${density} ${className}`.trim()}>
      {/* Decorative sprig/stamp/folds/seal removed for a simpler design */}

      <div className="paper-content">
        <header className="paper-title-block">
          <p className="paper-date">2026. 05. 15.</p>
          <span className="paper-ornament" aria-hidden="true" />
          <h2>{teacher.name}</h2>
          <p className="paper-memory">“{teacher.memory}”</p>
        </header>

        <section className="paper-memory-list" aria-label="선생님과의 기억">
          <p className="paper-section-title">선생님과의 기억</p>
          <ol>
            {teacher.keywords.map((keyword, index) => (
              <li key={keyword}>
                <b>{index + 1}</b>
                <span>{keyword}</span>
              </li>
            ))}
          </ol>
        </section>

        <p className="paper-body">{teacher.body}</p>

        <footer className="paper-closing">
          <p>시간이 지나도 선생님께 배운 마음은 오래 기억하겠습니다.</p>
          <strong>- 정후 올림 -</strong>
        </footer>
      </div>
    </div>
  );
}

function LetterScreen({ teacher, onBack }: { teacher: Teacher; onBack: () => void }) {
  const downloadPaperRef = useRef<HTMLDivElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  async function handleSaveImage() {
    if (!downloadPaperRef.current || isSaving) return;

    setIsSaving(true);
    setSaveMessage("");

    try {
      await document.fonts?.ready;
      const dataUrl = await toPng(downloadPaperRef.current, {
        backgroundColor: "#fffdf8",
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
        canvasWidth: EXPORT_WIDTH,
        canvasHeight: EXPORT_HEIGHT,
        cacheBust: true,
        pixelRatio: 1,
        skipFonts: true,
      });

      const link = document.createElement("a");
      link.download = `스승의날-편지-${toSafeFileName(teacher.name)}.png`;
      link.href = dataUrl;
      link.click();
      setSaveMessage("저장 완료");
    } catch {
      setSaveMessage("저장 실패");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <motion.section
      className="letter-screen"
      key="letter"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
    >
      <LetterPaper teacher={teacher} className="letter-paper-sheet--screen" />

      <div className="letter-actions" data-export-hidden="true">
        <button className="back-button" type="button" onClick={onBack} aria-label="처음 화면으로 돌아가기">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>처음 화면</span>
        </button>
        <button className="save-button" type="button" onClick={handleSaveImage} disabled={isSaving}>
          <Download size={18} aria-hidden="true" />
          <span>{isSaving ? "저장 중" : "이미지 저장"}</span>
        </button>
        {saveMessage ? <span className="save-status">{saveMessage}</span> : null}
      </div>

      <div className="export-stage" aria-hidden="true">
        <LetterPaper teacher={teacher} className="letter-paper-sheet--export" paperRef={downloadPaperRef} />
      </div>
    </motion.section>
  );
}

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState(blankPin);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  function handlePinChange(index: number, value: string) {
    const digit = onlyDigits(value).slice(0, 1);

    setPin((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && pinRefs.current[index + 1]) {
      requestAnimationFrame(() => pinRefs.current[index + 1]?.focus());
    }
  }

  function handlePinKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !pin[index] && pinRefs.current[index - 1]) {
      requestAnimationFrame(() => pinRefs.current[index - 1]?.focus());
    }
  }

  function handlePinPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = onlyDigits(event.clipboardData.getData("text")).slice(0, PIN_LENGTH);

    if (!pasted) return;

    setPin((current) => current.map((_, index) => pasted[index] ?? ""));
    requestAnimationFrame(() => pinRefs.current[Math.min(pasted.length, PIN_LENGTH) - 1]?.focus());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const pinValue = pin.join("");

    if (!trimmedName) {
      setError("선생님 성함을 입력해주세요 : )");
      return;
    }

    if (pinValue.length !== PIN_LENGTH) {
      setError("PIN 번호 4자리를 모두 입력해주세요.");
      pinRefs.current[pin.findIndex((digit) => !digit)]?.focus();
      return;
    }

    const teacher = findTeacher(trimmedName, pinValue);

    if (!teacher) {
      setError("성함 또는 PIN 번호가 맞지 않아요. 정후가 보내드린 정보를 다시 확인해주세요.");
      setPin(blankPin());
      requestAnimationFrame(() => pinRefs.current[0]?.focus());
      return;
    }

    setError("");
    setOpening(true);

    window.setTimeout(
      () => {
        setSelectedTeacher(teacher);
        setOpening(false);
        window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
      },
      shouldReduceMotion ? 60 : 2050,
    );
  }

  function handleBack() {
    setSelectedTeacher(null);
    setName("");
    setPin(blankPin());
    setError("");
    setOpening(false);
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* Ambient removed */}
      <OpeningOverlay show={opening && !selectedTeacher} />
      <main className="app-shell">
        <AnimatePresence mode="wait">
          {selectedTeacher ? (
            <LetterScreen teacher={selectedTeacher} onBack={handleBack} />
          ) : (
            <LoginScreen
              name={name}
              pin={pin}
              error={error}
              opening={opening}
              onNameChange={setName}
              onPinChange={handlePinChange}
              onPinKeyDown={handlePinKeyDown}
              onPinPaste={handlePinPaste}
              onSubmit={handleSubmit}
              pinRefs={pinRefs}
            />
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
