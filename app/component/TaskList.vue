<template lang="html">
<div>
  <input type="text" class="form-control input-sm search" v-model="search" :placeholder="$l10n('search')">
  <table class="table table-hover table-bordered">
    <tbody>
      <task v-for="task in filteredTasks" :key="task.id" :id="task.id" :field="task.field" :tag="task.tag" :search="search"></task>
    </tbody>
  </table>

  <div v-if="filteredTasks.length == 0" class="no-tasks">{{$l10n('taskNothingFound')}}</div>
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
        if (filter.test(t.id)) {
          return true;
        }

        let summary = _.chain(t.field).find({name: 'summary'}).get('value');
        if (filter.test(summary)) {
          return true;
        }

        if (_.some(t.tag, t => filter.test(t.value))) {
          return true;
        }

        // @TODO: Больше полей для поиска
      });
    }
  }
}
</script>

<style lang="css">
  .tab-container .table-bordered {
    border: 0;
  }

  .search, .search:focus  {
    border: 0;
    box-shadow: none;
    border-left: 1px solid #ddd;
    border-right: 1px solid #ddd;
    border-bottom: 1px solid #ddd;    
    border-radius: 0;
    background: transparent;
    -webkit-box-shdow: none;
    color: black;
    margin-bottom: -1px;
  }

  td:last-child {
    min-width: 80px;
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
