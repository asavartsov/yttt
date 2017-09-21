<template>
<vue-tabs>
  <v-tab v-for="(filter, idx) in filters" :key="idx" :title="filter.title">
    <taskList :tasks="tasks['tasks' + idx]"></taskList>
  </v-tab>
</vue-tabs>
</template>

<script>
import TaskList from './TaskList.vue'
import Store from './Store'
import { VueTabs, VTab } from 'vue-nav-tabs'

export default {
  data() {
    return {
      tasks: {},
      filters: []
    }
  },

  inject: ['bus', 'YT'],

  components: {
    TaskList,
    VueTabs,
    VTab
  },

  mounted() {
    this.store = new Store();
    this.store.loadOptions(o => { this.filters = o.filters; this.YT.baseURL = o.baseURL; });
    this.store.loadTasks(null, s => this.tasks = s);

    this.bus.subscribe('updateTaskList', msg => {
      this.store.loadTasks(msg.key, s => this.tasks[msg.key] = s[msg.key]);
    });
  }
}
</script>

<style lang="css">
  @import '../../node_modules/vue-nav-tabs/themes/vue-tabs.css';

  body {
    width: 600px;
    font-size: 13px;
  }
</style>
