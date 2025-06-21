/**
 * vxeTable 单元格框选复制功能 Mixin
 * 支持鼠标拖拽选择单元格并复制到剪贴板
 */
export default {
  data() {
    return {
      // 选择状态
      isSelecting: false,
      startCell: null,
      endCell: null,
      selectedCells: [],
      // 选择样式
      selectionStyle: {
        position: 'absolute',
        border: '2px solid #409eff',
        backgroundColor: 'rgba(64, 158, 255, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.initSelectionEvents()
    })
  },

  beforeDestroy() {
    this.removeSelectionEvents()
  },

  methods: {
    /**
     * 初始化选择事件
     */
    initSelectionEvents() {
      const tableEl = this.$refs.xTable?.$el
      if (!tableEl) {
        console.warn('vxeTable 引用未找到')
        return
      }

      console.log('初始化选择事件，表格元素:', tableEl)

      // 鼠标按下事件
      tableEl.addEventListener('mousedown', this.handleMouseDown)
      // 鼠标移动事件
      document.addEventListener('mousemove', this.handleMouseMove)
      // 鼠标松开事件
      document.addEventListener('mouseup', this.handleMouseUp)
      // 键盘事件
      document.addEventListener('keydown', this.handleKeyDown)
    },

    /**
     * 移除选择事件
     */
    removeSelectionEvents() {
      document.removeEventListener('mousemove', this.handleMouseMove)
      document.removeEventListener('mouseup', this.handleMouseUp)
      document.removeEventListener('keydown', this.handleKeyDown)
    },

    /**
     * 处理鼠标按下事件
     */
    handleMouseDown(event) {
      console.log('鼠标按下事件:', event.target)
      
      const cell = this.getCellFromEvent(event)
      if (!cell) {
        console.log('未找到有效单元格')
        return
      }

      console.log('找到单元格:', cell)

      // 清除之前的选择
      this.clearSelection()

      // 开始选择
      this.isSelecting = true
      this.startCell = cell
      this.endCell = cell
      this.selectedCells = [cell]

      // 创建选择框
      this.createSelectionBox()

      // 阻止默认行为
      event.preventDefault()
    },

    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(event) {
      if (!this.isSelecting) return

      const cell = this.getCellFromEvent(event)
      if (!cell) return

      this.endCell = cell
      this.updateSelectedCells()
      this.updateSelectionBox()

      event.preventDefault()
    },

    /**
     * 处理鼠标松开事件
     */
    handleMouseUp(event) {
      if (!this.isSelecting) return

      console.log('鼠标松开，选中单元格数:', this.selectedCells.length)

      this.isSelecting = false
      
      // 如果有选择内容，显示复制提示
      if (this.selectedCells.length > 0) {
        this.showCopyTip()
      }

      event.preventDefault()
    },

    /**
     * 处理键盘事件
     */
    handleKeyDown(event) {
      // Ctrl+C 复制
      if (event.ctrlKey && event.key === 'c') {
        this.copySelectedCells()
        event.preventDefault()
      }
      // ESC 清除选择
      if (event.key === 'Escape') {
        this.clearSelection()
        event.preventDefault()
      }
    },

    /**
     * 从事件获取单元格信息
     */
    getCellFromEvent(event) {
      const target = event.target
      console.log('目标元素:', target, '类名:', target.className)
      
      // 尝试多种选择器来找到单元格
      let cell = target.closest('td') || 
                 target.closest('.vxe-cell') ||
                 target.closest('.vxe-body--column') ||
                 target.closest('[class*="vxe-cell"]') ||
                 target.closest('[class*="vxe-body"]')
      
      if (!cell) {
        console.log('未找到单元格元素')
        return null
      }

      console.log('找到单元格元素:', cell, '类名:', cell.className)

      // 找到行元素
      let row = cell.closest('tr') || 
                cell.closest('.vxe-body--row') ||
                cell.parentElement

      if (!row) {
        console.log('未找到行元素')
        return null
      }

      console.log('找到行元素:', row, '类名:', row.className)

      // 计算行列索引
      const rowIndex = this.getRowIndex(row)
      const colIndex = this.getColIndex(cell, row)

      console.log('计算出的索引:', { rowIndex, colIndex })

      return {
        rowIndex,
        colIndex,
        element: cell,
        data: this.getCellData(rowIndex, colIndex)
      }
    },

    /**
     * 获取行索引
     */
    getRowIndex(row) {
      const table = this.$refs.xTable
      if (!table) return 0

      const tableData = table.tableData || []
      const rowElements = row.parentElement?.children || []
      
      for (let i = 0; i < rowElements.length; i++) {
        if (rowElements[i] === row) {
          return i
        }
      }
      
      return 0
    },

    /**
     * 获取列索引
     */
    getColIndex(cell, row) {
      const cells = row.children || []
      
      for (let i = 0; i < cells.length; i++) {
        if (cells[i] === cell) {
          return i
        }
      }
      
      return 0
    },

    /**
     * 获取单元格数据
     */
    getCellData(rowIndex, colIndex) {
      const table = this.$refs.xTable
      if (!table) return null

      const tableData = table.tableData || []
      const columns = table.tableColumn || []

      if (rowIndex >= tableData.length || colIndex >= columns.length) {
        return null
      }

      const row = tableData[rowIndex]
      const column = columns[colIndex]

      return {
        value: row[column.field] || '',
        field: column.field || '',
        title: column.title || ''
      }
    },

    /**
     * 更新选中的单元格
     */
    updateSelectedCells() {
      if (!this.startCell || !this.endCell) return

      const startRow = Math.min(this.startCell.rowIndex, this.endCell.rowIndex)
      const endRow = Math.max(this.startCell.rowIndex, this.endCell.rowIndex)
      const startCol = Math.min(this.startCell.colIndex, this.endCell.colIndex)
      const endCol = Math.max(this.startCell.colIndex, this.endCell.colIndex)

      this.selectedCells = []

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cellData = this.getCellData(row, col)
          if (cellData) {
            this.selectedCells.push({
              rowIndex: row,
              colIndex: col,
              data: cellData
            })
          }
        }
      }
    },

    /**
     * 创建选择框
     */
    createSelectionBox() {
      this.removeSelectionBox()

      const box = document.createElement('div')
      box.id = 'vxe-selection-box'
      box.style.cssText = `
        position: absolute;
        border: 2px solid #409eff;
        background-color: rgba(64, 158, 255, 0.1);
        pointer-events: none;
        z-index: 1000;
      `

      document.body.appendChild(box)
      this.updateSelectionBox()
    },

    /**
     * 更新选择框位置和大小
     */
    updateSelectionBox() {
      const box = document.getElementById('vxe-selection-box')
      if (!box || !this.startCell || !this.endCell) return

      const startRect = this.startCell.element.getBoundingClientRect()
      const endRect = this.endCell.element.getBoundingClientRect()

      const left = Math.min(startRect.left, endRect.left)
      const top = Math.min(startRect.top, endRect.top)
      const width = Math.max(startRect.right, endRect.right) - left
      const height = Math.max(startRect.bottom, endRect.bottom) - top

      box.style.left = left + 'px'
      box.style.top = top + 'px'
      box.style.width = width + 'px'
      box.style.height = height + 'px'
    },

    /**
     * 移除选择框
     */
    removeSelectionBox() {
      const box = document.getElementById('vxe-selection-box')
      if (box) {
        box.remove()
      }
    },

    /**
     * 清除选择
     */
    clearSelection() {
      this.isSelecting = false
      this.startCell = null
      this.endCell = null
      this.selectedCells = []
      this.removeSelectionBox()
      this.removeCopyTip()
    },

    /**
     * 显示复制提示
     */
    showCopyTip() {
      this.removeCopyTip()

      const tip = document.createElement('div')
      tip.id = 'vxe-copy-tip'
      tip.innerHTML = `
        <div style="
          position: fixed;
          top: 10px;
          right: 10px;
          background: #67c23a;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 1001;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">
          已选择 ${this.selectedCells.length} 个单元格，按 Ctrl+C 复制
        </div>
      `

      document.body.appendChild(tip)

      // 3秒后自动隐藏
      setTimeout(() => {
        this.removeCopyTip()
      }, 3000)
    },

    /**
     * 移除复制提示
     */
    removeCopyTip() {
      const tip = document.getElementById('vxe-copy-tip')
      if (tip) {
        tip.remove()
      }
    },

    /**
     * 复制选中的单元格
     */
    copySelectedCells() {
      if (this.selectedCells.length === 0) return

      // 按行列组织数据
      const rows = {}
      const columns = new Set()

      this.selectedCells.forEach(cell => {
        if (!rows[cell.rowIndex]) {
          rows[cell.rowIndex] = {}
        }
        rows[cell.rowIndex][cell.colIndex] = cell.data.value
        columns.add(cell.colIndex)
      })

      // 转换为表格格式
      const sortedRows = Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b))
      const sortedCols = Array.from(columns).sort((a, b) => parseInt(a) - parseInt(b))

      let text = ''
      sortedRows.forEach(rowIndex => {
        const row = []
        sortedCols.forEach(colIndex => {
          row.push(rows[rowIndex][colIndex] || '')
        })
        text += row.join('\t') + '\n'
      })

      // 复制到剪贴板
      this.copyToClipboard(text.trim())

      // 显示成功提示
      this.showSuccessTip()
    },

    /**
     * 复制文本到剪贴板
     */
    copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        // 使用现代 Clipboard API
        navigator.clipboard.writeText(text)
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
    },

    /**
     * 显示成功提示
     */
    showSuccessTip() {
      const tip = document.createElement('div')
      tip.innerHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #67c23a;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          z-index: 1002;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          复制成功！
        </div>
      `

      document.body.appendChild(tip)

      setTimeout(() => {
        tip.remove()
      }, 1500)
    }
  }
} 