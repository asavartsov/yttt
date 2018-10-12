<template>
    <table class="table table-hover table-bordered">
        <thead>
            <tr>
                <th>{{$l10n('calendarTask')}}</th>
                <th>{{$l10n('calendarTime')}}</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(event, idx) in taskViewEvents" :key="idx">
                <td><a :href="event.url" target="_blank">{{event.taskId}}</a> {{event.summary | truncate(truncateLength)}}</td>
                <td>{{youtrackMinutes(event.duration)}}</td>
            </tr>
            <tr>
                <td><b>{{$l10n('calendarTotal')}}</b></td>
                <td><b>{{youtrackMinutes(taskViewEventsTotal)}}</b></td>
            </tr>
        </tbody>
    </table>
</template>

<script>
import _ from 'lodash'
import L10n from './L10n'

export default {
    components: {
    },

    props: ['taskViewEvents', 'taskViewEventsTotal', 'truncateLength'],

    data() {
        return {
        }
    },

    mounted() {
    },

    methods: {
        youtrackMinutes: function(m) {
            var hours = parseInt(m / 60);
            return ((hours > 0) ? hours + L10n.l10n('h') : '') + m % 60 + L10n.l10n('m')
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

</style>
