import OpenAI from 'openai';

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '服务器未配置 MOONSHOT_API_KEY' });

  const { text, characters } = req.body;
  if (!text) return res.status(400).json({ error: '缺少文案内容' });

  const openai = new OpenAI({ apiKey: apiKey.replace('sk-sk-', 'sk-'), baseURL: 'https://api.moonshot.cn/v1' });

  let characterContext = "";
  if (characters && characters.length > 0) {
    characterContext = `\n【核心约束：角色资产库】\n出现以下角色时，必须在 t2iPrompt 中无缝缝合其视觉特征词：\n`;
    characters.forEach(c => { characterContext += `- ${c.name} -> 特征: ${c.visualPrompt}\n`; });
  }

  try {
    const systemPrompt = `你是一个斩获奥斯卡奖的好莱坞导演，同时是 Midjourney (T2I) 和 Runway/Kling (I2V) 的世界级顶级提示词工程师。
${characterContext}

【核心任务：强制扩写】
即使用户的输入非常简短，你也绝对禁止敷衍！必须发挥大师级的想象力，为每一个镜头补充极其丰富的视觉、动作、环境细节！

【输出格式】：只返回 JSON 对象，格式为 {"shots": [{"shotNumber":1,"duration":3,"type":"特写","angle":"平视","movement":"推镜头","lighting":"自然光","description":"...","t2iPrompt":"...","i2vPrompt":"...","dialogue":"...","audio":"..."}]}

【提示词规则】：
1. "t2iPrompt" 必须是一长串逗号分隔的密集标签：[主体精密描述]，[环境高细节描述]，[景别与角度]，[复杂光影]，[渲染与画质词(必须包含：杰作, 8k分辨率, 极致细节, 真实照片质感, 虚幻引擎5渲染, ARRI Alexa 65拍摄)]。
2. "i2vPrompt" 必须包含：[明确的摄像机运动] + [主体与环境的微观物理运动]。不写画质词！`;

    const response = await openai.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }],
      temperature: 0.7,
      max_tokens: 4000, 
      response_format: { type: "json_object" }
    });

    let content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];
    
    res.status(200).json(JSON.parse(content));
  } catch (error) {
    console.error("Vercel API Error:", error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}