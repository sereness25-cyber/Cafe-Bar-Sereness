/* メニューを A4 縦 1 ページに収めて印刷する（全メニューページ共通）
   印刷のときだけカードを幅 900px・2列にして、A4 の大きさに合わせて縮小する。
   印刷ボタン（autoScaleAndPrint）でも、ブラウザの印刷メニューからでも同じように印刷される。 */
(function () {
    var A4_W = 790, A4_H = 1118;   // A4 縦（96dpi で 794×1123px）から少し余裕を引いた大きさ
    function prepare() {
        var root = document.documentElement;
        root.classList.add('printing');
        Array.prototype.forEach.call(document.querySelectorAll('img[loading="lazy"]'), function (i) { i.loading = 'eager'; });
        var p = document.querySelector('.menu-paper');
        if (!p) return;
        // カードの幅と「見出しの中を2列にするか」をいくつか試して、A4にいちばん大きく印刷できる形を選ぶ
        var tries = [[900, false], [1150, true], [1400, true]], best = null;
        p.style.setProperty('--print-scale', '1');
        tries.forEach(function (t) {
            root.style.setProperty('--bw', t[0] + 'px');
            root.classList.toggle('print-wide', t[1]);
            var s = Math.min(A4_W / p.offsetWidth, A4_H / p.offsetHeight, 1), size = s * p.offsetWidth;
            if (!best || size > best.size + 1) best = { t: t, s: s, size: size };
        });
        root.style.setProperty('--bw', best.t[0] + 'px');
        root.classList.toggle('print-wide', best.t[1]);
        p.style.setProperty('--print-scale', best.s.toFixed(4));
    }
    function cleanup() { var r = document.documentElement; r.classList.remove('printing', 'print-wide'); r.style.removeProperty('--bw'); }
    window.addEventListener('beforeprint', prepare);
    window.addEventListener('afterprint', cleanup);
    // 印刷ボタン：写真の読み込みを少し待ってから印刷する
    window.autoScaleAndPrint = function () {
        prepare();
        var waiting = Array.prototype.filter.call(document.images, function (i) { return !i.complete; });
        Promise.race([
            Promise.all(waiting.map(function (i) { return new Promise(function (r) { i.addEventListener('load', r); i.addEventListener('error', r); }); })),
            new Promise(function (r) { setTimeout(r, 3000); })
        ]).then(function () { prepare(); window.print(); });
    };
})();
