/* メニューを A4 縦 1 ページに収めて印刷する（全メニューページ共通）
   印刷のときだけカードを幅 900px・2列にして、A4 の大きさに合わせて縮小する。
   印刷ボタン（autoScaleAndPrint）でも、ブラウザの印刷メニューからでも同じように印刷される。 */
(function () {
    var A4_W = 793, A4_H = 1122;   // A4 縦（96dpi で 793.7×1122.5px）
    function prepare() {
        var root = document.documentElement;
        root.classList.add('printing');
        Array.prototype.forEach.call(document.querySelectorAll('img[loading="lazy"]'), function (i) { i.loading = 'eager'; });
        var p = document.querySelector('.menu-paper');
        if (!p) return;
        // カードの幅と「見出しの中を2列にするか」をいくつか試して、A4にいちばん大きく印刷できる形を選ぶ
        // 幅の狭い順（＝文字が大きく印刷される順）に試し、A4いっぱいに収まる最初の形を使う。見出しの中の2列は必要なときだけ
        var tries = [], best = null, fit = null;
        [false, true].forEach(function (wide) { for (var w = 900; w <= 2000; w += 50) tries.push([w, wide]); });
        p.style.setProperty('--print-scale', '1');
        p.style.minHeight = '';
        tries.forEach(function (t) {
            root.style.setProperty('--bw', t[0] + 'px');
            root.classList.toggle('print-wide', t[1]);
            if (fit) return;
            var s = Math.min(A4_W / p.offsetWidth, A4_H / p.offsetHeight, 1), size = s * p.offsetWidth;
            if (p.offsetHeight <= p.offsetWidth * A4_H / A4_W) { fit = { t: t, s: s, size: size }; return; }
            if (!best || size > best.size + 1) best = { t: t, s: s, size: size };
        });
        if (fit) best = fit;
        root.style.setProperty('--bw', best.t[0] + 'px');
        root.classList.toggle('print-wide', best.t[1]);
        // 紙の部分を縦に伸ばしてA4の縦横比に合わせ、用紙いっぱいに印刷する（余白を出さない）
        var fitH = p.offsetWidth * A4_H / A4_W;
        if (p.offsetHeight < fitH) p.style.minHeight = Math.ceil(fitH) + 'px';
        var s = Math.min(A4_W / p.offsetWidth, A4_H / p.offsetHeight, 1);
        p.style.setProperty('--print-scale', (Math.floor(s * 10000) / 10000).toFixed(4));
    }
    function cleanup() { var r = document.documentElement; r.classList.remove('printing', 'print-wide'); r.style.removeProperty('--bw'); var p = document.querySelector('.menu-paper'); if (p) p.style.minHeight = ''; }
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
