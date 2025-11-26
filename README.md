# 智能视频分析工具 - 逐帧AI提示词生成

这是一个智能视频分析工具，可以上传视频并逐帧分析生成AI提示词，然后根据提示词生成AI图片。

## 功能特性

- 🎥 **视频上传和预览** - 支持MP4、MOV、AVI等视频格式
- 🖼️ **图片上传和分析** - 支持单张或多张图片批量分析
- 🔄 **文件类型切换** - 可在视频和图片分析模式间切换
- 🖼️ **逐帧提取视频帧** - 可设置采样间隔提取关键帧
- 🤖 **AI提示词生成** - 基于火山引擎API智能分析图像内容
- 🎨 **AI图片生成** - 基于火山引擎图片生成API
- 📝 **参考图+文字模式** - 使用原始图像作为参考生成新图片
- ⚙️ **独立的API配置管理** - 对话API和图片生成API分开配置
- 💾 **配置本地存储** - API配置自动保存到本地
- 📱 **响应式界面设计** - 适配桌面和移动设备

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

### 视频分析流程
1. **上传视频**：选择视频文件（支持MP4, MOV, AVI等格式）
2. **设置采样间隔**：设置帧提取间隔（默认3秒）
3. **开始分析**：点击"开始分析"按钮
4. **查看提示词**：在右侧面板查看生成的AI提示词
5. **生成图片**：点击"生成图片"按钮生成AI图片
6. **下载结果**：可以下载生成的图片和提示词

### 图片分析流程
1. **切换模式**：点击"图片"按钮切换到图片分析模式
2. **上传图片**：选择单张或多张图片文件（支持JPG、PNG等格式）
3. **开始分析**：点击"开始分析"按钮
4. **查看提示词**：在右侧面板查看每张图片生成的AI提示词
5. **生成图片**：点击"生成图片"按钮基于原始图片生成新的AI图片
6. **下载结果**：可以下载生成的图片和提示词

### 特色功能
- **参考图+文字模式**：使用原始图像作为参考，结合提示词生成新图片
- **批量处理**：支持同时处理多张图片
- **实时编辑**：可以编辑生成的提示词来优化图片生成效果
- **单帧重生成**：支持对单帧重新生成提示词或图片

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

## 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/paodingo/frame-analysis-tool.git
cd frame-analysis-tool
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动代理服务器
```bash
node proxy-server.js
```

### 4. 打开应用
在浏览器中打开 `index.html` 文件

## 环境要求

- **Node.js**: 版本 14.0 或更高
- **浏览器**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **网络**: 稳定的互联网连接（用于API调用）

## 项目特点

### 🎯 核心功能
- **智能视频分析**: 自动提取视频关键帧
- **AI提示词生成**: 基于视频内容生成高质量的AI绘画提示词
- **批量图片生成**: 一键生成多张AI图片
- **实时预览**: 即时查看生成结果

### 🔧 技术亮点
- **无后端依赖**: 纯前端应用，代理服务器仅用于解决CORS
- **配置持久化**: 本地存储API配置，无需重复输入
- **错误恢复**: 自动降级机制，API失败时使用模拟数据
- **响应式设计**: 适配桌面和移动设备

## API配置示例

### 火山引擎API获取步骤
1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 创建API密钥
3. 获取模型接入点ID
4. 在应用中配置相应参数

### 配置示例
```javascript
// 对话API配置
{
  "apiEndpoint": "https://ark.cn-beijing.volces.com/api/v3",
  "apiKey": "your-api-key-here",
  "modelId": "your-model-id-here"
}

// 图片生成API配置
{
  "imageApiEndpoint": "https://ark.cn-beijing.volces.com/api/v3/images/generations",
  "imageApiKey": "your-image-api-key-here", 
  "imageModelId": "your-image-model-id-here"
}
```

## 开发指南

### 本地开发
1. 启动代理服务器：`node proxy-server.js`
2. 使用Live Server或直接打开 `index.html`
3. 修改代码后刷新页面即可看到变化

### 自定义开发
- 修改 `app.js` 中的逻辑
- 调整 `style.css` 中的样式
- 扩展 `proxy-server.js` 中的API代理

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 提交Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 更新日志

### v1.0.0 (2024-11-26)
- ✅ 初始版本发布
- ✅ 视频逐帧分析功能
- ✅ AI提示词生成
- ✅ AI图片生成
- ✅ 代理服务器支持

## 技术支持

如有问题，请：
1. 查看 [Issues](https://github.com/paodingo/frame-analysis-tool/issues) 页面
2. 检查代理服务器是否正常运行
3. 验证API配置是否正确
4. 查看浏览器控制台错误信息
5. 提交新的Issue描述问题

## 相关链接

- [火山引擎API文档](https://www.volcengine.com/docs/6459/75268)
- [项目演示](https://paodingo.github.io/frame-analysis-tool/) (如果部署了GitHub Pages)
