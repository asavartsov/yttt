<template>
    <tr :class="{resolved: isResolved}">
        <td>
            <div class="summary">
                <a class="search-highlight" v-bind:href="issueURL" target="_blank">{{id}}</a>
                <span class="search-highlight">{{summary}}</span>
            </div>
            <div class="tags">
                <span :style="priority.color | color" :title="priority.value">{{priority.valueShort}}</span>
                <span>{{state}}</span>
                <span>{{assignee}}</span>
                <span v-for="(tag, idx) in tag" :key="idx" class="tag search-highlight">{{tag.value}}</span>
                <span v-for="(version, idx) in fixVersions" :key="idx" class="version">{{version}}</span>
                <span :class="{started: isStarted}" v-if="isStarted">В работе</span>
            </div>
        </td>
        <td>
            <div class="btn-group">
                <button type="button" :title="$l10n('taskStart')" class="btn btn-xs btn-primary" @click="startTimer" v-if="!isStarted">
                    <span class="glyphicon glyphicon-play"></span>
                </button>
                <button type="button" :title="$l10n('taskStop')" class="btn btn-xs btn-danger" @click="stopTimer" v-if="isStarted">
                    <span class="glyphicon glyphicon-stop"></span>
                </button>
                <button type="button" :title="$l10n('taskFix')" class="btn btn-xs btn-default" @click="complete" v-if="isResolved">
                    <span class="glyphicon glyphicon-asterisk"></span>
                </button>
                <button type="button" :title="$l10n('taskFix')" class="btn btn-xs btn-default" @click="complete" v-else>
                    <span class="glyphicon glyphicon-ok"></span>
                </button>
            </div>
            <div class="tags">
                <span class="timer" :class="{started: isStarted}">{{spent | minutes}}</span>
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
        summary: function() {
            return _.chain(this.field).find({ name: 'summary' }).get('value').value();
        },

        issueURL: function() {
            return this.YT.baseURL + "/issue/" + this.id;
        },

        isStarted: function() {
            let timer = _.chain(this.field).find({ name: 'Timer' }).get('value[0]');
            return timer == 'Start';
        },

        isResolved: function() {
            return _.find(this.field, { name: 'resolved' }) !== undefined;
        },

        assignee: function() {
            return _.chain(this.field).find({ name: 'Assignee' }).get('value[0].fullName').value();
        },

        state: function() {
            return _.chain(this.field).find({ name: 'State' }).get('value[0]').value();
        },

        spent: function() {
            let totalTimeSpent = 0;

            if (this.isStarted) {
                let timerTime = parseInt(_.chain(this.field).find({ name: 'Timer time' }).get('value[0]'));
                let now = new Date().getTime();
                return Math.round((now - timerTime) / 1000 / 60);
            }
            else {
                let timeSpent = parseInt(_.chain(this.field).find({ name: 'Time Spent' }).get('value[0]'));
                return timeSpent || 0;
            }
        },

        fixVersions: function() {
            return _.chain(this.field).find({ name: 'Fix versions' }).get('value').value();
        },

        priority: function() {
            let field = _.find(this.field, { name: 'Priority' });

            if (field) {
                return { value: field.value[0], valueShort: field.value[0][0], color: field.color };
            }
        },

        isStarred: function() {
            return !_.isEmpty(this.tag);
        }
    },

    filters: {
        minutes: function(m) {
            var hours = parseInt(m / 60);
            return ((hours > 0) ? hours + L10n.l10n('h') : '') + m % 60 + L10n.l10n('m')
        },

        color: function(c) {
            let fallback = (c) => c ? c : 'transparent';
            return [
                'background:' + fallback(c.bg),
                'color:' + fallback(c.fg)
            ].join(';');
        }
    }
}
</script>

<style lang="css">
.summary a {
    color: #337ab7;
    text-decoration: underline;
}

.resolved td {
    background: #fbfbfb;
    opacity: 0.9;
    filter: grayscale(100%);
}

.resolved .summary a {
    color: gray;
    text-decoration: none;
}

.resolved .summary {
    color: gray;    
    text-decoration: line-through;
}

.tags {
    margin: 2px 0 -3px 0;
}

.tags span {
    font-size: 11px;
    margin-right: 5px;
    background: rgba(214, 214, 214, 0.32);
    padding: 2px 3px;
    border-radius: 3px;
}

.tags .tag {
    background: rgba(255, 148, 40, 0.95);
    color: white;
}

.tags .version {
    background: rgba(153, 147, 249, 0.32);
}

.tags .timer {
    background: transparent;
}

.tags .started {
    background: #d9534f;
    color: white;
}

.started td {
    background: #fff1f1;
}
</style>
