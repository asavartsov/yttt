import axios from 'axios'
import qs from 'qs'

export default class YT {
    constructor(baseURL) {
        this.api = axios.create({
            baseURL: baseURL + "/rest"
        });
    }

    getTasks(filter) {
        return this.api.get("issue?" + qs.stringify({max: 100, filter: filter})).then(r => r.data.issue);
    }

    taskCommand(id, command, comment) {
        let data = { command: command };

        if (comment) {
            data.comment = comment;
        }

        return this.api.post("issue/" + id + "/execute", qs.stringify(data));
    }

    getTaskCount(filter) {
        return this.api.get("issue/count?" + qs.stringify({filter: filter})).then(r => r.data.value);
    }
}