<template>
<vue-tabs>
  <v-tab v-for="(filter, idx) in options.filters" :key="idx" :title="filter.title">
    <taskList :id="idx"></taskList>
  </v-tab>
</vue-tabs>
</template>

<script>
import TaskList from './TaskList.vue'
import {VueTabs, VTab} from 'vue-nav-tabs'

export default {
  components: {
    TaskList,
    VueTabs,
    VTab
  },

  inject: ['options']
}
</script>

<style lang="css">
  @import '../../node_modules/vue-nav-tabs/themes/vue-tabs.css';

  body {
    width: 460px;
  }
</style>
