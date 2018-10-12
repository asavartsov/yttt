<template>
<div v-if="loaded" class="time-reports">
    <h1>Time Reports</h1>
    <div class="form-group input-group typeahead-group">
        <span class="input-group-addon">User Group</span>
        <vue-bootstrap-typeahead
            @hit="loadUsers($event.name)"
            :data="groups"
            :serializer="s => s.name"
            v-model="selectedGroup"
            :placeholder="selectedGroup || 'User Group'"
            :maxMatches='50'
            :minMatchingChars='1'></vue-bootstrap-typeahead>
        <span class="input-group-addon">Month</span>
        <datepicker format="MMM yyyy" v-model="today" input-class="form-control" :minimumView="'month'" :maximumView="'month'"></datepicker>
        <span class="input-group-btn">
            <button class="btn btn-primary" @click="load" :disabled="loading || (users.length == 0)">Load Report</button>
            <button class="btn btn-default" @click="exportCSV" :disabled="loading || (workitems.length == 0)">CSV</button>
        </span>
    </div>

    <div class="form-group" v-if="loading">
        <div class="progress">
            <div class="progress-bar" :class="{'progress-bar-striped': tasksTotal == 0, active: tasksTotal == 0}" role="progressbar" :style="{width: progress + '%'}">
                <span v-if='tasksTotal == 0'>{{$l10n('calendarLoadingTaskCount')}}</span>
                <span v-else>{{tasksProcessed}}/{{tasksTotal}}</span>
            </div>
        </div>
    </div>

    <vue-tabs v-if="workitems.length > 0">
        <v-tab title="Projects">
            <div v-for="(item, idx) in workitemsByProject" :key="'project-' + idx">
                <table class="table table-hover table-bordered">
                    <thead>
                        <tr>
                            <th>{{item.project}}</th>
                            <th>{{youtrackMinutes(item.total)}}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(user, idx) in item.userViewEvents" :key="'project-user-' + idx">
                            <td>{{user.username}}</td>
                            <td>{{user.duration}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </v-tab>

        <v-tab title="Users">
            <div v-for="(item, idx) in workitemsByUser" :key="'user-' + idx">
                <table class="table table-hover table-bordered">
                    <thead>
                        <tr>
                            <th>{{item.username}}</th>
                            <th>{{youtrackMinutes(item.total)}}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(project, idx) in item.projectViewEvents" :key="'user-project-' + idx">
                            <td>{{project.project}}</td>
                            <td>{{project.duration}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </v-tab>

        <v-tab title="Calendars">
            <div v-for="(item, idx) in workitemsByUser" :key="'calendar' + idx" class="user-calendar">
                <div class="calendar-header">{{item.username}}</div>

                <work-item-calendar
                    :initialDate="today"
                    :monthViewEvents="item.monthViewEvents"
                    :allEvents="item.allEvents"
                    :tasks="tasks">
                </work-item-calendar>
            </div>
        </v-tab>
    </vue-tabs>
</div>
</template>

<script>
import VueBootstrapTypeahead from 'vue-bootstrap-typeahead'
import WorkItemCalendar from './WorkItemCalendar.vue'
import Store from './Store'
import L10n from './L10n'
import moment from 'moment'
import { VueTabs, VTab } from 'vue-nav-tabs'
import Datepicker from 'vuejs-datepicker'
import papaparse from 'papaparse'

export default {
    data() {
        return {
            groups: [],
            users: [],
            workitemsByUser: [],
            workitemsByProject: [],
            tasks: [],
            today: new Date(),
            workitems: [],
            loaded: false,
            loading: false,
            tasksLoaded: 0,
            tasksProcessed: 0,
            tasksTotal: 0,
            selectedGroup: ''
        }
    },

    inject: ['YT'],

    components: {
        VueBootstrapTypeahead,
        WorkItemCalendar,
        Datepicker,
        VueTabs,
        VTab
    },

    methods: {
        loadUsers(group) {
            this.store.saveByKey('_timeReportGroup', group);
            this.YT.getAllUsersInGroup(group).then(users => this.users = _.map(users, 'login'));
        },

        getFilter() {
            let period = this.youtrackMonth(this.today);
            return `${this.assignedOnly ? '#' + this.username : ''} updated: ${period} .. ${this.youtrackMonth(new Date())}`;
        },

        processWorkItems() {
            let users = _.groupBy(this.workitems, 'username');

            this.workitemsByUser = _.chain(users).map((workitems, username) => {
                let monthViewEvents = _.chain(workitems)
                    .groupBy('day')
                    .map((v, k) => {
                        let duration = _.sumBy(v, 'duration');
                        return { id: k, startDate: new Date(k), title: this.youtrackMinutes(duration), classes: 'pointer' };
                    })
                    .value();

                let projectViewEvents = _.chain(workitems)
                    .groupBy('project')
                    .map((v, k) => {
                        let duration = _.sumBy(v, 'duration');
                        return { project: k, duration: this.youtrackMinutes(duration) };
                    })
                    .sortBy('project')
                    .value();

                let total = _.sumBy(workitems, 'duration');

                return {
                    username: username,
                    monthViewEvents: monthViewEvents,
                    allEvents: workitems,
                    projectViewEvents: projectViewEvents,
                    total: total
                };
            })
            .sortBy('username')
            .value();

            let projects = _.groupBy(this.workitems, 'project');

            this.workitemsByProject = _.chain(projects).map((workitems, project) => {
                let userViewEvents = _.chain(workitems)
                    .groupBy('username')
                    .map((v, k) => {
                        let duration = _.sumBy(v, 'duration');
                        return { username: k, duration: this.youtrackMinutes(duration) };
                    })
                    .sortBy('username')
                    .value();

                let total = _.sumBy(workitems, 'duration');

                return {
                    project: project,
                    userViewEvents: userViewEvents,
                    allEvents: workitems,
                    total: total
                };
            })
            .sortBy('project')
            .value();
        },

        loadTasks(after) {
            let tasksLoaded = false;
            this.tasksProcessed = after;

            let monthStart = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
            let monthEnd = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 1);

            this.YT.getTasks(this.getFilter(), {max: 100, after: after}).then(tasks => {
                tasksLoaded = tasks.length > 0;
                let tasksWithTime = tasks.filter(t => this.getField(t, "Time Spent"));
                this.tasks = this.tasks.concat(tasksWithTime);
                return Promise.all(tasksWithTime.map(t => this.YT.getWorkItems(t.id)).map(p => p.catch(e => [])));
            }).then(work => {
                if (tasksLoaded) {
                    let workitems = _.chain(work)
                        .flatten()
                        .each(item => {
                            let date = new Date(item.date);
                            item.day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        })
                        .filter(item => _.includes(this.users, item.author.login) && _.inRange(item.day, monthStart, monthEnd))
                        .map(item => {
                            let taskId = item.url.match(/rest\/issue\/([\w-]+)\//)[1];
                            let task = _.find(this.tasks, {id: taskId});
                            let summary = this.getField(task, 'summary');

                            return {
                                id: item.id,
                                username: _.get(item, 'author.login'),
                                day: item.day,
                                taskId: taskId,
                                summary: summary,
                                url: this.YT.baseURL + '/issue/' + taskId,
                                duration: item.duration,
                                project: _.get(taskId.match(/(.*)-\d+$/), 1)
                            };
                        })
                        .value();

                    this.workitems = this.workitems.concat(workitems);
                    this.processWorkItems();
                    setTimeout(() => this.loadTasks(after + 100), 0);
                }
                else {
                    this.tasks = _.uniqBy(this.tasks, 'id');
                    this.workitems = _.uniqBy(this.workitems, 'id');

                    this.processWorkItems();
                    this.loading = false;
                }
            });
        },

        load() {
            this.loading = true;
            this.tasksLoaded = 0;
            this.tasksProcessed = 0;
            this.tasks = [];
            this.workitems = [];
            this.workitemsByUser = [];
            this.tasksTotal = 0;

            this.YT.getTaskCount(this.getFilter()).then(count => this.tasksTotal = count).then(() => this.loadTasks(0));
        },

        exportCSV() {
            let csv = papaparse.unparse(_.map(this.workitems, o => _.extend({}, o, {day: this.excelDate(o.day)})));

            let filename = _.chain(this.selectedGroup)
                .truncate(30, {omission: ''})
                .kebabCase()
                .value() + '-' + this.youtrackMonth(this.today) + '.csv';

            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

            if (navigator.msSaveBlob) {
                navigator.msSaveBlob(blob, filename);
            } else {
                var link = document.createElement("a");

                if (link.download !== undefined) {
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        },

        excelDate (date) {
            let year = date.getFullYear();
            let month = _.padStart(date.getMonth() + 1, 2, 0);
            let day = _.padStart(date.getDate(), 2, 0);

            return `${year}-${month}-${day}`;
        },

        youtrackMonth(date) {
            return date.getFullYear() + '-'  + _.padStart(date.getMonth() + 1, 2, 0);
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

        _fixTypeahead() {
            this.$el
                .querySelectorAll('.typeahead-group .input-group')
                .forEach(e => e.classList.remove('input-group'));
        }
    },

    mounted() {
        this.store = new Store();

        this.store.loadOptions(options => {
            this.filters = options.filters;
            this.YT.baseURL = options.baseURL;

            this.YT.getUserGroups().then(groups => {
                this.groups = groups;
                this.loaded = true;
                this.$nextTick(() => this._fixTypeahead());
            });
        });

        this.store.loadByKey('_timeReportGroup', group => {
            if (group) {
                this.selectedGroup = group;
                this.loadUsers(group);
            }
        });
    },

    computed: {
       progress: function() {
           return this.tasksTotal == 0 ? 100 : (this.tasksProcessed/this.tasksTotal) * 100;
       }
    },

    watch: {
        selectedMonth: function(m) {
            this.today = m.toDate();
        }
    }
}
</script>

<style lang="css">
    body {
        font-size: 13px;
    }

    .container {
        margin: 0 auto;
    }

    th:last-child {
        width: 125px;
    }

    .vdp-datepicker input[readonly] {
        background: white;
    }

    .vdp-datepicker__calendar {
        top: 36px;
    }

    .vdp-datepicker__calendar .cell {
        border-radius: 4px;
    }

    .time-reports .vbt-autcomplete-list {
        top: 32px;
    }

    .time-reports th,
    .calendar-header {
        background: #ececec;
    }

    .calendar-header {
        padding: 8px;
        font-weight: bold;
        border: 1px solid #ddd;
    }

    .user-calendar {
        margin-bottom: 20px;
    }

    .time-reports .tab-container {
        margin-top: 20px;
    }
</style>
