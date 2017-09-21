<template lang="html">
<div>
  <table class="table table-hover table-bordered">
    <thead>
      <tr>
        <th><input type="text" class="form-control input-sm" v-model="search" :placeholder="'taskSummary' | l10n"></th>
        <th class="wider">{{'taskAssignee' | l10n}}</th>
        <th class="wide">{{'taskSpent' | l10n}}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <task v-for="task in filteredTasks" :key="task.id" :id="task.id" :field="task.field" :tag="task.tag" :search="search"></task>
    </tbody>
  </table>

  <div v-if="filteredTasks.length == 0" class="no-tasks">{{'taskNothingFound' | l10n}}</div>
</div>
</template>

<script>
import Task from './Task.vue';
import Mark from 'mark.js'

export default {
  data: function() {
    return {
      search: ''
    }
  },

  props: ['tasks'],

  inject: ['bus'],

  components: {
    Task
  },

  watch: {
    search: function(search) {
      this.$nextTick(function () {
          let mark = new Mark(document.querySelectorAll('.search-highlight'));
          mark.unmark();
          
          if (!_.isEmpty(this.search)) {
              mark.mark(this.search, {acrossElements: true});
          }    
      });
    }
  },

  computed: {
    filteredTasks: function () {
      if (_.isEmpty(this.search)) {
        return this.tasks || [];
      }

      var filter = new RegExp(this.search, 'i');

      return _.filter(this.tasks, t => {
        let summary = _.chain(t.field).find({name: 'summary'}).get('value');
        return filter.test(t.id) || filter.test(summary);
      });
    }
  }
}
</script>

<style lang="css">
  table {
    border: 0;
  }

  .vue-tabs table a {
    color: #337ab7;
    text-decoration: underline;
  }

  td:last-child {
    min-width: 70px;
  }

  th input[type=text] {
      margin: -6px 0;
      padding: 5px 0;
      height: auto;
      font-size: inherit;
      background: transparent;
      border: 0;
      box-shadow: none;
      -webkit-box-shdow: none;
      color: black;
  }

  th input[type=text]:focus {
      border: 0;
      box-shadow: none;
  }

  th input[type=text]::placeholder {
      color: black;
  }

  th input[type=text]:focus::placeholder {
      color: gray;
  }

  th.wide {
    width: 90px;
  }

  th.wider {
    width: 160px;
  }

  mark {
    padding: 0;
    color: inherit;
    background: #ffeb4f;
    border-radius: 4px;
    border: 1px solid #fbc759;
  }

  .no-tasks {
    margin: 5px;
    background: #cee5fd;
    padding: 5px;
    border-radius: 5px;
    border: 1px solid #8ca5d4;
    box-shadow: inset 0 0 2px 0 rgb(255, 255, 255);
    text-align: center;
    text-shadow: 1px 1px rgba(255, 255, 255, 0.26);
  }
</style>
