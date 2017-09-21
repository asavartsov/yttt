<template>
<div>
    <h1>{{'options' | l10n}}</h1>
    <form class="form-horizontal">
        <div class="form-group">
            <div class="col-sm-12">
                <label>{{'optionsYTAddress' | l10n}}</label>
                <input type="text" class="form-control" v-model="options.baseURL" placeholder="http://youtrack.corp.com">
            </div>
        </div>
        <h2>{{'optionsFilterTabs' | l10n}}</h2>
        <div v-for="(filter, idx) in options.filters" :key="idx" class="form-group">
            <div class="col-sm-6">
                <input type="text" class="form-control" v-model="filter.title" :placeholder="'optionsTitle' | l10n">
            </div> 
            <div class="col-sm-6 input-group">
                <input type="text" class="form-control" v-model="filter.filter" :placeholder="'optionsFilter' | l10n">
                <div class="input-group-btn">
                    <button type="button" class="btn btn-danger" @click="removeFilter(idx)" v-if="canRemoveFilter"><span class="glyphicon glyphicon-minus"></span></button>
                </div>
            </div>
        </div>
        <button type="button" class="btn btn-primary" @click="save">{{'optionsSave' | l10n}}</button>
        <button type="button" class="btn btn-default" @click="addFilter">{{'optionsAddFilterTab' | l10n}}</button>
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
        this.store.loadOptions(o => this.options = o);
    },

    methods: {
        save() {
            this.options.baseURL = this.options.baseURL.replace(/\/$/, '');
            this.store.saveOptions(this.options);
        },

        addFilter() {
            this.options.filters = _.union(this.options.filters, [{title: "", filter: ""}])
        },

        removeFilter(idx) {
            this.options.filters.splice(idx, 1);
        }
    },

    computed: {
        canRemoveFilter: function() {
            return _.get(this.options, 'filters.length') > 1;
        }
    }
}
</script>

<style lang="css">
</style>
