import Messaging from './Messaging'
import L10n from './L10n'

let _defaults = {
    baseURL: "http://ticket.infolan.org",
    filters: [
        {
            title: L10n.l10n('myTasks'),
            filter: "assignee: me -Resolved sort by: updated"
        }
    ]
};

export default class Store {
    constructor() {
        this.bus = new Messaging();
    }

    loadOptions(callback) {
        chrome.storage.sync.get(_defaults, callback);
    }

    saveOptions(options) {
        chrome.storage.sync.set(options, () => this.bus.send('optionsSaved', options));
    }

    loadTasks(key, callback) {
        chrome.storage.local.get(key, callback);
    }

    saveTasks(key, tasks, callback) {
        chrome.storage.local.set(_.set({}, key, tasks), callback);
    }

    loadByKey(key, callback) {
        chrome.storage.local.get([key], p => callback(_.get(p, key)));
    }

    saveByKey(key, value) {
        chrome.storage.local.set(_.set({}, key, value));
    }
}