import axios from 'axios'
import qs from 'qs'
import { resolve } from 'path';
import { rejects } from 'assert';

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

    getTasks(filter, limits, fields) {
        limits = limits || {max: 100, after: 0};
        fields = fields || ['summary', 'Assignee', 'Timer', 'resolved', 'State', 'Timer time', 'Time Spent', 'Fix versions', 'Priority', 'projectShortName'];

        return this.api
            .get("rest/issue?" + qs.stringify({max: limits.max, after: limits.after, filter: filter, with: fields}, {indices: false}), {baseURL: this.baseURL})
            .then(r => r.data.issue);
    }

    getWorkItems(task) {
        return this.api
            .get(`/rest/issue/${task}/timetracking/workitem/`, {baseURL: this.baseURL})
            .then(r => r.data);
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
            .then(r => r.data.value)
            .then(count => {
                if (count >= 0) { return count; }
                return new Promise(resolve => setTimeout(() => resolve(this.getTaskCount(filter)), 200));
            });
    }

    getCurrentUser() {
        return this.api
            .get("rest/user/current", {baseURL: this.baseURL})
            .then(r => r.data);
    }

    getAllUsers(q) {
        return this.api
            .get("rest/admin/user?" + qs.stringify({q: q}), {baseURL: this.baseURL})
            .then(r => r.data);
    }

    getUser(user) {
        return this.api
            .get("rest/admin/user/" + user, {baseURL: this.baseURL})
            .then(r => r.data);
    }

    getAllUsersInGroup(group) {
        return new Promise((resolve, reject) => {
            let users = [];

            let _req = (start) => {
                this.api
                    .get("rest/admin/user?" + qs.stringify({group: group, start: start}), {baseURL: this.baseURL})
                    .then(r => {
                        if (r.data.length > 0) {
                            users = users.concat(r.data);
                            setTimeout(() => _req(start + 10), 0);
                        }
                        else {
                            resolve(_.uniqBy(users, 'login'));
                        }
                    })
                    .catch(e => reject(e));
            };

            _req(0);
        });
    }

    getUserGroups() {
        return this.api
            .get("rest/admin/group", {baseURL: this.baseURL})
            .then(r => r.data);
    }
}