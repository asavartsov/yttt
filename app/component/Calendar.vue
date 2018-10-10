<template>
    <div class="container calendar">

        <div class="theme-default" v-if="dayView">
            <div class="cv-header">
                <div class="cv-header-nav btn-group btn-group-xs">
                    <button class="btn btn-default" type="button" @click="showMonthView">
                        <span class="glyphicon glyphicon-chevron-left"></span>
                        {{$l10n('calendarMonth')}}
                    </button>
                </div>
                <div class="periodLabel">{{dayViewDate.toDateString()}}</div>
            </div>
        </div>

        <div class="form-group">
            <div v-if="dayView">
                <table class="table table-hover table-bordered">
                    <thead>
                        <tr>
                            <th>{{$l10n('calendarTask')}}</th>
                            <th>{{$l10n('calendarTime')}}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(event, idx) in dayViewEvents" :key="idx">
                            <td><a :href="event.url" target="_blank">{{event.taskId}}</a> {{event.summary}}</td>
                            <td>{{youtrackMinutes(event.duration)}}</td>
                        </tr>
                        <tr>
                            <td><b>{{$l10n('calendarTotal')}}</b></td>
                            <td><b>{{youtrackMinutes(dayTotal)}}</b></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <calendar-view
                class="theme-default"
                :show-date="today"
                :startingDayOfWeek="1"
                :events="monthViewEvents"
                :disableFuture="true"
                @click-event="showDayView"
                v-else>
                <calendar-view-header-bootstrap
                    slot="header"
                    slot-scope="t"
                    :header-props="t.headerProps"
                    @input="setCalendarDate" />
            </calendar-view>
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
import { CalendarView, CalendarViewHeader }  from "vue-simple-calendar"
import CalendarViewHeaderBootstrap from './CalendarViewHeaderBootstrap.vue'

export default {
    inject: ['YT', 'bus'],

    components: {
        CalendarView,
		CalendarViewHeaderBootstrap,
        VueBootstrapTypeahead
    },

    data() {
        return {
            users: [],
            today: new Date(),
            dayViewDate: null,
            dayView: false,
            username: "",
            monthViewEvents: [],
            dayViewEvents: [],
            allEvents: [],
            total: 0,
            dayTotal: 0,
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
                this.tasks = this.tasks.concat(tasksWithTime);
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

                    this.workitems = this.workitems.concat(workitems);

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
                        let summary = this.truncateString(this.getField(task, 'summary'), 50);

                        return {
                            day: item.day,
                            taskId: taskId,
                            summary: summary,
                            url: this.YT.baseURL + '/issue/' + taskId,
                            duration: item.duration
                        };
                    });

                    this.showMonthView();
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

        setCalendarDate(date) {
            this.today = date;
        },

        showDayView(dateOrEvent) {
            let day = (dateOrEvent instanceof Date) ? dateOrEvent : dateOrEvent.startDate;

            this.dayView = true;
            this.dayViewDate = day;
            this.dayViewEvents = this.allEvents.filter(e => e.day.getTime() == day.getTime());
            this.dayTotal = _.sumBy(this.dayViewEvents, 'duration');
        },

        showMonthView() {
            this.dayViewEvents = [];
            this.dayView = false;
        },

        youtrackMonth(date) {
            return date.getFullYear() + '-'  + ("0" + (date.getMonth() + 1)).slice(-2);
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

        truncateString(text, max) {
            return text.substr(0, max - 1) + (text.length > max ? '...' : '');
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
    @import url('../../node_modules/vue-simple-calendar/static/css/default.css');

    .container {
        margin: 15px 0;
    }

    .vbt-autcomplete-list {
        max-height: 250px !important;
    }

    .calendar .vbt-autcomplete-list {
        bottom: 20px;
    }

    .container > .input-group:first-child {
        margin-bottom: 15px;
    }

    .container > .input-group:last-child {
        margin-top: 15px;
    }

    .container .pointer {
        cursor: pointer;
    }

    .theme-default .cv-day.past,
    .theme-default .cv-day.future {
        background-color: white;
    }

    .theme-default .cv-day.outsideOfMonth {
        background: whitesmoke;
        color: #dadada;
    }

    .checkbox-addon input,
    .checkbox-addon label {
        font-weight: normal;
        margin: 0;
        vertical-align: middle;
    }
</style>
