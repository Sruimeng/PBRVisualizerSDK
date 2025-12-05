# 预设切换演示 - 快速启动指南

## 5分钟快速开始

### 1. 访问演示页面

#### 开发环境

```bash
# 启动Vite开发服务器
npm run dev

# 在浏览器中打开
http://localhost:8083/demo/html/preset-switcher/
```

#### 生产环境

```bash
# 构建项目
npm run build

# 访问生产版本
https://your-domain/demo/html/preset-switcher/
```

### 2. 界面说明

演示页面分为三个主要区域：

```
┌─────────────────────────────────────────────────┐
│  左侧面板        │  中间3D视图  │  右侧配置面板  │
│                  │              │                │
│ • 场景选择       │  WebGL渲染   │ • 当前场景     │
│ • 模型选择       │  Canvas      │ • 当前材质     │
│ • 材质库选择     │              │ • 配置参数     │
│ • 具体材质       │              │                │
│ • 快速按钮       │              │                │
└─────────────────────────────────────────────────┘
```

### 3. 基本操作

#### 切换场景

方法1：使用下拉框
```
1. 在左侧面板找到"场景预设"
2. 打开"选择场景"下拉框
3. 选择场景名称（产品展示、科技现代等）
```

方法2：使用快速按钮
```
1. 在左侧面板快速按钮区域
2. 直接点击场景按钮（产品、角色、科技、艺术、极简）
```

#### 切换材质库

```
1. 在左侧面板找到"材质库"
2. 选择材质库（金属、塑料、玻璃、特殊）
3. 材质选择下拉框会自动更新
```

#### 切换具体材质

```
1. 在左侧面板的"具体材质"下拉框
2. 选择材质（抛光钢、拉丝铝、铜等）
3. 右侧面板会显示材质参数
```

#### 切换模型

```
1. 在左侧面板的"模型选择"下拉框
2. 选择模型（标准模型、相机、角色、机甲等）
3. 中间视图会加载新模型
```

### 4. 实际示例

#### 示例1：展示产品

```
步骤1: 场景选择 → 产品展示
  - 自动应用明亮的环境
  - 启用轻微的Bloom效果
  - 自动旋转视角

步骤2: 模型选择 → 标准模型
  - 加载test.glb

步骤3: 材质库选择 → 金属材质
  - 自动切换到第一个金属材质

步骤4: 具体材质 → 选择不同的金属
  - 抛光钢：高反射度
  - 铜：温暖的颜色
  - 镀铬：镜面效果
```

#### 示例2：展示角色

```
步骤1: 场景选择 → 角色展示
  - 应用温暖的环境
  - 启用SSAO阴影
  - 柔和的Bloom

步骤2: 模型选择 → 军事角色
  - 加载角色模型

步骤3: 材质库选择 → 特殊材质
  - 选择皮肤、织物等材质

步骤4: 应用合适的材质
  - 角色皮肤
  - 衣服布料
```

#### 示例3：技术展示

```
步骤1: 场景选择 → 科技现代
  - 冷色调环境
  - 强Bloom效果
  - 高对比度

步骤2: 模型选择 → 相机或机甲
  - 加载科技类模型

步骤3: 材质库选择 → 金属或特殊
  - 应用金属或科技材质

步骤4: 调整到最佳效果
```

### 5. 快捷键和全局函数

在浏览器控制台可以直接调用函数：

```javascript
// 切换场景
switchScene('product-showcase')
switchScene('tech-modern')
switchScene('character-display')

// 切换材质库
switchMaterialLibrary('metals')
switchMaterialLibrary('glass')

// 切换具体材质
switchMaterial('polished-steel')
switchMaterial('clear-glass')

// 切换模型
switchModel('/demo/glb/test.glb')

// 查看当前状态
window.demoInstance.getCurrentState()
// 输出: { scene: 'product-showcase', materialLibrary: 'metals', material: 'polished-steel', model: 'main_model' }
```

### 6. 常见操作

#### 快速对比不同场景

```
1. 加载一个模型
2. 连续点击快速按钮
3. 观察不同场景的效果对比
```

#### 材质对比

```
1. 固定场景和模型
2. 打开材质库下拉框
3. 一个个选择材质
4. 观察同一个模型在不同材质下的表现
```

#### 环境配置学习

```
1. 打开右侧配置面板
2. 查看各个场景的参数设置
3. 理解Bloom、SSAO、暗角等参数的作用
```

### 7. UI界面说明

#### 左侧面板

| 区域 | 说明 |
|-----|------|
| 场景预设 | 5个预设场景 + 5个快速按钮 |
| 模型选择 | 4个可用模型 |
| 材质库 | 4个材质库 + 快速按钮 |
| 具体材质 | 动态加载的具体材质列表 |

#### 中间视图

- 3D Canvas渲染区
- 支持旋转和缩放
- 自动旋转（可在场景中配置）

#### 右侧面板

| 区域 | 说明 |
|-----|------|
| 当前场景 | 场景名称和描述 |
| 当前材质 | 选中的材质名称 |
| 配置参数 | 场景和材质的详细参数 |

### 8. 故障排查

#### 问题：模型加载失败

**原因：** 模型文件路径错误或网络问题
**解决：**
- 检查demo/glb目录是否有模型文件
- 查看浏览器控制台错误信息
- 确保开发服务器正常运行

#### 问题：预设加载失败

**原因：** 预设文件不存在或路径错误
**解决：**
- 检查demo/assets/presets目录结构
- 查看浏览器的Network标签
- 确保JSON文件格式正确

#### 问题：3D视图不显示

**原因：** WebGL不支持或初始化失败
**解决：**
- 更新显卡驱动
- 使用新版浏览器
- 检查浏览器WebGL支持：https://get.webgl.org/

#### 问题：材质切换无效果

**原因：** 模型没有加载或材质参数不适合该模型
**解决：**
- 确保模型已加载
- 尝试切换不同的材质库
- 检查浏览器控制台日志

### 9. 进阶用法

#### 通过URL参数初始化

可以创建带参数的URL来直接加载特定配置：

```html
<!-- 加载特定场景和材质 -->
<a href="/demo/html/preset-switcher/?scene=tech-modern&material=polished-steel">
  科技展示预配置
</a>
```

#### 编程方式使用

```typescript
import { initPresetSwitcherDemo } from '/demo/src/preset-switcher.ts';

const demo = initPresetSwitcherDemo();

// 加载特定配置
await demo.switchScene('artistic-gallery');
await demo.switchMaterialLibrary('glass');
await demo.switchMaterial('clear-glass');
```

#### 自定义预设

编辑JSON文件添加新预设：

```json
{
  "id": "my-scene",
  "name": "我的场景",
  "environment": { "url": "/path/to/hdr", "intensity": 1.0 },
  "postProcessing": { "enabled": true, "bloom": { ... } },
  ...
}
```

### 10. 键盘快捷操作

虽然演示主要使用鼠标操作，但可以通过控制台命令快速执行：

```javascript
// 在浏览器开发者工具控制台输入
switchScene('product-showcase')  // 回车执行
switchMaterialLibrary('metals')
switchMaterial('polished-steel')
```

## 常见预设组合

### 电商产品展示

```
场景: 产品展示
材质库: 金属
材质: 抛光钢 / 镀铬
```

### 珠宝展示

```
场景: 艺术画廊
材质库: 玻璃或特殊
材质: 清玻璃 / 钻石质感
```

### 角色模型展示

```
场景: 角色展示
材质库: 特殊
材质: 皮肤 / 织物
```

### 科技产品展示

```
场景: 科技现代
材质库: 金属或特殊
材质: 铝 / 抛光钢
```

### 极简主义展示

```
场景: 极简清洁
材质库: 塑料
材质: 光面塑料
```

## 下一步

- 查看完整文档：[README.md](./README.md)
- 学习API参考：[API Reference](#)
- 查看源代码：[preset-switcher.ts](../../../src/preset-switcher.ts)
- 了解SDK：[PBR Visualizer SDK Docs](../../../llmdoc/index.md)

## 获取帮助

- 查看浏览器控制台错误信息
- 检查network标签加载状态
- 参考完整文档中的故障排查部分
- 检查示例代码和最佳实践

祝您使用愉快！
