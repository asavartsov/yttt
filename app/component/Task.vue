<template>
  <tr>
      <td class="search-highlight"><a v-bind:href="id | issueURL" target="_blank">{{id}}</a> {{summary}}</td>
      <td class="search-highlight">
            <div class="btn-group">
                <button type="button" title="Старт" class="btn btn-xs btn-primary" @click="startTimer(id)" v-if="!isStarted" :disabled="loading">
                    <span class="glyphicon glyphicon-play"></span>
                </button>
                <button type="button" title="Стоп" class="btn btn-xs btn-danger" @click="stopTimer(id)" v-if="isStarted" :disabled="loading">
                    <span class="glyphicon glyphicon-stop"></span>
                </button>
                <button type="button" title="Завершить" class="btn btn-xs btn-default" @click="complete(id)" :disabled="loading">
                    <span class="glyphicon glyphicon-ok"></span>
                </button>
            </div>
      </td>
  </tr>
</template>

<<script>
import _ from 'lodash'

export default {
    data() {
        return {
            loading: false
        }
    },

    inject: ['options', 'YT', 'bus'],

    props: ['id', 'field', 'tag'],

    methods: {
        startTimer(id) {
            this.loading = true;

            this.YT
                .taskCommand(id, "Timer Start")
                .then(() => this.bus.send('loadTasks'))
                .then(() => this.loading = false);
        },

        stopTimer(id) {
            this.loading = true;

            this.YT
                .taskCommand(id, "Timer Stop")
                .then(() => this.bus.send('loadTasks'))
                .then(() => this.loading = false);
        },

        complete(id) {
            this.loading = true;

            this.YT
                .taskCommand(id, "Timer Stop state Fixed")
                .then(() => this.bus.send('loadTasks'))
                .then(() => this.loading = false);
        }
    },

    computed: {
        summary: function () {
           return _.chain(this.field).find({name: 'summary'}).get('value').value();
        },

        isStarted: function () {
            let timer = _.chain(this.field).find({name: 'Timer'}).get('value[0]');
            return timer == 'Start';
        }
    }
}
</script>
