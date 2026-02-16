// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

let apiKey = process.env.MOONSHOT_API_KEY;

if (!apiKey) {
  console.error('\n❌ 致命错误: 未能读取到有效的 MOONSHOT_API_KEY！');
  process.exit(1);
}

if (apiKey.startsWith('sk-sk-')) {
  apiKey = apiKey.replace('sk-sk-', 'sk-');
} else if (!apiKey.startsWith('sk-')) {
  console.error('\n❌ 致命错误: 您的 API Key 格式不正确！');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.moonshot.cn/v1',
});

// 接口 1：全局生成
app.post('/api/generate-storyboard', async (req, res) => {
  const { text, characters } = req.body;
  if (!text) return res.status(400).json({ error: '缺少文案内容' });

  let characterContext = "";
  if (characters && characters.length > 0) {
    characterContext = `\n【核心约束：角色资产库】\n出现以下角色时，必须在 t2iPrompt 中无缝缝合其视觉特征词：\n`;
    characters.forEach(c => { characterContext += `- ${c.name} -> 特征: ${c.visualPrompt}\n`; });
  }

  try {
    // 🧠 终极重构的 System Prompt：加入强制扩写指令和完美范例
    const systemPrompt = `你是一个斩获奥斯卡奖的好莱坞导演，同时是 Midjourney (T2I) 和 Runway/Kling (I2V) 的世界级顶级提示词工程师。
${characterContext}

【核心任务：强制扩写】
即使用户的输入非常简短（如“生成大年初二的三个镜头”），你也**绝对禁止**敷衍！你必须发挥大师级的想象力，为每一个镜头补充极其丰富的视觉、动作、环境细节！

【致命红线：提示词质量】
你的 t2iPrompt 和 i2vPrompt 绝对禁止使用“高清，4K画质，山间小道”、“一家人在吃饭”这种简单幼稚的词汇！必须严格执行以下工业级标准（默认使用中文，除非用户要求英文）：

1. "t2iPrompt" (静态生图) 必须是一长串逗号分隔的密集标签：
   公式：[主体精密描述(外貌/服装/材质/动作)]，[环境高细节描述(天气/背景/道具/氛围)]，[景别与角度]，[复杂光影(如电影级光影,丁达尔效应,边缘背光,赛博朋克霓虹)]，[渲染与画质词(必须包含：杰作, 8k分辨率, 极致细节, 真实照片质感, 虚幻引擎5渲染, ARRI Alexa 65拍摄)]。

2. "i2vPrompt" (图生视频) 必须精准控制物理与运镜：
   公式：[明确的摄像机运动(如: 摄像机缓慢向前推进并环绕)] + [主体与环境的微观物理运动(如: 人物的衣摆在微风中剧烈飘动，水面泛起真实的物理波纹，烟雾袅袅上升)]。

【完美的 JSON 输出范例（你必须模仿这种详细程度）】：
{
  "shots": [
    {
      "shotNumber": 1,
      "duration": 5,
      "type": "全景",
      "angle": "高角度俯视",
      "movement": "缓慢推镜头",
      "lighting": "清晨丁达尔光",
      "description": "年轻大师在清晨的山间小道上行走，周围是郁郁葱葱的树木和远处若隐若现的山峰。",
      "t2iPrompt": "一个年轻的武术大师，身穿飘逸的白色粗布长袍，背着一把古剑，神情坚毅地在晨雾弥漫的山间石阶上行走，周围是郁郁葱葱的古松树和若隐若现的险峻山峰，全景，高角度俯视，清晨柔和的阳光穿透树叶形成强烈的丁达尔效应，电影级光影，体积光，杰作，8k分辨率，极致细节，真实照片质感，ARRI Alexa 65拍摄，虚幻引擎5渲染。",
      "i2vPrompt": "摄像机从高处缓慢向前推镜头并跟随人物移动，年轻大师的白色衣摆和头发在晨风中自然飘动，四周的晨雾产生真实的流动感，阳光穿透树叶的阴影在地面上缓缓移动。",
      "dialogue": "（轻声）这是他艺术之路的起点。",
      "audio": "清脆的鸟鸣声，微风吹过树叶的沙沙声"
    }
  ]
}

严格返回合法的 JSON 对象，不要包含 \`\`\`json 等任何多余标记。`;

    const response = await openai.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }],
      temperature: 0.7, // 保持想象力
      max_tokens: 4000, 
      response_format: { type: "json_object" }
    });

    let content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];
    
    res.json(JSON.parse(content));
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

// 接口 2：单镜 AI 局部重绘
app.post('/api/regenerate-shot', async (req, res) => {
  const { script, characters, shotData } = req.body;
  
  let characterContext = "";
  if (characters && characters.length > 0) {
    characterContext = `\n【核心约束：角色资产库】\n出现以下角色时，必须在 t2iPrompt 中无缝缝合其视觉特征词：\n`;
    characters.forEach(c => { characterContext += `- ${c.name} -> 特征: ${c.visualPrompt}\n`; });
  }

  try {
    // 局部重绘同样套用最严格的工业标准
    const systemPrompt = `你是一个专业的 AI 导演和提示词工程师。用户对当前的某一个分镜头不满意，需要你结合完整的剧本上下文，单独对这一个镜头进行重新设计和极度详细的提示词重写。
${characterContext}

完整的剧本上下文是：
"""
${script}
"""

【提示词质量红线】
t2iPrompt 必须是包含复杂光影、极度细节描述和专业画质词（杰作, 8k分辨率, 极致细节, ARRI Alexa 65拍摄, 虚幻引擎5渲染）的长串逗号分隔标签！绝不能简单敷衍！
i2vPrompt 必须包含精准的摄像机运动和环境微观物理动态描述！

必须且只能返回一个代表该镜头的 JSON 对象，格式如下：
{
  "duration": 3,
  "type": "特写",
  "angle": "平视",
  "movement": "推镜头",
  "lighting": "伦勃朗光",
  "description": "更具张力的画面描述...",
  "t2iPrompt": "极其详细的静态生图提示词（必须包含画质词和复杂光影）...",
  "i2vPrompt": "极其细腻的动态运镜提示词...",
  "dialogue": "旁白...",
  "audio": "音效..."
}`;

    const response = await openai.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `这是当前需要被重写的镜头原有数据：\n${JSON.stringify(shotData, null, 2)}\n请对其进行深度优化、细节扩写和重构。` }
      ],
      temperature: 0.8, 
      max_tokens: 1500, 
      response_format: { type: "json_object" }
    });

    let content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];
    
    res.json(JSON.parse(content));
  } catch (error) {
    console.error("Regenerate Error:", error);
    res.status(500).json({ error: error.message || '单镜重绘失败' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ LensCore 后端引擎已启动: http://localhost:${PORT}`);
});