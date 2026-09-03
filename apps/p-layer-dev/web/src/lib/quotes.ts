/**
 * 主页每日名言。
 *
 * 逐条从旧版 index.html 的 pQuotes 数组原样搬过来（含为品章大帝定制的
 * 「看见机制 / 现实与权力 / 理论与检验 / 科学诚实 / 价值选择 / 行动与韧性」六组）。
 * 顺序保持原样，换一句时随机打乱后循环，和旧版 resetPQuoteOrder 的行为一致。
 */

export type Quote = {
  theme: string
  zh: string
  en: string
  author: string
  authorZh: string
  /** 意译而非原话：署名要写「受…思想启发」 */
  paraphrase?: boolean
}

export const QUOTES: Quote[] = [
  { theme: "学术", zh: "聪者听于无声，明者见于无形。", en: "The wise hear what has no sound, and the discerning see what has no form.", author: "Shuoyuan", authorZh: "《说苑》", paraphrase: false },
  { theme: "学术", zh: "重要的是不要停止提问。", en: "The important thing is not to stop questioning.", author: "Albert Einstein", authorZh: "阿尔伯特·爱因斯坦" },
  { theme: "学术", zh: "研究是被正式化的好奇心，是带着目的去探寻。", en: "Research is formalized curiosity. It is poking and prying with a purpose.", author: "Zora Neale Hurston", authorZh: "佐拉·尼尔·赫斯顿" },
  { theme: "学术", zh: "伟大的事业，是由一系列微小事物汇聚而成。", en: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh", authorZh: "文森特·梵高" },
  { theme: "学术", zh: "如果我看得更远，那是因为我站在巨人的肩膀上。", en: "If I have seen further, it is by standing on the shoulders of giants.", author: "Isaac Newton", authorZh: "艾萨克·牛顿" },
  { theme: "学术", zh: "生活中没有什么可怕的事情，只有需要理解的事情。", en: "Nothing in life is to be feared; it is only to be understood.", author: "Marie Curie", authorZh: "玛丽·居里" },
  { theme: "学术", zh: "第一原则是：不要欺骗自己，而你是最容易被自己欺骗的人。", en: "The first principle is that you must not fool yourself, and you are the easiest person to fool.", author: "Richard Feynman", authorZh: "理查德·费曼" },
  { theme: "学术", zh: "一个被问清楚的问题，往往已经解决了一半。", en: "A well-posed question is often half solved.", author: "John Dewey", authorZh: "约翰·杜威", paraphrase: true },
  { theme: "学术", zh: "知识可以不断增长，但未知也会随之扩大。", en: "Knowledge can keep growing, while the unknown expands with it.", author: "Karl Popper", authorZh: "卡尔·波普尔", paraphrase: true },
  { theme: "学术", zh: "把习以为常的事情重新变成问题，研究就有了入口。", en: "Research begins when the familiar becomes a question again.", author: "Pierre Bourdieu", authorZh: "皮埃尔·布迪厄", paraphrase: true },
  { theme: "学术", zh: "好的研究不急着给世界下结论，而是先把证据安排好。", en: "Good research does not rush to conclude; it first arranges the evidence.", author: "W. E. B. Du Bois", authorZh: "W·E·B·杜波依斯", paraphrase: true },
  { theme: "学术", zh: "当你愿意承认不确定性，严谨才真正开始。", en: "Rigor begins when you are willing to admit uncertainty.", author: "Max Weber", authorZh: "马克斯·韦伯", paraphrase: true },
  { theme: "学术", zh: "真正的理解，不是记住术语，而是知道它何时能帮助你判断。", en: "Understanding is not memorizing terms; it is knowing when they can guide judgment.", author: "Hannah Arendt", authorZh: "汉娜·阿伦特", paraphrase: true },
  { theme: "学术", zh: "问题不是障碍；它们是让思考变得具体的入口。", en: "Problems are not obstacles; they are the doorway that makes thinking concrete.", author: "Jane Addams", authorZh: "简·亚当斯", paraphrase: true },
  { theme: "学术", zh: "未经检验的生活不值得过。", en: "The unexamined life is not worth living.", author: "Socrates", authorZh: "苏格拉底" },
  { theme: "勇气", zh: "让一切发生：美好与恐惧，你都要继续前行。", en: "Let everything happen to you: beauty and terror. Just keep going.", author: "Rainer Maria Rilke", authorZh: "里尔克" },
  { theme: "公共领导", zh: "事情在完成之前，总看起来是不可能的。", en: "It always seems impossible until it is done.", author: "Nelson Mandela", authorZh: "纳尔逊·曼德拉" },
  { theme: "公共领导", zh: "我们唯一需要害怕的，就是恐惧本身。", en: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt", authorZh: "富兰克林·D·罗斯福" },
  { theme: "公共领导", zh: "即使看不见整段路，也可以先迈出第一步。", en: "Even when you cannot see the whole staircase, take the first step.", author: "Martin Luther King Jr.", authorZh: "马丁·路德·金", paraphrase: true },
  { theme: "公共领导", zh: "希望不是对未来的预测，而是让行动变得可能的力量。", en: "Hope is not a prediction of the future; it is a force that makes action possible.", author: "Václav Havel", authorZh: "瓦茨拉夫·哈维尔", paraphrase: true },
  { theme: "公共领导", zh: "不要等一个更合适的人来改变事情；从你能做的那一步开始。", en: "Do not wait for someone else to change things; begin with the step you can take.", author: "Abraham Lincoln", authorZh: "亚伯拉罕·林肯", paraphrase: true },
  { theme: "公共领导", zh: "失败不是终点，真正重要的是你是否还有勇气继续。", en: "Failure is not the end; what matters is whether you still have the courage to continue.", author: "Winston Churchill", authorZh: "温斯顿·丘吉尔", paraphrase: true },
  { theme: "公共领导", zh: "改变不会因为等待而发生，它需要有人先把第一件事做起来。", en: "Change does not arrive through waiting; someone has to begin the first thing.", author: "Barack Obama", authorZh: "巴拉克·奥巴马", paraphrase: true },
  { theme: "品格", zh: "没有人能在未经你同意的情况下让你感到自卑。", en: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt", authorZh: "埃莉诺·罗斯福" },
  { theme: "品格", zh: "你可以遇到许多失败，但不必被失败定义。", en: "You may encounter many defeats, but you do not have to be defeated.", author: "Maya Angelou", authorZh: "玛雅·安吉罗" },
  { theme: "品格", zh: "当你敢于拥有力量，你就不必再为自己的光芒道歉。", en: "When you dare to own your power, you no longer need to apologize for your light.", author: "Audre Lorde", authorZh: "奥德丽·洛德", paraphrase: true },
  { theme: "品格", zh: "能看见自己的局限，不是软弱，而是开始成长。", en: "Seeing your limits is not weakness; it is where growth begins.", author: "Viktor Frankl", authorZh: "维克多·弗兰克尔", paraphrase: true },
  { theme: "商业创造", zh: "那些疯狂到以为自己能改变世界的人，才真正有机会做到。", en: "The people who are crazy enough to think they can change the world are the ones who do.", author: "Steve Jobs", authorZh: "史蒂夫·乔布斯" },
  { theme: "商业创造", zh: "无论你认为自己能不能做到，你通常都会证明自己是对的。", en: "Whether you think you can or you think you cannot, you are usually right.", author: "Henry Ford", authorZh: "亨利·福特" },
  { theme: "商业创造", zh: "开始行动的最好时机，往往早于你觉得自己准备好的时候。", en: "The best time to begin is often before you feel ready.", author: "Walt Disney", authorZh: "沃尔特·迪士尼", paraphrase: true },
  { theme: "商业创造", zh: "如果你不愿意被批评，就很难真正做出新的东西。", en: "If you are unwilling to be criticized, it is difficult to create something truly new.", author: "Jeff Bezos", authorZh: "杰夫·贝索斯", paraphrase: true },
  { theme: "商业创造", zh: "长期的成果，来自一次又一次把重要的事情做好。", en: "Long-term results come from doing the important things well, again and again.", author: "Indra Nooyi", authorZh: "英德拉·努伊", paraphrase: true },
  { theme: "困难时刻", zh: "一段漫长的路，也可以被今天这一小步真正改变。", en: "A long road can still be changed by the small step you take today.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "困难时刻", zh: "你不需要一次解决整个研究，只需要诚实地完成下一步。", en: "You do not need to solve the whole study at once; complete the next honest step.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "困难时刻", zh: "慢一点没有关系，只要你没有把好奇心交给怀疑。", en: "It is all right to move slowly, as long as doubt does not take your curiosity away.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "困难时刻", zh: "今天的混乱不等于失败，它可能只是问题正在变清楚。", en: "Today’s confusion is not failure; it may be the problem becoming clearer.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "看见机制", zh: "理性是激情的奴隶，而且也只能如此。", en: "Reason is, and ought only to be the slave of the passions.", author: "David Hume", authorZh: "大卫·休谟" },
  { theme: "看见机制", zh: "先问一种行为被什么奖励，再听人们如何解释它。", en: "First ask what rewards a behavior; then listen to how people explain it.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "看见机制", zh: "一个动机可以真诚，同时也具有适应性。", en: "A motive can be sincere and adaptive at the same time.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "看见机制", zh: "自我叙事是证据的一部分，不是机制的全部。", en: "Self-narrative is part of the evidence, not the whole mechanism.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "看见机制", zh: "解释欲望从哪里来，不等于让欲望替你决定方向。", en: "Explaining where desire comes from does not let desire choose your direction.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "现实与权力", zh: "不要只看系统声称奖励什么，要看它反复奖励了什么。", en: "Do not only read what a system claims to reward; watch what it rewards repeatedly.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "现实与权力", zh: "地位最诚实的证据，常常是谁能让别人承担成本。", en: "The clearest evidence of status is often who can make others bear the cost.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "现实与权力", zh: "声望由他人授予，支配则把选择强加给他人。", en: "Prestige is granted by others; dominance imposes choices on them.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "现实与权力", zh: "权力能解释许多公开理由背后的驱动力，但它不是解释的终点。", en: "Power can reveal what lies behind public reasons, but it is not the end of explanation.", author: "Friedrich Nietzsche", authorZh: "弗里德里希·尼采", paraphrase: true },
  { theme: "现实与权力", zh: "真正的现实主义不是犬儒，而是看清约束之后仍然行动。", en: "Realism is not cynicism; it is acting after seeing the constraints clearly.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "理论与检验", zh: "我努力保持思想自由：一旦事实反对某个假设，就放弃它，无论我多么喜欢它。", en: "I have endeavoured to give up any hypothesis, however beloved, as soon as facts are shown to oppose it.", author: "Charles Darwin", authorZh: "查尔斯·达尔文", paraphrase: true },
  { theme: "理论与检验", zh: "理论的价值，不只在于解释过去，还在于冒险预测下一步。", en: "A theory earns its place not only by explaining the past, but by risking a prediction.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "理论与检验", zh: "如果一个中介什么都能解释，它往往什么也没有真正解释。", en: "If a mediator can explain everything, it may explain nothing in particular.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "理论与检验", zh: "当两个解释预测同一个结果时，真正的研究问题才刚刚开始。", en: "When two explanations predict the same result, the real research question has just begun.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "理论与检验", zh: "一个概念只有在改变你的观察、预测或行动时，才真正开始工作。", en: "An idea begins to work when it changes what you observe, predict, or do.", author: "William James", authorZh: "威廉·詹姆斯", paraphrase: true },
  { theme: "理论与检验", zh: "检验知识的标准，是实验。", en: "The test of all knowledge is experiment.", author: "Richard Feynman", authorZh: "理查德·费曼" },
  { theme: "科学诚实", zh: "比得到显著结果更重要的，是让自己有机会被事实纠正。", en: "More important than significance is giving the facts a chance to correct you.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "科学诚实", zh: "不确定不是知识的敌人；隐藏不确定才是。", en: "Uncertainty is not the enemy of knowledge; hiding it is.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "科学诚实", zh: "严谨不是把报告写复杂，而是让每个决定都可以被追问。", en: "Rigor is not making a report complex; it is making every decision answerable.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "科学诚实", zh: "数据不是为假设服务；假设必须接受数据的审判。", en: "Data do not serve the hypothesis; the hypothesis must answer to the data.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "价值选择", zh: "看清机制，并不会取消价值。", en: "Seeing the mechanism does not cancel the value.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "价值选择", zh: "解释爱为何存在，并没有把爱解释掉。", en: "Explaining why love exists does not explain love away.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "价值选择", zh: "事实告诉你世界是什么样，却不能替你选择什么值得追求。", en: "Facts tell you how the world is; they cannot choose what is worth pursuing.", author: "David Hume", authorZh: "大卫·休谟", paraphrase: true },
  { theme: "价值选择", zh: "你可以清楚看见竞争，同时拒绝让残酷成为自己的性格。", en: "You can see competition clearly without letting cruelty become your character.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "价值选择", zh: "冷静地描述世界，热烈地决定怎样活。", en: "Describe the world coolly; decide how to live passionately.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "价值选择", zh: "理解人类之后，剩下的问题是：你选择成为什么样的人。", en: "After understanding people, the remaining question is who you choose to become.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "行动与韧性", zh: "荣誉属于真正置身竞技场的人。", en: "The credit belongs to the man who is actually in the arena.", author: "Theodore Roosevelt", authorZh: "西奥多·罗斯福" },
  { theme: "行动与韧性", zh: "向前看时无法连接所有点；只有回望时，你才看见它们如何相连。", en: "You cannot connect the dots looking forward; you can only connect them looking backward.", author: "Steve Jobs", authorZh: "史蒂夫·乔布斯" },
  { theme: "行动与韧性", zh: "不要等待完全确定；先做那个能让下一步更清楚的动作。", en: "Do not wait for certainty; take the action that makes the next step clearer.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "行动与韧性", zh: "困难不是对你价值的裁决，它只是当前环境提出的约束。", en: "Difficulty is not a verdict on your worth; it is a constraint posed by the present environment.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
  { theme: "行动与韧性", zh: "把重要的事情做好一次是能力；反复做好，才形成命运。", en: "Doing important work well once is skill; doing it repeatedly shapes a life.", author: "Pia!", authorZh: "Pia！", paraphrase: true },
]
