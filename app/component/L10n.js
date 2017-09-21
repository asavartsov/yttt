let l10n = (key) => chrome.i18n.getMessage(key);

const L10n = {
    install(Vue, options) {
        Vue.filter('l10n', l10n);
    },

    l10n: l10n
};
  
export default L10n;