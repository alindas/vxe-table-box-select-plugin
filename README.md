# VXE Table 演示案例

基于 Vue2 和 vxeTable 3.5.9 的高级表格演示案例，展示了 vxeTable 的主要功能和特性。

## 功能特性

### 🎯 基础功能
- ✅ 数据展示和编辑
- ✅ 行选择和批量操作
- ✅ 分页显示
- ✅ 数据导出（Excel）
- ✅ 响应式设计

### 🔍 搜索和筛选
- ✅ 关键词搜索（姓名、邮箱、地址）
- ✅ 状态筛选
- ✅ 实时过滤

### 📊 表格增强
- ✅ 列排序
- ✅ 固定列（左侧复选框、序号，右侧操作列）
- ✅ 虚拟滚动
- ✅ 全屏显示
- ✅ 树形表格

### ✏️ 编辑功能
- ✅ 单元格编辑
- ✅ 表单编辑对话框
- ✅ 多种编辑控件（输入框、下拉框、日期时间）

### 🎨 界面优化
- ✅ 现代化 UI 设计
- ✅ 悬停效果
- ✅ 选中状态高亮
- ✅ 移动端适配

## 技术栈

- **Vue**: 2.7.7
- **vxe-table**: 3.5.9
- **xe-utils**: 3.5.31
- **Vite**: 3.0.2

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 使用说明

### 1. 基础操作
- **添加行**: 点击"添加行"按钮在表格末尾添加新记录
- **删除行**: 点击行操作列的"删除"按钮删除单行
- **批量删除**: 勾选复选框后点击"删除选中行"批量删除
- **编辑行**: 点击行操作列的"编辑"按钮打开编辑对话框

### 2. 搜索和筛选
- **关键词搜索**: 在搜索框输入关键词，支持姓名、邮箱、地址字段
- **状态筛选**: 使用下拉框按状态筛选数据

### 3. 表格切换
- **普通表格**: 显示员工信息，支持排序和编辑
- **树形表格**: 显示部门结构，支持展开/收起

### 4. 高级功能
- **全屏显示**: 点击"全屏显示"按钮进入全屏模式
- **数据导出**: 点击"导出数据"按钮导出 Excel 文件
- **清空数据**: 点击"清空数据"按钮清空所有记录

## 代码结构

```
src/
├── demo/
│   └── vxeTable.vue          # 主要演示组件
├── main.js                   # 应用入口，配置 vxeTable
├── App.vue                   # 根组件
└── assets/                   # 静态资源
```

## 主要配置

### vxeTable 配置
```javascript
// 编辑配置
:edit-config="{trigger: 'click', mode: 'cell'}"

// 复选框配置
:checkbox-config="{checkField: 'checked'}"

// 排序配置
:sort-config="{remote: false}"

// 滚动配置
:scroll-x="{enabled: true}"
:scroll-y="{enabled: true}"
```

### 列配置示例
```javascript
// 可编辑列
<vxe-column field="name" title="姓名" :edit-render="{name: 'input'}" sortable></vxe-column>

// 下拉选择列
<vxe-column field="gender" title="性别" :edit-render="{name: 'select', options: genderOptions}"></vxe-column>

// 固定列
<vxe-column type="checkbox" width="60" fixed="left"></vxe-column>
```

## 自定义样式

项目包含了完整的样式定制，包括：
- 表格边框和圆角
- 悬停效果
- 选中状态高亮
- 按钮样式
- 响应式布局

## 浏览器支持

- Chrome >= 60
- Firefox >= 60
- Safari >= 12
- Edge >= 79

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [vxe-table 官方文档](https://vxetable.cn/)
- [Vue.js 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
