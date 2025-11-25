# Demo系统状态参考

## 1. 核心摘要

Demo演示系统已恢复正常运行状态，包含完整的资源文件和功能模块，可直接用于PBR Visualizer SDK的功能展示和测试验证。

## 2. 源文件信息

### 资源文件清单
- **3D模型文件**: `demo/glb/` 目录包含4个GLB模型文件
  - `Camera_XHS_17479384306051040g00831hpgdts3jo6g5pmo3n0nc99qji23br8.glb` (22.8MB)
  - `military+character+3d+model_Clone1.glb` (3.8MB)
  - `moon_knight_mecha_marvel_rivals.glb` (36.0MB)
  - `test.glb` (9.0MB)

- **环境贴图**: `demo/hdr/env.hdr` (6.6MB) - HDR环境贴图，用于PBR渲染

- **配置文件**: `demo/tsconfig.json` - TypeScript配置文件

### 演示文件清单
- `demo/html/ai_studio_code.html` - AI Studio风格演示
- `demo/html/material-editor/sdk-simple.html` - SDK材质编辑器演示

## 3. 源文件位置

- **Primary Code**: `demo/` - 完整的演示系统目录
- **Models**: `demo/glb/` - 3D模型资源文件
- **Environment**: `demo/hdr/env.hdr` - HDR环境贴图
- **Configuration**: `demo/tsconfig.json` - TypeScript配置
- **Related Documentation**: `/llmdoc/agent/demo目录更新分析报告.md` - Demo系统分析报告

## 4. 使用说明

### 直接访问
```bash
# 开发环境访问
http://localhost:8083/demo/html/ai_studio_code.html
http://localhost:8083/demo/html/material-editor/sdk-simple.html

# 生产环境访问
https://your-domain/demo/html/ai_studio_code.html
```

### 资源引用
示例代码中的模型路径可更新为实际可用文件：
```javascript
// 使用demo中的模型文件
const model = await visualizer.loadModel('/demo/glb/test.glb');
const environment = await visualizer.loadEnvironmentHDRI('/demo/hdr/env.hdr');
```

## 5. 系统状态

- ✅ **Demo系统**: 完全正常运行
- ✅ **资源文件**: 4个3D模型 + 1个HDR环境贴图 + 配置文件
- ✅ **演示功能**: 2个核心HTML演示文件
- ✅ **文档同步**: 相关文档已更新

## 6. 下一步

- 使用提供的演示文件验证SDK功能
- 参考API文档进行二次开发
- 根据需要扩展新的演示场景