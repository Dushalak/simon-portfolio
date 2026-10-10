/* Shared project metadata. Existing case chapters remain unchanged. */
(()=>{
  const projects={
    nelu:{title:'Nelu AI',category:'AI AGENT / MOBILE EXPERIENCE',subtitle:'让陪伴，有了新的形态。',cover:'assets/nelu-hero.webp',groups:[
      {title:'项目概览',heading:'从 AI 对话，到有温度的陪伴',text:'以 AI 小猫为情感入口，连接智能对话、阅读与日常互动，建立产品的核心体验。',indices:[0,1]},
      {title:'研究与策略',heading:'先理解需求，再定义体验',text:'从项目流程与前期调研出发，明确用户场景、体验目标与设计方向。',indices:[2,3]},
      {title:'产品体验',heading:'让角色、界面与交互一起表达',text:'将 IP 视觉、注册登录、昼夜切换、阅读反馈与小猫派遣串联成完整体验。',indices:[4,5,6,7,8,9,10,11,12,13]},
      {title:'复盘与沉淀',heading:'从这一次设计，走向下一次',text:'整理设计过程中的判断与经验，回顾视觉和产品体验的落地。',indices:[14,15]}]},
    yuxu:{title:'予序 · Yuxu',category:'AI SOCIAL / PRODUCT REDESIGN',subtitle:'予奇遇，序写新程。',cover:'assets/yuxu-hero.webp',groups:[
      {title:'项目概览',heading:'围绕 AI 角色，重新组织相遇',text:'通过页面通览与迭代分析，梳理予序的产品场景与体验问题。',indices:[0,1]},
      {title:'设计策略',heading:'让信息结构支撑自然的互动',text:'从设计目标、风格推导到框架与原型，建立一致的体验方向。',indices:[2,3]},
      {title:'界面迭代',heading:'把每一个关键路径设计清楚',text:'逐步呈现首页、列表、对话、个人中心、充值与弹窗的界面迭代。',indices:[4,5,6,7,8,9]},
      {title:'项目复盘',heading:'回看变化背后的设计判断',text:'总结本次项目迭代的思路与经验。',indices:[10]}]},
    qingyu:{title:'晴雨 · Qingyu',category:'E-COMMERCE / ENTERPRISE PLATFORM',subtitle:'让复杂业务，清晰运转。',cover:'assets/qingyu-hero.webp',groups:[
      {title:'项目概览',heading:'连接电商业务与工作效率',text:'理解电商智配中枢的业务背景与设计场景。',indices:[0]},
      {title:'研究与规范',heading:'从用户任务，到一致的设计语言',text:'结合用户调研、设计目标与视觉规范，建立后台界面的设计基础。',indices:[1,2,3]},
      {title:'业务界面',heading:'让数据与操作各就其位',text:'展示首页、报表及各业务页面，梳理信息层级与操作路径。',indices:[4,5,6,7,8]},
      {title:'设计总结',heading:'回归业务中的真实体验',text:'回顾项目设计的完整表达与落地。',indices:[9]}]},
    aigc:{title:'AIGC · Visuals',category:'CREATIVE EXPLORATION / VISUAL DESIGN',subtitle:'把想象力，变成看得见的表达。',cover:'assets/aigc-hero.webp',groups:[
      {title:'前期探索',heading:'从一个想法，展开视觉可能',text:'梳理创作方向与前期准备，探索生成式工具在设计中的应用。',indices:[0]},
      {title:'视觉落地',heading:'把生成结果转译成设计作品',text:'结合创意表达与页面设计，将 AIGC 素材应用到运营视觉。',indices:[1]},
      {title:'设计沉淀',heading:'让创作成为可持续的工作流',text:'整理创作经验与方法，为后续视觉探索积累思路。',indices:[2]}]}
  };
  const cards={
  "nelu": {
    "displayTitle": "Nelu AI.",
    "description": "以 AI 小猫为情感入口，将智能对话、阅读与互动融入日常。从 0 到 1，构建有温度的产品体验。",
    "tags": [
      "0—1 产品设计",
      "情感化体验",
      "IP 视觉"
    ],
    "cover": "assets/project-covers/nelu.webp"
  },
  "yuxu": {
    "displayTitle": "予序 Yuxu.",
    "description": "围绕 AI 角色与故事互动，梳理从发现到对话的体验路径。通过信息层级与界面迭代，让每一次相遇更自然。",
    "tags": [
      "体验迭代",
      "信息架构",
      "视觉规范"
    ],
    "cover": "assets/project-covers/yuxu.webp"
  },
  "qingyu": {
    "displayTitle": "晴雨 Qingyu.",
    "description": "面向电商运营场景，整理多角色工作流与数据呈现。将业务逻辑转译为清晰、高效、一致的后台体验。",
    "tags": [
      "B 端设计",
      "数据可视化",
      "设计系统"
    ],
    "cover": "assets/project-covers/qingyu.webp"
  },
  "aigc": {
    "displayTitle": "AI视觉探索",
    "description": "从前期创意到视觉生成，再到运营页面落地。探索 AIGC 与设计工作流的结合，拓展视觉表达的可能。",
    "tags": [
      "AIGC 探索",
      "运营视觉",
      "创意表达"
    ],
    "cover": "assets/project-covers/aigc.webp"
  }
};
  const introductions={
    nelu:{detailTitle:'Nelu AI Agent',detailCategory:'AI陪伴 · 情感交互 · 智能体验',year:'2026',
      detailSummary:'以AI小猫为情感入口，将智能对话、多模态交互与内容体验融入日常陪伴，从0到1构建具有温度的智能陪伴产品。',
      detailInsight:'探索AI Agent时代下人与智能体建立长期关系的新形态，让陪伴从工具使用走向情感连接。',
      atmosphere:{name:'obsidian-gold',depth:'#0e0d0b',rayColor1:'#cbb68b',rayColor2:'#8d6b49',origin:'top-right',tilt:-12,spread:1.8,speed:.55,intensity:1.6,blend:.38,saturation:.85,falloff:1.5,opacity:.6}},
    yuxu:{detailTitle:'予序 AI剧本聊天软件',detailCategory:'AI互动 · 剧情探索 · 沉浸体验',year:'2025',
      detailSummary:'一款融合AI对话与互动剧情的智能聊天应用，通过角色塑造与内容体验设计，让用户探索更自由、更沉浸的故事世界。',
      detailInsight:'重新定义人与AI交流的方式，让每一次对话都成为开启故事的新入口。',
      atmosphere:{name:'glacier-blue',depth:'#090e18',rayColor1:'#90bfd8',rayColor2:'#3c67b5',origin:'top-left',tilt:10,spread:1.4,speed:.45,intensity:1.8,blend:.68,saturation:1.1,falloff:1.35,opacity:.65}},
    qingyu:{detailTitle:'晴雨电商智配中枢',detailCategory:'数据决策 · 商业效率 · 智能运营',year:'2025',
      detailSummary:'面向电商运营场景打造的数据管理平台，通过信息架构优化与可视化设计，帮助用户快速理解业务状态并提升运营效率。',
      detailInsight:'将复杂业务数据转化为清晰、高效的决策体验，连接数据洞察与商业增长。',
      atmosphere:{name:'caramel-amber',depth:'#140e09',rayColor1:'#d6a06a',rayColor2:'#a96739',origin:'top-right',tilt:8,spread:2.35,speed:.5,intensity:1.7,blend:.55,saturation:1,falloff:1.65,opacity:.6}},
    aigc:{detailTitle:'AIGC运营页设计',detailCategory:'AI辅助 · 视觉生成 · 创意表达',year:'2025',
      detailSummary:'探索AIGC工具在视觉设计流程中的应用，通过智能生成与创意整合，快速构建具有传播力的营销视觉方案。',
      detailInsight:'让AI成为设计创作伙伴，拓展视觉表达边界，提高从概念到成品的创造效率。',
      atmosphere:{name:'mint-nature',depth:'#09130f',rayColor1:'#9ad2bf',rayColor2:'#508b72',origin:'top-left',tilt:-8,spread:1.9,speed:.6,intensity:1.55,blend:.48,saturation:.9,falloff:1.5,opacity:.6}}
  };
  Object.entries(projects).forEach(([key,project],i)=>Object.assign(project,cards[key],introductions[key],{key,number:i+1,href:"#project/"+key}));
  window.PortfolioProjects=projects;
})();
