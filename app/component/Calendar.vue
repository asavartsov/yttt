<template>
    <div class="container calendar">
        <div class="form-group">
            <work-item-calendar
                :show-header="true"
                :initialDate="today"
                :monthViewEvents="monthViewEvents"
                :allEvents="allEvents"
                :tasks="tasks"
                @dateChanged="(date) => this.today = date" >
            </work-item-calendar>
        </div>

        <div class="form-group" v-if="loading">
            <div class="progress">
                <div class="progress-bar" :class="{'progress-bar-striped': tasksTotal == 0, active: tasksTotal == 0}" role="progressbar" :style="{width: progress + '%'}">
                    <span v-if='tasksTotal == 0'>{{$l10n('calendarLoadingTaskCount')}}</span>
                    <span v-else>{{tasksProcessed}}/{{tasksTotal}}</span>
                </div>
            </div>
        </div>

        <div class="input-group user-search">
            <span class="input-group-addon"><b>{{$l10n('calendarTotal')}}: {{youtrackMinutes(total)}}</b></span>

            <vue-bootstrap-typeahead
                v-model="username"
                :data="users"
                :placeholder="this.username || $l10n('calendarUser')"
                :minMatchingChars="1" />

            <span class="input-group-addon checkbox-addon">
                <input type="checkbox" id="assignedOnly" v-model="assignedOnly" :disabled="loading">
                <label for="assignedOnly">{{$l10n('calendarAssignedOnly')}}</label>
            </span>
            <span class="input-group-btn">
                <button class="btn btn-default" type="button" @click="openTimeReport" v-if="isAdmin" :title="$l10n('timeReports')">
                    <span class="glyphicon glyphicon-stats"></span>
                </button>
                <button class="btn btn-primary" type="button" @click="loadWorkItems" :disabled="!username || loading">{{$l10n('calendarLoad')}}</button>
            </span>
        </div>
    </div>
</template>

<script>
import _ from 'lodash'
import L10n from './L10n'
import Store from './Store'
import VueBootstrapTypeahead from 'vue-bootstrap-typeahead'
import WorkItemCalendar from './WorkItemCalendar.vue';

export default {
    inject: ['YT', 'bus'],

    components: {
        WorkItemCalendar,
        VueBootstrapTypeahead
    },

    data() {
        return {
            users: [],
            isAdmin: false,
            today: new Date(),
            username: "",
            monthViewEvents: [],
            dayViewEvents: [],
            allEvents: [],
            total: 0,
            error: false,
            loading: false,
            assignedOnly: true,
            tasks: [],
            workitems: [],
            tasksTotal: 0,
            tasksProcessed: 0
        }
    },

    mounted() {
        this.store = new Store();
        this.store.loadByKey('_calendarUser', value => this.username = value);
        this.store.loadByKey('_calendarAssignedOnly', value => this.assignedOnly = value);
        this.$el.querySelectorAll('.user-search .input-group').forEach(e => e.classList.remove('input-group'));
    },

    methods: {
        load() {
            if (!this.username) {
                this.YT.getCurrentUser().then(user => this.username = user.login);
            }

            this.YT.getUserGroups().then(() => this.isAdmin = true)
        },

        openTimeReport() {
            chrome.tabs.create({ url: chrome.runtime.getURL("pages/calendar.html") });
        },

        getFilter() {
            let period = this.youtrackMonth(this.today);
            return `${this.assignedOnly ? '#' + this.username : ''} updated: ${period} .. ${this.youtrackMonth(new Date())}`;
        },

        loadItems(after) {
            let tasksLoaded = false;

            this.tasksProcessed = after;

            this.YT.getTasks(this.getFilter(), {max: 100, after: after}).then(tasks => {
                tasksLoaded = tasks.length > 0;
                let tasksWithTime = tasks.filter(t => this.getField(t, "Time Spent"));
                this.tasks = _.uniqBy(this.tasks.concat(tasksWithTime), 'id');
                return Promise.all(tasksWithTime.map(t => this.YT.getWorkItems(t.id)).map(p => p.catch(e => [])));
            }).then(work => {
                if (tasksLoaded) {
                    let monthStart = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
                    let monthEnd = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 1);

                    let workitems = _.chain(work)
                        .flatten()
                        .each(item => {
                            let date = new Date(item.date);
                            item.day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        })
                        .filter(item => item.author.login == this.username && _.inRange(item.day, monthStart, monthEnd))
                        .value();

                    this.workitems = _.uniqBy(this.workitems.concat(workitems), 'id');

                    this.monthViewEvents = _.chain(this.workitems)
                        .groupBy('day')
                        .map((v, k) => {
                            let duration = _.sumBy(v, 'duration');
                            return { id: k, startDate: new Date(k), title: this.youtrackMinutes(duration), classes: 'pointer' };
                        })
                        .value();

                    this.total = _.sumBy(this.workitems, 'duration');

                    setTimeout(() => this.loadItems(after + 100), 0);
                }
                else {
                    this.allEvents = this.workitems.map(item => {
                        let taskId = item.url.match(/rest\/issue\/([\w-]+)\//)[1];
                        let task = _.find(this.tasks, {id: taskId});
                        let summary = this.getField(task, 'summary');

                        return {
                            day: item.day,
                            taskId: taskId,
                            summary: summary,
                            url: this.YT.baseURL + '/issue/' + taskId,
                            duration: item.duration
                        };
                    });

                    this.loading = false;
                }
            })
        },

        loadWorkItems() {
            this.store.saveByKey('_calendarUser', this.username);
            this.store.saveByKey('_calendarAssignedOnly', this.assignedOnly);

            this.loading = true;
            this.total = 0;
            this.dayTotal = 0;
            this.monthViewEvents = [];
            this.tasks = [];
            this.workitems = [];
            this.tasksTotal = 0;
            this.tasksProcessed = 0;

            this.YT.getTaskCount(this.getFilter()).then(count => this.tasksTotal = count).then(() => this.loadItems(0));
        },

        youtrackMonth(date) {
            return date.getFullYear() + '-' + _.padStart(date.getMonth() + 1, 2, 0);
        },

        youtrackMinutes: function(m) {
            var hours = parseInt(m / 60);
            return ((hours > 0) ? hours + L10n.l10n('h') : '') + m % 60 + L10n.l10n('m')
        },

        getField(task, name, asArray) {
            let value = _.chain(task.field).find({ name: name }).get('value').value()

            if (!asArray && _.isArray(value)) {
                value = _.get(value, 0);
            }

            return value;
        },

        getUsers(query) {
            this.YT.getAllUsers(query).then(users => this.users = _.map(users, 'login'));
        }
    },

    watch: {
        username: _.debounce(function(query) { this.getUsers(query) }, 200)
    },

    computed: {
       progress: function() {
           return this.tasksTotal == 0 ? 100 : (this.tasksProcessed/this.tasksTotal) * 100;
       }
    },

    filters: {

    }
}
</script>

<style lang="css">
    .container {
        margin: 15px 0;
    }

    .calendar .vbt-autcomplete-list {
        max-height: 250px !important;
        bottom: 20px;
    }

    .checkbox-addon input,
    .checkbox-addon label {
        font-weight: normal;
        margin: 0;
        vertical-align: middle;
    }

    .checkbox-addon label {
        user-select: none;
    }
</style>
