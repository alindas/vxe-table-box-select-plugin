<template>
    <div style="width: 600px;">
        <!-- 正常区域的框 -->
        <div class="vxe-table--cell-area" ref="cellarea">
            <span class="vxe-table--cell-main-area"></span>
            <span class="vxe-table--cell-active-area"></span>
        </div>
        <!-- 左边fixed区域的框,右边fixed没有尝试过。。。 -->
        <div class="vxe-table--cell-area" ref="fixedcellarea">
            <span class="vxe-table--cell-main-area"></span>
            <span class="vxe-table--cell-active-area"></span>
        </div>

        <vxe-grid ref='xGrid' v-bind="gridOptions" height="400px" @cell-click="tableCellClick" @keydown="tableKeydown"
            @toolbar-button-click="toolbarButtonClickEvent">

        </vxe-grid>
    </div>
</template>

<script>
/**
     * 复制文本到剪贴板
     */
function copyToClipboard(text) {
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
}

export default {
    data() {
        return {
            gridOptions: {
                "keyboard-config": {
                    isArrow: true,
                },
                //左上角按钮
                toolbarConfig: {
                    perfect: true,
                    enabled: true,
                    size: "mini",
                    buttons: [
                        {
                            code: 'getcellselctdata', type: "text", name: '获取选中数据(结果看控制台)'
                        }
                    ],
                },
                //列配置 (使用列拖拽功能,必须配置useKey为true)
                "column-config": { resizable: true, useKey: true },
                //边框
                border: "full",
                //斑马纹
                stripe: true,
                //列信息
                columns: [
                    { width: 70, field: "id", title: "#", align: "left", fixed: "left" },
                    { width: 100, field: "name", title: "姓名", align: "left", fixed: "left" },
                    { width: 100, field: "age", title: "年龄", align: "left", fixed: "left" },
                    { width: 100, field: "sex", title: "性别", align: "left" },
                    { width: 100, field: "job", title: "岗位", align: "left" },
                    { width: 270, field: "address", title: "地址", align: "left" },
                ],
                //数据
                data: [
                    { id: 1, name: "张三", age: 30, sex: "男", job: "前端", address: "中国xxxxxxxxxx" },
                    { id: 2, name: "李四", age: 30, sex: "男", job: "后端", address: "中国xxxxxxxxxx" },
                    { id: 3, name: "王五", age: 30, sex: "女", job: "运维", address: "中国xxxxxxxxxx" },
                    { id: 4, name: "赵六", age: 30, sex: "男", job: "美工", address: "中国xxxxxxxxxx" },
                    { id: 5, name: "老八", age: 30, sex: "男", job: "项目经理", address: "中国xxxxxxxxxx" },
                    { id: 6, name: "桀桀", age: 30, sex: "女", job: "售后", address: "中国xxxxxxxxxx" },
                ],
                //这里一定要指定true，否则row-config的height没用
                'show-overflow': true,
                //行配置,这里的行高一定需要指定
                "row-config": { isCurrent: true, height: 35, isHover: true },
            },
            //鼠标滑动选中
            isSelecting: false, // 是否正在进行选择操作
            selectionStart: { rowIndex: -1, cellIndex: -1 }, // 选择操作起始单元格位置
            selectionEnd: { rowIndex: -1, cellIndex: -1 }, // 选择操作结束单元格位置
        }
    },
    mounted() {
        this.addListener();
    },
    methods: {
        //返回table的ref名称
        getTablexGrid() {
            return this.$refs.xGrid;
        },
        //添加事件
        addListener() {
            //添加多选列
            this.$nextTick(() => {
                let tbody = this.getTablexGrid().$el.querySelector(".vxe-table--main-wrapper table tbody");
                if (tbody) {
                    tbody.addEventListener("mousedown", this.tbodymousedown);
                    tbody.addEventListener("mouseup", this.tbodymouseup);
                    tbody.addEventListener("mousemove", this.tbodymousemove);
                    tbody.addEventListener("paste", this.tbodykeydown);
                }
                let bodyWrapper = this.getTablexGrid().$el.querySelector(".vxe-table--main-wrapper .vxe-table--body-wrapper");
                if (bodyWrapper) {
                    //注意这里的ref名称，这里是非fixed区域的框的名称
                    bodyWrapper.appendChild(this.$refs.cellarea);
                }

                setTimeout(() => {
                    let fixedtbody = this.getTablexGrid().$el.querySelector(".vxe-table--fixed-wrapper table tbody");
                    if (fixedtbody) {
                        fixedtbody.addEventListener("mousedown", this.tbodymousedown);
                        fixedtbody.addEventListener("mouseup", this.tbodymouseup);
                        fixedtbody.addEventListener("mousemove", this.tbodymousemove);
                        fixedtbody.addEventListener("paste", this.tbodykeydown);
                    }

                    let fixedBodyWrapper = this.getTablexGrid().$el.querySelector(".vxe-table--fixed-wrapper .vxe-table--body-wrapper");
                    if (fixedBodyWrapper) {
                        //注意这里的ref名称，这里是fixed区域的框的名称
                        fixedBodyWrapper.appendChild(this.$refs.fixedcellarea);
                    }
                })
            })
        },
        //鼠标按下事件
        tbodymousedown(event) {
            //左键
            if (event.button === 0) {
                // 记录选择操作起始位置
                this.selectionStart = this.getCellPosition(event.target);
                this.isSelecting = true;
            }
        },
        //鼠标移动事件
        tbodymousemove(event) {
            //左键
            if (event.button === 0) {
                if (!this.isSelecting) return;
                var x = event.clientX;
                // 记录选择操作结束位置
                this.selectionEnd = this.getCellPosition(event.target);
                //设置样式
                this.setselectedCellArea();
                //持续向右滚动
                var x = event.clientX;
                var table = this.getTablexGrid().$el.querySelector(".vxe-table--body-wrapper table");
                if (table) {
                    let tableRect = table.parentElement.getBoundingClientRect();
                    if (x > tableRect.right - 20) {
                        table.parentElement.scrollLeft += 20;
                    }
                }
            }
        },
        //鼠标按键结束事件
        tbodymouseup(event) {
            //左键
            if (event.button === 0) {
                this.isSelecting = false;
            }
        },
        // 获取单元格位置
        getCellPosition(cell) {
            try {
                while (cell.tagName !== 'TD') {
                    cell = cell.parentElement;
                }
                // const rowIndex = cell.parentElement.rowIndex;
                // const cellIndex = cell.cellIndex;
                let visibleColumn = this.getTablexGrid().getTableColumn()["visibleColumn"];
                const cellIndex = visibleColumn.findIndex((col) => {
                    return col.id == cell.getAttribute("colid");
                })
                let visibleData = this.getTablexGrid().getTableData()["visibleData"];
                const rowIndex = visibleData.findIndex((row) => {
                    return row._X_ROW_KEY == cell.parentElement.getAttribute("rowid");
                })
                return { rowIndex, cellIndex };
            } catch (e) {
                return { rowIndex: -1, cellIndex: -1 };
            }
        },
        //设置框打开
        setselectedCellArea() {
            try {
                let startRowIndex = this.selectionStart["rowIndex"];
                let endRowIndex = this.selectionEnd["rowIndex"];
                let startColumnIndex = this.selectionStart["cellIndex"];
                let endColumnIndex = this.selectionEnd["cellIndex"];
                let { width, height, left, top } = this.getAreaBoxPostion();
                // .vxe-table--fixed-wrapper .vxe-table--body-wrapper
                // .vxe-table--main-wrapper .vxe-table--body-wrapper
                var activeElement = this.getTablexGrid().$el.querySelector(".vxe-table--main-wrapper .vxe-table--body-wrapper .vxe-table--cell-active-area");
                var mainElement = this.getTablexGrid().$el.querySelector(".vxe-table--main-wrapper .vxe-table--body-wrapper .vxe-table--cell-main-area");
                var fixedActiveElement = this.getTablexGrid().$el.querySelector(".vxe-table--fixed-wrapper .vxe-table--body-wrapper .vxe-table--cell-active-area");
                var fixedMainElement = this.getTablexGrid().$el.querySelector(".vxe-table--fixed-wrapper .vxe-table--body-wrapper .vxe-table--cell-main-area");
                //获取固定列宽度fixed--hidden
                var fixedWidth = 0;
                let flexDiv = this.getTablexGrid().$el.querySelector(".vxe-table--fixed-left-wrapper");
                if (flexDiv) {
                    fixedWidth = flexDiv.offsetWidth;
                }
                var elements = [activeElement, mainElement, fixedActiveElement, fixedMainElement];
                elements.forEach((element) => {
                    if (element) {
                        element.style.width = `${width}px`;
                        element.style.height = `${height}px`;
                        element.style.top = `${top}px`;
                        element.style.left = `${left}px`;
                        element.style.display = "block";
                    }
                })
                this.openAreaBox();
                this.selectionStart = { "cellIndex": startColumnIndex, "rowIndex": startRowIndex };
                this.selectionEnd = { "cellIndex": endColumnIndex, "rowIndex": endRowIndex };
            } catch (e) {
            }
        },
        //根据开始位置和结束位置的索引计算框的width,height,left,top
        getAreaBoxPostion() {
            let startRowIndex = this.selectionStart["rowIndex"];
            let endRowIndex = this.selectionEnd["rowIndex"];
            let startColumnIndex = this.selectionStart["cellIndex"];
            let endColumnIndex = this.selectionEnd["cellIndex"];
            let visibleColumn = this.getTablexGrid().getTableColumn()["visibleColumn"];
            let visibleData = this.getTablexGrid().getTableData()["visibleData"];
            if (startColumnIndex < 0 || endColumnIndex < 0 || startRowIndex < 0 || endRowIndex < 0) return;
            var maxColumnIndex = visibleColumn.length - 1;
            var maxRowIndex = visibleData.length - 1;
            if (endColumnIndex > maxColumnIndex) {
                endColumnIndex = maxColumnIndex;
            }
            if (endRowIndex > maxRowIndex) {
                endRowIndex = maxRowIndex;
            }
            // height width left top display
            // cellarea
            let width = 0, height = 0, left = 0, top = 0;
            let fixedwidth = 0, fixedheight = 0, fixedleft = 0, fixedtop = 0;
            visibleColumn.forEach((col, index) => {
                if (index < startColumnIndex) {
                    left += this.getTablexGrid().getColumnWidth(col);
                }
                if (index <= endColumnIndex && startColumnIndex <= index) {
                    width += this.getTablexGrid().getColumnWidth(col);
                }
            })
            height = (endRowIndex - startRowIndex + 1) * this.gridOptions["row-config"]["height"];
            if (height <= 0 || width <= 0) {
                this.destroyAreaBox();
                return;
            }
            top = startRowIndex * this.gridOptions["row-config"]["height"];
            return { width, height, left, top };
        },
        //显示范围框
        openAreaBox() {
            var element = this.$refs.xGrid.$el.querySelector(".vxe-table--main-wrapper .vxe-table--body-wrapper .vxe-table--cell-area");
            if (element) {
                element.style.display = "block";
            }
            element = this.$refs.xGrid.$el.querySelector(".vxe-table--fixed-wrapper .vxe-table--body-wrapper .vxe-table--cell-area");
            if (element) {
                element.style.display = "block";
            }
        },
        //关闭范围框
        closeAreaBox() {
            var element = this.getTablexGrid().$el.querySelector(".vxe-table--main-wrapper .vxe-table--body-wrapper .vxe-table--cell-area");
            if (element) {
                element.style.display = "none";
            }
            element = this.getTablexGrid().$el.querySelector(".vxe-table--fixed-wrapper .vxe-table--body-wrapper .vxe-table--cell-area");
            if (element) {
                element.style.display = "block";
            }
        },
        //销毁范围框
        destroyAreaBox() {
            this.selectionStart = { "rowIndex": -1, "cellIndex": -1 };
            this.selectionEnd = { "rowIndex": -1, "cellIndex": -1 };
            var element = this.getTablexGrid().$el.querySelector(".vxe-table--main-wrapper .vxe-table--body-wrapper .vxe-table--cell-area");
            if (element) {
                element.style.display = "none";
            }
            element = this.getTablexGrid().$el.querySelector(".vxe-table--fixed-wrapper .vxe-table--body-wrapper .vxe-table--cell-area");
            if (element) {
                element.style.display = "none";
            }
        },
        //表格单元格点击事件
        tableCellClick(e) {
            let { row, column } = e;
            if (!this.isSelecting) {
                if (!this.lastActive || this.lastActive["rowid"] != row["_X_ROW_KEY"] || this.lastActive["colid"] != column["id"]) {
                    this.selectionStart = this.getCellPosition(e.$event.target);
                    this.selectionEnd = this.selectionStart;
                    //设置样式
                    this.setselectedCellArea();
                    this.lastActive = { "rowid": "", "colid": "" };
                }
            }
        },

        toolbarButtonClickEvent({ code, button }) {
            switch (code) {
                case "getcellselctdata":
                    //我给大家打印处理:
                    console.log("是否正在进行滑动选中操作：", this.isSelecting);
                    //左上角坐标
                    console.log("单元格起始位置：索引:", this.selectionStart);
                    //右下角坐标
                    console.log("单元格结束位置：索引:", this.selectionEnd);

                    //这里需要是visibleData
                    let tableData = this.getTablexGrid().getTableData()["visibleData"];
                    let rowStart = this.selectionStart.rowIndex;
                    let rowEnd = this.selectionEnd.rowIndex;
                    let selectRows = tableData.filter((col, index) => {
                        return rowStart <= index && rowEnd >= index;
                    })
                    console.log("鼠标选中行:", JSON.stringify(selectRows));

                    //这里需要是visibleColumn
                    let colStart = this.selectionStart.cellIndex;
                    let colEnd = this.selectionEnd.cellIndex;
                    let tableColumn = this.getTablexGrid().getTableColumn()["visibleColumn"];
                    let selectCols = tableColumn.filter((col, index) => {
                        return colStart <= index && colEnd >= index;
                    })
                    console.log("鼠标选中列:", JSON.stringify(selectCols));
                    break;
            }
        },
        tableKeydown({ $event }) {
            this.tbodykeydown($event);
        },
        tbodykeydown(event) {
            let tablexgrid = this.getTablexGrid();
            let tableColumn = this.getTablexGrid().getTableColumn()["visibleColumn"];
            let tableData = this.getTablexGrid().getTableData()["visibleData"];
            let startRowIndex = this.selectionStart["rowIndex"];
            let endRowIndex = this.selectionEnd["rowIndex"];
            let startColumnIndex = this.selectionStart["cellIndex"];
            let endColumnIndex = this.selectionEnd["cellIndex"];
            var maxColumnIndex = tableColumn.length - 1;
            var maxRowIndex = tableData.length - 1;
            var minColumnIndex = 0;
            var minRowIndex = 0;

            if (event.ctrlKey && event.keyCode === 67) {
                //ctrl+c 复制
                this.contextMenuClickEvent({ menu: { code: "cellCopy" } });
                event.preventDefault();
            } else if (event.ctrlKey && event.keyCode === 86) {
                //ctrl+v 粘贴
                this.contextMenuClickEvent({ menu: { code: "cellPaste" } });
                event.preventDefault();
            } else if (event.ctrlKey && event.key === 'd') {
                //ctrl+d
                this.contextMenuClickEvent({ menu: { code: "cellLineCopy" } });
                event.preventDefault();
            } else if (event.key === 'Delete') {
                //delete
                this.contextMenuClickEvent({ menu: { code: "cellDelete" } });
                event.preventDefault();
            } else if (event.ctrlKey && event.key === 'x') {
                //ctrl+x
                this.contextMenuClickEvent({ menu: { code: "cellCut" } });
                event.preventDefault();
            } else if (event.ctrlKey && event.key === 'z') {
                //ctrl+z
                this.contextMenuClickEvent({ menu: { code: "cellSortValue" } });
                event.preventDefault();
            } else if (event.keyCode === 39) {
                //右键 向右
                if (endColumnIndex + 1 <= maxColumnIndex) {
                    var currentRow = tablexgrid.getCurrentRecord();
                    const rowIndex = tableData.findIndex((row) => {
                        return row._X_ROW_KEY == currentRow._X_ROW_KEY;
                    })
                    this.selectionStart = { "cellIndex": endColumnIndex + 1, "rowIndex": rowIndex };
                    this.selectionEnd = { "cellIndex": endColumnIndex + 1, "rowIndex": rowIndex };
                }
                this.setselectedCellArea();
                this.tableScrollMove("right");
                event.preventDefault();
            } else if (event.keyCode === 37) {
                //左键 向左
                if (startColumnIndex - 1 >= minColumnIndex) {
                    var currentRow = tablexgrid.getCurrentRecord();
                    const rowIndex = tableData.findIndex((row) => {
                        return row._X_ROW_KEY == currentRow._X_ROW_KEY;
                    })
                    this.selectionStart = { "cellIndex": startColumnIndex - 1, "rowIndex": rowIndex };
                    this.selectionEnd = { "cellIndex": startColumnIndex - 1, "rowIndex": rowIndex };
                }
                this.setselectedCellArea();
                this.tableScrollMove("left");
                event.preventDefault();
            } else if (event.keyCode === 38) {
                //向上
                var currentRow = tablexgrid.getCurrentRecord();
                const rowIndex = tableData.findIndex((row) => {
                    return row._X_ROW_KEY == currentRow._X_ROW_KEY;
                })
                if (rowIndex - 1 >= minRowIndex) {
                    this.selectionStart = { "cellIndex": startColumnIndex, "rowIndex": rowIndex - 1 };
                    this.selectionEnd = { "cellIndex": startColumnIndex, "rowIndex": rowIndex - 1 };
                }
                this.setselectedCellArea();
                //判断是否小于最小行的个数
                event.preventDefault();
            } else if (event.keyCode === 40) {
                //向下
                var currentRow = tablexgrid.getCurrentRecord();
                const rowIndex = tableData.findIndex((row) => {
                    return row._X_ROW_KEY == currentRow._X_ROW_KEY;
                })
                if (rowIndex + 1 <= maxRowIndex) {
                    this.selectionStart = { "cellIndex": startColumnIndex, "rowIndex": rowIndex + 1 };
                    this.selectionEnd = { "cellIndex": startColumnIndex, "rowIndex": rowIndex + 1 };
                }
                this.setselectedCellArea();
                event.preventDefault();
            }
        },
        //控制滚动条，元素隐藏时滚动条自动滚动到显示的位置
        //move：快捷键左右时有效,其他无效
        tableScrollMove(move) {
            let tableColumn = this.getTablexGrid().getTableColumn()["visibleColumn"];
            let tableData = this.getTablexGrid().getTableData()["visibleData"];
            let startRowIndex = this.selectionStart["rowIndex"];
            let endRowIndex = this.selectionEnd["rowIndex"];
            let startColumnIndex = this.selectionStart["cellIndex"];
            let endColumnIndex = this.selectionEnd["cellIndex"];

            let fixedWidth = 0;

            //获取固定列宽度fixed--hidden
            let flexDiv = this.getTablexGrid().$el.querySelector(".vxe-table--fixed-left-wrapper");
            if (flexDiv) {
                fixedWidth = flexDiv.offsetWidth;
            }
            //获取td
            var td;
            var tbody = this.getTablexGrid().$el.querySelector(".vxe-table--main-wrapper table tbody");
            if (tbody && move == "left") {
                var column = tableColumn[startColumnIndex];
                td = tbody.querySelector(`td[colid="${column.id}"]`);
            } else if (tbody && move == "right") {
                var column = tableColumn[endColumnIndex];
                td = tbody.querySelector(`td[colid="${column.id}"]`);
            }
            if (td) {
                //判断是否隐藏
                var tdRect = td.getBoundingClientRect();
                var table = this.getTablexGrid().$el.querySelector(".vxe-table--body-wrapper table");
                if (table) {
                    let tableRect = table.parentElement.getBoundingClientRect();
                    //需要减去左边固定列的宽度
                    if (tdRect.top < tableRect.top || tdRect.bottom > tableRect.bottom ||
                        tdRect.left < tableRect.left + fixedWidth || tdRect.right > tableRect.right) {
                        if (move == "right") {
                            table.parentElement.scrollLeft += (tdRect.right - tableRect.right);
                        } else if (move == "left") {
                            table.parentElement.scrollLeft += (tdRect.left - tableRect.left - fixedWidth);
                        }
                    } else {
                        // console.log("该 td 元素未隐藏");
                    }
                }
            }
        },
        //
        contextMenuClickEvent({ menu, row, column, rowIndex, columnIndex, $event }) {
            let startRowIndex = this.selectionStart["rowIndex"];
            let endRowIndex = this.selectionEnd["rowIndex"];
            let startColumnIndex = this.selectionStart["cellIndex"];
            let endColumnIndex = this.selectionEnd["cellIndex"];
            var tableColumn = JSON.parse(JSON.stringify(this.getTablexGrid().getTableColumn()["visibleColumn"]));
            var tableData = this.getTablexGrid().getTableData()["visibleData"];
            switch (menu.code) {
                //复制
                case "cellCopy":
                    let enterStr = "\r\n";
                    let spaceStr = "\t";
                    let data = [];
                    for (var i = startRowIndex; i <= endRowIndex; i++) {
                        let value = [];
                        for (var j = startColumnIndex; j <= endColumnIndex; j++) {
                            value.push(tableData[i][tableColumn[j].field]);
                        }
                        data.push(value);
                    }
                    let finalStr = data.map((value) => {
                        return value.join(spaceStr);
                    }).join(enterStr);
                    this.copyValue(finalStr);
                    break;
                //粘贴
                case "cellPaste":
                    navigator.clipboard.readText().then((text) => {
                        if (text) {
                            //去除首尾换行
                            text = text.replace(/^\r\n+|\r\n+$/g, '');
                            var snsArr = text.split(/\r\n+/);
                            var tArr = snsArr.map((value) => {
                                return value.split("\t");
                            })
                            for (var i = 0; i < tArr.length; i++) {
                                let line = tArr[i];
                                if (startRowIndex + i > tableData.length - 1) break;
                                let row = tableData[startRowIndex + i];
                                for (var j = 0; j < line.length; j++) {
                                    if (startColumnIndex + j > tableColumn.length) break;
                                    let column = tableColumn[startColumnIndex + j];
                                    row[column.field] = line[j];
                                }
                            }
                        }
                    })
                    break;
                //delete清除
                case "cellDelete":
                    for (var i = startRowIndex; i <= endRowIndex; i++) {
                        if (i > tableData.length - 1) break;
                        for (var j = startColumnIndex; j <= endColumnIndex; j++) {
                            if (j > tableColumn.length - 1) break;
                            let row = tableData[i];
                            let column = tableColumn[j];
                            this.getTablexGrid().clearData(row, column.property);
                        }
                    }
                    break;
                case "cellLineCopy":
                    //第一行的值不变,后面的行等于第一行的值
                    var firstRow = tableData[startRowIndex];
                    for (var i = startRowIndex + 1; i <= endRowIndex; i++) {
                        if (i > tableData.length - 1) break;
                        for (var j = startColumnIndex; j <= endColumnIndex; j++) {
                            if (j > tableColumn.length - 1) break;
                            tableData[i][tableColumn[j].field] = firstRow[tableColumn[j].field];
                        }
                    }
                    break;
                case "cellCut":
                    //剪切
                    this.contextMenuClickEvent({ menu: { code: "cellCopy" } });
                    this.contextMenuClickEvent({ menu: { code: "cellDelete" } });
                    break;
                case "cellSortValue":
                    //自增
                    var firstRow = tableData[startRowIndex];
                    for (var i = startRowIndex + 1; i <= endRowIndex; i++) {
                        if (i > tableData.length - 1) break;
                        for (var j = startColumnIndex; j <= endColumnIndex; j++) {
                            if (j > tableColumn.length - 1) break;
                            let value = firstRow[tableColumn[j].field];
                            if (!value) break;
                            if (!isNaN(value)) {
                                tableData[i][tableColumn[j].field] = parseFloat(value) + (i - startRowIndex);
                            } else {
                                //最后一个字符
                                let lastChar = value[value.length - 1];
                                //去除最后一个字符
                                let nvalChar = value.slice(0, -1);
                                if (/[a-zA-Z]/.test(lastChar)) {
                                    let result = this.generateAlphabetChars(lastChar, i - startRowIndex + 1);
                                    tableData[i][tableColumn[j].field] = nvalChar + result;
                                }
                            }
                        }
                    }
                    break;
            }
        },
        //数据自增的工具方法
        generateAlphabetChars(c, shift) {
            /**
             * 将一个字符按照指定的偏移量进行移位
             * @param {string} c 需要移位的字符
             * @param {number} shift 移位的偏移量
             * @returns {string} 移位后的字符
             */
            // 将字符转换为 ASCII 码
            var asciiCode = c.charCodeAt(0);
            // 计算移位后的 ASCII 码
            var shiftedAsciiCode = asciiCode + shift;
            let flag = false;
            if (shiftedAsciiCode > 122) {
                shiftedAsciiCode -= 26;
            } else if (shiftedAsciiCode < 97) {
                shiftedAsciiCode += 26;
            }
            // 将 ASCII 码转换为字符
            const shiftedChar = String.fromCharCode(shiftedAsciiCode);
            return asciiCode + shift > 122 ? 'a' + shiftedChar : shiftedChar;
        },
        //复制的工具方法
        copyValue(value) {
            copyToClipboard(value);
            alert("已复制到剪贴板！");
            // if (XEClipboard.copy(value)) {
            //     this.$VXETable.modal.message({ content: '已复制到剪贴板！', status: 'success', duration: 400 });
            // }
        },
    }
}
</script>

<style scoped>
.vxe-grid {
    -webkit-user-select: none;
    /* Safari */
    -moz-user-select: none;
    /* Firefox */
    -ms-user-select: none;
    /* Internet Explorer/Edge */
    user-select: none;
}
</style>