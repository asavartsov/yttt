export default class Messaging {
    constructor() {
        this.subscriptions = [];

        chrome.runtime.onMessage.addListener(message => {
            let action = _.get(message, 'action');
            _(this.subscriptions).filter({action: action}).each(s => s.cb(message));
        });
    }

    send(action, data) {
        chrome.runtime.sendMessage(_.extend({action: action}, data));
    }

    subscribe(action, cb) {
        this.subscriptions.push({action: action, cb: cb});
    }
}