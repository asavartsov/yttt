import _ from 'lodash'

export default class Messaging {
    constructor() {
        this.subscriptions = [];
        this.globals = {};

        chrome.runtime.onMessage.addListener(message => {
            let action = _.get(message, 'action');
            _(this.subscriptions).filter({action: action}).each(subscription => subscription.callback(message));
        });
    }

    send(action, data) {
        chrome.runtime.sendMessage(_.extend({action: action}, data));
    }

    subscribe(action, callback) {
        this.subscriptions.push({action: action, callback: callback});
    }

    setGlobal(key, value) {
        return _.set(this.globals, key, value);
    }

    getGlobal(key) {
        return _.get(this.globals, key);
    }
}