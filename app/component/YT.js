import axios from 'axios'
import qs from 'qs'

export default class YT {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.api = axios.create();
    }

    putIssue(project, summary, description) {
        let data = {
            project: project,
            summary: summary,
            description: description
        };

        return this.api
            .put("rest/issue", qs.stringify(data), {baseURL: this.baseURL})
            .then(r => r.headers.location.match(/[^\/]+$/)[0]);
    }

    getProjects() {
        return this.api
            .get("rest/project/all", {baseURL: this.baseURL})
            .then(r => r.data);
    }

    getTasks(filter) {
        return this.api
            .get("rest/issue?" + qs.stringify({max: 100, filter: filter}), {baseURL: this.baseURL})
            .then(r => r.data.issue);
    }

    taskCommand(id, command, comment) {
        let data = { command: command };

        if (comment) {
            data.comment = comment;
        }

        return this.api
            .post("rest/issue/" + id + "/execute", qs.stringify(data), {baseURL: this.baseURL});
    }

    getTaskCount(filter) {
        return this.api
            .get("rest/issue/count?" + qs.stringify({filter: filter}), {baseURL: this.baseURL})
            .then(r => r.data.value);
    }
}