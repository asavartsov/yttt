<template>
    <div>
        <div v-if="taskView">
            <div class="task-view-title-header">
                <button class="btn btn-default btn-xs" @click="showFullView"><span class="glyphicon glyphicon-chevron-left"></span> {{title}}</button>
                <span class="task-view-title">{{taskViewEntity.subTitle}}</span>
            </div>
            <work-item-calendar-tasks-view
                :task-view-events="taskViewEntity.tasks"
                :task-view-events-total="taskViewEntity.duration"
                :truncate-length="500">
            </work-item-calendar-tasks-view>
        </div>
        <table class="table table-hover table-bordered" v-else>
            <thead>
                <tr>
                    <th>{{title}} <span class="task-view-subtitle">{{subTitle}}</span></th>
                    <th>{{youtrackMinutes(total)}}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(entity, idx) in entityViewEvents" :key="idx">
                    <td><a href="#" @click.stop.prevent="showTaskView(entity)">{{entity.subTitle}}</a></td>
                    <td>{{youtrackMinutes(entity.duration)}}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import _ from 'lodash'
import L10n from './L10n'
import WorkItemCalendarTasksView from './WorkItemCalendarTasksView.vue'

export default {
    components: {
        WorkItemCalendarTasksView
    },

    props: ['title', 'subTitle', 'total', 'entityViewEvents'],

    data() {
        return {
            taskViewEntity: '',
            taskView: false
        }
    },

    mounted() {
    },

    methods: {
        showTaskView(entity) {
            this.taskViewEntity = entity;
            this.taskView = true;
        },

        showFullView() {
            this.taskView = false;
        },

        youtrackMinutes: function(m) {
            var hours = parseInt(m / 60);
            return ((hours > 0) ? hours + L10n.l10n('h') : '') + m % 60 + L10n.l10n('m')
        }
    }
}
</script>

<style lang="css">
    .task-view-title-header {
        padding: 8px;
        font-weight: bold;
        border: 1px solid #ddd;
        background: #ececec;
    }

    .task-view-title {
        padding-left: 10px;
        vertical-align: middle;
    }

    .task-view-subtitle {
        font-weight: normal;
        color: #444;
    }
</style>
