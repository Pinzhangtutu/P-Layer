/**
 * 跨学科顶级/次顶级期刊库（P-Layer 研究库 · 用户 09-04 09-04 10:1x）
 *
 * 子领域覆盖：管理 / 营销 / 心理 / 组织行为 / 社会学 / 人类学 / 经济学
 *             传播学 / 信息科学 / 教育学
 * 每领域分 tier1（顶级）/ tier2（次顶级）。
 * RSS 字段：
 *   - 现有 RSS：qinhuanyu/marketing-journal-rss/{id}.xml 等可拉取源
 *   - 官方 RSS：刊物的 Early View / Articles in Press 官方订阅
 *   - 缺：留空字符串，扫描时跳过；UI 提示「用 Zotero 同步 / 等官方源」
 */

export type JournalTier = 'tier1' | 'tier2'

export type Journal = {
  abbr: string
  name: string
  publisher: string
  /** RSS URL；空表示当前无公开 RSS 源（建议 Zotero 集成） */
  rssUrl: string
  /** 早期出版阶段（Articles in Press / OnlineFirst / Early View / Accepted） */
  stage: string
  /** 刊主站（用户可点入） */
  webUrl: string
}

export type Subfield = {
  key: string
  zh: string
  en: string
  descZh: string
  descEn: string
  /** 顶级 */
  tier1: Journal[]
  /** 次顶级 */
  tier2: Journal[]
}

/* ---------- 1. 营销学 Marketing（qinhuanyu 9 个 RSS 源）---------- */
const marketing: Subfield = {
  key: 'marketing',
  zh: '营销学',
  en: 'Marketing',
  descZh: '消费者行为、品牌与市场策略、零售与服务、定价与渠道、营销模型与实证。',
  descEn: 'Consumer behavior, branding, retail, service, pricing, marketing models and field experiments.',
  tier1: [
    { abbr: 'JCR', name: 'Journal of Consumer Research', publisher: 'Oxford University Press', stage: 'Advance / Accepted', rssUrl: 'https://qinhuanyu.github.io/marketing-journal-rss/jcr.xml', webUrl: 'https://academic.oup.com/jcr' },
    { abbr: 'JAMS', name: 'Journal of the Academy of Marketing Science', publisher: 'Springer Nature', stage: 'Online First', rssUrl: 'https://qinhuanyu.github.io/marketing-journal-rss/jams.xml', webUrl: 'https://link.springer.com/journal/11747' },
    { abbr: 'JM', name: 'Journal of Marketing', publisher: 'SAGE / AMA', stage: 'OnlineFirst / Express', rssUrl: 'https://qinhuanyu.github.io/marketing-journal-rss/jm.xml', webUrl: 'https://journals.sagepub.com/home/jmx' },
    { abbr: 'JMR', name: 'Journal of Marketing Research', publisher: 'SAGE / AMA', stage: 'OnlineFirst / Express', rssUrl: 'https://qinhuanyu.github.io/marketing-journal-rss/jmr.xml', webUrl: 'https://journals.sagepub.com/home/mrj' },
  ],
  tier2: [
    { abbr: 'JCP', name: 'Journal of Consumer Psychology', publisher: 'Wiley / SCP', stage: 'Early View', rssUrl: 'https://qinhuanyu.github.io/marketing-journal-rss/jcp.xml', webUrl: 'https://onlinelibrary.wiley.com/journal/15327663' },
    { abbr: 'IJRM', name: 'International Journal of Research in Marketing', publisher: 'Elsevier / EMAC', stage: 'Articles in Press', rssUrl: 'https://qinhuanyu.github.io/marketing-journal-rss/ijrm.xml', webUrl: 'https://www.sciencedirect.com/journal/international-journal-of-research-in-marketing' },
    { abbr: 'JR', name: 'Journal of Retailing', publisher: 'Elsevier', stage: 'Articles in Press', rssUrl: 'https://qinhuanyu.github.io/marketing-journal-rss/jr.xml', webUrl: 'https://www.sciencedirect.com/journal/journal-of-retailing' },
    { abbr: 'JSR', name: 'Journal of Service Research', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: 'https://qinhuanyu.github.io/marketing-journal-rss/jsr.xml', webUrl: 'https://journals.sagepub.com/home/jsr' },
    { abbr: 'MS', name: 'Marketing Science', publisher: 'INFORMS', stage: 'Articles in Advance', rssUrl: 'https://qinhuanyu.github.io/marketing-journal-rss/ms.xml', webUrl: 'https://pubsonline.informs.org/journal/mksc' },
  ],
}

/* ---------- 2. 管理学 Management（UT-Dallas / FT50）---------- */
const management: Subfield = {
  key: 'management',
  zh: '管理学',
  en: 'Management',
  descZh: '战略、创业、运营与公司治理，UT-Dallas 与 FT50 顶级期刊。',
  descEn: 'Strategy, entrepreneurship, operations and corporate governance, top UT-Dallas / FT50 outlets.',
  tier1: [
    { abbr: 'AMR', name: 'Academy of Management Review', publisher: 'AOM', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://journals.aom.org/journal/amr' },
    { abbr: 'AMJ', name: 'Academy of Management Journal', publisher: 'AOM', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://journals.aom.org/journal/amj' },
    { abbr: 'ASQ', name: 'Administrative Science Quarterly', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/asq' },
    { abbr: 'OS', name: 'Organization Science', publisher: 'INFORMS', stage: 'Articles in Advance', rssUrl: '', webUrl: 'https://pubsonline.informs.org/journal/orsc' },
  ],
  tier2: [
    { abbr: 'SMJ', name: 'Strategic Management Journal', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/10970266' },
    { abbr: 'AME', name: 'Academy of Management Executive', publisher: 'AOM', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://journals.aom.org/journal/ame' },
    { abbr: 'JBE', name: 'Journal of Business Ethics', publisher: 'Springer', stage: 'Online First', rssUrl: '', webUrl: 'https://link.springer.com/journal/10551' },
    { abbr: 'JOM', name: 'Journal of Operations Management', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/18755923' },
  ],
}

/* ---------- 3. 组织行为学 OB（AIS basket / OB 顶级）---------- */
const ob: Subfield = {
  key: 'ob',
  zh: '组织行为学',
  en: 'Organizational Behavior',
  descZh: '态度、动机、领导力、谈判、团队，AIS 顶级与 OBHDP 等 OB 核心。',
  descEn: 'Attitudes, motivation, leadership, negotiation, teams — AIS basket and OBHDP.',
  tier1: [
    { abbr: 'PersonnelPsych', name: 'Personnel Psychology', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/17446570' },
    { abbr: 'JOB', name: 'Journal of Organizational Behavior', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/10991379' },
    { abbr: 'JAP', name: 'Journal of Applied Psychology', publisher: 'APA', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://www.apa.org/pubs/journals/apl' },
    { abbr: 'AMJ', name: 'Academy of Management Journal (OB strand)', publisher: 'AOM', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://journals.aom.org/journal/amj' },
  ],
  tier2: [
    { abbr: 'OBHDP', name: 'Organizational Behavior and Human Decision Processes', publisher: 'Elsevier', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://www.sciencedirect.com/journal/organizational-behavior-and-human-decision-processes' },
    { abbr: 'OSc', name: 'Organization Studies', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/oss' },
    { abbr: 'GOM', name: 'Group & Organization Management', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/dom' },
    { abbr: 'OS', name: 'Organization Science', publisher: 'INFORMS', stage: 'Articles in Advance', rssUrl: '', webUrl: 'https://pubsonline.informs.org/journal/orsc' },
  ],
}

/* ---------- 4. 心理学 Psychology（APA 顶级）---------- */
const psychology: Subfield = {
  key: 'psychology',
  zh: '心理学',
  en: 'Psychology',
  descZh: '社会与认知心理、情感、人格、神经心理；APA 顶级与 Annual Review 系列。',
  descEn: 'Social / cognitive psychology, emotion, personality, neuropsychology — APA top + AR series.',
  tier1: [
    { abbr: 'ARP', name: 'Annual Review of Psychology', publisher: 'Annual Reviews', stage: 'Online First', rssUrl: '', webUrl: 'https://www.annualreviews.org/journal/psych' },
    { abbr: 'PsychBulletin', name: 'Psychological Bulletin', publisher: 'APA', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://www.apa.org/pubs/journals/bul' },
    { abbr: 'PR', name: 'Psychological Review', publisher: 'APA', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://www.apa.org/pubs/journals/rev' },
    { abbr: 'JPSP', name: 'Journal of Personality and Social Psychology', publisher: 'APA', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://www.apa.org/pubs/journals/psp' },
    { abbr: 'JEPG', name: 'Journal of Experimental Psychology: General', publisher: 'APA', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://www.apa.org/pubs/journals/xge' },
  ],
  tier2: [
    { abbr: 'PsychSci', name: 'Psychological Science', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/pss' },
    { abbr: 'Cognition', name: 'Cognition', publisher: 'Elsevier', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://www.sciencedirect.com/journal/cognition' },
    { abbr: 'PSPR', name: 'Personality and Social Psychology Review', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/psr' },
    { abbr: 'SCAN', name: 'Social Cognitive and Affective Neuroscience', publisher: 'Oxford', stage: 'Advance', rssUrl: '', webUrl: 'https://academic.oup.com/scan' },
    { abbr: 'JPSP_OB', name: 'Journal of Personality (J Pers)', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/17516485' },
  ],
}

/* ---------- 5. 社会学 Sociology ---------- */
const sociology: Subfield = {
  key: 'sociology',
  zh: '社会学',
  en: 'Sociology',
  descZh: '社会结构、阶层、文化、组织、量化方法；AJS / ASR / Social Forces。',
  descEn: 'Social structure, stratification, culture, organizations, quantitative methods — AJS / ASR / Social Forces.',
  tier1: [
    { abbr: 'AJS', name: 'American Journal of Sociology', publisher: 'University of Chicago Press', stage: 'Online First', rssUrl: '', webUrl: 'https://www.journals.uchicago.edu/loi/ajs' },
    { abbr: 'ASR', name: 'American Sociological Review', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/asr' },
    { abbr: 'SocialForces', name: 'Social Forces', publisher: 'Oxford', stage: 'Advance', rssUrl: '', webUrl: 'https://academic.oup.com/sf' },
    { abbr: 'SocRev', name: 'Sociological Review', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/sor' },
  ],
  tier2: [
    { abbr: 'JHSB', name: 'Journal of Health and Social Behavior', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/hsb' },
    { abbr: 'SocMethods', name: 'Sociological Methods & Research', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/smr' },
    { abbr: 'SPQ', name: 'Social Psychology Quarterly', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/spq' },
    { abbr: 'EurSocRev', name: 'European Sociological Review', publisher: 'Oxford', stage: 'Advance', rssUrl: '', webUrl: 'https://academic.oup.com/esr' },
  ],
}

/* ---------- 6. 人类学 Anthropology ---------- */
const anthropology: Subfield = {
  key: 'anthropology',
  zh: '人类学',
  en: 'Anthropology',
  descZh: '文化、亲属、宗教、政治人类学；Current Anthropology / American Anthropologist / JRAI。',
  descEn: 'Culture, kinship, religion, political anthropology — CA / AA / JRAI.',
  tier1: [
    { abbr: 'CA', name: 'Current Anthropology', publisher: 'University of Chicago Press', stage: 'Online First', rssUrl: '', webUrl: 'https://www.journals.uchicago.edu/loi/can' },
    { abbr: 'AA', name: 'American Anthropologist', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/15481433' },
    { abbr: 'JRAI', name: 'Journal of the Royal Anthropological Institute', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/14679655' },
  ],
  tier2: [
    { abbr: 'Ethos', name: 'Ethos', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/15481352' },
    { abbr: 'AEEthno', name: 'American Ethnologist', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/15481409' },
    { abbr: 'JASO', name: 'Journal of the Anthropological Society of Oxford', publisher: 'Oxford', stage: 'Online First', rssUrl: '', webUrl: 'https://academic.oup.com/jaso' },
    { abbr: 'CultAnthro', name: 'Cultural Anthropology', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/ca' },
  ],
}

/* ---------- 7. 经济学 Economics ---------- */
const economics: Subfield = {
  key: 'economics',
  zh: '经济学',
  en: 'Economics',
  descZh: '宏观、微观、计量、行为经济；Top5 + 顶会刊物。',
  descEn: 'Macro, micro, econometrics, behavioral economics — top-5 + leading field journals.',
  tier1: [
    { abbr: 'AER', name: 'American Economic Review', publisher: 'AEA', stage: 'Forthcoming', rssUrl: '', webUrl: 'https://www.aeaweb.org/journals/aer' },
    { abbr: 'QJE', name: 'Quarterly Journal of Economics', publisher: 'Oxford', stage: 'Advance', rssUrl: '', webUrl: 'https://academic.oup.com/qje' },
    { abbr: 'JPE', name: 'Journal of Political Economy', publisher: 'University of Chicago Press', stage: 'Online First', rssUrl: '', webUrl: 'https://www.journals.uchicago.edu/loi/jpe' },
    { abbr: 'Econometrica', name: 'Econometrica', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://onlinelibrary.wiley.com/journal/14680262' },
  ],
  tier2: [
    { abbr: 'JEEA', name: 'Journal of the European Economic Association', publisher: 'Oxford', stage: 'Advance', rssUrl: '', webUrl: 'https://academic.oup.com/jeea' },
    { abbr: 'REStud', name: 'Review of Economic Studies', publisher: 'Oxford', stage: 'Advance', rssUrl: '', webUrl: 'https://academic.oup.com/restud' },
    { abbr: 'JET', name: 'Journal of Economic Theory', publisher: 'Elsevier', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://www.sciencedirect.com/journal/journal-of-economic-theory' },
    { abbr: 'JEEA-Micro', name: 'American Economic Journal: Microeconomics', publisher: 'AEA', stage: 'Forthcoming', rssUrl: '', webUrl: 'https://www.aeaweb.org/journals/aej/micro' },
  ],
}

/* ---------- 8. 传播学 Communication ---------- */
const communication: Subfield = {
  key: 'communication',
  zh: '传播学',
  en: 'Communication',
  descZh: '媒体效果、人际传播、政治传播、ICT 使用；JOC / Communication Research。',
  descEn: 'Media effects, interpersonal, political communication, ICT — JoC / CR.',
  tier1: [
    { abbr: 'JoC', name: 'Journal of Communication', publisher: 'Oxford', stage: 'Advance', rssUrl: '', webUrl: 'https://academic.oup.com/joc' },
    { abbr: 'CR', name: 'Communication Research', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/crq' },
    { abbr: 'JCMC', name: 'Journal of Computer-Mediated Communication', publisher: 'Oxford', stage: 'Advance', rssUrl: '', webUrl: 'https://academic.oup.com/jcmc' },
    { abbr: 'NMS', name: 'New Media & Society', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/nms' },
  ],
  tier2: [
    { abbr: 'CommTheory', name: 'Communication Theory', publisher: 'Oxford', stage: 'Advance', rssUrl: '', webUrl: 'https://academic.oup.com/ct' },
    { abbr: 'MCS', name: 'Mass Communication & Society', publisher: 'Taylor & Francis', stage: 'Online First', rssUrl: '', webUrl: 'https://www.tandfonline.com/toc/rmcs20/current' },
    { abbr: 'JMCQ', name: 'Journal of Mass Communication Quarterly', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/jmq' },
  ],
}

/* ---------- 9. 信息科学 Information Science / IS ---------- */
const is: Subfield = {
  key: 'is',
  zh: '信息科学',
  en: 'Information Science',
  descZh: '信息系统、用户行为、检索、推荐；AIS basket 与顶会刊物。',
  descEn: 'Information systems, user behavior, retrieval, recommendation — AIS basket + top IS outlets.',
  tier1: [
    { abbr: 'JASIST', name: 'Journal of the Association for Information Science and Technology', publisher: 'Wiley', stage: 'Early View', rssUrl: '', webUrl: 'https://asistdl.onlinelibrary.wiley.com/journal/23301643' },
    { abbr: 'MISQ', name: 'MIS Quarterly', publisher: 'MISQ', stage: 'Online First', rssUrl: '', webUrl: 'https://www.misq.org/' },
    { abbr: 'ISR', name: 'Information Systems Research', publisher: 'INFORMS', stage: 'Articles in Advance', rssUrl: '', webUrl: 'https://pubsonline.informs.org/journal/isre' },
    { abbr: 'JMIS', name: 'Journal of Management Information Systems', publisher: 'Taylor & Francis', stage: 'Online First', rssUrl: '', webUrl: 'https://www.tandfonline.com/toc/tmis20/current' },
  ],
  tier2: [
    { abbr: 'IM', name: 'Information & Management', publisher: 'Elsevier', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://www.sciencedirect.com/journal/information-and-management' },
    { abbr: 'DSS', name: 'Decision Support Systems', publisher: 'Elsevier', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://www.sciencedirect.com/journal/decision-support-systems' },
    { abbr: 'IJIM', name: 'International Journal of Information Management', publisher: 'Elsevier', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://www.sciencedirect.com/journal/international-journal-of-information-management' },
  ],
}

/* ---------- 10. 教育学 Education ---------- */
const education: Subfield = {
  key: 'education',
  zh: '教育学',
  en: 'Education',
  descZh: '教育心理、教学法、课程、政策；AER / RER / Educational Researcher。',
  descEn: 'Educational psychology, pedagogy, curriculum, policy — AER / RER / ER.',
  tier1: [
    { abbr: 'AER', name: 'American Educational Research Journal', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/aer' },
    { abbr: 'RER', name: 'Review of Educational Research', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/rer' },
    { abbr: 'EdResearcher', name: 'Educational Researcher', publisher: 'SAGE', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://journals.sagepub.com/home/edr' },
  ],
  tier2: [
    { abbr: 'JEdPsych', name: 'Journal of Educational Psychology', publisher: 'APA', stage: 'OnlineFirst', rssUrl: '', webUrl: 'https://www.apa.org/pubs/journals/edu' },
    { abbr: 'LI', name: 'Learning and Instruction', publisher: 'Elsevier', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://www.sciencedirect.com/journal/learning-and-instruction' },
    { abbr: 'CSE', name: 'Computer-Supported Education (顶刊子集)', publisher: 'Elsevier', stage: 'Articles in Press', rssUrl: '', webUrl: 'https://www.sciencedirect.com/journal/computers-and-education' },
  ],
}

export const SUBFIELDS: Subfield[] = [
  management,
  marketing,
  ob,
  psychology,
  sociology,
  anthropology,
  economics,
  communication,
  is,
  education,
]

/** 是否有 RSS 源：扫描时只扫 rssUrl 非空。 */
export function journalHasRss(j: Journal): boolean {
  return !!j.rssUrl && /^https?:\/\//.test(j.rssUrl)
}

export function allJournals(): Journal[] {
  return SUBFIELDS.flatMap((s) => [...s.tier1, ...s.tier2])
}

export function subfieldOf(abbr: string): { subfield: Subfield; tier: JournalTier } | null {
  for (const s of SUBFIELDS) {
    if (s.tier1.some((j) => j.abbr === abbr)) return { subfield: s, tier: 'tier1' }
    if (s.tier2.some((j) => j.abbr === abbr)) return { subfield: s, tier: 'tier2' }
  }
  return null
}
