# Table Selection Mixin 使用说明

## 功能概述

`tableSelectionMixin.js` 是一个专门为 vxeTable 设计的 mixin，提供了强大的单元格框选复制功能，类似于 Excel 的使用体验。

## 主要功能

### 🎯 核心特性
- **鼠标框选**: 支持鼠标拖拽选择单元格区域
- **可视化选择框**: 实时显示选择区域，带有蓝色边框和半透明背景
- **键盘快捷键**: 支持 Ctrl+C 复制和 ESC 清除选择
- **智能提示**: 自动显示操作提示和成功反馈
- **剪贴板支持**: 兼容现代浏览器和降级方案

### 📋 操作方式
1. **开始选择**: 在表格单元格上按下鼠标左键
2. **拖拽选择**: 按住鼠标左键拖拽选择区域
3. **复制内容**: 按 `Ctrl+C` 复制选中内容到剪贴板
4. **清除选择**: 按 `ESC` 键清除当前选择

## 使用方法

### 1. 引入 Mixin

```javascript
import tableSelectionMixin from '@/mixins/tableSelectionMixin.js'

export default {
  mixins: [tableSelectionMixin],
  // ... 其他配置
}
```

### 2. 确保表格引用

确保你的 vxeTable 组件有正确的 ref 引用：

```vue
<vxe-table ref="xTable" :data="tableData">
  <!-- 表格列配置 -->
</vxe-table>
```

### 3. 显示选择状态

在模板中显示当前选择的单元格数量：

```vue
<template>
  <div class="stats">
    <p>框选单元格数: {{ selectedCells.length }}</p>
  </div>
</template>
```

## 技术实现

### 事件处理
- `mousedown`: 开始选择
- `mousemove`: 更新选择区域
- `mouseup`: 完成选择
- `keydown`: 处理键盘快捷键

### 数据格式
选中的单元格数据格式：

```javascript
{
  rowIndex: 0,        // 行索引
  colIndex: 1,        // 列索引
  data: {
    value: '单元格值',  // 单元格内容
    field: '字段名',    // 字段名
    title: '列标题'     // 列标题
  }
}
```

### 复制格式
复制到剪贴板的内容采用制表符分隔的格式，可以直接粘贴到 Excel 中：

```
张三	25	男	zhangsan@example.com
李四	30	女	lisi@example.com
```

## 自定义配置

### 修改选择框样式

```javascript
data() {
  return {
    selectionStyle: {
      position: 'absolute',
      border: '2px solid #409eff',        // 边框颜色
      backgroundColor: 'rgba(64, 158, 255, 0.1)', // 背景色
      pointerEvents: 'none',
      zIndex: 1000
    }
  }
}
```

### 自定义提示样式

修改 `showCopyTip()` 和 `showSuccessTip()` 方法中的样式配置。

## 兼容性

### 浏览器支持
- ✅ Chrome 60+
- ✅ Firefox 60+
- ✅ Safari 12+
- ✅ Edge 79+

### 剪贴板 API
- **现代浏览器**: 使用 `navigator.clipboard.writeText()`
- **降级方案**: 使用 `document.execCommand('copy')`

## 注意事项

1. **表格引用**: 确保表格组件有正确的 `ref="xTable"` 引用
2. **事件冲突**: 避免与其他鼠标事件处理冲突
3. **样式层级**: 选择框使用较高的 z-index，确保显示在最上层
4. **内存清理**: mixin 会自动在组件销毁时清理事件监听器

## 扩展功能

### 添加右键菜单
可以扩展 mixin 添加右键菜单功能：

```javascript
// 在 handleMouseDown 中添加右键检测
if (event.button === 2) { // 右键
  this.showContextMenu(event)
}
```

### 支持键盘选择
可以添加键盘方向键选择功能：

```javascript
// 在 handleKeyDown 中添加方向键处理
if (event.key === 'ArrowRight') {
  this.selectNextCell()
}
```

## 故障排除

### 常见问题

1. **选择框不显示**
   - 检查表格是否正确渲染
   - 确认 ref 引用是否正确

2. **复制功能不工作**
   - 检查浏览器是否支持剪贴板 API
   - 确认页面运行在 HTTPS 环境下

3. **事件冲突**
   - 检查是否有其他事件处理器干扰
   - 调整事件监听器的优先级

### 调试方法

```javascript
// 在浏览器控制台中查看选择状态
console.log('选中单元格:', this.selectedCells)
console.log('选择状态:', this.isSelecting)
```

## 更新日志

### v1.0.0
- 基础框选功能
- 复制到剪贴板
- 键盘快捷键支持
- 可视化选择框
- 操作提示功能 