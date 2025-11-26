# AI Coding Agent Instructions - 智能视频分析工具

## 项目概览

这是一个**客户端视频分析工具**，用于：
1. 上传视频文件
2. 按设定间隔（默认3秒）逐帧提取
3. 将每一帧发送到外部API（火山引擎视觉模型）
4. 生成AI驱动的图像描述提示词
5. 在UI中展示结果供用户复制使用

**架构特点**：完全基于浏览器的客户端应用，无后端服务器。

---

## 核心数据流

```
用户上传视频 
    → 验证文件类型 
    → 显示视频预览
    → 提取帧（interval间隔）
    → 逐帧API调用（base64图像）
    → 显示提示词卡片
    → 支持复制功能
```

**关键变量**：
- `uploadedVideoFile`：当前上传的文件对象
- `currentFrames`：提取的所有Blob帧
- `videoElement`：html5 video标签引用

---

## 架构与组件关系

### 文件职责
- **app.js**：所有业务逻辑和DOM交互
- **index.html**：两列布局（左配置+上传 | 右结果展示）
- **style.css**：CSS变量主题系统 + 响应式网格布局

### 主要功能模块

| 函数/功能 | 用途 | 关键输入 | 输出 |
|---------|------|--------|------|
| `extractVideoFrames()` | 使用canvas逐帧截图 | video元素 + 间隔ms | Blob数组 |
| `getFramePromptFromAPI()` | 调用火山引擎API | frameBlob + 模板 | 字符串提示词 |
| `displayFrameWithPrompt()` | 渲染卡片UI | Blob + prompt + 索引 | DOM插入 |
| `loadConfig()/saveConfig()` | localStorage持久化 | - | 无 |

---

## 重要实现细节与陷阱

### 1. 视频帧提取（extractVideoFrames）
```javascript
// 核心原理：跳转video.currentTime → 触发seeked事件 → canvas绘制 → toBlob转换
// 注意：使用了60秒超时保护，防止长视频卡住
// 重要：每个Blob转URL后未及时撤销会导致内存泄漏 → beforeunload监听清理
```

**常见问题**：
- 视频格式支持取决于浏览器（检查 `file.type.startsWith('video/')` 很宽松）
- `toBlob()` JPEG压缩为0.8质量以减小base64大小
- 跨域视频无法canvas绘制（需要CORS头）

### 2. API调用（getFramePromptFromAPI）
```javascript
// 请求格式：火山引擎ARK API格式
// 图像通过base64 data URL传递（不是URL对象）
// 模板可自定义，影响生成质量和风格
```

**配置项**：
- `apiEndpoint`：默认火山引擎北京区域
- `apiKey`：必需，若缺失返回占位符文本
- `modelId`：接入点ID，不同模型效果不同
- `promptTemplate`：系统提示词，决定生成风格

### 3. UI状态管理
```javascript
// showStatus() 控制加载/成功/错误三态显示
// updateProgress() 更新进度条（10% 提取 → 30% 开始处理 → 100% 完成）
// clearStatus() 在分析完成或清除时调用
```

---

## 性能与限制

| 限制 | 说明 | 影响 |
|------|------|------|
| 单次提取超时 | 60秒 | 长视频需更大间隔 |
| API并发 | 串行调用（不是并行） | N帧需N次HTTP请求 |
| Blob内存 | 所有帧保存在内存 | 高分辨率+短间隔会爆 |
| JPEG质量 | 0.8 | 平衡文件大小和AI识别 |

**优化建议**：
- 间隔设置：1-10秒，建议3-5秒获取合理帧数
- 高分辨率视频：增加间隔、降低采样率

---

## 开发工作流

### 添加新功能的检查清单
1. **修改API集成**：更新 `getFramePromptFromAPI()` 的requestBody格式
2. **UI新增输入**：在HTML中添加input → app.js中读取 → saveConfig/loadConfig支持持久化
3. **新增处理步骤**：在 `analyzeVideo()` 循环中插入 → 更新进度计算
4. **调试框架**：console.error记录详细信息 → status显示用户消息（技术细节用console）

### 常见编辑点
- **提示词模板**：index.html的textarea → 不需代码改动，用户可直接修改
- **颜色/主题**：style.css的`:root` CSS变量
- **按钮/状态消息**：hardcoded在app.js的showStatus调用处

---

## 关键约定与模式

### 错误处理
- **验证层**：文件类型、API配置、时间间隔合法性 → 返回error状态
- **API错误**：response.ok判断 + try-catch + 用户友好消息
- **视频错误**：video标签error事件监听

### 异步流程
```javascript
// analyzeVideo() 是主协调函数
// 1. 提取帧（Promise）
// 2. for循环逐帧API调用（await）
// 3. 每次循环后更新UI和进度
```
**重要**：API调用是串行的，不是Promise.all并发

### DOM操作约定
- 帧卡片通过 `displayFrameWithPrompt()` 动态创建
- 空状态HTML定义在 `getEmptyStateHTML()`
- 事件监听在DOMContentLoaded中集中处理

---

## 依赖与集成点

### 外部依赖
- **Font Awesome 6.4**：图标库（CDN）
- **火山引擎ARK API**：视觉模型调用（用户提供密钥）

### 本地存储
- Key: `videoAnalyzerConfig` (JSON字符串)
- 包含：endpoint, apiKey, modelId, promptTemplate

### 浏览器API依赖
- `File API` + `Canvas 2D`：视频帧提取
- `Fetch API`：HTTP请求
- `LocalStorage`：配置持久化
- `URL.createObjectURL/revokeObjectURL`：文件URL处理

---

## 测试要点

- ✓ 视频上传验证（仅接受video/*）
- ✓ 帧提取超时处理（>60秒）
- ✓ API错误响应处理
- ✓ 缺失配置时的友好提示
- ✓ localStorage读写功能
- ✓ 内存泄漏（URL释放）

