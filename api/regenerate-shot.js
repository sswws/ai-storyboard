import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '服务器未配置 API Key' });

  const { script, characters, shotData } = req.body;
  const openai = new OpenAI({ apiKey: apiKey.replace('sk-sk-', 'sk-'), baseURL: 'https://api.moonshot.cn/v1' });
  
  let characterContext = "";
  if (characters && characters.length > 0) {
    characterContext = `\n【核心约束：角色资产库】\n出现以下角色时，必须在 t2iPrompt 中无缝缝合其视觉特征词：\n`;
    characters.forEach(c => { characterContext += `- ${c.name} -> 特征: ${c.visualPrompt}\n`; });
  }

  try {
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
  "t2iPrompt": "极其详细的静态生图提示词...",
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
    
    res.status(200).json(JSON.parse(content));
  } catch (error) {
    res.status(500).json({ error: error.message || '单镜重绘失败' });
  }
}