<template>
    <div class="container">
        <form>
            <div class="form-group new-task-project">
                <label>{{$l10n('newTaskProject')}}</label>
                <vue-bootstrap-typeahead
                    v-model="projectSearch"
                    :data="projects"
                    :placeholder="this.projectName(this.project) || $l10n('newTaskProject')"
                    :serializer="s => projectName(s)"
                    @hit="project = $event"
                    :minMatchingChars="1"
                    :maxMatches="400" />
            </div>
            <div class="form-group">
                <label>{{$l10n('newTaskSummary')}}</label>
                <input type="text" class="form-control" v-model="summary" :placeholder="$l10n('newTaskSummary')">
            </div>
            <div class="form-group">
                <label>{{$l10n('newTaskDescription')}}</label>
                <textarea class="form-control" rows="5" v-model="description" :placeholder="$l10n('newTaskDescription')"></textarea>
            </div>
            <div v-if="lastTaskId" class="alert alert-info">
                <p>{{$l10n('taskAdded')}} <a :href="this.YT.baseURL + '/issue/' + this.lastTaskId" target="_blank">{{this.lastTaskId}}</a></p>
            </div>
            <div v-if="error" class="alert alert-danger">
                <p>{{$l10n('taskError')}}</p>
            </div>
            <div class="row">
                <div class="col-xs-7">
                    <button type="button" class="btn btn-primary" @click="saveAndStart" :disabled="!(project && summary)">{{$l10n('newTaskSaveAndStart')}}</button>
                    <button type="button" class="btn btn-default" @click="save" :disabled="!(project && summary)">{{$l10n('newTaskSave')}}</button>
                </div>
                <div class="col-xs-5">
                    <div class="input-group">
                        <input type="text" class="form-control" :placeholder="$l10n('newTaskTime')" v-model="timeToTrack" @keyup.enter="saveAndTrack">
                        <span class="input-group-btn">
                            <button class="btn btn-default" type="button" @click="saveAndTrack" :disabled="!timeToTrack">{{$l10n('newTaskAddTrack')}}</button>
                        </span>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<script>
import _ from 'lodash'
import L10n from './L10n'
import Store from './Store'
import VueBootstrapTypeahead from 'vue-bootstrap-typeahead'

export default {
    inject: ['YT', 'bus'],

    components: {
        VueBootstrapTypeahead
    },

    data() {
        return {
            error: false,
            lastTaskId: "",
            timeToTrack: "",
            summary: "",
            description: "",
            projectSearch: "",
            project: "",
            projects: []
        }
    },

    mounted() {
        this.store = new Store();
        this.store.loadByKey('_projectForNewTask', project => this.project = project);
        this.$el.querySelectorAll('.new-task-project .input-group').forEach(e => e.classList.remove('input-group'));
    },

    methods: {
        saveAction() {
            this.error = false;
            this.store.saveByKey('_projectForNewTask', this.project);

            return this.YT.putIssue(this.project.shortName, this.summary, this.description)
                .then(task => this.lastTaskId = task)
                .then(() => this.YT.taskCommand(this.lastTaskId, "assignee me"));
        },

        saveAfter() {
            this.bus.send('loadTasks');
            this.clearForm();
        },

        save() {
            this.saveAction()
                .then(() => this.saveAfter())
                .catch(_ => this.error = true);
        },

        saveAndStart() {
            return this.saveAction()
                .then(() => this.YT.taskCommand(this.lastTaskId, "state In Progress"))
                .then(() => this.YT.taskCommand(this.lastTaskId, "Timer Start"))
                .then(() => this.saveAfter())
                .catch(_ => this.error = true);
        },

        saveAndTrack() {
            return this.saveAction()
                .then(() => this.YT.taskCommand(this.lastTaskId, "work " + this.timeToTrack))
                .then(() => this.saveAfter())
                .catch(_ => this.error = true);
        },

        load() {
            this.clearForm();
            this.YT.getProjects().then(p => this.projects = p);
        },

        clearForm() {
            this.timeToTrack = "";
            this.summary = "";
            this.description = "";
        },

        projectName(project) {
            if (!project) {
                return "";
            }

            if (project.name == project.shortName) {
                return project.name;
            }

            return project.shortName + ' (' + project.name + ')';
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

    .vbt-autcomplete-list {
        max-height: 250px !important;
    }
</style>
