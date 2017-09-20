<template lang="html">
<div>
  <table class="table table-hover table-bordered">
    <thead>
      <tr>
        <th><input type="text" v-model="search" placeholder="Задача"></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <task v-for="task in filteredTasks" :key="task.id" :id="task.id" :field="task.field" :tag="task.tag" :search="search"></task>
      <tr v-if="filteredTasks.length == 0">
        <td colspan="2">Ничего не нашлось</td>
      </tr>
    </tbody>
  </table>
</div>
</template>

<script>
import Task from './Task.vue';
import Mark from 'mark.js'

export default {
  data: function() {
    return {
      search: '',
      tasks: []
    }
  },

  props: ['id'],

  inject: ['options', 'bus'],

  components: {
    Task
  },

  methods: {
    updateTaskList() {
      let key = 'tasks' + this.id;
      chrome.storage.local.get(key, s => this.tasks = s[key]);
    }
  },

  watch: {
    search: function(search) {
      this.$nextTick(function () {
          let mark = new Mark(document.querySelectorAll('.search-highlight'));
          mark.unmark();
          console.log(this.search)
          if (!_.isEmpty(this.search)) {
              mark.mark(this.search, {acrossElements: true});
          }    
      });
    }
  },

  computed: {
    filteredTasks: function () {
      if (_.isEmpty(this.search)) {
        return this.tasks;
      }

      var filter = new RegExp(this.search, 'i');

      return _.filter(this.tasks, t => {
        let summary = _.chain(t.field).find({name: 'summary'}).get('value');
        return filter.test(t.id) || filter.test(summary);
      });
    }
  },

  mounted() {
    this.updateTaskList();
    this.bus.subscribe('updateTaskList', () => this.updateTaskList());
  }
}
</script>

<style lang="css">
  td:last-child {
    min-width: 70px;
  }

  mark {
    padding: 0.2em 0;
    color: inherit;
  }
</style>
