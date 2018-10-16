// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly';

import _ from 'lodash';
import Store from '../component/Store'
import YT from '../component/YT'
import Messaging from '../component/Messaging'

class Background {
  constructor() {
    this.filters = [];
    this.client = new YT();
    this.bus = new Messaging();
    this.store = new Store();
    this.interval = setInterval(() => this.loadTasks(), 5000);

    this.bus.subscribe('loadTasks', () => this.loadTasks());
    this.bus.subscribe('optionsSaved', o => this.updateOptions(o));

    chrome.browserAction.setBadgeBackgroundColor({color: "#f66"});
    this.store.loadOptions(o => this.updateOptions(o));
  }

  updateOptions(options) {
    this.filters = options.filters;
    this.client.baseURL = options.baseURL;
    chrome.storage.local.clear();
    chrome.browserAction.setBadgeText({text: ""});
    this.loadTasks();
  }

  loadTasks() {
    let _innerFn = () =>_.each(this.filters, (filter, idx) => {
      this.client.getTasks(filter.filter).then(tasks => {
        let key = 'tasks' + idx;
        this.store.saveByKey('_bgNoAuth', false);
        this.store.saveByKey('_bgError', false);
        this.store.saveTasks(key, tasks);
        this.bus.send('updateTaskList', {key: key});

        if (idx == 0) {
          let active = _.filter(tasks, t => _.chain(t.field).find({name: 'Timer'}).get('value[0]') == "Start");
          chrome.browserAction.setBadgeText({text: active.length > 0 ? "T" : ""});
        }
      })
      .catch(e => {
        if (_.get(e, 'response.status') == 401) {
          this.store.saveByKey('_bgNoAuth', true);
        }
        else {
          this.store.saveByKey('_bgError', {message: _.get(e, 'message'), data: _.get(e, 'response.data')});
        }
      });
    });

    // Загружать задачи, только если есть вкладки с YouTrack
    // Иначе все равно нет аутентификации
    chrome.tabs.query(
      {url: this.client.baseURL + '/*'},
      t => _.isEmpty(t) ? this.store.saveByKey('_bgNoAuth', true) : _innerFn()
    );
  }
}

new Background();
