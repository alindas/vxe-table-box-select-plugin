<script>
import VxeTableDemo from './demo/vxeTable.vue'
// import VxeGridTableDemo from './demo/gridTable.vue'

export default {
  name: 'App',
  components: {
    VxeTableDemo,
    // VxeGridTableDemo
  }
}
</script>

<template>
  <div id="app">
    <VxeTableDemo />
    <!-- <VxeGridTableDemo /> -->
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}
</style>
