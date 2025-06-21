import Vue from 'vue'
import App from './App.vue'

// 引入 vxe-table
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

// 注册 vxe-table
Vue.use(VXETable)

import './assets/main.css'

new Vue({
  render: (h) => h(App)
}).$mount('#app')
