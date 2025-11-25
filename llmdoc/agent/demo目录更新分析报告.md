# Demo目录更新分析报告

### Code Sections (The Evidence)
- `README.md` (lines 108-109): 包含两个已删除demo的本地开发链接
- `demo/html/material-editor/README.md` (lines 7, 49, 158, 178, 187): 多处引用已删除的pure.html和single.html文件
- `llmdoc/agent/PBRVisualizer_SDK_Demo实现全面分析报告.md`: 详细描述了4个已删除demo的功能和架构
- `llmdoc/agent/sdk-demo-execution-failure-analysis.md`: 分析了已删除demo中的sdk-simple.html问题
- `vercel.json` (lines 5-6): 包含指向已删除demo文件的路由重写规则
- `vite.config.ts` (lines 11, 17, 47-50): 包含指向已删除demo文件的默认打开和静态复制配置

### Report (The Answers)

#### result
**需要更新的文档文件清单：**

1. **README.md** - 包含两个已删除demo的本地开发链接
2. **demo/html/material-editor/README.md** - 多处引用已删除的pure.html、single.html文件
3. **llmdoc/agent/PBRVisualizer_SDK_Demo实现全面分析报告.md** - 完整描述了4个已删除demo的详细分析
4. **llmdoc/agent/sdk-demo-execution-failure-analysis.md** - 引用了sdk-simple.html的具体代码分析
5. **vercel.json** - 包含指向已删除demo的路由重写规则
6. **vite.config.ts** - 包含指向已删除demo的默认打开和静态复制配置

当前demo目录只保留两个文件：
- `demo/html/material-editor/sdk-simple.html`
- `demo/html/ai_studio_code.html`

#### conclusions
**文档更新优先级分析：**

1. **高优先级** (直接影响开发体验)：
   - `README.md` - 开发者快速入门文档，链接失效影响开发体验
   - `vite.config.ts` - 开发服务器默认打开页面已不存在
   - `vercel.json` - 生产环境路由重写规则失效

2. **中优先级** (影响实际demo使用)：
   - `demo/html/material-editor/README.md` - 材质编辑器demo的主要说明文档
   - `llmdoc/agent/sdk-demo-execution-failure-analysis.md` - 包含现有sdk-simple.html的具体问题分析

3. **低优先级** (历史记录性质)：
   - `llmdoc/agent/PBRVisualizer_SDK_Demo实现全面分析报告.md` - 历史分析报告，主要作为记录

**失效的demo文件清单：**
- `/demo/index.html` (主导航页面)
- `/demo/html/pbr-demo.html` (专业PBR可视化demo)
- `/demo/html/single.html` (3D模型转换工具)
- `/demo/html/material-editor/pure.html` (纯Three.js实现)

#### relations
**文档间的依赖关系：**
- `README.md` → 依赖 `/demo/index.html` 和 `/demo/pbr-demo.html` 的存在
- `vite.config.ts` → 开发服务器依赖 `/demo/index.html` 的存在
- `vercel.json` → 生产环境依赖 `/demo/index.html` 和路由规则
- `demo/html/material-editor/README.md` → 依赖 `pure.html` 和 `single.html` 的存在
- 分析报告 → 依赖所有已删除demo文件的详细分析

**需要重构的文档内容：**
1. **README.md** - 需要更新demo链接，改为指向现有的两个demo
2. **demo/html/material-editor/README.md** - 需要移除对已删除demo的引用，重新组织demo说明
3. **配置文件** - 需要更新开发和生产环境的配置以反映新的demo结构
4. **分析报告** - 需要更新或标记为历史文档，创建新的demo分析报告