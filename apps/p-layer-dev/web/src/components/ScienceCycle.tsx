import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useI18n } from "../i18n";
import { useProject } from "../lib/useProject";
import { askAssistant } from "../lib/api";
import { classifyIdea, newIdeaId, readIdeas, type Idea } from "../lib/ideas";
import { normBrainstorm, emptyResearchState, type ResearchState, type TheorizingState, type CycleState } from "../lib/brainstormV1";
import { WallaceCycleOverview } from "./WallaceCycleOverview";

type Track = "theory" | "empirical";
export type NodeKey = "E" | "T" | "H" | "O";
type NodeDef = {
  key: NodeKey;
  icon: string;
  zh: string;
  en: string;
  descZh: string;
  descEn: string;
  step: string;
  coachZh: string;
  coachEn: string;
  promptZh: string;
  promptEn: string;
};

/* 数组按环序排列：O → E → T → H → O（Wallace 科学环的线性表达）。
   命名对齐统一产品文档 v1.0：O 经验观察 / E 经验概括 / T 理论与概念 / H 命题与假设。 */
const NODES: NodeDef[] = [
  {
    key: "O",
    icon: "⌕",
    zh: "经验观察",
    en: "Observation & Evidence",
    descZh: "决定要观察、比较或查找什么，以及证据能说明什么。",
    descEn:
      "Decide what to observe, compare or look up, and what the evidence can establish.",
    step: "evidence",
    coachZh: "设计你将如何观察、测量或收集证据；不要把研究设计当成已经得到的结果。",
    coachEn: "Design how you will observe, measure, or collect evidence; do not confuse design with results.",
    promptZh: "写下研究设计、变量与操作化、样本、程序，以及数据收集计划。",
    promptEn: "Write the design, variables and operationalization, sample, procedure, and data-collection plan.",
  },
  {
    key: "E",
    icon: "▦",
    zh: "经验概括",
    en: "Empirical Generalization",
    descZh: "从多个观察中整理出暂时性的经验规律。",
    descEn: "Organize observations into a provisional empirical pattern.",
    step: "observe",
    coachZh: "把已有证据整理成暂时性的经验规律，并保留它的适用范围。",
    coachEn: "Organize evidence into a provisional empirical pattern and keep its scope visible.",
    promptZh: "写下你的数据分析、主要结果、经验规律，以及它支持或修正了什么。",
    promptEn: "Write your analysis, main result, empirical pattern, and what it supports or revises.",
  },
  {
    key: "T",
    icon: "◌",
    zh: "理论与概念",
    en: "Theory & Concepts",
    descZh: "明确你用来理解现象的概念、关系和理论依据。",
    descEn:
      "Clarify the concepts, relationships and theory used to understand the phenomenon.",
    step: "proposition",
    coachZh: "从现象和相关文献出发，发展你自己的概念与理论解释。",
    coachEn: "Develop your concepts and theoretical explanation from the phenomenon and relevant literature.",
    promptZh: "写下核心概念、理论依据、文献批判，以及你形成的理论命题。",
    promptEn: "Write the core concepts, theoretical basis, literature critique, and your theoretical proposition.",
  },
  {
    key: "H",
    icon: "✦",
    zh: "命题与假设",
    en: "Propositions & Hypotheses",
    descZh: "把解释写成可能被证据支持或反驳的命题与假设。",
    descEn:
      "Turn an explanation into propositions and hypotheses that evidence could support or challenge.",
    step: "prediction",
    coachZh: "把理论解释推进为逻辑上可以被证据支持或反驳的命题与假设。",
    coachEn: "Turn the explanation into testable propositions and hypotheses that evidence could support or challenge.",
    promptZh: "写下逻辑推演、假设、预测、替代解释，以及由此形成的研究问题。",
    promptEn: "Write the deduction, hypothesis, prediction, alternatives, and research question that follows.",
  },
];

const ENTRY_ORDER: NodeKey[] = ["T", "H", "E", "O"];
/* 顶部工作导航只呈现四张卡：当前卡片 + 左侧上一项 + 右侧两项。
   用线性顺序表达 Wallace 环的 x 轴运动：O → E → T → H → O。 */
const CYCLE_ORDER: NodeKey[] = ["O", "E", "T", "H"];

const MINI_QUESTIONS = [
  {
    key: "cause",
    zh: "你认为它可能是因为什么？",
    en: "What do you think might cause it?",
  },
  {
    key: "boundary",
    zh: "这个解释有什么前提和边界？",
    en: "What premises and boundaries does this explanation have?",
  },
  {
    key: "alternative",
    zh: "还有没有其他可能的解释？",
    en: "Could there be another explanation?",
  },
] as const;

function initialBrainstorm(text: string) {
  const now = new Date().toISOString();
  return {
    ...normBrainstorm({}),
    status: "探索中",
    currentStep: "idea" as const,
    steps: { idea: { text, updatedAt: now } },
  };
}

export function ScienceCycle({
  onNavigate,
  onOpenIdea,
  onNodeSelect,
  initialNode,
  compact = false,
  nodeOnly = false,
}: {
  onNavigate?: (route: string) => void;
  onOpenIdea?: (ideaId: string, step: string) => void;
  onNodeSelect?: (node: NodeKey) => void;
  initialNode?: NodeKey;
  compact?: boolean;
  /** 从顶部 T/H/O/E 导航进入时，直接显示工作区，不重复展示入口环。 */
  nodeOnly?: boolean;
}) {
  const { lang } = useI18n();
  const { active, mutate } = useProject();
  const [focusedKey, setFocusedKey] = useState<NodeKey | null>(initialNode ?? null);
  const [mode, setMode] = useState<"idle" | "input" | "mini" | "choose">(
    "idle",
  );
  const [rawIdea, setRawIdea] = useState("");
  /* 研究推理空间：direction = 分流选择 */
  const [direction, setDirection] = useState<"undecided" | "theorizing" | "cycle">("undecided");
  /* 当前 Idea 的研究状态（存 brainstorm.researchState，只追加不覆盖） */
  const [research, setResearch] = useState<ResearchState>(emptyResearchState());
  const [miniIndex, setMiniIndex] = useState(0);
  const [miniAnswers, setMiniAnswers] = useState<Record<string, string>>({});
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null);
  const [cycleIndex, setCycleIndex] = useState(() => {
    const index = initialNode ? CYCLE_ORDER.indexOf(initialNode) : 0;
    return index >= 0 ? index : 0;
  });
  const [enteredTrack, setEnteredTrack] = useState<Track | null>(null);
  const [currentNode, setCurrentNode] = useState<NodeKey | null>(null);
  const [nodeDraft, setNodeDraft] = useState("");
  const [nodeDrafts, setNodeDrafts] = useState<Partial<Record<NodeKey, string>>>({});
  const [suggestedNode, setSuggestedNode] = useState<NodeKey | null>(null);
  const [piaBusy, setPiaBusy] = useState(false);
  const [piaAnswer, setPiaAnswer] = useState("");
  /* 0 = 不滑到工作卡片；> 0 = 触发滚动。
     用 number 计数器：boolean true 重复设会被 React bailout，
     number +1 才能确保 useEffect 每次都重跑。 */
  const [scrollToWorkCard, setScrollToWorkCard] = useState(0);
  const workCardRef = useRef<HTMLElement | null>(null);
  const nodeInputRef = useRef<HTMLTextAreaElement | null>(null);
  /* 轮播拖动：记录 pointerdown 起点，pointerup 时位移 > 46px 触发旋转 */
  const pointerStartX = useRef<number | null>(null);
  const ideas = useMemo(() => (active ? readIdeas(active) : []), [active]);

  /* 两阶段交互（产品文档 §7.4 / §7.5）：
     阶段一：点击邻居卡 / 箭头 / 拖动 / 键盘 ← → → 只旋转环，卡成为「当前位置」；
     阶段二：CTA 或点击当前卡 → 显式进入该节点工作区。 */
  function focusNode(key: NodeKey) {
    if (onNodeSelect) {
      onNodeSelect(key);
      return;
    }
    setFocusedKey(key);
    /* 环同步到工作节点：工作卡打开时，环上的当前卡停在同一个位置 */
    const nextIndex = CYCLE_ORDER.indexOf(key);
    if (nextIndex >= 0) setCycleIndex(nextIndex);
    setNodeDraft(nodeDrafts[key] || "");
    setScrollToWorkCard((t) => t + 1);
    setPiaAnswer("");
    setResearch((r) => ({ ...r, mode: "cycle", updatedAt: new Date().toISOString() }));
  }

  /* 阶段一：点击环上某卡（非当前卡）→ 该卡转中，成为当前位置；不进入工作区 */
  function selectCycleNode(key: NodeKey) {
    const nextIndex = CYCLE_ORDER.indexOf(key);
    if (nextIndex >= 0) setCycleIndex(nextIndex);
  }

  function rotateCycle(direction: -1 | 1) {
    const nextIndex = (cycleIndex + direction + CYCLE_ORDER.length) % CYCLE_ORDER.length;
    setCycleIndex(nextIndex);
  }

  /* 阶段二：在当前位置显式进入工作区（滚动到节点工作卡并聚焦输入） */
  function openWorkNode(key: NodeKey) {
    focusNode(key);
  }

  function onCarouselPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onCarouselPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) > 46) rotateCycle(distance < 0 ? 1 : -1);
  }
  function onCarouselPointerCancel() {
    pointerStartX.current = null;
  }
  function onCarouselKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      rotateCycle(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      rotateCycle(1);
    }
  }

  /* 节点属于演绎（T/H）还是归纳（O/E）半边 */
  function reasonSide(key: NodeKey): "deduction" | "induction" {
    return key === "T" || key === "H" ? "deduction" : "induction";
  }

  /* Pia! 帮助（可选，不落库） */
  async function askPia() {
    if (!focused) return;
    setPiaBusy(true);
    setPiaAnswer("");
    try {
      const side = reasonSide(focused.key);
      const res = await askAssistant({
        page: "science-cycle",
        prompt:
          "用户正在科学环的「" + (lang === "en" ? focused.en : focused.zh) + "」节点（" +
          (side === "deduction" ? "演绎推理" : "归纳推理") + "半边）。" +
          (side === "deduction"
            ? "这一步是从理论/概念推导出可检验的假设与预测。"
            : "这一步是从观察/证据归纳出经验规律。") +
          "\n用户已写：" + (nodeDraft || "（还没写）") +
          "\n请只解释这一步怎么做、给一个例子，不要替用户写结论。",
        project: { id: active?.id || "", name: active?.name || "", milestones: [], steps: [] },
        context: { research_question: "", fields: [] },
        language: lang === "en" ? "en" : "zh-CN",
        ai_config: {},
      });
      setPiaAnswer(res.content || "");
    } catch (err) {
      setPiaAnswer("Pia! 暂时不可用：" + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPiaBusy(false);
    }
  }

  useEffect(() => {
    if (nodeOnly || !focusedKey || scrollToWorkCard === 0) return;
    /* 等工作卡片 mount 完，再带动画地滚到它；并把光标定位到 textarea（避免浏览器默认 scrollIntoView 抢先滚） */
    window.requestAnimationFrame(() => {
      if (workCardRef.current) {
        workCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      window.requestAnimationFrame(() => {
        nodeInputRef.current?.focus({ preventScroll: true });
      });
    });
  }, [focusedKey, scrollToWorkCard]);

  useEffect(() => {
    if (initialNode) {
      setFocusedKey(initialNode);
      const nextIndex = CYCLE_ORDER.indexOf(initialNode);
      if (nextIndex >= 0) setCycleIndex(nextIndex);
      setNodeDraft(nodeDrafts[initialNode] || "");
      setScrollToWorkCard((value) => value + 1);
    }
  }, [initialNode]);

  function startIdea() {
    const scrollTop = window.scrollY;
    setRawIdea("");
    setMiniAnswers({});
    setMiniIndex(0);
    setSavedIdeaId(null);
    setEnteredTrack(null);
    setCurrentNode(null);
    setSuggestedNode(null);
    setDirection("undecided");
    setMode("input");
    setScrollToWorkCard(0);
    window.requestAnimationFrame(() => window.scrollTo(0, scrollTop));
  }
  function continueMini() {
    if (rawIdea.trim()) setMode("mini");
  }
  /* 输入 Idea 后分流：发展理论 / 检验想法 / 先理解 */
  function chooseDirection(d: "theorizing" | "cycle") {
    setDirection(d);
    setResearch((r) => ({ ...r, mode: d, explore: { direction: d } }));
  }
  function openExploreFirst() {
    setDirection("undecided");
    setResearch((r) => ({ ...r, mode: "theorizing", explore: { direction: "undecided" } }));
  }

  function saveIdea(track?: Track, node?: NodeDef) {
    const text = rawIdea.trim();
    if (!text || !active) return null;
    const id = newIdeaId();
    const now = new Date().toISOString();
    const base = initialBrainstorm(text);
    const answerSteps = Object.fromEntries(
      Object.entries(miniAnswers).map(([key, value]) => [
        key,
        { text: value, updatedAt: now },
      ]),
    );
    const idea: Idea = {
      id,
      text,
      origin: "life",
      category: classifyIdea(text),
      status: "idea",
      lifecycle: "active",
      created: now,
      tags: [],
      brainstorm: { ...base, steps: { ...base.steps, ...answerSteps } },
    };
    if (idea.brainstorm)
      idea.brainstorm.scienceCycle = {
        mini: miniAnswers,
        enteredTracks: track ? [track] : [],
        currentNode: node?.key ?? null,
        completedNodes: [],
        nodeNotes: node ? { [node.key]: "" } : {},
      };
    /* 研究推理空间状态：初始 explore，保存到 idea */
    if (idea.brainstorm) idea.brainstorm.researchState = emptyResearchState();
    mutate((project) => {
      const notes = (project.notes ?? {}) as Record<string, unknown>;
      const current = Array.isArray(notes.ideasV2) ? notes.ideasV2 : [];
      notes.ideasV2 = [idea, ...current];
      project.notes = notes;
    });
    setSavedIdeaId(id);
    return id;
  }

  function chooseEntryNode(key: NodeKey) {
    const node = NODES.find((item) => item.key === key);
    if (!node) return;
    const track: Track = key === "T" || key === "H" ? "theory" : "empirical";
    setEnteredTrack(track);
    setCurrentNode(node.key);
    const id = saveIdea(track, node);
    if (id) {
      if (onOpenIdea) onOpenIdea(id, node.step);
      else onNavigate?.("brainstorm");
    }
  }

  function confirmNode() {
    if (focusedKey) {
      const map: Record<NodeKey, keyof CycleState> = { T: "theory", H: "hypothesis", O: "observation", E: "generalization" };
      setResearch((r) => ({
        ...r,
        cycle: { ...r.cycle, [map[focusedKey]]: nodeDraft },
        updatedAt: new Date().toISOString(),
      }));
    }
    const node = NODES.find((n) => n.key === focusedKey);
    if (!node) return;
    setNodeDrafts((drafts) => ({ ...drafts, [node.key]: nodeDraft }));
    if (savedIdeaId && active) {
      mutate((project) => {
        const notes = (project.notes ?? {}) as Record<string, unknown>;
        const current = Array.isArray(notes.ideasV2) ? notes.ideasV2 : [];
        notes.ideasV2 = current.map((item) => {
          if (!item || typeof item !== "object" || (item as Idea).id !== savedIdeaId)
            return item;
          const idea = item as Idea;
          const brainstorm = idea.brainstorm || normBrainstorm({});
          return {
            ...idea,
            brainstorm: {
              ...brainstorm,
              steps: {
                ...brainstorm.steps,
                [node.step]: { text: nodeDraft, updatedAt: new Date().toISOString() },
              },
              scienceCycle: {
                ...(brainstorm.scienceCycle || {}),
                currentNode: node.key,
                nodeNotes: {
                  ...(brainstorm.scienceCycle?.nodeNotes || {}),
                  [node.key]: nodeDraft,
                },
                completedNodes: Array.from(
                  new Set([...(brainstorm.scienceCycle?.completedNodes || []), node.key]),
                ),
              },
            },
          };
        });
        project.notes = notes;
      });
    }
    setCurrentNode(node.key);
    const nextNode: Partial<Record<NodeKey, NodeKey>> = { T: "H", H: "O", O: "E", E: "T" };
    setSuggestedNode(nextNode[node.key] ?? null);
    setFocusedKey(null);
      }

  const focused = NODES.find((n) => n.key === focusedKey) || null;
  const activeNode = NODES.find((n) => n.key === CYCLE_ORDER[cycleIndex]) ?? null;
  const q = MINI_QUESTIONS[miniIndex];
  const miniAnswer = miniAnswers[q.key] || "";

  return (
    <div className={`science-cycle-page${nodeOnly ? " science-node-only-page" : ""}`}>
      {!compact ? <div className="science-cycle-intro">
        <div>
          <span className="eyebrow">Research thinking / Wallace</span>
          <h1>
            {lang === "en"
              ? "The Wallace scientific cycle"
              : "华莱士科学环"}
          </h1>
          <p>
            {lang === "en"
              ? "Research moves between experience and theory: observations form patterns, patterns connect to concepts, predictions meet evidence, and evidence revises our understanding."
              : "研究在经验与理论之间往返：从观察形成经验概括，把概括连接到理论与概念，再提出预测，最后用证据修正我们的理解。"}
          </p>
          <p className="science-cycle-citation">
            {lang === "en" ? (
              <>Adapted from Walter L. Wallace, <cite>The Logic of Science in Sociology</cite> (1971).</>
            ) : (
              <>思路参考 Walter L. Wallace，<cite>The Logic of Science in Sociology</cite>（1971）。科学研究可以从经验观察、理论或假设等不同位置进入。</>
            )}{" "}
            <a href="https://books.google.com/books?id=-qLrAAAAMAAJ" target="_blank" rel="noreferrer">Source</a>
          </p>
        </div>
      </div> : null}
      <div className="wallace-cycle">
        {/* 完整 Wallace 经典科学环示意图（教科书风格 · 垂直循环，方法学总览） */}
        <WallaceCycleOverview className="wallace-overview-card" />

        {/* 主视觉：O → E → T → H → O 水平循环（对齐 science-cycle-demo.html）：
           当前卡居中完整，两端邻居露出并灰罩；点击邻居卡 / 箭头 / 拖动 / 键盘旋转。 */}
        <div className="wc-cycle-shell">
          <button
            type="button"
            className="wc-carousel-arrow previous"
            onClick={() => rotateCycle(-1)}
            aria-label={lang === "en" ? "Previous cycle node" : "上一个科学环节点"}
          >‹</button>
          <div
            className="wc-carousel-viewport"
            tabIndex={0}
            role="group"
            aria-label={lang === "en" ? "Wallace cycle: rotate with arrows, drag, or keyboard" : "华莱士科学环：用左右键或拖动旋转"}
            onKeyDown={onCarouselKeyDown}
            onPointerDown={onCarouselPointerDown}
            onPointerUp={onCarouselPointerUp}
            onPointerCancel={onCarouselPointerCancel}
          >
            <div className="wc-carousel-track">
              {[0, 1, 2, 3].map((offset) => {
                const key = CYCLE_ORDER[(cycleIndex + offset - 1 + CYCLE_ORDER.length) % CYCLE_ORDER.length];
                const node = NODES.find((item) => item.key === key)!;
                const position = offset === 1 ? "active" : offset === 0 ? "previous" : offset === 2 ? "next" : "next2";
                const isCurrent = position === "active";
                return (
                  <button
                    key={offset}
                    type="button"
                    className={`wc-carousel-card ${position}${isCurrent ? "" : " side"}`}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={
                      isCurrent
                        ? (lang === "en" ? `Work at ${node.en}` : `在 ${node.zh} 工作`)
                        : (lang === "en" ? `Select ${node.en}` : `选择 ${node.zh}`)
                    }
                    onClick={() => (isCurrent ? openWorkNode(node.key) : selectCycleNode(node.key))}
                  >
                    <span className="wc-carousel-card-top">
                      <span className="wc-carousel-card-key">{node.key}</span>
                      <span className="wc-carousel-card-icon" aria-hidden="true">{node.icon}</span>
                    </span>
                    <strong>{lang === "en" ? node.en : node.zh}</strong>
                    <span className="wc-carousel-card-desc">{lang === "en" ? node.descEn : node.descZh}</span>
                    {isCurrent ? <em>{lang === "en" ? "Current position" : "当前位置"}</em> : null}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="wc-carousel-arrow next"
            onClick={() => rotateCycle(1)}
            aria-label={lang === "en" ? "Next cycle node" : "下一个科学环节点"}
          >›</button>
          <p className="wc-carousel-hint">
            {lang === "en"
              ? "Click a neighbor card, drag, or use ← → to rotate. Click the active card to work at that node."
              : "点击左右卡片、拖动卡片，或使用键盘 ← → 旋转；点击当前卡，进入该节点工作。"}
          </p>
        </div>

        {/* 工作台 action 行（两阶段交互 §7.4）：先选位置，再显式进入工作区 */}
        <div className="wc-cycle-cta">
          <button type="button" className="btn" onClick={startIdea}>
            🧠 {lang === "en" ? "Enter an Idea" : "输入一个 Idea"}
          </button>
          {activeNode ? (
            focusedKey === activeNode.key ? (
              <button
                type="button"
                className="btn primary"
                onClick={() => setScrollToWorkCard((v) => v + 1)}
              >
                ✓ {lang === "en" ? `Working at ${activeNode.en} · back to workspace` : `正在「${activeNode.zh}」工作 · 回到工作卡`} ↑
              </button>
            ) : (
              <button type="button" className="btn primary" onClick={() => openWorkNode(activeNode.key)}>
                {lang === "en" ? `Work at ${activeNode.en} →` : `在「${activeNode.zh}」工作 →`}
              </button>
            )
          ) : null}
        </div>

        {/* Idea 分流：发展理论 / 检验想法 / 先理解（仅在保存 Idea 后出现） */}
        {savedIdeaId && direction === "undecided" ? (
          <div className="rs-branch card">
            <div className="rs-branch-idea"><span className="rs-branch-emoji">🧠</span><strong>{rawIdea}</strong></div>
            <p className="rs-branch-title">{lang === "en" ? "How would you like to work on this idea?" : "你想怎样发展这个 Idea？"}</p>
            <div className="rs-branch-actions">
              <button type="button" className="btn" onClick={() => chooseDirection("theorizing")}>
                🧩 {lang === "en" ? "Develop the Theory" : "发展这个理论"}
              </button>
              <button type="button" className="btn" onClick={() => chooseDirection("cycle")}>
                🧪 {lang === "en" ? "Test the Idea" : "检验这个想法"}
              </button>
              <button type="button" className="btn" onClick={openExploreFirst}>
                🔍 {lang === "en" ? "Explore First" : "先帮我理解这个 Idea"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Theorizing 空间：仅当研究推理模式为「理论发展」时展开（纯理论可独立成立） */}
        {research.mode === "theorizing" ? (
          <div className="rs-theorizing card">
            <div className="rs-theorizing-head">
              <div>
                <span className="rs-section-tag">Theorizing</span>
                <strong>{lang === "en" ? "Theory Development" : "理论发展"}</strong>
                <small>{lang === "en" ? "Not every study needs new data. Sometimes, theory itself is the contribution." : "不是所有研究都需要新的数据。有时候，理论本身就是贡献。"}</small>
              </div>
              <button type="button" className="btn small" onClick={() => setResearch((r) => ({ ...r, mode: "cycle", updatedAt: new Date().toISOString() }))}>
                {lang === "en" ? "Enter empirical test →" : "进入实证检验 →"}
              </button>
            </div>
            <div className="rs-theorizing-grid">
              {([["literature", "📚", "Literature & Existing Theory", "已有文献与理论", "已有理论、解释、机制、实证发现"],
                ["puzzle", "⚡", "Gap / Tension / Puzzle", "缺口、张力与谜题", "理论矛盾、无法解释的现象、边界条件"],
                ["constructs", "🧩", "Constructs", "概念与构念", "定义 construct、区分相似概念、边界"],
                ["mechanisms", "⚙️", "Mechanism", "机制", "Why does X lead to Y? 因果/心理/社会机制"],
                ["integration", "🔗", "Integration", "理论整合", "连接理论、比较竞争解释、建立框架"],
                ["propositions", "💡", "Propositions", "理论命题", "If X, then Y, because M, especially when Z"],
                ["theory", "📐", "Theory / Conceptual Model", "理论 / 概念模型", "新理论、扩展理论、过程模型、类型学"]] as const).map(([key, icon, en, zh, hint]) => (
                <label key={key} className="rs-theorizing-field">
                  <span className="rs-field-label">{icon} {lang === "en" ? en : zh}</span>
                  <textarea
                    className="textarea rs-field-input"
                    value={research.theorizing[key as keyof TheorizingState]}
                    onChange={(e) =>
                      setResearch((r) => ({
                        ...r,
                        theorizing: { ...r.theorizing, [key]: e.target.value },
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                    placeholder={hint}
                  />
                </label>
              ))}
            </div>
            <div className="rs-theorizing-actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  /* 保存理论发展为一个 iteration（纯理论可停在此） */
                  setResearch((r) => ({
                    ...r,
                    iterations: [
                      ...r.iterations,
                      { v: r.iterations.length + 1, theory: r.theorizing.theory, hypotheses: [], evidence: [], generalization: "", createdAt: new Date().toISOString() },
                    ],
                    updatedAt: new Date().toISOString(),
                  }));
                }}
              >
                {lang === "en" ? "Keep developing theory" : "继续发展理论"}
              </button>
              <button type="button" className="btn primary" onClick={() => setResearch((r) => ({ ...r, mode: "cycle", updatedAt: new Date().toISOString() }))}>
                {lang === "en" ? "Enter empirical test →" : "进入实证检验 →"}
              </button>
            </div>
            {/* 迭代历史（只追加不覆盖） */}
            {research.iterations.length > 0 ? (
              <details className="rs-iterations">
                <summary>{lang === "en" ? `Iteration history (${research.iterations.length})` : `迭代历史（${research.iterations.length}）`}</summary>
                <div className="rs-iterations-list">
                  {research.iterations.slice().reverse().map((it) => (
                    <div key={it.v} className="rs-iter-row">
                      <span className="rs-iter-v">{lang === "en" ? `It.${it.v}` : `迭代 ${it.v}`}</span>
                      <span className="rs-iter-theory">{(it.theory || (lang === "en" ? "(empty)" : "（空）")).slice(0, 120)}</span>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
      {focused ? (
        <section ref={workCardRef} className="science-node-work-card card">
          <div className="head">
            <div>
              <h2>{lang === "en" ? focused.en : focused.zh}</h2>
              <h3>{lang === "en" ? focused.descEn : focused.descZh}</h3>
            </div>
            <div className="science-work-head-right">
              <span className={`wc-reason-badge ${reasonSide(focused.key)}`}>
                {reasonSide(focused.key) === "deduction"
                  ? (lang === "en" ? "Deduction" : "演绎推理")
                  : (lang === "en" ? "Induction" : "归纳推理")}
              </span>
              <span className="science-node-work-code">{focused.key}</span>
            </div>
          </div>
          <p className="science-node-coach">
            {lang === "en"
              ? focused.coachEn
              : focused.coachZh}
          </p>
          <div className="science-pia-row">
            <button type="button" className="btn small" onClick={askPia} disabled={piaBusy}>
              {piaBusy
                ? (lang === "en" ? "Pia! is thinking…" : "Pia! 思考中…")
                : (lang === "en" ? "Ask Pia! to clarify this step" : "请 Pia! 讲解这一步")}
            </button>
            {piaAnswer ? <div className="science-pia-answer"><b>Pia!</b><p>{piaAnswer}</p></div> : null}
          </div>
          <div className="science-node-purpose">
            <span>{lang === "en" ? "Your result" : "这一节点要留下的成果"}</span>
            <p>{lang === "en" ? focused.promptEn : focused.promptZh}</p>
          </div>
          <textarea
            ref={nodeInputRef}
            className="textarea science-node-input"
            value={nodeDraft}
            onChange={(e) => setNodeDraft(e.target.value)}
            placeholder={
              lang === "en"
                ? focused.promptEn
                : focused.promptZh
            }
          />
          <div className="science-workspace-actions">
            <button type="button" className="btn primary" onClick={confirmNode}>
              {lang === "en" ? "Save this step" : "保存这一步"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const order: NodeKey[] = ["T", "H", "O", "E"];
                const idx = order.indexOf(focused.key);
                const next = order[(idx + 1) % order.length];
                focusNode(next);
              }}
            >
              {lang === "en" ? "Next stage (clockwise)" : "下一步（顺时针）"} →
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setFocusedKey(null);
                setScrollToWorkCard(0);
              }}
            >
              {lang === "en" ? "Close" : "关闭"}
            </button>
          </div>
        </section>
      ) : null}
      {savedIdeaId && !focused && suggestedNode ? (
        <section className="science-cross-track" aria-label={lang === "en" ? "Continue this Idea" : "继续这个 Idea"}>
          <div>
            <strong>{lang === "en" ? "Continue the same Idea" : "继续研究同一个 Idea"}</strong>
            <p>
              {lang === "en"
                ? "Your next step can stay on this track or move across the Wallace cycle."
                : "你可以继续当前研究，也可以把同一个 Idea 带到另一条研究路径。"}
            </p>
          </div>
          <button type="button" className="btn primary" onClick={() => focusNode(suggestedNode)}>
            {lang === "en"
              ? `Open ${suggestedNode}`
              : suggestedNode === "O" ? "进入 O 观察与证据" : suggestedNode === "T" ? "回到 T 理论与概念" : `进入 ${suggestedNode}`}
            →
          </button>
        </section>
      ) : null}
      {enteredTrack ? (
        <div className="science-node-progress">
          <span>
            {lang === "en"
              ? `${enteredTrack === "theory" ? "Theory" : "Empirical"} track entered`
              : `已进入${enteredTrack === "theory" ? "理论" : "实证"}轨道`}
          </span>
          <div>
            {NODES.map((node) => (
              <i
                key={node.key}
                className={currentNode === node.key ? "current" : ""}
              >
                {node.key}
              </i>
            ))}
          </div>
          <small>
            {lang === "en"
              ? `Current node: ${currentNode}`
              : `当前节点：${currentNode}`}
          </small>
        </div>
      ) : null}
      {mode !== "idle" ? (
        <section className="science-idea-workspace card">
          <div className="head">
            <div>
              <h2>
                {mode === "input"
                  ? lang === "en"
                    ? "Start with curiosity"
                    : "从好奇开始"
                  : mode === "mini"
                    ? lang === "en"
                      ? "One question at a time"
                      : "一次只问一个问题"
                    : lang === "en"
                      ? "Choose where to enter the cycle"
                      : "选择你的科学环入口"}
              </h2>
              <h3>
                {lang === "en"
                  ? "Pia! helps clarify; you keep the judgment."
                  : "Pia! 只帮助澄清，判断始终由你保留。"}
              </h3>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setMode("idle")}
            >
              ×
            </button>
          </div>
          {mode === "input" ? (
            <>
              <label className="field">
                <span>{lang === "en" ? "Your Idea" : "你的 Idea"}</span>
                <textarea
                  className="textarea science-idea-input"
                  autoFocus
                  value={rawIdea}
                  onChange={(e) => setRawIdea(e.target.value)}
                  placeholder={
                    lang === "en"
                      ? "A question, observation, intuition, or confusion…"
                      : "一个疑问、观察、直觉或困惑……"
                  }
                />
              </label>
              <div className="science-workspace-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={!rawIdea.trim()}
                  onClick={continueMini}
                >
                  {lang === "en" ? "Begin clarification" : "开始澄清"} →
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!rawIdea.trim()}
                  onClick={() => {
                    const id = saveIdea();
                    if (id) setMode("idle");
                  }}
                >
                  {lang === "en" ? "Save raw Idea" : "只保存原始 Idea"}
                </button>
              </div>
            </>
          ) : null}
          {mode === "mini" ? (
            <>
              <div className="science-mini-progress">
                <span>
                  {miniIndex + 1} / {MINI_QUESTIONS.length}
                </span>
                <i
                  style={{
                    width: `${((miniIndex + 1) / MINI_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>
              <p className="science-mini-question">
                {lang === "en" ? q.en : q.zh}
              </p>
              <textarea
                className="textarea science-mini-answer"
                autoFocus
                value={miniAnswer}
                onChange={(e) =>
                  setMiniAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                }
                placeholder={
                  lang === "en"
                    ? "Write in your own words…"
                    : "用你自己的话写下来……"
                }
              />
              <div className="science-workspace-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={!miniAnswer.trim()}
                  onClick={() =>
                    miniIndex < MINI_QUESTIONS.length - 1
                      ? setMiniIndex((i) => i + 1)
                      : setMode("choose")
                  }
                >
                  {miniIndex < MINI_QUESTIONS.length - 1
                    ? lang === "en"
                      ? "Next question"
                      : "下一个问题"
                    : lang === "en"
                      ? "Review my thinking"
                      : "查看我的思考"}{" "}
                  →
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setMode("input")}
                >
                  {lang === "en" ? "Back" : "返回"}
                </button>
              </div>
              <div className="science-live-result">
                <b>{lang === "en" ? "Your Idea" : "你的 Idea"}</b>
                <p>{rawIdea}</p>
                {Object.entries(miniAnswers)
                  .filter(([, v]) => v.trim())
                  .map(([key, value]) => (
                    <div key={key}>
                      <small>
                        {lang === "en"
                          ? MINI_QUESTIONS.find((x) => x.key === key)?.en
                          : MINI_QUESTIONS.find((x) => x.key === key)?.zh}
                      </small>
                      <p>{value}</p>
                    </div>
                  ))}
              </div>
            </>
          ) : null}
          {mode === "choose" ? (
            <>
              <div className="science-mini-summary">
                <b>
                  {lang === "en"
                    ? "You have clarified the Idea enough to choose a direction."
                    : "你已经完成了初步澄清，可以选择接下来从哪里进入科学环。"}
                </b>
                <p>{rawIdea}</p>
              </div>
              <p className="science-entry-guidance">
                {lang === "en"
                  ? "Research can begin at any node. Choose the part of your Idea that is clearest now."
                  : "研究可以从任意节点开始。请选择此刻最清楚、最想继续发展的部分。"}
              </p>
              <div className="science-track-choice">
                {ENTRY_ORDER.map((key) => {
                  const node = NODES.find((item) => item.key === key)!;
                  const theory = key === "T" || key === "H";
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`science-choice-card ${theory ? "theory" : "empirical"}`}
                      onClick={() => chooseEntryNode(key)}
                    >
                      <span className="science-choice-icon" aria-hidden="true">{node.icon}</span>
                      <strong>{lang === "en" ? node.en : node.zh}</strong>
                      <small>{lang === "en" ? node.descEn : node.descZh}</small>
                      <em>
                        {lang === "en"
                          ? theory ? "Theory research" : "Empirical research"
                          : theory ? "理论研究" : "实证研究"}
                      </em>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const id = saveIdea();
                  if (id) setMode("idle");
                }}
              >
                {lang === "en"
                  ? "Save without choosing an entry"
                  : "暂不选择入口，只保存"}
              </button>
            </>
          ) : null}
        </section>
      ) : null}
      {savedIdeaId ? (
        <span className="science-saved-note" aria-live="polite">
          {lang === "en" ? "Idea saved locally." : "Idea 已保存在本地。"}
        </span>
      ) : null}
      {ideas.length ? (
        <div className="science-existing-note">
          {lang === "en"
            ? `${ideas.length} saved Idea${ideas.length === 1 ? "" : "s"} in this project.`
            : `当前项目已有 ${ideas.length} 个 Idea，可从研究探索继续。`}
        </div>
      ) : null}
      {/* 产品原则 footer（架构约束） */}
      <div className="wc-principles">
        <p>{lang === "en"
          ? "Research has no fixed start and no fixed end."
          : "研究没有固定起点，也没有固定终点。"}</p>
        <p>{lang === "en"
          ? "P-Layer doesn't run a pipeline for you — it keeps you working between Idea, Theory and Evidence."
          : "P-Layer 不是替用户跑完一条流程，而是让用户在 Idea、Theory 与 Evidence 之间持续工作。"}</p>
      </div>
    </div>
  );
}
