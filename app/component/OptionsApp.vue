<template>
<div>
    <form class="form-horizontal">
        <div class="form-group">
            <div class="col-sm-12">
                <label>{{$l10n('optionsYTAddress')}}</label>
                <input type="text" class="form-control" v-model="options.baseURL" :placeholder="$l10n('youtrackExample')">
            </div>
        </div>
        <h2>{{$l10n('optionsFilterTabs')}}</h2>
        <div v-for="(filter, idx) in options.filters" :key="idx" class="form-group">
            <div class="col-sm-3">
                <input type="text" class="form-control" v-model="filter.title" :placeholder="$l10n('optionsTitle')">
            </div>
            <div class="col-sm-8 input-group">
                <input type="text" class="form-control" v-model="filter.filter" :placeholder="$l10n('optionsFilter')">
                <div class="input-group-btn">
                    <button type="button" class="btn btn-danger" @click="removeFilter(idx)" :disabled="idx == 0"><span class="glyphicon glyphicon-minus"></span></button>
                </div>
            </div>
        </div>
        <div class="form-group">
            <div class="col-sm-12">
                <label>
                    <input type="checkbox" v-model="options.changeTaskState">
                    {{$l10n('optionsChangeTaskState')}}
                </label>
            </div>
        </div>
        <button type="button" class="btn btn-primary" @click="save">{{$l10n('optionsSave')}}</button>
        <button type="button" class="btn btn-default" @click="addFilter">{{$l10n('optionsAddFilterTab')}}</button>
    </form>
</div>
</template>

<script>
import _ from 'lodash'
import Store from './Store'

export default {
    data() {
        return {
            options: {}
        }
    },

    mounted() {
        this.store = new Store();
        this.store.loadOptions(options => this.options = options);
    },

    methods: {
        save() {
            this.options.baseURL = this.options.baseURL.replace(/\/$/, '');
            this.store.saveOptions(this.options, () => window.close());
        },

        addFilter() {
            this.options.filters = _.union(this.options.filters, [{title: "", filter: ""}])
        },

        removeFilter(idx) {
            this.options.filters.splice(idx, 1);
        }
    }
}
</script>

<style lang="css">
</style>
