# 智能视频分析工具 - 逐帧AI提示词生成

这是一个智能视频分析工具，可以上传视频并逐帧分析生成AI提示词，然后根据提示词生成AI图片。

## 功能特性

- 🎥 视频上传和预览
- 🖼️ 逐帧提取视频帧
- 🤖 AI提示词生成（基于火山引擎API）
- 🎨 AI图片生成（基于火山引擎图片生成API）
- ⚙️ 独立的API配置管理
- 💾 配置本地存储
- 📱 响应式界面设计

## 解决CORS问题

由于浏览器安全策略，直接调用火山引擎API会遇到CORS（跨域资源共享）问题。我们提供了代理服务器解决方案。

### 启动代理服务器

1. **安装依赖**：
   ```bash
   npm install express cors node-fetch
   ```

2. **启动代理服务器**：
   ```bash
   node proxy-server.js
   ```

3. **验证服务器运行**：
   访问 http://localhost:3001/health 应该看到 `{"status":"ok","message":"代理服务器运行正常"}`

### 代理服务器端点

- `POST /api/images/generations` - 图片生成代理
- `POST /api/chat/completions` - 对话API代理  
- `GET /health` - 健康检查

## 配置说明

### API配置

1. **打开配置面板**：点击右上角"API配置"按钮
2. **配置对话API**：
   - API端点：`https://ark.cn-beijing.volces.com/api/v3`
   - API密钥：您的火山引擎API密钥
   - 模型ID：对话模型接入点ID

3. **配置图片生成API**：
   - 图片生成API端点：`https://ark.cn-beijing.volces.com/api/v3/images/generations`
   - 图片生成API密钥：您的火山引擎API密钥
   - 图片生成模型ID：图片生成模型ID

4. **保存配置**：点击"保存配置"按钮

## 使用流程

1. **上传视频**：选择视频文件（支持MP4, MOV, AVI等格式）
2. **设置采样间隔**：设置帧提取间隔（默认3秒）
3. **开始分析**：点击"开始分析"按钮
4. **查看提示词**：在右侧面板查看生成的AI提示词
5. **生成图片**：点击"生成图片"按钮生成AI图片
6. **下载结果**：可以下载生成的图片和提示词

## 技术架构

### 前端技术
- HTML5 + CSS3 + JavaScript
- Canvas API 用于视频帧提取
- Fetch API 用于HTTP请求
- LocalStorage 用于配置存储

### 后端技术
- Node.js + Express 代理服务器
- CORS 中间件解决跨域问题
- 火山引擎API集成

## 故障排除

### 常见问题

1. **CORS错误**：
   - 确保代理服务器正在运行
   - 检查代理服务器端口（默认3001）是否被占用

2. **API调用失败**：
   - 检查API密钥和模型ID是否正确
   - 查看浏览器控制台错误信息
   - 检查网络连接

3. **图片生成失败**：
   - 检查图片生成API配置
   - 系统会自动生成模拟图片作为备选

4. **视频处理失败**：
   - 检查视频文件格式
   - 尝试缩短视频长度或增加采样间隔

### 调试技巧

1. 打开浏览器开发者工具（F12）查看控制台日志
2. 检查网络面板查看API请求和响应
3. 使用测试页面验证基础功能：`test_image_generation.html`

## 文件结构

```
逐帧解析/
├── index.html                 # 主页面
├── app.js                     # 主要JavaScript逻辑
├── style.css                  # 样式文件
├── proxy-server.js            # 代理服务器
├── test_image_generation.html # 测试页面
└── README.md                  # 说明文档
```

## 注意事项

1. **API费用**：使用火山引擎API会产生费用，请合理使用
2. **视频大小**：建议使用较小的视频文件以减少处理时间
3. **网络要求**：需要稳定的网络连接以调用API
4. **浏览器兼容**：建议使用现代浏览器（Chrome、Firefox、Edge等）

## 许可证

MIT License

## 技术支持

如有问题，请检查：
1. 代理服务器是否正常运行
2. API配置是否正确
3. 浏览器控制台是否有错误信息
