/* トップページを開いている間に、イベント一覧を先に取得して端末に保存しておく。
   さらに Apps Script の起動待ちも済ませるので、イベントページがほぼ一瞬で開く。 */
(function () {
    var url = window.SERENESS_EVENTS_API;
    if (!url) return;
    var KEY = "sereness_events_cache"; // events-common.js の EV_CACHE_KEY と同じ

    function run() {
        fetch(url + "?action=list")
            .then(function (r) { return r.json(); })
            .then(function (j) {
                if (j && j.events) { try { localStorage.setItem(KEY, JSON.stringify(j.events)); } catch (e) {} }
            })
            .catch(function () {});
    }
    // トップページ自体の表示を邪魔しないよう、ひと息ついてから実行
    if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 3000 });
    else setTimeout(run, 800);
})();
