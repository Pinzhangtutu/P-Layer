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
import { readIdeas } from "../lib/ideas";
import { WallaceCycleOverview } from "./WallaceCycleOverview";

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

/* 用线性顺序表达 Wallace 环的 x 轴运动：O → E → T → H → O。 */
const CYCLE_ORDER: NodeKey[] = ["O", "E", "T", "H"];

type NodeNotes = Partial<Record<NodeKey, string>>

/** 项目级「科学环工作台」：各节点草稿独立于 Idea 库。
    方案 3（用户 09-03）：科学环 = 认知导航 + 当前节点工作台，
    不在环内再生成一套 Idea 管理/头脑风暴界面。 */
const CYCLE_WS_KEY = "cycleWorkspace"

function readCycleWorkspace(project: { notes?: Record<string, unknown> } | null | undefined): NodeNotes {
  const ws = project?.notes?.[CYCLE_WS_KEY] as { nodeNotes?: NodeNotes } | undefined
  const notes = ws?.nodeNotes
  return notes && typeof notes === "object" ? (notes as NodeNotes) : {}
}

/**
 * 科学环（方案 3 收敛版 · 2026-09-03）
 *
 * 科学环 = 认知导航（O/E/T/H 轮播）+ 当前节点工作台：
 *   - O/T 双入口提示：经验观察 与 理论/文献 是两大入口（§7.2）
 *   - 轮播四卡：O → E → T → H → O，点击邻居卡/箭头/拖动/键盘旋转
 *   - 点当前卡 → 该节点工作卡：写下这一节点要留下的成果，保存到
 *     项目级 notes.cycleWorkspace（不创建 Idea）；Pia! 只可选讲解
 *   - CTA「输入一个 Idea」→ 顶部一级「头脑风暴」页（捕捉/澄清/发展 Idea）
 *
 * 不再包含：环内 Idea 捕获（mini 澄清/三路分流/theorizing 理论发展区）。
 * 这些职责交给一级「头脑风暴 + 研究库」。
 */
export function ScienceCycle({
  onNavigate,
  onNodeSelect,
  initialNode,
  compact = false,
  nodeOnly = false,
}: {
  onNavigate?: (route: string) => void;
  onNodeSelect?: (node: NodeKey) => void;
  initialNode?: NodeKey;
  compact?: boolean;
  /** 从顶部 T/H/O/E 导航进入时，直接显示工作区，不重复展示入口环。 */
  nodeOnly?: boolean;
}) {
  const { lang } = useI18n();
  const { active, mutate } = useProject();
  const [focusedKey, setFocusedKey] = useState<NodeKey | null>(initialNode ?? null);
  const [cycleIndex, setCycleIndex] = useState(() => {
    const index = initialNode ? CYCLE_ORDER.indexOf(initialNode) : 0;
    return index >= 0 ? index : 0;
  });
  const [nodeDrafts, setNodeDrafts] = useState<NodeNotes>(() =>
    readCycleWorkspace(active),
  );
  const [nodeDraft, setNodeDraft] = useState("");
  const [piaBusy, setPiaBusy] = useState(false);
  const [piaAnswer, setPiaAnswer] = useState("");
  /* 0 = 不滑到工作卡片；> 0 = 触发滚动。
     用 number 计数器：boolean true 重复设会被 React bailout，
     number +1 才能确保 useEffect 每次都重跑。 */
  const [scrollToWorkCard, setScrollToWorkCard] = useState(0);
  const workCardRef = useRef<HTMLElement | null>(null);
  const nodeInputRef = useRef<HTMLTextAreaElement | null>(null);

  const pointerStartX = useRef<number | null>(null);
  const ideas = useMemo(() => (active ? readIdeas(active) : []), [active]);

  /* 方案 3：工作台只管理「当前节点草稿」——环不建立 Idea。
     active 切换时重新加载项目级 cycleWorkspace。 */
  useEffect(() => {
    setNodeDrafts(readCycleWorkspace(active));
  }, [active]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNode]);

  /* 保存当前节点成果：只写入项目级 notes.cycleWorkspace（方案 3），
     不创建 Idea、不改 ideasV2 —— Idea 的形成属于一级头脑风暴/研究库。 */
  function confirmNode() {
    const node = NODES.find((n) => n.key === focusedKey);
    if (!node) return;
    setNodeDrafts((drafts) => ({ ...drafts, [node.key]: nodeDraft }));
    if (active) {
      mutate((p) => {
        const notes = (p.notes ?? {}) as Record<string, unknown>;
        const prev = (notes[CYCLE_WS_KEY] as { nodeNotes?: NodeNotes } | undefined) ?? {};
        notes[CYCLE_WS_KEY] = {
          ...prev,
          nodeNotes: { ...(prev.nodeNotes ?? {}), [node.key]: nodeDraft },
          updatedAt: new Date().toISOString(),
        };
        p.notes = notes;
      });
    }
    setFocusedKey(null);
    setPiaAnswer("");
  }

  const focused = NODES.find((n) => n.key === focusedKey) || null;
  const activeNode = NODES.find((n) => n.key === CYCLE_ORDER[cycleIndex]) ?? null;

  return (
    <div className={`science-cycle-page${nodeOnly ? " science-node-only-page" : ""}`}>
      {!compact ? (
        <div className="science-cycle-intro">
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
        </div>
      ) : null}
      <div className="wallace-cycle">
        {/* 主视觉：O → E → T → H → O 水平循环。
           Wallace 的完整方法论图默认收起为「讲解视图」；主界面聚焦可操作的
           四节点认知导航 + 当前节点工作台（方案 3，不占首屏）。 */}
        <details className="wallace-overview-collapse">
          <summary>
            {lang === "en" ? "📘 Wallace's full science cycle (textbook view)" : "📘 华莱士科学环完整示意图（教科书视图）"}
          </summary>
          <WallaceCycleOverview />
        </details>

        <div className="wc-cycle-orientation" aria-label={lang === "en" ? "Two entry points" : "科学环的两个入口"}>
          <span className="wc-cycle-orientation-label">{lang === "en" ? "Two ways in" : "两个主要入口"}</span>
          <span className="wc-cycle-entry observation"><b>O</b> {lang === "en" ? "Observation" : "经验观察"}</span>
          <span className="wc-cycle-orientation-arrow" aria-hidden="true">↔</span>
          <span className="wc-cycle-entry theory"><b>T</b> {lang === "en" ? "Theory / Literature" : "理论 / 文献"}</span>
          <span className="wc-cycle-orientation-note">{lang === "en" ? "An existing Idea may enter at any node." : "已有 Idea 可以从任意节点进入。"}</span>
        </div>

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

        {/* 工作台 action 行：输入 Idea 由一级头脑风暴承载（方案 3）；环内只进节点工作卡 */}
        <div className="wc-cycle-cta">
          <button type="button" className="btn primary" onClick={() => onNavigate?.("brainstorm")}>
            🧠 {lang === "en" ? "Enter an Idea (Brainstorm)" : "输入一个 Idea（去头脑风暴）"}
          </button>
          {activeNode ? (
            focusedKey === activeNode.key ? (
              <button
                type="button"
                className="btn"
                onClick={() => setScrollToWorkCard((v) => v + 1)}
              >
                ✓ {lang === "en" ? `Working at ${activeNode.en} · back to workspace` : `正在「${activeNode.zh}」工作 · 回到工作卡`} ↑
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => openWorkNode(activeNode.key)}>
                {lang === "en" ? `Work at ${activeNode.en} →` : `在「${activeNode.zh}」工作 →`}
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* 当前节点工作卡（方案 3：保存到项目级 cycleWorkspace，不创建 Idea） */}
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
              {lang === "en" ? "Save to cycle workspace" : "保存到环工作台"}
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
              {lang === "en" ? "Next node" : "下一节点（顺时针）"} →
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
      {ideas.length ? (
        <div className="science-existing-note">
          {lang === "en"
            ? `${ideas.length} saved Idea${ideas.length === 1 ? "" : "s"} in this project — brainstorm or manage them from the top nav.`
            : `当前项目已有 ${ideas.length} 个 Idea — 用顶部「头脑风暴 / 研究库」继续。`}
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
