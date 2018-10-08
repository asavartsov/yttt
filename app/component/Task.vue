<template>
    <tr :class="{resolved: isResolved}">
        <td>
            <div class="summary">
                <a class="search-highlight" v-bind:href="issueURL" target="_blank">{{id}}</a>
                <span class="search-highlight">{{summary}}</span>
            </div>
            <div class="tags">
                <span :style="priority.color | color" :title="priority.value" :class="priority.id">{{priority.valueShort}}</span>
                <span>{{state}}</span>
                <span v-if="assignee">{{assignee}}</span>
                <span v-for="(tag, idx) in tag" :key="idx" class="tag search-highlight">{{tag.value}}</span>
                <span v-for="(version, idx) in fixVersions" :key="idx" class="version">{{version}}</span>
                <span :class="{started: isStarted}" v-if="isStarted">{{$l10n('taskWIP')}}</span>
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
                <button type="button" :title="$l10n('taskAddTime')" class="btn btn-xs btn-default" @click="toggleTimePanel" :class="{active: timePanel  }">
                    <span class="glyphicon glyphicon-plus"></span>
                </button>
                <button type="button" :title="$l10n('taskOpen')" class="btn btn-xs btn-default" @click="open" v-if="isResolved">
                    <span class="glyphicon glyphicon-flash"></span>
                </button>
                <button type="button" :title="$l10n('taskFix')" class="btn btn-xs btn-default" @click="complete" v-else>
                    <span class="glyphicon glyphicon-ok"></span>
                </button>
                <div class="time-panel" v-if="timePanel">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control" ref="timeToTrack" :placeholder="$l10n('taskTime')" v-model="timeToTrack" @keyup.enter="addTime">
                        <span class="input-group-btn">
                            <button class="btn btn-success" type="button" :disabled="!timeToTrack" @click="addTime" :title="$l10n('taskAddTime')">
                                <span class="glyphicon glyphicon-plus"></span>
                            </button>
                        </span>
                    </div>
                </div>
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

    data() {
        return {
            timePanel: false,
            timeToTrack: ""
        }
    },

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

        open() {
            this.YT
                .taskCommand(this.id, "state Open")
                .then(() => this.bus.send('loadTasks'));
        },

        toggleTimePanel() {
            if (this.timePanel) {
                this.timePanel = false;
            }
            else {
                this.timePanel = true;
                this.$nextTick(() => this.$refs.timeToTrack.focus());
            }
        },

        addTime() {
            this.YT
                .taskCommand(this.id, "work " + this.timeToTrack)
                .then(() => { this.timeToTrack = ""; this.timePanel = false; })
                .then(() => this.bus.send('loadTasks'));
        },

        getField(name, asArray) {
            let value = _.chain(this.field).find({ name: name }).get('value').value()

            if (!asArray && _.isArray(value)) {
                value = _.get(value, 0);
            }

            return value;
        }
    },

    computed: {
        summary: function() {
            return this.getField('summary');
        },

        issueURL: function() {
            return this.YT.baseURL + "/issue/" + this.id;
        },

        isStarted: function() {
            return this.getField('Timer')  == 'Start';
        },

        isResolved: function() {
            return this.getField('resolved') !== undefined;
        },

        assignee: function() {
            return _.get(this.getField('Assignee'), 'fullName')
        },

        state: function() {
            return this.getField('State');
        },

        spent: function() {
            let totalTimeSpent = 0;

            if (this.isStarted) {
                let timerTime = parseInt(this.getField('Timer time'));
                let now = new Date().getTime();
                return Math.round((now - timerTime) / 1000 / 60);
            }
            else {
                let timeSpent = parseInt(this.getField('Time Spent'));
                return timeSpent || 0;
            }
        },

        fixVersions: function() {
            return this.getField('Fix versions', true);
        },

        priority: function() {
            let field = _.find(this.field, { name: 'Priority' });

            if (field) {
                return { value: field.value[0], valueShort: field.value[0][0], color: field.color, id: _.toLower(field.valueId[0]) };
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

        color: function(color) {
            let fallback = (value) => value ? value : 'transparent';

            return [
                'color:' + fallback(color.fg),
                'border-color:' + fallback(color.fg),
                'background:' + fallback(color.bg)
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
    border-radius: 3px;
    background: rgba(214, 214, 214, 0.32);
    padding: 0 5px;
    min-width: 20px;
    height: 16px;
    text-align: center;
    white-space: nowrap;
    -webkit-box-pack: center;
    -webkit-box-align: center;
    display: -webkit-inline-box;
    vertical-align: middle;
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

.show-stopper {
    border: 1px solid;
}

.time-panel {
    position: absolute;
    z-index: 2;
    top: 25px;
    padding: 5px;
    border-radius: 3px;
    box-shadow: 0 0 3px rgba(0,0,0,0.5);
    background: white;
    left: -40px;
    width: 110px;
}
</style>
