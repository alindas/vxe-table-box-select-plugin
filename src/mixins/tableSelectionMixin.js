/**
 * vxeTable 单元格框选复制功能 Mixin
 * 支持鼠标拖拽选择单元格并复制到剪贴板
 */
export default {
  data() {
    return {
      // 选择状态
      p_$isSelecting: false,
      p_$hasMoved: false, // 是否已经移动鼠标
      p_$startCell: null,
      p_$endCell: null,
      p_$selectedCells: [],
      // 滚动监听器
      p_$scrollListeners: [],
      // 尺寸变化监听器
      p_$resizeObserver: null,
      // 上次cell更新时间戳
      p_$lastCellUpdateTime: 0,
      // 防抖间隔
      p_$cellUpdateDebounce: 16,
    };
  },

  mounted() {
    this.$nextTick(() => {
      this._$initSelectionEvents();
      this._$initResizeObserver();
    });
  },

  beforeDestroy() {
    this._$removeSelectionEvents();
    this._$removeResizeObserver();
  },

  methods: {
    /**
     * 初始化选择事件
     */
    _$initSelectionEvents() {
      const tableEl = this.$refs.table?.$el;
      if (!tableEl) {
        console.warn("vxeTable 引用未找到");
        return;
      }

      // 鼠标按下事件
      tableEl.addEventListener("mousedown", this._$handleMouseDown);
      // 鼠标移动事件
      document.addEventListener("mousemove", this._$handleMouseMove);
      // 鼠标松开事件
      document.addEventListener("mouseup", this._$handleMouseUp);
      // 键盘事件
      document.addEventListener("keydown", this._$handleKeyDown);
    },

    /**
     * 移除选择事件
     */
    _$removeSelectionEvents() {
      document.removeEventListener("mousemove", this._$handleMouseMove);
      document.removeEventListener("mouseup", this._$handleMouseUp);
      document.removeEventListener("keydown", this._$handleKeyDown);
    },

    /**
     * 初始化尺寸变化监听器
     */
    _$initResizeObserver() {
      window.addEventListener("resize", this._$clearSelection);
      if (!window.ResizeObserver) return;

      const tableEl = this.$refs.table?.$el;
      if (!tableEl) return;

      this._$resizeObserver = new ResizeObserver(() => {
        this._$clearSelection();
      });

      this._$resizeObserver.observe(tableEl);
    },

    /**
     * 移除尺寸变化监听器
     */
    _$removeResizeObserver() {
      window.removeEventListener("resize", this._$clearSelection);
      if (this._$resizeObserver) {
        this._$resizeObserver.disconnect();
        this._$resizeObserver = null;
      }
    },

    /**
     * 处理鼠标按下事件
     */
    _$handleMouseDown(event) {
      const cell = this._$getCellFromEvent(event);
      if (!cell) {
        return;
      }

      // 清除之前的选择
      this._$clearSelection();

      // 开始选择
      this.p_$isSelecting = true;
      this.p_$hasMoved = false; // 重置移动状态
      this.p_$startCell = cell;
      this.p_$endCell = cell;
      this.p_$selectedCells = [cell];

      // 不在这里创建选择框，等到鼠标移动时再创建

      // 阻止默认行为
      event.preventDefault();
    },

    /**
     * 处理鼠标移动事件
     */
    _$handleMouseMove(event) {
      if (!this.p_$isSelecting) return;

      // 标记已经移动
      if (!this.p_$hasMoved) {
        this.p_$hasMoved = true;
        // 第一次移动时创建选择框
        this._$createSelectionBox();
      }

      // 处理滚动
      this._$handleScrollDuringSelection(event);

      // 优先更新框选div
      this._$updateSelectionBox();

      // 对获取cell进行防抖
      const now = Date.now();
      if (
        !this.p_$lastCellUpdateTime ||
        now - this.p_$lastCellUpdateTime > this.p_$cellUpdateDebounce
      ) {
        const cell = this._$getCellFromEvent(event);
        if (cell) {
          this.p_$endCell = cell;
          this._$updateSelectedCells();
          this._$updateSelectionBox();
        }
        this.p_$lastCellUpdateTime = now;
      }

      event.preventDefault();
    },

    /**
     * 处理鼠标松开事件
     */
    _$handleMouseUp(event) {
      if (!this.p_$isSelecting) return;

      this.p_$isSelecting = false;

      event.preventDefault();
    },

    /**
     * 处理键盘事件
     */
    _$handleKeyDown(event) {
      // Ctrl+C 复制
      if (event.ctrlKey && event.key === "c") {
        this._$copySelectedCells();
        event.preventDefault();
      }
      // ESC 清除选择
      if (event.key === "Escape") {
        this._$clearSelection();
        event.preventDefault();
      }
    },

    /**
     * 处理选择过程中的滚动
     */
    _$handleScrollDuringSelection(event) {
      const tableEl = this.$refs.table?.$el;
      if (!tableEl) return;

      const bodyWrapper = tableEl.querySelector(".vxe-table--body-wrapper");
      if (!bodyWrapper) return;

      const rect = bodyWrapper.getBoundingClientRect();
      const scrollSpeed = 10; // 滚动速度
      const scrollThreshold = 50; // 滚动触发阈值

      // 水平滚动
      if (event.clientX < rect.left + scrollThreshold) {
        // 向左滚动
        bodyWrapper.scrollLeft -= scrollSpeed;
      } else if (event.clientX > rect.right - scrollThreshold) {
        // 向右滚动
        bodyWrapper.scrollLeft += scrollSpeed;
      }

      // 垂直滚动
      if (event.clientY < rect.top + scrollThreshold) {
        // 向上滚动
        bodyWrapper.scrollTop -= scrollSpeed;
      } else if (event.clientY > rect.bottom - scrollThreshold) {
        // 向下滚动
        bodyWrapper.scrollTop += scrollSpeed;
      }
    },

    /**
     * 从事件获取单元格信息
     */
    _$getCellFromEvent(event) {
      const target = event.target;
      // 尝试多种选择器来找到单元格
      let cell =
        target.closest("td") ||
        target.closest(".vxe-cell") ||
        target.closest(".vxe-body--column") ||
        target.closest('[class*="vxe-cell"]') ||
        target.closest('[class*="vxe-body"]');

      if (!cell) {
        return null;
      }

      // 限制只能选中 table-body 区域内容
      const tableEl = this.$refs.table?.$el;
      if (tableEl) {
        const bodyWrapper = tableEl.querySelector(".vxe-table--body-wrapper");
        if (bodyWrapper && !bodyWrapper.contains(cell)) {
          // cell 不在 body 区域，禁止选中
          return null;
        }
      }

      // 找到行元素
      let row =
        cell.closest("tr") ||
        cell.closest(".vxe-body--row") ||
        cell.parentElement;

      if (!row) {
        return null;
      }

      // 计算行列索引
      const rowIndex = this._$getRowIndex(row);
      const colIndex = this._$getColIndex(cell, row);

      return {
        rowIndex,
        colIndex,
        element: cell,
        data: this._$getCellData(rowIndex, colIndex),
      };
    },

    /**
     * 获取行索引
     */
    _$getRowIndex(row) {
      const table = this.$refs.table;
      if (!table) return 0;

      const tableData = table.tableData || [];
      const rowElements = row.parentElement?.children || [];

      for (let i = 0; i < rowElements.length; i++) {
        if (rowElements[i] === row) {
          return i;
        }
      }

      return 0;
    },

    /**
     * 获取列索引
     */
    _$getColIndex(cell, row) {
      const cells = row.children || [];

      for (let i = 0; i < cells.length; i++) {
        if (cells[i] === cell) {
          return i;
        }
      }

      return 0;
    },

    /**
     * 获取单元格数据
     */
    _$getCellData(rowIndex, colIndex) {
      const table = this.$refs.table;
      if (!table) return null;

      const tableData = table.tableData || [];
      const columns = table.tableColumn || [];

      if (rowIndex >= tableData.length || colIndex >= columns.length) {
        return null;
      }

      const row = tableData[rowIndex];
      const column = columns[colIndex];

      return {
        value: row[column.field] || "",
        field: column.field || "",
        title: column.title || "",
      };
    },

    /**
     * 更新选中的单元格
     */
    _$updateSelectedCells() {
      if (!this.p_$startCell || !this.p_$endCell) return;

      const startRow = Math.min(this.p_$startCell.rowIndex, this.p_$endCell.rowIndex);
      const endRow = Math.max(this.p_$startCell.rowIndex, this.p_$endCell.rowIndex);
      const startCol = Math.min(this.p_$startCell.colIndex, this.p_$endCell.colIndex);
      const endCol = Math.max(this.p_$startCell.colIndex, this.p_$endCell.colIndex);

      this.p_$selectedCells = [];

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cellData = this._$getCellData(row, col);
          if (cellData) {
            this.p_$selectedCells.push({
              rowIndex: row,
              colIndex: col,
              data: cellData,
            });
          }
        }
      }
    },

    /**
     * 创建选择框
     */
    _$createSelectionBox() {
      this._$removeSelectionBox();

      const tableEl = this.$refs.table?.$el;
      const container = tableEl?.querySelector(".vxe-table--body-wrapper");

      if (!container) return;

      // Ensure the container has a non-static position
      const containerPosition = window.getComputedStyle(container).position;
      if (containerPosition === "static") {
        container.style.position = "relative";
      }

      const box = document.createElement("div");
      box.id = "vxe-selection-box";
      box.style.cssText = `
        position: absolute;
        border: 1px solid #1d22ab;
        background-color: rgba(64, 158, 255, 0.1);
        pointer-events: none;
        z-index: 1;
        transition: none;
      `;

      container.appendChild(box);
      this._$updateSelectionBox();
    },

    /**
     * 更新选择框位置和大小
     */
    _$updateSelectionBox() {
      const tableEl = this.$refs.table?.$el;
      const container = tableEl?.querySelector(".vxe-table--body-wrapper");
      const box = document.getElementById("vxe-selection-box");

      if (!box || !this.p_$startCell || !this.p_$endCell || !container) return;

      const containerRect = container.getBoundingClientRect();
      const startRect = this.p_$startCell.element.getBoundingClientRect();
      const endRect = this.p_$endCell.element.getBoundingClientRect();

      const left =
        Math.min(startRect.left, endRect.left) -
        containerRect.left +
        container.scrollLeft;
      const top =
        Math.min(startRect.top, endRect.top) -
        containerRect.top +
        container.scrollTop;
      const width =
        Math.max(startRect.right, endRect.right) -
        Math.min(startRect.left, endRect.left);
      const height =
        Math.max(startRect.bottom, endRect.bottom) -
        Math.min(startRect.top, endRect.top);

      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
    },

    /**
     * 移除选择框
     */
    _$removeSelectionBox() {
      const box = document.getElementById("vxe-selection-box");
      if (box) {
        box.remove();
      }
    },

    /**
     * 清除选择
     */
    _$clearSelection() {
      if (this.p_$isSelecting) return;
      this.p_$isSelecting = false;
      this.p_$hasMoved = false; // 重置移动状态
      this.p_$startCell = null;
      this.p_$endCell = null;
      this.p_$selectedCells = [];
      this._$removeSelectionBox();
      this.p_$lastCellUpdateTime = 0;
    },

    /**
     * 复制选中的单元格
     */
    _$copySelectedCells() {
      console.log('lhh-log:this.p_$selectedCells', this.p_$selectedCells, this.p_$selectedCells.length);
      if (this.p_$selectedCells.length === 0) return;

      // 按行列组织数据
      const rows = {};
      const columns = new Set();

      this.p_$selectedCells.forEach((cell) => {
        if (!rows[cell.rowIndex]) {
          rows[cell.rowIndex] = {};
        }
        rows[cell.rowIndex][cell.colIndex] = cell.data.value;
        columns.add(cell.colIndex);
      });

      // 转换为表格格式
      const sortedRows = Object.keys(rows).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );
      const sortedCols = Array.from(columns).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );

      let text = "";
      sortedRows.forEach((rowIndex) => {
        const row = [];
        sortedCols.forEach((colIndex) => {
          row.push(rows[rowIndex][colIndex] || "");
        });
        text += row.join("\t") + "\n";
      });
      console.log('lhh-log:copy-text', text);

      // 复制到剪贴板
      this._$copyToClipboard(text.trim());
    },

    /**
     * 复制文本到剪贴板
     */
    _$copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        // 使用现代 Clipboard API
        navigator.clipboard.writeText(text);
      } else {
        // 降级方案
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
    }
  },
};
