// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly';

import _ from 'lodash';
import options from './options'
import YT from '../component/YT'
import Messaging from '../component/Messaging'

class Background {
  constructor() {
    this.YT = new YT(options.baseURL);
    this.bus = new Messaging();
    this.bus.subscribe('loadTasks', () => this.loadTasks());
    chrome.browserAction.setBadgeBackgroundColor({color: "#f66"});
  }

  loadTasks() {
    _.each(options.filters, (filter, idx) => {
      this.YT.getTasks(filter.filter).then(tasks => {
        let cache = _.set({}, 'tasks' + idx, tasks);
        chrome.storage.local.set(cache);
        this.bus.send('updateTaskList');
        
        if (idx == 0) {
          let active = _.filter(tasks, t => _.chain(t.field).find({name: 'Timer'}).get('value[0]') == "Start");
          chrome.browserAction.setBadgeText({text: active.length > 0 ? "T" : ""});
        }
      });
    });
  }
}

((background) => {
  background.loadTasks();
  setInterval(() => background.loadTasks(), 5000);
})(new Background());
