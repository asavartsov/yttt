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