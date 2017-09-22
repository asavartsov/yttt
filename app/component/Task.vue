<template>
  <tr :class="{danger: isStarted, warning: isStarred}">
      <td class="search-highlight"><a v-bind:href="issueURL" target="_blank">{{id}}</a> {{summary}}</td>
      <td>{{assignee}}</td>
      <td>{{spent | minutes}}</td>
      <td>
            <div class="btn-group">
                <button type="button" :title="$l10n('taskStart')" class="btn btn-xs btn-primary" @click="startTimer" v-if="!isStarted">
                    <span class="glyphicon glyphicon-play"></span>
                </button>
                <button type="button" :title="$l10n('taskStop')" class="btn btn-xs btn-danger" @click="stopTimer" v-if="isStarted">
                    <span class="glyphicon glyphicon-stop"></span>
                </button>
                <button type="button" :title="$l10n('taskFix')" class="btn btn-xs btn-default" @click="complete">
                    <span class="glyphicon glyphicon-ok"></span>
                </button>
            </div>
      </td>
  </tr>
</template>

<script>
import _ from 'lodash'
import L10n from './L10n'

export default {
    inject: ['YT', 'bus'],

    props: ['id', 'field', 'tag'],

    methods: {
        startTimer() {
            this.YT
                .taskCommand(this.id, "Timer Start state In Progress")
                .then(() => this.bus.send('loadTasks'));
        },

        stopTimer() {
            this.YT
                .taskCommand(this.id, "Timer Stop state Open")
                .then(() => this.bus.send('loadTasks'));
        },

        complete() {
            this.YT
                .taskCommand(this.id, "Timer Stop state Fixed")
                .then(() => this.bus.send('loadTasks'));
        },
    },

    computed: {
        summary: function () {
           return _.chain(this.field).find({name: 'summary'}).get('value').value();
        },

        issueURL: function() {
            return this.YT.baseURL + "/issue/" + this.id;
        },

        isStarted: function () {
            let timer = _.chain(this.field).find({name: 'Timer'}).get('value[0]');
            return timer == 'Start';
        },

        assignee: function () {
            return _.chain(this.field).find({name: 'Assignee'}).get('value[0].fullName').value();
        },

        spent: function () {
            let timerTime = parseInt(_.chain(this.field).find({name: 'Timer time'}).get('value[0]'));
            let timeSpent = parseInt(_.chain(this.field).find({name: 'Spent time'}).get('value[0]'));
            let totalTimeSpent = 0;
            
            if(this.isStarted) {
                let now = new Date().getTime();
                totalTimeSpent = Math.round((now - timerTime) / 1000 / 60);
            }

            if (timeSpent) {
                totalTimeSpent += timeSpent;
            }
            
            return totalTimeSpent;
        },

        isStarred: function () {
            return !_.isEmpty(this.tag);
        }
    },

    filters: {
        minutes: function (m) {
            var hours = parseInt(m / 60);
            return ((hours > 0 ) ? hours + L10n.l10n('h') : '') + m % 60 + L10n.l10n('m')
        }
    }
}
</script>
