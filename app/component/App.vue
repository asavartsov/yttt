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
    this.store.loadOptions(options => { this.filters = options.filters; this.YT.baseURL = options.baseURL; });
    this.store.loadTasks(null, tasks => this.tasks = tasks);

    this.bus.subscribe('updateTaskList', msg => {
      this.store.loadTasks(msg.key, tasks => this.tasks[msg.key] = tasks[msg.key]);
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
