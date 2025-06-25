/**
 * vxeTable 单元格框选复制功能插件
 * 支持鼠标拖拽选择单元格并复制到剪贴板
 */
class TableSelectionPlugin {
  constructor(component, tableRef = 'table') {
    this.component = component;
    this.tableRef = tableRef;
    
    // 选择状态
    this.p_$isSelecting = false;
    this.p_$hasMoved = false; // 是否已经移动鼠标
    this.p_$startCell = null;
    this.p_$endCell = null;
    this.p_$selectedCells = [];
    // 起始位置信息
    this.p_$startPosition = null;
    this.p_$bodyWrapperDom = null;
    // bodyWrapper 位置信息
    this.p_$bodyWrapperRect = null;
    // 滚动监听器
    this.p_$scrollListeners = [];
    // 尺寸变化监听器
    this.p_$resizeObserver = null;
    // 上次cell更新时间戳
    this.p_$lastCellUpdateTime = 0;
    // 防抖间隔
    this.p_$cellUpdateDebounce = 16;
    
    // 绑定方法到实例
    this._$handleMouseDown = this._$handleMouseDown.bind(this);
    this._$handleMouseMove = this._$handleMouseMove.bind(this);
    this._$handleMouseUp = this._$handleMouseUp.bind(this);
    this._$handleKeyDown = this._$handleKeyDown.bind(this);
    this._$clearSelection = this._$clearSelection.bind(this);
  }

  /**
   * 初始化插件
   */
  init() {
    this._$initSelectionEvents();
    this._$initResizeObserver();
  }

  /**
   * 移除插件
   */
  remove() {
    this._$removeSelectionEvents();
    this._$removeResizeObserver();
  }

  /**
   * 获取选中单元格数据
   */
  getSelectedCells() {
    return this.p_$selectedCells;
  }

  /**
   * 获取选择状态
   */
  getSelectionState() {
    return {
      isSelecting: this.p_$isSelecting,
      hasMoved: this.p_$hasMoved,
      startCell: this.p_$startCell,
      endCell: this.p_$endCell,
      selectedCells: this.p_$selectedCells
    };
  }

  /**
   * 清除选择
   */
  clearSelection() {
    this._$clearSelection();
  }

  /**
   * 复制选中单元格
   */
  copySelectedCells() {
    this._$copySelectedCells();
  }

  /**
   * 获取表格对象
   */
  _$getTable() {
    return this.component.$refs[this.tableRef] ? this.component.$refs[this.tableRef].$el : null;
  }

  /**
   * 初始化选择事件
   */
  _$initSelectionEvents() {
    const tableEl = this._$getTable();
    if (!tableEl) {
      console.warn("vxeTable 引用未找到");
      return;
    }

    // 禁止表格内文本被选中
    tableEl.style.userSelect = "none";

    // 鼠标按下事件
    tableEl.addEventListener("mousedown", this._$handleMouseDown);
    // 鼠标移动事件
    document.addEventListener("mousemove", this._$handleMouseMove);
    // 鼠标松开事件
    document.addEventListener("mouseup", this._$handleMouseUp);
    // 键盘事件
    document.addEventListener("keydown", this._$handleKeyDown);
    // 表格外点击清除选择
    document.addEventListener("mousedown", this._$handleDocumentMouseDown);
  }

  /**
   * 移除选择事件
   */
  _$removeSelectionEvents() {
    document.removeEventListener("mousemove", this._$handleMouseMove);
    document.removeEventListener("mouseup", this._$handleMouseUp);
    document.removeEventListener("keydown", this._$handleKeyDown);
    document.removeEventListener("mousedown", this._$handleDocumentMouseDown);
  }

  /**
   * 初始化尺寸变化监听器
   */
  _$initResizeObserver() {
    window.addEventListener("resize", this._$clearSelection);
    if (!window.ResizeObserver) return;

    const tableEl = this._$getTable();
    if (!tableEl) return;

    this.p_$resizeObserver = new ResizeObserver(() => {
      this._$clearSelection();
    });

    this.p_$resizeObserver.observe(tableEl);
  }

  /**
   * 移除尺寸变化监听器
   */
  _$removeResizeObserver() {
    window.removeEventListener("resize", this._$clearSelection);
    if (this.p_$resizeObserver) {
      this.p_$resizeObserver.disconnect();
      this.p_$resizeObserver = null;
    }
  }

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

    // 记录起始位置信息
    this.p_$startPosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  /**
   * 处理鼠标移动事件
   */
  _$handleMouseMove(event) {
    if (!this.p_$isSelecting) return;

    // 计算移动距离，超过阈值才进入框选
    if (!this.p_$hasMoved) {
      if (this.p_$startPosition) {
        const dx = event.clientX - this.p_$startPosition.x;
        const dy = event.clientY - this.p_$startPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 30) {
          this.p_$hasMoved = true;
          // 第一次移动时创建选择框
          this._$createSelectionBox();
          
          // 获取 bodyWrapper 的 rect 信息
          const tableEl = this._$getTable();
          if (tableEl) {
            const bodyWrapper = tableEl.querySelector(".vxe-table--body-wrapper");
            if (bodyWrapper) {
              this.p_$bodyWrapperDom = bodyWrapper;
              this.p_$bodyWrapperRect = bodyWrapper.getBoundingClientRect();
            }
          }
        } else {
          // 未超过阈值不进入框选
          return;
        }
      }
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
        // 不再调用 this._$updateSelectedCells();
        this._$updateSelectionBox();
      }
      this.p_$lastCellUpdateTime = now;
    }

    event.preventDefault();
  }

  /**
   * 处理鼠标松开事件
   */
  _$handleMouseUp(event) {
    if (!this.p_$isSelecting) return;

    this.p_$isSelecting = false;

    // 在松开鼠标时，统一获取所有 cell 的 data
    this._$updateSelectedCells();

    event.preventDefault();
  }

  /**
   * 处理表格外点击，清除选择
   */
  _$handleDocumentMouseDown = (event) => {
    const tableEl = this._$getTable();
    if (!tableEl) return;
    if (!tableEl.contains(event.target)) {
      this._$clearSelection();
    }
  }

  /**
   * 处理键盘事件
   */
  _$handleKeyDown(event) {
    // 只有有框选项时才响应
    if (!this.p_$selectedCells || this.p_$selectedCells.length === 0) return;
    // Ctrl/Cmd+C 复制
    if ((event.ctrlKey || event.metaKey) && event.key === "c") {
      this._$copySelectedCells();
      event.preventDefault();
    }
    // ESC 或 Cmd+ESC 清除选择
    if (event.key === "Escape" || (event.metaKey && event.key === "Escape")) {
      this._$clearSelection();
      event.preventDefault();
    }
  }

  /**
   * 处理选择过程中的滚动
   */
  _$handleScrollDuringSelection(event) {
    if (!this.p_$bodyWrapperDom || !this.p_$bodyWrapperRect) return;


    const rect = this.p_$bodyWrapperRect;
    const scrollSpeed = 10; // 滚动速度
    const scrollThreshold = 50; // 滚动触发阈值

    // 水平滚动
    if (event.clientX < rect.left + scrollThreshold) {
      // 向左滚动
      this.p_$bodyWrapperDom.scrollLeft -= scrollSpeed;
    } else if (event.clientX > rect.right - scrollThreshold) {
      // 向右滚动
      this.p_$bodyWrapperDom.scrollLeft += scrollSpeed;
    }

    // 垂直滚动
    if (event.clientY < rect.top + scrollThreshold) {
      // 向上滚动
      this.p_$bodyWrapperDom.scrollTop -= scrollSpeed;
    } else if (event.clientY > rect.bottom - scrollThreshold) {
      // 向下滚动
      this.p_$bodyWrapperDom.scrollTop += scrollSpeed;
    }
  }

  /**
   * 从事件获取单元格信息（不带 data 字段）
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
    const tableEl = this._$getTable();
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
      element: cell
    };
  }

  /**
   * 获取行索引
   */
  _$getRowIndex(row) {
    const rowElements = row.parentElement.children || [];

    for (let i = 0; i < rowElements.length; i++) {
      if (rowElements[i] === row) {
        return i;
      }
    }

    return 0;
  }

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
  }

  /**
   * 获取单元格数据（优先获取渲染后的文本内容）
   * @param {number} rowIndex
   * @param {number} colIndex
   * @param {HTMLElement} [cellElement]
   */
  _$getCellData(rowIndex, colIndex, cellElement) {
    const table = this.component.$refs[this.tableRef];
    if (!table) return null;

    const tableData = table.tableData || [];
    const columns = table.tableColumn || [];

    if (rowIndex >= tableData.length || colIndex >= columns.length) {
      return null;
    }

    const row = tableData[rowIndex];
    const column = columns[colIndex];

    // 1. 优先用 cellElement
    let cellText = '';
    if (cellElement && cellElement.innerText) {
      cellText = cellElement.innerText.trim();
    }
    if (cellText) {
      return {
        value: cellText,
        field: column.field || "",
        title: column.title || "",
      };
    }

    // 2. 否则回退到原始数据
    return {
      value: isNullOrUnDef(row[column.field]) ? "" : row[column.field],
      field: column.field || "",
      title: column.title || "",
    };
  }

  /**
   * 遍历区域，统一获取所有 cell 的数据
   */
  _$updateSelectedCells() {
    if (!this.p_$startCell || !this.p_$endCell) return;

    const startRow = Math.min(this.p_$startCell.rowIndex, this.p_$endCell.rowIndex);
    const endRow = Math.max(this.p_$startCell.rowIndex, this.p_$endCell.rowIndex);
    const startCol = Math.min(this.p_$startCell.colIndex, this.p_$endCell.colIndex);
    const endCol = Math.max(this.p_$startCell.colIndex, this.p_$endCell.colIndex);

    this.p_$selectedCells = [];

    // 通过 DOM 定位 tr/td，保证 element 一致
    const tableEl = this._$getTable();
    let bodyRows = [];
    if (tableEl) {
      bodyRows = tableEl.querySelectorAll('.vxe-table--body-wrapper tbody tr');
    }

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        let cellElement = null;
        if (bodyRows[row]) {
          cellElement = bodyRows[row].children[col];
        }
        this.p_$selectedCells.push({
          rowIndex: row,
          colIndex: col,
          element: cellElement,
          data: this._$getCellData(row, col, cellElement)
        });
      }
    }
  }

  /**
   * 创建选择框
   */
  _$createSelectionBox() {
    this._$removeSelectionBox();

    const tableEl = this._$getTable();
    if (!tableEl) return;
    const container = tableEl.querySelector(".vxe-table--body-wrapper");
    if (!container) return;

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
  }

  /**
   * 更新选择框位置和大小
   */
  _$updateSelectionBox() {
    const tableEl = this._$getTable();
    if (!tableEl) return;

    const container = tableEl.querySelector(".vxe-table--body-wrapper");
    if (!container) return;
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
  }

  /**
   * 移除选择框
   */
  _$removeSelectionBox() {
    const box = document.getElementById("vxe-selection-box");
    if (box) {
      box.remove();
    }
  }

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
    this.p_$startPosition = null;
    this.p_$bodyWrapperDom = null;
    this.p_$bodyWrapperRect = null;
  }

  /**
   * 复制选中的单元格
   */
  _$copySelectedCells() {
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
        row.push(rows[rowIndex][colIndex]);
      });
      text += row.join("\t") + "\n";
    });

    // 复制到剪贴板
    this._$copyToClipboard(text.trim());
  }

  /**
   * 复制文本到剪贴板（惰性函数）
   */
  _$copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      // 使用现代 Clipboard API
      this._$copyToClipboard = text => navigator.clipboard.writeText(text);
    } else {
      // 降级方案
      this._$copyToClipboard = function(text) {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const result = document.execCommand("copy");
          textArea.remove();
          return result;
        } catch (error) {
          console.error('剪贴板复制失败:', error);
          return false;
        }
      };
    }
    
    // 执行复制
    this._$copyToClipboard(text);
  }

}

function isNullOrUnDef(val) {
  return typeof val === 'undefined' || val === null;
}

export default TableSelectionPlugin;
