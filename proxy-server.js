const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 提供静态文件服务
app.use(express.static(path.join(__dirname)));

// 图片生成代理端点
app.post('/api/images/generations', async (req, res) => {
    try {
        const { prompt, model, apiKey } = req.body;
        
        if (!prompt || !model || !apiKey) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        console.log('收到图片生成请求:', { model, promptLength: prompt.length });
        
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                response_format: "url",
                size: "1024x1024",
                watermark: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API请求失败:', response.status, errorText);
            return res.status(response.status).json({ error: `API请求失败: ${response.status}` });
        }

        const data = await response.json();
        console.log('API响应成功');
        res.json(data);
        
    } catch (error) {
        console.error('代理服务器错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 对话API代理端点
app.post('/api/chat/completions', async (req, res) => {
    try {
        const { messages, model, apiKey } = req.body;
        
        if (!messages || !model || !apiKey) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        console.log('收到对话请求:', { model, messagesCount: messages.length });
        
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API请求失败:', response.status, errorText);
            return res.status(response.status).json({ error: `API请求失败: ${response.status}` });
        }

        const data = await response.json();
        console.log('对话API响应成功');
        res.json(data);
        
    } catch (error) {
        console.error('代理服务器错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '代理服务器运行正常' });
});

app.listen(PORT, () => {
    console.log(`代理服务器运行在 http://localhost:${PORT}`);
    console.log('可用端点:');
    console.log('  GET / - 静态文件服务');
    console.log('  POST /api/images/generations - 图片生成');
    console.log('  POST /api/chat/completions - 对话API');
    console.log('  GET /health - 健康检查');})
