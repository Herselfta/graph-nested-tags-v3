# Graph Nested Tags

[![Release](https://img.shields.io/github/v/release/drPilman/obsidian-graph-nested-tags?style=flat-square)](https://github.com/drPilman/obsidian-graph-nested-tags/releases)
[![License](https://img.shields.io/github/license/drPilman/obsidian-graph-nested-tags?style=flat-square)](LICENSE)

An enhanced Obsidian plugin that displays nested tag hierarchies and tag-file relationships in graph views.

[English](#english) | [中文](#中文)

---

## English

### Features

#### 🏷️ Nested Tag Hierarchy
- Automatically creates hierarchical relationships between nested tags
- Arrow direction: parent → child (e.g., `#work → #work/project → #work/project/task`)
- Works in both global and local graph views

#### 📁 Tag File Expansion
- Tag nodes automatically connect to all files containing that tag
- Bidirectional links: tag ↔ file
- Exact matching: `#work/project` matches only that specific tag, not `#work` or `#work/project/task`
- Supports both frontmatter and inline `#` tag formats
- Works in both global and local graph views

#### 🎛️ UI Controls
- **Location**: Filters section → under Tags toggle (as sub-items)
- **Controls**: 
  - Nested tags
  - Tag file expansion
- **Features**:
  - Smaller font and toggle size for visual hierarchy
  - Auto-hide when parent Tags toggle is disabled
  - Instant refresh on toggle
  - Multi-window state synchronization
- **Available in**: Both global and local graph views

#### ⚡ Real-time Updates
- All operations refresh graphs immediately
- Multi-window automatic synchronization
- Settings panel, UI controls, and command palette stay in sync

### Installation

#### From Obsidian Community Plugins
1. Open Settings → Community plugins → Browse
2. Search for "Graph Nested Tags"
3. Install and enable

#### Manual Installation
1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/drPilman/obsidian-graph-nested-tags/releases)
2. Create folder `.obsidian/plugins/graph-nested-tags/` in your vault
3. Copy files to the folder
4. Reload Obsidian
5. Enable the plugin in Settings → Community plugins

### Usage

#### Quick Start

1. **Reload Obsidian** after installation
   ```
   Ctrl/Cmd + P → "Reload app without saving"
   ```

2. **Open any graph view**
   - Nested tags and file expansions will appear automatically

3. **Adjust settings** (optional)
   - In graph view → Filters section → Tags → sub-items
   - Or in plugin settings

#### UI Controls

In local/global graph view's right panel:
```
Filters
  └─ Tags [toggle]
      ├─ Nested tags [toggle] ← smaller, indented
      └─ Tag file expansion [toggle] ← smaller, indented
```

- Toggle these to enable/disable features instantly
- Sub-items hide automatically when Tags toggle is off

#### Command Palette

- `Toggle Nested Tags` - Toggle nested tag display
- `Toggle Tag File Expansion` - Toggle tag file expansion

### Configuration

Access via Settings → Graph Nested Tags:

- **Enable for Global Graph** - Enable features in global graph view
- **Enable Nested Tags** - Show hierarchical tag relationships
- **Enable Tag File Expansion** - Connect tags with files
- **Enable for Local Graph** - Enable features in local graph view

### Technical Details

#### Refresh Mechanisms
- **Global graph**: `view.onunload() + view.onload()`
- **Local graph**: `view.engine.render()`
- Debouncing: 1-second cooldown (except user actions)

#### Data Processing
- Deep copy to avoid data pollution
- Exact tag matching (no boundary overflow)
- Automatic parent tag node creation
- Automatic file node creation (if not in graph)

### Troubleshooting

#### Features not working

Run in console (Ctrl+Shift+I):
```javascript
const plugin = app.plugins.plugins['graph-nested-tags'];
plugin.refreshAllGraphs();
```

#### Check plugin status

```javascript
const plugin = app.plugins.plugins['graph-nested-tags'];
console.log('Settings:', plugin.settings);
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Credits

- **This Version**: [Herta Herselfta](https://github.com/Herselfta) - Enhanced v3.1
- **Based on Original Plugin**: [Graph Nested Tags by drPilman](https://github.com/drPilman/obsidian-graph-nested-tags)

### Links

- **This Repository**: [https://github.com/Herselfta/graph-nested-tags-v3.0](https://github.com/Herselfta/graph-nested-tags-v3.0)
- **Report Issues**: [https://github.com/Herselfta/graph-nested-tags-v3.0/issues](https://github.com/Herselfta/graph-nested-tags-v3.0/issues)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

### Original Plugin

This is an enhanced fork of the original **Graph Nested Tags** plugin by drPilman.

**Original Plugin**:
- Repository: [https://github.com/drPilman/obsidian-graph-nested-tags](https://github.com/drPilman/obsidian-graph-nested-tags)
- Author: [drPilman](https://github.com/drPilman)
- License: MIT

**Enhancements in v3.x**:
- ✅ Local graph view support (original only supported global)
- ✅ Tag file expansion feature (show files with same tags)
- ✅ UI controls in graph views (original had no UI)
- ✅ Real-time refresh on toggle (instant feedback)
- ✅ Multi-window state synchronization
- ✅ Fixed numerous bugs and compatibility issues
- ✅ Professional UI integration matching Obsidian's native design
- ✅ Complete rewrite based on actual API testing

**Acknowledgments**:
Thanks to drPilman for creating the original plugin that inspired this enhanced version. The core concept of linking nested tags in graph view comes from the original work.

---

## 中文

### 功能特性

#### 🏷️ 嵌套标签层级显示
- 自动创建父子标签的层级关系
- 箭头方向：父 → 子（例如：`#work → #work/project → #work/project/task`）
- 支持全局和局部图谱

#### 📁 标签文件扩展
- 标签节点自动连接所有包含该标签的文件
- 双向连接：标签 ↔ 文件
- 精确匹配：`#work/project` 只匹配该标签本身，不匹配 `#work` 或 `#work/project/task`
- 支持 frontmatter 和行内 `#` 标签格式
- 支持全局和局部图谱

#### 🎛️ UI 控制
- **位置**: "筛选"栏 → "标签" toggle 下方（作为子项）
- **控件**: 
  - 嵌套标签
  - 标签文件扩展
- **特性**:
  - 缩进、小字号、小 toggle，形成视觉层级
  - 当"标签" toggle 关闭时自动隐藏
  - 切换后立即刷新
  - 多窗口状态同步
- **可用于**: 全局和局部图谱

#### ⚡ 实时生效
- 所有操作立即刷新图谱
- 多窗口自动同步
- 插件设置、UI 控件、命令面板三者状态同步

### 安装方法

#### 从 Obsidian 社区插件安装
1. 打开 设置 → 社区插件 → 浏览
2. 搜索 "Graph Nested Tags"
3. 安装并启用

#### 手动安装
1. 从 [最新发布](https://github.com/drPilman/obsidian-graph-nested-tags/releases) 下载 `main.js` 和 `manifest.json`
2. 在你的仓库中创建文件夹 `.obsidian/plugins/graph-nested-tags/`
3. 将文件复制到该文件夹
4. 重新加载 Obsidian
5. 在 设置 → 社区插件 中启用插件

### 使用方法

#### 快速开始

1. **安装后重新加载 Obsidian**
   ```
   Ctrl/Cmd + P → "Reload app without saving"
   ```

2. **打开任意图谱视图**
   - 嵌套标签和文件扩展会自动显示

3. **调整设置**（可选）
   - 在图谱视图 → 筛选栏 → 标签 → 子项中
   - 或在插件设置中

#### UI 控件说明

在局部/全局图谱的右侧面板：
```
筛选
  └─ 标签 [toggle]
      ├─ 嵌套标签 [toggle] ← 缩进、小字号
      └─ 标签文件扩展 [toggle] ← 缩进、小字号
```

- 切换这些选项可以立即启用/禁用功能
- 当"标签" toggle 关闭时，子项自动隐藏

#### 命令面板

- `Toggle Nested Tags` - 切换嵌套标签显示
- `Toggle Tag File Expansion` - 切换标签文件扩展

### 配置选项

通过 设置 → Graph Nested Tags 访问：

- **Enable for Global Graph** - 在全局图谱中启用功能
- **Enable Nested Tags** - 显示标签层级关系
- **Enable Tag File Expansion** - 连接标签与文件
- **Enable for Local Graph** - 在局部图谱中启用功能

### 技术细节

#### 刷新机制
- **全局图谱**: `view.onunload() + view.onload()`
- **局部图谱**: `view.engine.render()`
- 防抖机制：1秒冷却时间（用户操作除外）

#### 数据处理
- 深拷贝避免数据污染
- 精确标签匹配（无越界）
- 自动创建父标签节点
- 自动添加文件节点（如果不在图谱中）

### 故障排查

#### 功能不生效

在控制台运行（Ctrl+Shift+I）：
```javascript
const plugin = app.plugins.plugins['graph-nested-tags'];
plugin.refreshAllGraphs();
```

#### 检查插件状态

```javascript
const plugin = app.plugins.plugins['graph-nested-tags'];
console.log('Settings:', plugin.settings);
```

### 贡献

欢迎贡献！请随时提交 Pull Request。

### 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 致谢

- **本版本**: [Herta Herselfta](https://github.com/Herselfta/graph-nested-tags-v3.0) - Enhanced v3.1
- **基于原插件**: [Graph Nested Tags by drPilman](https://github.com/drPilman/obsidian-graph-nested-tags)

---

## Links

- **本仓库**: [https://github.com/Herselfta/graph-nested-tags-v3.0](https://github.com/Herselfta/graph-nested-tags-v3.0)
- **提交问题**: [https://github.com/Herselfta/graph-nested-tags-v3.0/issues](https://github.com/Herselfta/graph-nested-tags-v3.0/issues)
- **更新日志**: [CHANGELOG.md](CHANGELOG.md)

---

## 原插件信息

本项目是原 **Graph Nested Tags** 插件的增强分支版本。

**原始插件**:
- 仓库: [https://github.com/drPilman/obsidian-graph-nested-tags](https://github.com/drPilman/obsidian-graph-nested-tags)
- 作者: [drPilman](https://github.com/drPilman)
- 许可证: MIT

**v3.x 的增强内容**:
- ✅ 支持局部图谱视图（原版只支持全局图谱）
- ✅ 标签文件扩展功能（显示带有相同标签的文件）
- ✅ 图谱视图中的 UI 控件（原版没有 UI）
- ✅ 切换后实时刷新（即时反馈）
- ✅ 多窗口状态同步
- ✅ 修复了大量 bug 和兼容性问题
- ✅ 专业的 UI 集成，完美匹配 Obsidian 原生设计
- ✅ 基于实际 API 测试的完全重构

**致谢**:
感谢 drPilman 创建了原始插件，为本增强版本提供了灵感和基础。在图谱中显示嵌套标签层级的核心概念源自原始作品。
