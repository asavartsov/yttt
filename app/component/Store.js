let _defaults = { 
    baseURL: "http://ticket.infolan.org",
    filters: [
        {
            title: "My Tasks",
            filter: "assignee: me -Resolved sort by: updated"
        }
    ]
};

import Messaging from './Messaging'

export default class Store {
    constructor() {
        this.bus = new Messaging();
    }

    loadOptions(cb) {
        chrome.storage.sync.get(_defaults, cb);
    }

    saveOptions(options) {
        chrome.storage.sync.set(options, () => this.bus.send('optionsSaved', options));
    }

    loadTasks(key, cb) {
        chrome.storage.local.get(key, cb);
    }

    saveTasks(key, tasks, cb) {
        chrome.storage.local.set(_.set({}, key, tasks), cb);
    }
}