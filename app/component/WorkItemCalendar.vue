<template>
    <div class="work-item-calendar">
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
                        <td><a :href="event.url" target="_blank">{{event.taskId}}</a> {{event.summary | truncate(50)}}</td>
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
            :show-date="showDate"
            :startingDayOfWeek="1"
            :events="monthViewEvents"
            :disableFuture="true"
            @click-event="showDayView"
            v-else>
            <calendar-view-header-bootstrap
                v-if="showHeader"
                slot="header"
                slot-scope="t"
                :header-props="t.headerProps"
                @input="setCalendarDate" />
        </calendar-view>
    </div>
</template>

<script>
import _ from 'lodash'
import L10n from './L10n'
import { CalendarView, CalendarViewHeader }  from "vue-simple-calendar"
import CalendarViewHeaderBootstrap from './CalendarViewHeaderBootstrap.vue'

export default {
    components: {
        CalendarView,
		CalendarViewHeaderBootstrap,
    },

    props: ['initialDate', 'monthViewEvents', 'allEvents', 'tasks', 'showHeader'],

    data() {
        return {
            dayView: false,
            showDate: new Date(),
            dayViewDate: null,
            dayViewEvents: [],
            dayTotal: 0
        }
    },

    mounted() {
        if (this.initialDate) {
            this.showDate = this.initialDate;
        }

        this.dayView = !!this.dayViewMode;
    },

    methods: {
        setCalendarDate(date) {
            this.showDate = date;
            this.$emit('dateChanged', date);
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

        youtrackMinutes: function(m) {
            var hours = parseInt(m / 60);
            return ((hours > 0) ? hours + L10n.l10n('h') : '') + m % 60 + L10n.l10n('m')
        }
    },

    watch: {
        monthViewEvents: function() {
            this.showMonthView();
        }
    },

    filters: {
        truncate(text, max) {
            return text.substr(0, max - 1) + (text.length > max ? '...' : '');
        }
    }
}
</script>

<style lang="css">
    @import url('../../node_modules/vue-simple-calendar/static/css/default.css');

    .work-item-calendar .pointer {
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
</style>
