<template>
  <div class="vxe-demo">
    <h2>VXE Table 演示案例</h2>

    <!-- 使用说明 -->
    <div class="usage-tip">
      <p>💡 <strong>框选复制功能：</strong></p>
      <ul>
        <li>鼠标拖拽选择单元格区域</li>
        <li>按 <kbd>Ctrl+C</kbd> 复制选中内容</li>
        <li>按 <kbd>ESC</kbd> 清除选择</li>
      </ul>
    </div>

    <!-- 调试信息 -->
    <div class="debug-info">
      <p>调试信息：</p>
      <p>选择状态: {{ isSelecting ? '选择中' : '未选择' }}</p>
      <p>开始单元格: {{ startCell ? `${startCell.rowIndex},${startCell.colIndex}` : '无' }}</p>
      <p>结束单元格: {{ endCell ? `${endCell.rowIndex},${endCell.colIndex}` : '无' }}</p>
      <p>选中单元格数: {{ selectedCells.length }}</p>
    </div>

    <!-- 表格 -->
    <vxe-table
      ref="xTable" 
      :data="tableData" 
      :checkbox-config="{ checkField: 'checked' }" 
      :sort-config="{ remote: false }"
      :filter-config="{ remote: false }" 
      :scroll-x="{ enabled: true }" 
      :scroll-y="{ enabled: true }" 
      height="400"
      @checkbox-change="checkboxChangeEvent" 
      @checkbox-all="checkboxAllEvent" 
      @sort-change="sortChangeEvent"
    >
      <vxe-column type="checkbox" width="60" fixed="left"></vxe-column>
      <vxe-column type="seq" width="60" title="序号" fixed="left"></vxe-column>
      <vxe-column field="name" title="姓名" sortable></vxe-column>
      <vxe-column field="age" title="年龄" sortable></vxe-column>
      <vxe-column field="gender" title="性别"></vxe-column>
      <vxe-column field="email" title="邮箱" sortable></vxe-column>
      <vxe-column field="phone" title="电话"></vxe-column>
      <vxe-column field="address" title="地址"></vxe-column>
      <vxe-column field="status" title="状态"></vxe-column>
      <vxe-column field="createTime" title="创建时间" sortable></vxe-column>
      <vxe-column field="salary" title="薪资" sortable></vxe-column>
    </vxe-table>

    <!-- 分页 -->
    <vxe-pager :current-page="page.currentPage" :page-size="page.pageSize" :total="page.total"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
      @page-change="handlePageChange"></vxe-pager>

    <!-- 统计信息 -->
    <div class="stats">
      <p>总记录数: {{ page.total }}</p>
      <p>选中记录数: {{ selectedRows.length }}</p>
      <p>框选单元格数: {{ selectedCells.length }}</p>
    </div>
  </div>
</template>

<script>
import tableSelectionMixin from '../mixins/tableSelectionMixin.js'

export default {
  name: 'VxeTableDemo',
  mixins: [tableSelectionMixin],
  data() {
    return {
      tableData: Array(100).fill(null).map((o, i) => (
        {
          id: i,
          name: '张三',
          age: 25,
          gender: '男',
          email: 'zhangsan@example.com',
          phone: '13800138001',
          address: '北京市朝阳区',
          status: '在职',
          createTime: '2023-01-15 10:30:00',
          salary: 8000
        }
      )),
      selectedRows: [],
      page: {
        currentPage: 1,
        pageSize: 10,
        total: 5
      }
    }
  },
  methods: {
    // 复选框变化事件
    checkboxChangeEvent({ records }) {
      this.selectedRows = records
    },

    // 全选事件
    checkboxAllEvent({ records }) {
      this.selectedRows = records
    },

    // 排序事件
    sortChangeEvent({ property, order }) {
      console.log('排序变化:', property, order)
    },

    // 分页变化
    handlePageChange({ currentPage, pageSize }) {
      this.page.currentPage = currentPage
      this.page.pageSize = pageSize
    }
  }
}
</script>

<style scoped>
.vxe-demo {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.vxe-demo h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.usage-tip {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  color: #333;
}

.usage-tip p {
  margin: 0 0 10px 0;
  font-weight: bold;
}

.usage-tip ul {
  margin: 0;
  padding-left: 20px;
}

.usage-tip li {
  margin: 5px 0;
  line-height: 1.5;
}

.usage-tip kbd {
  background-color: #f1f1f1;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
}

.debug-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  color: #856404;
  font-size: 14px;
}

.debug-info p {
  margin: 5px 0;
}

.stats {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  display: flex;
  gap: 30px;
}

.stats p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* 表格样式优化 */
:deep(.vxe-table) {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.vxe-table--header-wrapper) {
  background-color: #fafafa;
}

:deep(.vxe-table--body-wrapper) {
  background-color: #fff;
}

:deep(.vxe-table--row) {
  border-bottom: 1px solid #ebeef5;
}

:deep(.vxe-table--row:hover) {
  background-color: #f5f7fa;
}

:deep(.vxe-table--row.row--checked) {
  background-color: #ecf5ff;
}

/* 分页样式 */
:deep(.vxe-pager) {
  margin-top: 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .vxe-demo {
    padding: 10px;
  }

  .stats {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
