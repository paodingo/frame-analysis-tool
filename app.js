// 全局变量
let videoElement = null;
let uploadedVideoFile = null;
let uploadedImages = [];
let currentFrames = [];
let currentFileType = 'video'; // 'video' or 'image'

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 逐帧解析应用初始化完成');
    console.log('📝 日志打印功能已启用');
    
    videoElement = document.getElementById('videoPreview');
    
    // 加载保存的配置
    loadConfig();
    
    // 文件上传事件监听
    document.getElementById('videoUpload').addEventListener('change', handleVideoUpload);
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    
    // 文件类型切换事件
    setupFileTypeSelector();
    
    // 按钮事件监听
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
    document.getElementById('analyzeBtn').addEventListener('click', analyzeFiles);
    document.getElementById('generateImagesBtn').addEventListener('click', generateImages);
    document.getElementById('clearBtn').addEventListener('click', clearAnalysis);
    
    // 配置面板控制
    document.getElementById('toggleConfigBtn').addEventListener('click', toggleConfigPanel);
    document.getElementById('closeConfigBtn').addEventListener('click', closeConfigPanel);
    
    console.log('✅ 所有事件监听器已注册');
});

// 处理视频上传
function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('video/')) {
        showStatus('请上传视频文件！', 'error');
        return;
    }
    
    uploadedVideoFile = file;
    const videoURL = URL.createObjectURL(file);
    videoElement.src = videoURL;
    videoElement.style.display = 'block';
    
    // 清空之前的结果
    document.getElementById('framesContainer').innerHTML = getEmptyStateHTML();
    updateFrameCount(0);
    
    showStatus('视频上传成功！点击"开始分析"进行处理。', 'success');
}

// 切换配置面板显示/隐藏
function toggleConfigPanel() {
    const configPanel = document.getElementById('configPanel');
    configPanel.classList.toggle('active');
    
    // 更新按钮文本
    const toggleBtn = document.getElementById('toggleConfigBtn');
    if (configPanel.classList.contains('active')) {
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> 关闭配置';
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-cog"></i> API配置';
    }
}

// 关闭配置面板
function closeConfigPanel() {
    const configPanel = document.getElementById('configPanel');
    configPanel.classList.remove('active');
    
    // 更新按钮文本
    const toggleBtn = document.getElementById('toggleConfigBtn');
    toggleBtn.innerHTML = '<i class="fas fa-cog"></i> API配置';
}

// 保存配置到本地存储
function saveConfig() {
    const config = {
        endpoint: document.getElementById('apiEndpoint').value,
        apiKey: document.getElementById('apiKey').value,
        modelId: document.getElementById('modelId').value,
        promptTemplate: document.getElementById('promptTemplate').value,
        imageApiEndpoint: document.getElementById('imageApiEndpoint').value,
        imageApiKey: document.getElementById('imageApiKey').value,
        imageModelId: document.getElementById('imageModelId').value
    };
    
    localStorage.setItem('videoAnalyzerConfig', JSON.stringify(config));
    showStatus('配置已保存！', 'success');
    
    // 保存后自动关闭配置面板
    setTimeout(() => {
        closeConfigPanel();
    }, 1000);
}

// 从本地存储加载配置
function loadConfig() {
    const savedConfig = localStorage.getItem('videoAnalyzerConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        document.getElementById('apiEndpoint').value = config.endpoint || '';
        document.getElementById('apiKey').value = config.apiKey || '';
        document.getElementById('modelId').value = config.modelId || '';
        document.getElementById('promptTemplate').value = config.promptTemplate || 
            '请详细描述这张图像的内容，包括场景、主体、动作、风格、色彩、光照等要素。用简洁的语言生成一个可用于AI绘图的提示词。';
        document.getElementById('imageApiEndpoint').value = config.imageApiEndpoint || '';
        document.getElementById('imageApiKey').value = config.imageApiKey || '';
        document.getElementById('imageModelId').value = config.imageModelId || '';
    }
}

// 显示状态信息
function showStatus(message, type = 'loading') {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `<i class="fas fa-${type === 'loading' ? 'sync-alt fa-spin' : type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'flex';
    statusDiv.style.alignItems = 'center';
    statusDiv.style.gap = '10px';
}

// 清除状态信息
function clearStatus() {
    document.getElementById('status').style.display = 'none';
}

// 更新进度条
function updateProgress(percent) {
    document.getElementById('progress').style.width = `${percent}%`;
}

// 更新帧计数
function updateFrameCount(count) {
    document.getElementById('frameCount').textContent = `${count} 帧`;
}

// 获取空状态HTML
function getEmptyStateHTML() {
    return `
        <div class="empty-state" style="text-align: center; padding: 40px; color: var(--gray);">
            <i class="fas fa-image" style="font-size: 3rem; margin-bottom: 15px;"></i>
            <h3>暂无分析结果</h3>
            <p>上传视频并开始分析后，结果将显示在这里</p>
        </div>
    `;
}

// 分析视频主函数
async function analyzeVideo() {
    if (!uploadedVideoFile) {
        showStatus('请先上传一个视频文件', 'error');
        return;
    }
    
    // 检查API配置
    const apiKey = document.getElementById('apiKey').value;
    const modelId = document.getElementById('modelId').value;
    
    if (!apiKey || !modelId) {
        showStatus('请先配置API密钥和模型ID', 'error');
        // 自动打开配置面板
        toggleConfigPanel();
        return;
    }
    
    const interval = parseInt(document.getElementById('frameInterval').value) * 1000;
    if (isNaN(interval) || interval < 1000) {
        showStatus('请设置合理的采样间隔（至少1秒）', 'error');
        return;
    }
    
    showStatus('正在提取视频帧...', 'loading');
    updateProgress(10);
    
    try {
        const frames = await extractVideoFrames(videoElement, interval);
        currentFrames = frames;
        showStatus(`成功提取 ${frames.length} 帧，正在生成提示词...`, 'loading');
        updateProgress(30);
        
        document.getElementById('framesContainer').innerHTML = '';
        updateFrameCount(frames.length);
        
        // 逐帧处理
        for (let i = 0; i < frames.length; i++) {
            const prompt = await getFramePromptFromAPI(frames[i]);
            displayFrameWithPrompt(frames[i], prompt, i, frames.length);
            
            // 更新进度
            const progress = 30 + (i / frames.length) * 70;
            updateProgress(progress);
            showStatus(`处理进度: ${i + 1}/${frames.length} 帧`, 'loading');
        }
        
        updateProgress(100);
        showStatus(`分析完成！共处理 ${frames.length} 个视频帧。`, 'success');
        
    } catch (error) {
        console.error('分析视频时出错:', error);
        showStatus(`分析失败: ${error.message}`, 'error');
        updateProgress(0);
    }
}

// 提取视频帧
function extractVideoFrames(video, intervalMs) {
    return new Promise((resolve, reject) => {
        const frames = [];
        let currentTime = 0;
        
        // 设置超时保护
        const timeout = setTimeout(() => {
            reject(new Error('视频帧提取超时，请尝试缩短视频长度或增加采样间隔'));
        }, 60000);
        
        video.addEventListener('seeked', function onSeeked() {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                frames.push(blob);
                currentTime += intervalMs;
                
                if (currentTime <= video.duration * 1000) {
                    video.currentTime = currentTime / 1000;
                } else {
                    clearTimeout(timeout);
                    video.removeEventListener('seeked', onSeeked);
                    resolve(frames);
                }
            }, 'image/jpeg', 0.8);
        });
        
        // 开始提取过程
        video.currentTime = 0;
        
        // 错误处理
        video.addEventListener('error', () => {
            clearTimeout(timeout);
            reject(new Error('视频加载失败，请检查文件格式'));
        });
    });
}

// 调用火山引擎API生成提示词
async function getFramePromptFromAPI(frameBlob) {
    const API_CONFIG = {
        endpoint: document.getElementById('apiEndpoint').value,
        apiKey: document.getElementById('apiKey').value,
        modelId: document.getElementById('modelId').value
    };
    
    const promptTemplate = document.getElementById('promptTemplate').value;
    
    // 检查配置
    if (!API_CONFIG.apiKey || !API_CONFIG.modelId) {
        return "请先配置API密钥和模型ID以获取真实分析结果。";
    }
    
    const base64Image = await blobToBase64(frameBlob);
    
    const requestBody = {
        model: API_CONFIG.modelId,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: base64Image
                        }
                    },
                    {
                        type: "text",
                        text: promptTemplate
                    }
                ]
            }
        ]
    };
    
    try {
        // 使用本地代理服务器避免CORS问题
        const proxyEndpoint = 'http://localhost:3001/api/chat/completions';
        const response = await fetch(proxyEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: requestBody.messages,
                model: API_CONFIG.modelId,
                apiKey: API_CONFIG.apiKey
            })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('调用火山引擎API时出错:', error);
        return `生成提示词时出错: ${error.message}`;
    }
}

// 工具函数：Blob转Base64
function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

// 显示帧和提示词
function displayFrameWithPrompt(frameBlob, prompt, index, total) {
    const container = document.getElementById('framesContainer');
    
    // 移除空状态提示
    if (container.querySelector('.empty-state')) {
        container.innerHTML = '';
    }
    
    const frameCard = document.createElement('div');
    frameCard.className = 'frame-card';
    frameCard.setAttribute('data-frame-index', index);
    
    // 创建图片对比容器
    const imageComparison = document.createElement('div');
    imageComparison.className = 'image-comparison';
    
    // 原始帧图片
    const originalImageContainer = document.createElement('div');
    originalImageContainer.className = 'image-container original-image';
    
    const originalImg = document.createElement('img');
    originalImg.src = URL.createObjectURL(frameBlob);
    originalImg.className = 'frame-image';
    originalImg.alt = `视频帧 ${index + 1}`;
    originalImg.onclick = () => openImageModal(originalImg.src, '原始帧');
    
    const originalLabel = document.createElement('div');
    originalLabel.className = 'image-label';
    originalLabel.textContent = '原始帧';
    
    originalImageContainer.appendChild(originalImg);
    originalImageContainer.appendChild(originalLabel);
    
    // AI生成图片占位容器
    const generatedImageContainer = document.createElement('div');
    generatedImageContainer.className = 'image-container generated-image';
    generatedImageContainer.id = `generated-image-${index}`;
    
    const generatedPlaceholder = document.createElement('div');
    generatedPlaceholder.className = 'image-placeholder';
    generatedPlaceholder.innerHTML = `
        <i class="fas fa-image"></i>
        <span>AI生成图片将显示在这里</span>
    `;
    
    const generatedLabel = document.createElement('div');
    generatedLabel.className = 'image-label';
    generatedLabel.textContent = 'AI生成';
    
    generatedImageContainer.appendChild(generatedPlaceholder);
    generatedImageContainer.appendChild(generatedLabel);
    
    imageComparison.appendChild(originalImageContainer);
    imageComparison.appendChild(generatedImageContainer);
    
    const frameContent = document.createElement('div');
    frameContent.className = 'frame-content';
    
    const frameInfo = document.createElement('div');
    frameInfo.className = 'frame-info';
    frameInfo.innerHTML = `<span>帧 ${index + 1}/${total}</span><span>${new Date().toLocaleTimeString()}</span>`;
    
    // 创建提示词容器
    const promptContainer = document.createElement('div');
    promptContainer.className = 'prompt-container';
    
    // 中文提示词文本框
    const chinesePromptBox = document.createElement('textarea');
    chinesePromptBox.className = 'frame-prompt chinese-prompt';
    chinesePromptBox.value = prompt;
    chinesePromptBox.readOnly = false;
    chinesePromptBox.placeholder = '中文提示词...可以编辑此提示词来调整图片生成效果';
    
    promptContainer.appendChild(chinesePromptBox);
    
    const frameActions = document.createElement('div');
    frameActions.className = 'frame-actions';
    
    const copyButton = document.createElement('button');
    copyButton.className = 'btn btn-outline';
    copyButton.style.padding = '8px 12px';
    copyButton.style.fontSize = '0.8rem';
    copyButton.innerHTML = '<i class="fas fa-copy"></i> 复制';
    copyButton.onclick = () => {
        chinesePromptBox.select();
        document.execCommand('copy');
        copyButton.innerHTML = '<i class="fas fa-check"></i> 已复制';
        setTimeout(() => {
            copyButton.innerHTML = '<i class="fas fa-copy"></i> 复制';
        }, 2000);
    };
    
    const regeneratePromptButton = document.createElement('button');
    regeneratePromptButton.className = 'btn btn-outline regenerate-prompt-btn';
    regeneratePromptButton.style.padding = '8px 12px';
    regeneratePromptButton.style.fontSize = '0.8rem';
    regeneratePromptButton.innerHTML = '<i class="fas fa-redo"></i> 重新生成提示词';
    regeneratePromptButton.onclick = () => {
        regenerateSinglePrompt(index, frameBlob);
    };
    
    const regenerateImageButton = document.createElement('button');
    regenerateImageButton.className = 'btn btn-outline regenerate-btn';
    regenerateImageButton.style.padding = '8px 12px';
    regenerateImageButton.style.fontSize = '0.8rem';
    regenerateImageButton.innerHTML = '<i class="fas fa-sync-alt"></i> 重新生成图片';
    regenerateImageButton.onclick = () => {
        generateSingleImage(index);
    };
    
    frameActions.appendChild(copyButton);
    frameActions.appendChild(regeneratePromptButton);
    frameActions.appendChild(regenerateImageButton);
    
    frameContent.appendChild(frameInfo);
    frameContent.appendChild(promptContainer);
    frameContent.appendChild(frameActions);
    
    frameCard.appendChild(imageComparison);
    frameCard.appendChild(frameContent);
    container.appendChild(frameCard);
}

// 清除分析结果
function clearAnalysis() {
    document.getElementById('framesContainer').innerHTML = getEmptyStateHTML();
    updateFrameCount(0);
    updateProgress(0);
    clearStatus();
}

// 生成图片主函数
async function generateImages() {
    console.log('🎯 生成图片按钮被点击');
    
    const frameCards = document.querySelectorAll('.frame-card');
    
    if (frameCards.length === 0) {
        console.log('❌ 没有找到帧卡片，请先分析视频');
        showStatus('请先分析视频生成提示词', 'error');
        return;
    }
    
    console.log(`📊 找到 ${frameCards.length} 个帧卡片`);
    
    // 检查API配置 - 现在检查图片API配置
    const imageApiKey = document.getElementById('imageApiKey').value || document.getElementById('apiKey').value;
    const imageModelId = document.getElementById('imageModelId').value || document.getElementById('modelId').value;
    
    console.log('🔑 API配置检查:', {
        imageApiKey: imageApiKey ? '已配置' : '未配置',
        imageModelId: imageModelId ? '已配置' : '未配置'
    });
    
    if (!imageApiKey || !imageModelId) {
        console.log('❌ API配置不完整，无法生成图片');
        showStatus('请先配置API密钥和模型ID', 'error');
        toggleConfigPanel();
        return;
    }
    
    console.log('✅ API配置完整，开始生成图片');
    showStatus('正在生成图片...', 'loading');
    updateProgress(10);
    
    try {
        const totalFrames = frameCards.length;
        let successCount = 0;
        
        for (let i = 0; i < totalFrames; i++) {
            const frameCard = frameCards[i];
            const promptBox = frameCard.querySelector('.frame-prompt');
            const prompt = promptBox.value;
            
            if (prompt && !prompt.includes('请先配置API密钥') && !prompt.includes('生成提示词时出错')) {
                showStatus(`正在生成第 ${i + 1}/${totalFrames} 张图片...`, 'loading');
                
                // 获取对应的原始帧作为参考图
                const frameIndex = parseInt(frameCard.getAttribute('data-frame-index'));
                const originalFrameBlob = currentFrames[frameIndex];
                
                console.log(`开始生成第 ${i + 1} 帧图片，使用参考图+文字模式，提示词:`, prompt.substring(0, 100));
                const generatedImage = await generateImageFromPrompt(prompt, originalFrameBlob);
                
                if (generatedImage) {
                    // 在帧卡片中添加生成的图片
                    addGeneratedImageToCard(frameCard, generatedImage, i);
                    successCount++;
                    console.log(`第 ${i + 1} 帧图片生成成功`);
                } else {
                    console.log(`第 ${i + 1} 帧图片生成失败`);
                }
                
                // 更新进度
                const progress = 10 + (i / totalFrames) * 90;
                updateProgress(progress);
            }
        }
        
        updateProgress(100);
        showStatus(`图片生成完成！成功生成 ${successCount}/${totalFrames} 张图片。`, 'success');
        
    } catch (error) {
        console.error('生成图片时出错:', error);
        showStatus(`生成图片失败: ${error.message}`, 'error');
        updateProgress(0);
    }
}

// 翻译中文提示词到英文
async function translatePromptToEnglish(chinesePrompt, englishPromptBox, syncStatus) {
    if (!chinesePrompt || chinesePrompt.trim() === '') {
        englishPromptBox.value = '';
        syncStatus.style.display = 'none';
        return;
    }
    
    // 显示同步状态
    syncStatus.style.display = 'flex';
    syncStatus.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> 翻译中...';
    
    try {
        // 使用火山引擎API进行翻译
        const API_CONFIG = {
            endpoint: document.getElementById('apiEndpoint').value,
            apiKey: document.getElementById('apiKey').value,
            modelId: document.getElementById('modelId').value
        };
        
        if (!API_CONFIG.apiKey || !API_CONFIG.modelId) {
            // 如果没有配置API，使用简单的关键词翻译
            const translatedPrompt = simpleTranslate(chinesePrompt);
            englishPromptBox.value = translatedPrompt;
            syncStatus.innerHTML = '<i class="fas fa-check"></i> 翻译完成';
            setTimeout(() => {
                syncStatus.style.display = 'none';
            }, 2000);
            return;
        }
        
        const requestBody = {
            model: API_CONFIG.modelId,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `请将以下中文提示词翻译成英文，保持专业美食摄影的描述风格：\n\n${chinesePrompt}`
                        }
                    ]
                }
            ]
        };
        
        // 使用本地代理服务器避免CORS问题
        const proxyEndpoint = 'http://localhost:3001/api/chat/completions';
        const response = await fetch(proxyEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: requestBody.messages,
                model: API_CONFIG.modelId,
                apiKey: API_CONFIG.apiKey
            })
        });
        
        if (!response.ok) {
            throw new Error(`翻译API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        const translatedText = data.choices[0].message.content;
        
        englishPromptBox.value = translatedText;
        syncStatus.innerHTML = '<i class="fas fa-check"></i> 翻译完成';
        setTimeout(() => {
            syncStatus.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        console.error('翻译提示词时出错:', error);
        // 使用简单的关键词翻译作为备选方案
        const translatedPrompt = simpleTranslate(chinesePrompt);
        englishPromptBox.value = translatedPrompt;
        syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 翻译失败，使用关键词翻译';
        setTimeout(() => {
            syncStatus.style.display = 'none';
        }, 3000);
    }
}

// 简单的关键词翻译（当API不可用时使用）
function simpleTranslate(chinesePrompt) {
    const translations = {
        '专业美食摄影': 'Professional food photography',
        '高清细节': 'high detail',
        '色彩鲜艳': 'vibrant colors',
        '明亮柔和的光线': 'bright soft lighting',
        '浅灰色背景': 'light gray background',
        '巧克力': 'chocolate',
        '甜点': 'dessert',
        '布朗尼': 'brownie',
        '雪花酥': 'nougat',
        '牛轧糖': 'nougat candy',
        '葡萄干': 'raisins',
        '饼干': 'biscuits',
        '糖粉': 'powdered sugar',
        '抹茶粉': 'matcha powder',
        '奶酪': 'cheese',
        '白巧克力': 'white chocolate',
        '拉丝效果': 'stringy texture',
        '粘稠': 'sticky',
        '表面': 'surface',
        '内部': 'inside',
        '周围': 'around',
        '散落': 'scattered',
        '标志': 'logo',
        'AI生成': 'AI generated'
    };
    
    let englishPrompt = chinesePrompt;
    
    // 替换关键词
    for (const [chinese, english] of Object.entries(translations)) {
        englishPrompt = englishPrompt.replace(new RegExp(chinese, 'g'), english);
    }
    
    return englishPrompt;
}

// 重新生成单帧提示词
async function regenerateSinglePrompt(frameIndex, frameBlob) {
    const frameCard = document.querySelector(`[data-frame-index="${frameIndex}"]`);
    
    if (!frameCard) {
        showStatus('找不到对应的帧卡片', 'error');
        return;
    }
    
    // 检查API配置
    const apiKey = document.getElementById('apiKey').value;
    const modelId = document.getElementById('modelId').value;
    
    if (!apiKey || !modelId) {
        showStatus('请先配置API密钥和模型ID', 'error');
        toggleConfigPanel();
        return;
    }
    
    // 禁用重新生成提示词按钮
    const regeneratePromptBtn = frameCard.querySelector('.regenerate-prompt-btn');
    if (regeneratePromptBtn) {
        regeneratePromptBtn.disabled = true;
        regeneratePromptBtn.innerHTML = '<i class="fas fa-redo fa-spin"></i> 生成中...';
    }
    
    try {
        showStatus(`正在为第 ${frameIndex + 1} 帧重新生成提示词...`, 'loading');
        
        const newPrompt = await getFramePromptFromAPI(frameBlob);
        if (newPrompt && !newPrompt.includes('请先配置API密钥') && !newPrompt.includes('生成提示词时出错')) {
            const promptBox = frameCard.querySelector('.frame-prompt');
            promptBox.value = newPrompt;
            showStatus(`第 ${frameIndex + 1} 帧提示词重新生成成功！`, 'success');
        } else {
            showStatus(`第 ${frameIndex + 1} 帧提示词重新生成失败`, 'error');
        }
        
    } catch (error) {
        console.error('重新生成提示词时出错:', error);
        showStatus(`重新生成提示词失败: ${error.message}`, 'error');
    } finally {
        // 恢复重新生成提示词按钮
        if (regeneratePromptBtn) {
            setTimeout(() => {
                regeneratePromptBtn.disabled = false;
                regeneratePromptBtn.innerHTML = '<i class="fas fa-redo"></i> 重新生成提示词';
            }, 1000);
        }
    }
}

// 单帧图片生成函数
async function generateSingleImage(frameIndex) {
    const frameCard = document.querySelector(`[data-frame-index="${frameIndex}"]`);
    
    if (!frameCard) {
        showStatus('找不到对应的帧卡片', 'error');
        return;
    }
    
    const promptBox = frameCard.querySelector('.frame-prompt');
    const prompt = promptBox.value;
    
    if (!prompt || prompt.includes('请先配置API密钥') || prompt.includes('生成提示词时出错')) {
        showStatus('该帧没有有效的提示词', 'error');
        return;
    }
    
    // 检查API配置
    const apiKey = document.getElementById('apiKey').value;
    const modelId = document.getElementById('modelId').value;
    
    if (!apiKey || !modelId) {
        showStatus('请先配置API密钥和模型ID', 'error');
        toggleConfigPanel();
        return;
    }
    
    // 禁用重新生成按钮
    const regenerateBtn = frameCard.querySelector('.regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> 生成中...';
    }
    
    try {
        showStatus(`正在为第 ${frameIndex + 1} 帧生成图片...`, 'loading');
        
        // 获取对应的原始帧作为参考图
        const originalFrameBlob = currentFrames[frameIndex];
        
        const generatedImage = await generateImageFromPrompt(prompt, originalFrameBlob);
        if (generatedImage) {
            // 在帧卡片中添加生成的图片
            addGeneratedImageToCard(frameCard, generatedImage, frameIndex);
            showStatus(`第 ${frameIndex + 1} 帧图片生成成功！`, 'success');
        } else {
            showStatus(`第 ${frameIndex + 1} 帧图片生成失败`, 'error');
        }
        
    } catch (error) {
        console.error('生成单帧图片时出错:', error);
        showStatus(`生成图片失败: ${error.message}`, 'error');
    } finally {
        // 恢复重新生成按钮
        if (regenerateBtn) {
            setTimeout(() => {
                regenerateBtn.disabled = false;
                regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 重新生成';
            }, 1000);
        }
    }
}

// 调用火山引擎API生成图片（参考图+文字模式）
async function generateImageFromPrompt(prompt, referenceImageBlob = null) {
    // 优先使用图片生成API配置，如果未配置则使用默认API配置
    const IMAGE_API_CONFIG = {
        endpoint: document.getElementById('imageApiEndpoint').value || 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
        apiKey: document.getElementById('imageApiKey').value || document.getElementById('apiKey').value,
        modelId: document.getElementById('imageModelId').value || document.getElementById('modelId').value
    };
    
    // 检查配置
    if (!IMAGE_API_CONFIG.apiKey || !IMAGE_API_CONFIG.modelId) {
        console.warn('图片生成API配置不完整，无法生成图片');
        showStatus('请先配置图片生成API密钥和模型ID', 'error');
        return null;
    }
    
    try {
        // 详细的请求参数日志
        console.log('=== 图片生成请求参数详情 ===');
        console.log('模型ID:', IMAGE_API_CONFIG.modelId);
        console.log('提示词长度:', prompt.length);
        console.log('提示词内容:', prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''));
        console.log('是否包含参考图:', !!referenceImageBlob);
        console.log('参考图类型:', referenceImageBlob ? referenceImageBlob.type : '无');
        console.log('参考图大小:', referenceImageBlob ? `${(referenceImageBlob.size / 1024).toFixed(2)} KB` : '无');
        console.log('使用图片API配置:', document.getElementById('imageApiKey').value ? '是' : '否');
        console.log('API端点:', IMAGE_API_CONFIG.endpoint);
        console.log('============================');
        
        // 构建官方API格式的请求体
        let requestBody = {
            model: IMAGE_API_CONFIG.modelId,
            prompt: prompt,
            sequential_image_generation: "disabled",
            response_format: "url",
            size: "2K",
            stream: false,
            watermark: true
        };
        
        // 如果有参考图，添加图像数据（使用URL格式）
        if (referenceImageBlob) {
            // 使用URL.createObjectURL创建临时URL
            const imageUrl = URL.createObjectURL(referenceImageBlob);
            requestBody.image = imageUrl;
            
            console.log('✅ 使用参考图+文字模式生成图片（图生图）');
            console.log('参考图URL:', imageUrl);
            console.log('参考图Blob信息:', {
                type: referenceImageBlob.type,
                size: referenceImageBlob.size,
                blobType: typeof referenceImageBlob
            });
            
            // 清理临时URL（在请求完成后）
            setTimeout(() => {
                URL.revokeObjectURL(imageUrl);
                console.log('清理临时URL:', imageUrl);
            }, 30000); // 30秒后清理
        } else {
            console.log('⚠️ 使用纯文本提示词生成图片（文生图）');
        }
        
        // 打印完整的请求体（不含敏感信息）
        const logRequestBody = {...requestBody};
        if (logRequestBody.image) {
            logRequestBody.image = `[Base64图像数据，长度: ${logRequestBody.image.length}]`;
        }
        console.log('发送的请求体（官方格式）:', logRequestBody);
        
        // 使用本地代理服务器避免CORS问题
        const proxyEndpoint = 'http://localhost:3001/api/images/generations';
        console.log('发送请求到代理服务器:', proxyEndpoint);
        
        const response = await fetch(proxyEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...requestBody,
                apiKey: IMAGE_API_CONFIG.apiKey
            })
        });
        
        console.log('API响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 图片生成API请求失败:', response.status, errorText);
            throw new Error(`图片生成API请求失败: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ 图片生成API响应数据:', data);
        
        // 解析官方API响应格式
        if (data.data && data.data.length > 0) {
            const imageUrl = data.data[0].url;
            console.log('🎉 成功获取图片URL:', imageUrl);
            console.log('生成的图片数量:', data.data.length);
            return imageUrl;
        }
        
        console.warn('⚠️ 图片生成API返回格式不匹配，无法解析图片数据:', data);
        // 生成模拟图片作为备选方案
        console.log('使用模拟图片作为备选方案');
        return generateMockImage(prompt, referenceImageBlob);
        
    } catch (error) {
        console.error('❌ 调用火山引擎图片生成API时出错:', error);
        console.error('错误详情:', error.message);
        // 生成模拟图片作为备选方案
        console.log('使用模拟图片作为备选方案');
        return generateMockImage(prompt, referenceImageBlob);
    }
}

// 生成模拟图片（当API不可用时使用）
function generateMockImage(prompt, referenceImageBlob = null) {
    console.log('使用模拟图片生成功能');
    console.log('模拟图片生成参数:', {
        promptLength: prompt.length,
        hasReferenceImage: !!referenceImageBlob
    });
    
    // 创建一个简单的Canvas来生成模拟图片
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 生成渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#4361ee');
    gradient.addColorStop(1, '#4cc9f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // 添加文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AI生成图片', 256, 200);
    
    ctx.font = '16px Arial';
    ctx.fillText('基于提示词生成', 256, 230);
    
    // 添加提示词摘要
    const shortPrompt = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    ctx.font = '14px Arial';
    ctx.fillText(shortPrompt, 256, 280);
    
    // 添加说明文字
    ctx.font = '12px Arial';
    ctx.fillText('（实际使用时请配置正确的图片生成API）', 256, 320);
    
    // 如果使用参考图，添加额外说明
    if (referenceImageBlob) {
        ctx.fillText('（参考图+文字模式）', 256, 350);
    }
    
    // 转换为base64
    return canvas.toDataURL('image/png');
}

// 在帧卡片中添加生成的图片
function addGeneratedImageToCard(frameCard, imageData, index) {
    // 找到对应的AI生成图片容器
    const generatedImageContainer = document.getElementById(`generated-image-${index}`);
    
    if (generatedImageContainer) {
        // 清空占位符内容
        generatedImageContainer.innerHTML = '';
        
        // 创建图片元素
        const generatedImg = document.createElement('img');
        generatedImg.src = imageData;
        generatedImg.className = 'frame-image';
        generatedImg.alt = `AI生成图片 ${index + 1}`;
        generatedImg.onclick = () => openImageModal(generatedImg.src, 'AI生成图片');
        
        // 创建下载按钮
        const downloadButton = document.createElement('button');
        downloadButton.className = 'btn btn-outline download-btn';
        downloadButton.innerHTML = '<i class="fas fa-download"></i> 下载';
        downloadButton.onclick = () => {
            downloadImage(imageData, `ai-generated-image-${index + 1}.png`);
        };
        
        // 创建标签
        const generatedLabel = document.createElement('div');
        generatedLabel.className = 'image-label';
        generatedLabel.textContent = 'AI生成';
        
        // 组装容器
        generatedImageContainer.appendChild(generatedImg);
        generatedImageContainer.appendChild(downloadButton);
        generatedImageContainer.appendChild(generatedLabel);
        
        // 添加成功动画效果
        generatedImageContainer.style.animation = 'fadeIn 0.5s ease';
    }
}

// 下载图片函数
function downloadImage(imageData, filename) {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 打开图片模态框
function openImageModal(imageSrc, title) {
    // 创建模态框元素
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        animation: fadeIn 0.3s ease forwards;
    `;
    
    // 模态框内容
    modal.innerHTML = `
        <div class="modal-content" style="
            max-width: 90%;
            max-height: 90%;
            position: relative;
            background: transparent;
            border-radius: 8px;
            overflow: hidden;
        ">
            <div class="modal-header" style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                z-index: 10;
            ">
                <h3 style="margin: 0; font-size: 1.1rem;">${title}</h3>
                <button class="close-btn" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>
            <img src="${imageSrc}" alt="${title}" style="
                width: 100%;
                height: auto;
                max-height: calc(90vh - 60px);
                object-fit: contain;
                display: block;
            ">
            <div class="modal-footer" style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px 20px;
                text-align: center;
                z-index: 10;
            ">
                <button class="download-btn" style="
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                ">下载图片</button>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 关闭按钮事件
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.onclick = () => {
        modal.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    };
    
    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    };
    
    // 下载按钮事件
    const downloadBtn = modal.querySelector('.download-btn');
    downloadBtn.onclick = () => {
        const filename = `${title}-${Date.now()}.png`;
        downloadImage(imageSrc, filename);
    };
    
    // ESC键关闭
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            modal.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);
}

// 设置文件类型选择器
function setupFileTypeSelector() {
    const fileTypeBtns = document.querySelectorAll('.file-type-btn');
    const videoUpload = document.querySelector('.video-upload');
    const imageUpload = document.querySelector('.image-upload');
    const videoControls = document.querySelector('.video-controls');
    const videoPreview = document.getElementById('videoPreview');
    const imagePreview = document.getElementById('imagePreview');
    
    fileTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的active类
            fileTypeBtns.forEach(b => b.classList.remove('active'));
            // 添加当前按钮的active类
            btn.classList.add('active');
            
            const fileType = btn.getAttribute('data-type');
            currentFileType = fileType;
            
            // 切换上传区域显示
            if (fileType === 'video') {
                videoUpload.classList.add('active');
                imageUpload.classList.remove('active');
                videoControls.style.display = 'block';
                videoPreview.style.display = 'block';
                imagePreview.style.display = 'none';
                document.querySelector('.subtitle').textContent = '上传视频，逐帧分析并生成AI提示词';
            } else {
                videoUpload.classList.remove('active');
                imageUpload.classList.add('active');
                videoControls.style.display = 'none';
                videoPreview.style.display = 'none';
                imagePreview.style.display = 'block';
                document.querySelector('.subtitle').textContent = '上传图片，分析并生成AI提示词';
            }
            
            // 清空之前的结果
            document.getElementById('framesContainer').innerHTML = getEmptyStateHTML();
            updateFrameCount(0);
            clearStatus();
        });
    });
}

// 处理图片上传
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // 验证文件类型
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
        showStatus('请上传图片文件！', 'error');
        return;
    }
    
    uploadedImages = files;
    
    // 显示图片预览
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = '';
    imagePreview.style.display = 'block';
    
    files.forEach((file, index) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.className = 'frame-image';
        img.alt = `上传图片 ${index + 1}`;
        img.style.marginBottom = '10px';
        img.style.borderRadius = '8px';
        img.style.maxWidth = '100%';
        imagePreview.appendChild(img);
    });
    
    // 清空之前的结果
    document.getElementById('framesContainer').innerHTML = getEmptyStateHTML();
    updateFrameCount(0);
    
    showStatus(`成功上传 ${files.length} 张图片！点击"开始分析"进行处理。`, 'success');
}

// 分析文件主函数（支持视频和图片）
async function analyzeFiles() {
    if (currentFileType === 'video') {
        await analyzeVideo();
    } else if (currentFileType === 'image') {
        await analyzeImages();
    }
}

// 分析图片主函数
async function analyzeImages() {
    if (uploadedImages.length === 0) {
        showStatus('请先上传图片文件', 'error');
        return;
    }
    
    // 检查API配置
    const apiKey = document.getElementById('apiKey').value;
    const modelId = document.getElementById('modelId').value;
    
    if (!apiKey || !modelId) {
        showStatus('请先配置API密钥和模型ID', 'error');
        // 自动打开配置面板
        toggleConfigPanel();
        return;
    }
    
    showStatus(`正在分析 ${uploadedImages.length} 张图片...`, 'loading');
    updateProgress(10);
    
    try {
        currentFrames = uploadedImages;
        showStatus(`开始生成提示词...`, 'loading');
        updateProgress(30);
        
        document.getElementById('framesContainer').innerHTML = '';
        updateFrameCount(uploadedImages.length);
        
        // 逐张图片处理
        for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];
            const prompt = await getImagePromptFromAPI(file);
            displayImageWithPrompt(file, prompt, i, uploadedImages.length);
            
            // 更新进度
            const progress = 30 + (i / uploadedImages.length) * 70;
            updateProgress(progress);
            showStatus(`处理进度: ${i + 1}/${uploadedImages.length} 张图片`, 'loading');
        }
        
        updateProgress(100);
        showStatus(`分析完成！共处理 ${uploadedImages.length} 张图片。`, 'success');
        
    } catch (error) {
        console.error('分析图片时出错:', error);
        showStatus(`分析失败: ${error.message}`, 'error');
        updateProgress(0);
    }
}

// 调用火山引擎API生成图片提示词
async function getImagePromptFromAPI(imageFile) {
    const API_CONFIG = {
        endpoint: document.getElementById('apiEndpoint').value,
        apiKey: document.getElementById('apiKey').value,
        modelId: document.getElementById('modelId').value
    };
    
    const promptTemplate = document.getElementById('promptTemplate').value;
    
    // 检查配置
    if (!API_CONFIG.apiKey || !API_CONFIG.modelId) {
        return "请先配置API密钥和模型ID以获取真实分析结果。";
    }
    
    const base64Image = await fileToBase64(imageFile);
    
    const requestBody = {
        model: API_CONFIG.modelId,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: base64Image
                        }
                    },
                    {
                        type: "text",
                        text: promptTemplate
                    }
                ]
            }
        ]
    };
    
    try {
        // 使用本地代理服务器避免CORS问题
        const proxyEndpoint = 'http://localhost:3001/api/chat/completions';
        const response = await fetch(proxyEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: requestBody.messages,
                model: API_CONFIG.modelId,
                apiKey: API_CONFIG.apiKey
            })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('调用火山引擎API时出错:', error);
        return `生成提示词时出错: ${error.message}`;
    }
}

// 工具函数：File转Base64
function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// 显示图片和提示词
function displayImageWithPrompt(imageFile, prompt, index, total) {
    const container = document.getElementById('framesContainer');
    
    // 移除空状态提示
    if (container.querySelector('.empty-state')) {
        container.innerHTML = '';
    }
    
    const frameCard = document.createElement('div');
    frameCard.className = 'frame-card';
    frameCard.setAttribute('data-frame-index', index);
    
    // 创建图片对比容器
    const imageComparison = document.createElement('div');
    imageComparison.className = 'image-comparison';
    
    // 原始图片
    const originalImageContainer = document.createElement('div');
    originalImageContainer.className = 'image-container original-image';
    
    const originalImg = document.createElement('img');
    originalImg.src = URL.createObjectURL(imageFile);
    originalImg.className = 'frame-image';
    originalImg.alt = `图片 ${index + 1}`;
    originalImg.onclick = () => openImageModal(originalImg.src, '原始图片');
    
    const originalLabel = document.createElement('div');
    originalLabel.className = 'image-label';
    originalLabel.textContent = '原始图片';
    
    originalImageContainer.appendChild(originalImg);
    originalImageContainer.appendChild(originalLabel);
    
    // AI生成图片占位容器
    const generatedImageContainer = document.createElement('div');
    generatedImageContainer.className = 'image-container generated-image';
    generatedImageContainer.id = `generated-image-${index}`;
    
    const generatedPlaceholder = document.createElement('div');
    generatedPlaceholder.className = 'image-placeholder';
    generatedPlaceholder.innerHTML = `
        <i class="fas fa-image"></i>
        <span>AI生成图片将显示在这里</span>
    `;
    
    const generatedLabel = document.createElement('div');
    generatedLabel.className = 'image-label';
    generatedLabel.textContent = 'AI生成';
    
    generatedImageContainer.appendChild(generatedPlaceholder);
    generatedImageContainer.appendChild(generatedLabel);
    
    imageComparison.appendChild(originalImageContainer);
    imageComparison.appendChild(generatedImageContainer);
    
    const frameContent = document.createElement('div');
    frameContent.className = 'frame-content';
    
    const frameInfo = document.createElement('div');
    frameInfo.className = 'frame-info';
    frameInfo.innerHTML = `<span>图片 ${index + 1}/${total}</span><span>${new Date().toLocaleTimeString()}</span>`;
    
    // 创建提示词容器
    const promptContainer = document.createElement('div');
    promptContainer.className = 'prompt-container';
    
    // 中文提示词文本框
    const chinesePromptBox = document.createElement('textarea');
    chinesePromptBox.className = 'frame-prompt chinese-prompt';
    chinesePromptBox.value = prompt;
    chinesePromptBox.readOnly = false;
    chinesePromptBox.placeholder = '中文提示词...可以编辑此提示词来调整图片生成效果';
    
    promptContainer.appendChild(chinesePromptBox);
    
    const frameActions = document.createElement('div');
    frameActions.className = 'frame-actions';
    
    const copyButton = document.createElement('button');
    copyButton.className = 'btn btn-outline';
    copyButton.style.padding = '8px 12px';
    copyButton.style.fontSize = '0.8rem';
    copyButton.innerHTML = '<i class="fas fa-copy"></i> 复制';
    copyButton.onclick = () => {
        chinesePromptBox.select();
        document.execCommand('copy');
        copyButton.innerHTML = '<i class="fas fa-check"></i> 已复制';
        setTimeout(() => {
            copyButton.innerHTML = '<i class="fas fa-copy"></i> 复制';
        }, 2000);
    };
    
    const regeneratePromptButton = document.createElement('button');
    regeneratePromptButton.className = 'btn btn-outline regenerate-prompt-btn';
    regeneratePromptButton.style.padding = '8px 12px';
    regeneratePromptButton.style.fontSize = '0.8rem';
    regeneratePromptButton.innerHTML = '<i class="fas fa-redo"></i> 重新生成提示词';
    regeneratePromptButton.onclick = () => {
        regenerateSingleImagePrompt(index, imageFile);
    };
    
    const regenerateImageButton = document.createElement('button');
    regenerateImageButton.className = 'btn btn-outline regenerate-btn';
    regenerateImageButton.style.padding = '8px 12px';
    regenerateImageButton.style.fontSize = '0.8rem';
    regenerateImageButton.innerHTML = '<i class="fas fa-sync-alt"></i> 重新生成图片';
    regenerateImageButton.onclick = () => {
        generateSingleImage(index);
    };
    
    frameActions.appendChild(copyButton);
    frameActions.appendChild(regeneratePromptButton);
    frameActions.appendChild(regenerateImageButton);
    
    frameContent.appendChild(frameInfo);
    frameContent.appendChild(promptContainer);
    frameContent.appendChild(frameActions);
    
    frameCard.appendChild(imageComparison);
    frameCard.appendChild(frameContent);
    container.appendChild(frameCard);
}

// 重新生成单张图片提示词
async function regenerateSingleImagePrompt(imageIndex, imageFile) {
    const frameCard = document.querySelector(`[data-frame-index="${imageIndex}"]`);
    
    if (!frameCard) {
        showStatus('找不到对应的图片卡片', 'error');
        return;
    }
    
    // 检查API配置
    const apiKey = document.getElementById('apiKey').value;
    const modelId = document.getElementById('modelId').value;
    
    if (!apiKey || !modelId) {
        showStatus('请先配置API密钥和模型ID', 'error');
        toggleConfigPanel();
        return;
    }
    
    // 禁用重新生成提示词按钮
    const regeneratePromptBtn = frameCard.querySelector('.regenerate-prompt-btn');
    if (regeneratePromptBtn) {
        regeneratePromptBtn.disabled = true;
        regeneratePromptBtn.innerHTML = '<i class="fas fa-redo fa-spin"></i> 生成中...';
    }
    
    try {
        showStatus(`正在为第 ${imageIndex + 1} 张图片重新生成提示词...`, 'loading');
        
        const newPrompt = await getImagePromptFromAPI(imageFile);
        if (newPrompt && !newPrompt.includes('请先配置API密钥') && !newPrompt.includes('生成提示词时出错')) {
            const promptBox = frameCard.querySelector('.frame-prompt');
            promptBox.value = newPrompt;
            showStatus(`第 ${imageIndex + 1} 张图片提示词重新生成成功！`, 'success');
        } else {
            showStatus(`第 ${imageIndex + 1} 张图片提示词重新生成失败`, 'error');
        }
        
    } catch (error) {
        console.error('重新生成提示词时出错:', error);
        showStatus(`重新生成提示词失败: ${error.message}`, 'error');
    } finally {
        // 恢复重新生成提示词按钮
        if (regeneratePromptBtn) {
            setTimeout(() => {
                regeneratePromptBtn.disabled = false;
                regeneratePromptBtn.innerHTML = '<i class="fas fa-redo"></i> 重新生成提示词';
            }, 1000);
        }
    }
}

// 页面卸载时清理URL对象
window.addEventListener('beforeunload', () => {
    if (videoElement && videoElement.src) {
        URL.revokeObjectURL(videoElement.src);
    }
});