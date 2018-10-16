<template>
<div>
  <div v-if="noAuth" class="alert alert-sm alert-info">
    <p>{{$l10n('authError')}} <a :href="YT.baseURL" v-if="YT.baseURL" target="_blank">{{YT.baseURL}}</a><span v-else>{{$l10n('noServer')}}</span></p>
  </div>
  <div v-else-if="bgError" class="alert alert-sm alert-danger">
    <p><b>{{$l10n('loadError')}}</b></p>
    <p v-if="bgError.message">{{bgError.message}}</p>
    <p v-if="bgError.data ">{{bgError.data}}</p>
  </div>
  <vue-tabs v-if="!noAuth" @tab-change="handleTabChange">
    <v-tab v-for="(filter, idx) in filters" :key="idx" :title="filter.title">
      <taskList :tasks="tasks['tasks' + idx]"></taskList>
    </v-tab>
    <v-tab :title="$l10n('newTaskTab')" id="newTaskTab" v-if="loaded">
      <newTask ref="newTask"></newTask>
    </v-tab>
    <v-tab :title="$l10n('calendarTab')" id="calendarTab" v-if="loaded">
      <calendar ref="calendar"></calendar>
    </v-tab>
  </vue-tabs>
</div>
</template>

<script>
import TaskList from './TaskList.vue'
import NewTask from './NewTask.vue'
import Calendar from './Calendar.vue'
import Store from './Store'
import { VueTabs, VTab } from 'vue-nav-tabs'

export default {
  data() {
    return {
      loaded: false,
      noAuth: false,
      bgError: false,
      tasks: {},
      filters: []
    }
  },

  inject: ['bus', 'YT'],

  components: {
    TaskList,
    NewTask,
    Calendar,
    VueTabs,
    VTab
  },

  methods: {
    handleTabChange(tabIndex, newTab, oldTab) {
      if (newTab.id == "newTaskTab") {
        this.$refs.newTask.load();
      }

      if (newTab.id == "calendarTab") {
        this.$refs.calendar.load();
      }
    }
  },

  mounted() {
    this.store = new Store();

    this.store.loadOptions(options => {
      this.filters = options.filters;
      this.YT.baseURL = options.baseURL;
      this.loaded = true;
    });

    this.store.loadByKey('_bgNoAuth', v => this.noAuth = v);
    this.store.loadByKey('_bgError', v => this.bgError = v);
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

  .alert-sm {
    padding: 10px;
    margin: 8px;
  }
</style>
