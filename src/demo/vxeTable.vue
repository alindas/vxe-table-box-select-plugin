<template>
  <div class="vxe-demo">
    <h2>VXE Table 演示案例</h2>

    <!-- 调试信息 -->
    <div class="debug-info">
      <p>调试信息：</p>
      <p>选择状态: {{ selectionState.isSelecting ? '选择中' : '未选择' }}</p>
      <p>开始单元格: {{ selectionState.startCell ? `${selectionState.startCell.rowIndex},${selectionState.startCell.colIndex}` : '无' }}</p>
      <p>结束单元格: {{ selectionState.endCell ? `${selectionState.endCell.rowIndex},${selectionState.endCell.colIndex}` : '无' }}</p>
      <p>选中单元格数: {{ selectionState.selectedCells.length }}</p>
    </div>

    <!-- 表格 -->
    <vxe-table
      ref="table" 
      :data="tableData" 
      :checkbox-config="{ checkField: 'checked' }" 
      :sort-config="{ remote: false }"
      :filter-config="{ remote: false }"
      :scroll-x="{ enabled: true }" 
      :scroll-y="{ enabled: true }" 
      height="400"
      min-width="1200"
      @checkbox-change="checkboxChangeEvent" 
      @checkbox-all="checkboxAllEvent" 
      @sort-change="sortChangeEvent"
    >
      <vxe-column type="checkbox" width="60" fixed="left"></vxe-column>
      <vxe-column type="seq" width="60" title="序号" fixed="left"></vxe-column>
      <vxe-column field="name" width="120" title="姓名" sortable></vxe-column>
      <vxe-column field="age" width="80" title="年龄" sortable>
        <template #default="{ row }">
          <input type="text" :style="{ width: '100%' }"/>
        </template>
      </vxe-column>
      <vxe-column field="gender" width="80" title="性别"></vxe-column>
      <vxe-column field="email" width="200" title="邮箱" sortable></vxe-column>
      <vxe-column field="phone" width="140" title="电话"></vxe-column>
      <vxe-column field="address" width="180" title="地址"></vxe-column>
      <vxe-column field="status" width="100" title="状态"></vxe-column>
      <vxe-column field="createTime" width="160" title="创建时间" sortable></vxe-column>
      <vxe-column field="salary" width="120" title="薪资" sortable fixed="right"></vxe-column>
    </vxe-table>

    <!-- 分页 -->
    <vxe-pager :current-page="page.currentPage" :page-size="page.pageSize" :total="page.total"
      :layouts="['PrevPage', 'JumpNumber', 'NextPage', 'FullJump', 'Sizes', 'Total']"
      @page-change="handlePageChange"></vxe-pager>

    <!-- 统计信息 -->
    <div class="stats">
      <p>总记录数: {{ page.total }}</p>
      <p>当前页记录数: {{ tableData.length }}</p>
      <p>选中记录数: {{ selectedRows.length }}</p>
      <p>框选单元格数: {{ selectionState.selectedCells.length }}</p>
      <p>当前页码: {{ page.currentPage }}/{{ Math.ceil(page.total / page.pageSize) }}</p>
    </div>
  </div>
</template>

<script>
import TableSelectionPlugin from '../plugin/tableSelectionPlugin.js'

export default {
  name: 'VxeTableDemo',
  data() {
    return {
      // 完整数据
      fullData: Array(100).fill(null).map((o, i) => (
        {
          id: i + 1,
          name: '张三' + (i + 1),
          age: 0,
          gender: Math.random() > 0.5 ? '男' : '女',
          email: `user${i + 1}@example.com`,
          phone: '138' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
          address: ['北京市朝阳区', '上海市浦东区', '广州市天河区', '深圳市南山区'][Math.floor(Math.random() * 4)],
          status: ['在职', '离职', '试用期'][Math.floor(Math.random() * 3)],
          createTime: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} 10:30:00`,
          salary: 5000 + Math.floor(Math.random() * 15000)
        }
      )),
      // 当前页显示的数据
      tableData: [],
      selectedRows: [],
      page: {
        currentPage: 1,
        pageSize: 10,
        total: 100
      },
      // 表格选择插件实例
      tableSelectionPlugin: null
    }
  },
  created() {
    this.tableSelectionPlugin = new TableSelectionPlugin(this, 'table');
  },
  mounted() {
    // 初始化第一页数据
    this.loadPageData();
    this.$nextTick(() => {
      this.tableSelectionPlugin.init();
    })
  },
  beforeDestroy() {
    // 移除表格选择插件
    if (this.tableSelectionPlugin) {
      this.tableSelectionPlugin.remove();
    }
  },
  methods: {
    // 加载当前页数据
    loadPageData() {
      const { currentPage, pageSize } = this.page;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      this.tableData = this.fullData.slice(startIndex, endIndex);
      
      // 清除选中状态
      this.selectedRows = [];
      
      // 清除框选状态
      if (this.tableSelectionPlugin) {
        this.tableSelectionPlugin.clearSelection();
      }
    },
    handleTableResize() {
      console.log('lhh-log:resize');
      if (this.tableSelectionPlugin) {
        const state = this.tableSelectionPlugin.getSelectionState();
        if (state.isSelecting) {
          this.tableSelectionPlugin.clearSelection();
        }
      }
    },
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
      this.page.currentPage = currentPage;
      this.page.pageSize = pageSize;
      
      // 重新加载当前页数据
      this.loadPageData();
    }
  },
  computed: {
    // 计算属性：获取选择状态
    selectionState() {
      return this.tableSelectionPlugin ? this.tableSelectionPlugin.getSelectionState() : {
        isSelecting: false,
        hasMoved: false,
        startCell: null,
        endCell: null,
        selectedCells: []
      };
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

/* 修复固定列定位问题 */
:deep(.vxe-table) {
  position: relative;
}

:deep(.vxe-table--main-wrapper) {
  position: relative;
}

:deep(.vxe-table--fixed-left-wrapper),
:deep(.vxe-table--fixed-right-wrapper) {
  position: absolute !important;
  top: 0 !important;
  z-index: 10;
  pointer-events: auto;
}

:deep(.vxe-table--fixed-left-wrapper) {
  left: 0 !important;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

:deep(.vxe-table--fixed-right-wrapper) {
  right: 0 !important;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
}

/* 确保固定列背景色一致 */
:deep(.vxe-table--fixed-left-wrapper .vxe-table--header-wrapper),
:deep(.vxe-table--fixed-right-wrapper .vxe-table--header-wrapper) {
  background-color: #fafafa;
}

:deep(.vxe-table--fixed-left-wrapper .vxe-table--body-wrapper),
:deep(.vxe-table--fixed-right-wrapper .vxe-table--body-wrapper) {
  background-color: #fff;
}

/* 防止固定列内容溢出 */
:deep(.vxe-table--fixed-left-wrapper .vxe-table--body-wrapper),
:deep(.vxe-table--fixed-right-wrapper .vxe-table--body-wrapper) {
  overflow: hidden !important;
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
