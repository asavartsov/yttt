<template>
<div v-if="loaded || error" class="time-reports">
    <h1>{{$l10n('timeReports')}}</h1>
    <div class="form-group input-group typeahead-group">
        <span class="input-group-addon">{{$l10n('timeReportsUserGroup')}}</span>
        <vue-bootstrap-typeahead
            @hit="loadUsers($event.name)"
            :data="groups"
            :serializer="s => s.name"
            v-model="groupSearch"
            :placeholder="group || $l10n('timeReportsUserGroup')"
            :maxMatches='50'
            :minMatchingChars='1'></vue-bootstrap-typeahead>
        <span class="input-group-addon">{{$l10n('timeReportsMonth')}}</span>
        <datepicker
            format="MMM yyyy"
            v-model="today"
            input-class="form-control"
            :minimumView="'month'"
            :maximumView="'month'"
            :disabled="loading">
        </datepicker>
    </div>

    <div class="input-group form-group">
        <span class="input-group-addon checkbox-addon">
            <input type="checkbox" id="applyFilter" v-model="applyFilter" :disabled="loading">
            <label for="applyFilter">{{$l10n('timeReportsApplyFilter')}}</label>
        </span>
        <input type="text" class="form-control" v-model="filter" :disabled="loading || !applyFilter" :placeholder="$l10n('timeReportsFilter')">
        <span class="input-group-btn">
            <button class="btn btn-primary" @click="load" v-if="!loading || (tasksTotal == 0)" :disabled="loading || (users.length == 0)">{{$l10n('timeReportsLoad')}}</button>
            <button class="btn btn-danger" @click="stop = true" v-if="loading && (tasksTotal > 0)" :disabled="stop">{{$l10n('timeReportsCancel')}}</button>
            <button class="btn btn-default" @click="exportCSV" :disabled="loading || (workitems.length == 0)">{{$l10n('timeReportsCSV')}}</button>
        </span>
    </div>

    <div class="form-group" v-if="loading">
        <div class="progress">
            <div class="progress-bar" :class="{'progress-bar-striped': tasksTotal == 0, active: tasksTotal == 0}" role="progressbar" :style="{width: progress + '%'}">
                <span v-if='users.length == 0'>{{$l10n('timeReportsLoadingUsers')}}</span>
                <span v-else-if='tasksTotal == 0'>{{$l10n('calendarLoadingTaskCount')}}</span>
                <span v-else>{{tasksProcessed}}/{{tasksTotal}}</span>
            </div>
        </div>
    </div>

    <div v-if="error" class="alert alert-danger">
        <p>{{$l10n('loadError')}}</p>
    </div>

    <div v-if="!loading">
        <div v-if="users.length == 0" class="alert alert-warning">
            <p>{{$l10n('timeReportsNoUsers')}}</p>
        </div>
        <div v-else-if="workitems.length == 0" class="alert" :class="{'alert-warning': !showInfo, 'alert-info': showInfo}">
            <p>{{$l10n(showInfo ? 'timeReportsInfo' : 'timeReportsNoWorkitems')}}</p>
            <ul v-if="showInfo">
                <li v-for="user in this.users" :key="user.login">{{user.fullName}} ({{user.login}})</li>
            </ul>
        </div>
    </div>

    <vue-tabs v-if="workitems.length > 0">
        <v-tab :title="$l10n('timeReportsProjects')">
            <div v-for="(item, idx) in workitemsByProject" :key="'project-' + idx">
                <time-report-table-view
                    :title="item.fullName"
                    :sub-title="item.project"
                    :total="item.total"
                    :entity-view-events="item.userViewEvents">
                </time-report-table-view>
            </div>
        </v-tab>

        <v-tab :title="$l10n('timeReportsContracts')">
            <div v-for="(item, idx) in workitemsByContract" :key="'contract-' + idx">
                <time-report-table-view
                    :title="item.contract || $l10n('timeReportsOther')"
                    :total="item.total"
                    :entity-view-events="item.userViewEvents">
                </time-report-table-view>
            </div>
        </v-tab>

        <v-tab :title="$l10n('timeReportsUsers')">
            <div v-for="(item, idx) in workitemsByUser" :key="'user-' + idx">
                <time-report-table-view
                    :title="item.fullName"
                    :sub-title="item.username"
                    :total="item.total"
                    :entity-view-events="item.projectViewEvents">
                </time-report-table-view>

            </div>
        </v-tab>

        <v-tab :title="$l10n('timeReportsCalendars')">
            <div v-for="(item, idx) in workitemsByUser" :key="'calendar' + idx" class="user-calendar">
                <div class="calendar-header" :title="item.username">{{youtrackUserName(item.username)}}</div>

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
import TimeReportTableView from './TimeReportTableView.vue'
import Store from './Store'
import L10n from './L10n'
import moment from 'moment'
import { VueTabs, VTab } from 'vue-nav-tabs'
import Datepicker from 'vuejs-datepicker'
import papaparse from 'papaparse'

export default {
    data() {
        return {
            error: false,
            projects: [],
            groups: [],
            users: [],
            workitemsByUser: [],
            workitemsByProject: [],
            tasks: [],
            today: new Date(),
            workitems: [],
            loaded: false,
            loading: false,
            showInfo: false,
            tasksLoaded: 0,
            tasksProcessed: 0,
            tasksTotal: 0,
            groupSearch: '',
            group: '',
            filter: '',
            applyFilter: false,
            stop: false
        }
    },

    inject: ['YT'],

    components: {
        TimeReportTableView,
        VueBootstrapTypeahead,
        WorkItemCalendar,
        Datepicker,
        VueTabs,
        VTab
    },

    methods: {
        loadUsers(group) {
            if (this.loading) return;

            this.users = [];
            this.group = group;

            if (this.group) {
                this.error = false;
                this.loading = true;
                this.clearWorkitems();

                this.YT
                    .getAllUsersInGroup(this.group)
                    .then(users => Promise.all(users.map(u => this.YT.getUser(u.login))))
                    .then(users => this.users = users)
                    .then(() => this.loading = false)
                    .catch(e => this.error = true);
            }
        },

        getFilter() {
            let period = this.youtrackMonth(this.today);
            return `${this.applyFilter ? this.filter : ''} updated: ${period} .. ${this.youtrackMonth(new Date())}`;
        },

        aggregateTasks(filter) {
            return _.chain(this.workitems)
                .filter(filter)
                .groupBy('taskId')
                .map((v, k) => {
                    let duration = _.sumBy(v, 'duration');
                    let task = _.find(this.tasks, {id: k});
                    let summary = this.getField(task, 'summary');

                    return {
                        taskId: k,
                        username: _.get(filter, 'username'),
                        duration: duration,
                        summary: summary,
                        url: this.YT.baseURL + '/issue/' + k
                    }
                }).value();
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
                        return {
                            title: this.youtrackProjectName(k),
                            subTitle: k,
                            duration: duration,
                            tasks: this.aggregateTasks({username: username, project: k})
                        };
                    })
                    .sortBy('title')
                    .value();

                let total = _.sumBy(workitems, 'duration');

                return {
                    username: username,
                    fullName: this.youtrackUserName(username),
                    monthViewEvents: monthViewEvents,
                    allEvents: workitems,
                    projectViewEvents: projectViewEvents,
                    total: total
                };
            })
            .sortBy('fullName')
            .value();

            let projects = _.groupBy(this.workitems, 'project');

            this.workitemsByProject = _.chain(projects).map((workitems, project) => {
                let userViewEvents = _.chain(workitems)
                    .groupBy('username')
                    .map((v, k) => {
                        let duration = _.sumBy(v, 'duration');
                        return {
                            title: this.youtrackUserName(k),
                            subTitle: k,
                            duration: duration,
                            tasks: this.aggregateTasks({username: k, project: project})
                        };
                    })
                    .sortBy('title')
                    .value();

                let total = _.sumBy(workitems, 'duration');

                return {
                    project: project,
                    fullName: this.youtrackProjectName(project),
                    userViewEvents: userViewEvents,
                    allEvents: workitems,
                    total: total
                };
            })
            .sortBy('fullName')
            .value();

            let contracts = _.groupBy(this.workitems, 'contract');

            this.workitemsByContract = _.chain(contracts).map((workitems, contract) => {
                contract = contract === 'undefined' ? undefined : contract;

                let userViewEvents = _.chain(workitems)
                    .groupBy('username')
                    .map((v, k) => {
                        let duration = _.sumBy(v, 'duration');
                        return {
                            title: this.youtrackUserName(k),
                            subTitle: k,
                            duration: duration,
                            tasks: this.aggregateTasks({username: k, contract: contract})
                        };
                    })
                    .sortBy('title')
                    .value();

                let total = _.sumBy(workitems, 'duration');

                return {
                    contract: contract,
                    fullName: contract,
                    userViewEvents: userViewEvents,
                    allEvents: workitems,
                    total: total
                };
            })
            .sortBy('fullName')
            .value();
        },

        loadTasks(after) {
            let tasksLoaded = false;
            this.tasksProcessed = after;

            let monthStart = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
            let monthEnd = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 1);

            return this.YT.getTasks(this.getFilter(), {max: 100, after: after}).then(tasks => {
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
                        .filter(item => _.find(this.users, {login: item.author.login}) && _.inRange(item.day, monthStart, monthEnd))
                        .map(item => {
                            let taskId = item.url.match(/rest\/issue\/([\w-]+)\//)[1];
                            let task = _.find(this.tasks, {id: taskId});
                            let summary = this.getField(task, 'summary');
                            let contract = this.getField(task, 'Договор');

                            return {
                                id: item.id,
                                username: _.get(item, 'author.login'),
                                day: item.day,
                                taskId: taskId,
                                summary: summary,
                                url: this.YT.baseURL + '/issue/' + taskId,
                                duration: item.duration,
                                project: _.get(taskId.match(/(.*)-\d+$/), 1),
                                contract: contract
                            };
                        })
                        .value();

                    this.workitems = this.workitems.concat(workitems);
                    this.processWorkItems();

                    if (!this.stop) {
                        setTimeout(() => this.loadTasks(after + 100), 0);
                    }
                    else {
                        this.clearWorkitems();
                        this.loading = false;
                    }
                }
                else {
                    this.tasks = _.uniqBy(this.tasks, 'id');
                    this.workitems = _.uniqBy(this.workitems, 'id');

                    this.processWorkItems();
                    this.loading = false;
                    this.showInfo = false;
                }
            });
        },

        clearWorkitems() {
            this.tasksLoaded = 0;
            this.tasksProcessed = 0;
            this.tasks = [];
            this.workitems = [];
            this.workitemsByUser = [];
            this.workitemsByProject = [];
            this.tasksTotal = 0;
            this.showInfo = true;
        },

        load() {
            this.error = false;
            this.stop = false;
            this.loading = true;
            this.clearWorkitems();
            this.store.saveByKey('_timeReportGroup', this.group);
            this.store.saveByKey('_timeReportFilter', this.filter);
            this.store.saveByKey('_timeReportApplyFilter', this.applyFilter);

            this.YT
                .getTaskCount(this.getFilter())
                .then(count => this.tasksTotal = count)
                .then(() => this.loadTasks(0))
                .catch(e => { this.error = true; this.loading = false; });
        },

        exportCSV() {
            let csv = papaparse.unparse(_.map(this.workitems, o => _.extend({}, o, {day: this.excelDate(o.day)})));

            let filename = _.chain(this.group)
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

        youtrackProjectName(shortName) {
            let project = _.find(this.projects, {shortName: shortName});
            return _.get(project, 'name') || shortName;
        },

        youtrackUserName(login) {
            let project = _.find(this.users, {login: login});
            return _.get(project, 'fullName') || login;
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
            this.error = false;

            Promise.all([
                this.YT.getProjects().then(p => this.projects = p),
                this.YT.getUserGroups().then(g => this.groups = g)
            ])
            .then(() => {
                this.loaded = true;
                this.store.loadByKey('_timeReportGroup', v => this.loadUsers(v));
                this.store.loadByKey('_timeReportFilter', v => this.filter = v || '');
                this.store.loadByKey('_timeReportApplyFilter', v => this.applyFilter = !!v);
                this.$nextTick(() => this._fixTypeahead());
            })
            .catch(e => this.error = true);
        });
    },

    computed: {
       progress: function() {
           return this.tasksTotal == 0 ? 100 : (this.tasksProcessed/this.tasksTotal) * 100;
       }
    },

    watch: {
        today: function() {
            this.clearWorkitems();
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

    .vdp-datepicker input.form-control[readonly] {
        background: white;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
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
