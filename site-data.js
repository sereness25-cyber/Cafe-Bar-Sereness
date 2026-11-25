/* お店のデータ（メニュー・カレンダー・お知らせ）を早く表示するための読み込み。
   1. 端末に保存したデータがあれば、すぐ表示する（トップページと同じ保存場所）
   2. なければ、サイトに置いた data.json（10分ごとに自動更新）をすぐ表示する
   3. どちらの場合も、Apps Script から最新のデータを取りに行き、届いたら差し替えて保存する */
(function () {
    var KEY = "sereness_data_cache";
    window.loadSiteData = function (gasUrl, onData, onFail) {
        var shown = false, live = false;
        try {
            var c = localStorage.getItem(KEY);
            if (c) { onData(JSON.parse(c)); shown = true; }
        } catch (e) {}
        if (!shown) {
            fetch("data.json", { cache: "no-cache" })
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (d) { if (d && d.menu && !live) { onData(d); shown = true; } })
                .catch(function () {});
        }
        fetch(gasUrl)
            .then(function (r) { return r.json(); })
            .then(function (d) {
                live = true;
                try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
                onData(d);
            })
            .catch(function (e) { if (!shown && onFail) onFail(e); });
    };
})();
