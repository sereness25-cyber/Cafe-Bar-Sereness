/* お店のデータ（メニュー・カレンダー・お知らせ）を早く表示するための読み込み。
   1. 端末に保存したデータがあれば、すぐ表示する（トップページと同じ保存場所）
   2. なければ、サイトに置いた data.json（10分ごとに自動更新）をすぐ表示する
   3. どちらの場合も、Apps Script から最新のデータを取りに行き、届いたら差し替えて保存する */
(function () {
    var KEY = "sereness_data_cache";
    // 説明欄の先頭の [おすすめ][人気] を取り出して i.badges に入れ、説明からは外す
    function prep(d) {
        if (d && d.menu) d.menu.forEach(function (i) {
            var desc = String(i.description || ''), b = [], m;
            while ((m = /^\s*\[(おすすめ|人気)\]/.exec(desc))) { if (b.indexOf(m[1]) < 0) b.push(m[1]); desc = desc.slice(m[0].length); }
            i.badges = b; i.description = desc.trim();
        });
        return d;
    }
    window.menuBadgeHtml = function (i) {
        return (i.badges || []).map(function (b) { return '<span class="mb-chip ' + (b === 'おすすめ' ? 'mb-osusume' : 'mb-ninki') + '">' + b + '</span>'; }).join('');
    };
    window.loadSiteData = function (gasUrl, onDataRaw, onFail) {
        var onData = function (d) { onDataRaw(prep(d)); };
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
