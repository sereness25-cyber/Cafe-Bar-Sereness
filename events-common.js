/* =========================================================
   Sereness イベント機能 共通スクリプト
   events.html（閲覧）と event-admin.html（管理）で共有します
   ========================================================= */

/* 接続先URLは events-config.js に書きます（トップページの先読みと共通で使うため）。
   空のままだと「テストモード」（このブラウザ内だけに保存）で動きます。 */
const EVENTS_API_URL = window.SERENESS_EVENTS_API || "";

const EV_LOCAL_KEY = "sereness_events_local";
const EV_RES_LOCAL_KEY = "sereness_reservations_local";
const EV_CACHE_KEY = "sereness_events_cache";
const EV_CATEGORIES = ["イベント", "スポーツ観戦", "カラオケ", "ボードゲーム", "貸切・団体", "お知らせ"];
const EV_IS_LOCAL = !EVENTS_API_URL;

function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
}

// 本文の改行とURLを自動リンク化（先にエスケープするので安全）
function autoLink(text) {
    return esc(text)
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\n/g, "<br>");
}

// Driveの画像は ?sz=w1200 の数字を変えると小さい版が取れる（一覧では小さい版で高速に表示）
function thumbUrl(url, w) { return String(url || "").replace(/sz=w\d+/, "sz=w" + w); }

function pad2(n) { return String(n).padStart(2, "0"); }
function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function parseDate(str) {
    const p = String(str).split("-").map(Number);
    return { y: p[0], m: p[1], d: p[2], w: "日月火水木金土"[new Date(p[0], p[1] - 1, p[2]).getDay()] };
}

function localRead() {
    try { return JSON.parse(localStorage.getItem(EV_LOCAL_KEY) || "[]"); } catch (e) { return []; }
}
function localWrite(list) { localStorage.setItem(EV_LOCAL_KEY, JSON.stringify(list)); }

async function apiPost(body) {
    const res = await fetch(EVENTS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // プリフライトを避けるため text/plain
        body: JSON.stringify(body)
    });
    let json;
    try { json = await res.json(); }
    catch (e) { throw new Error("サーバーの応答が不正です。Apps Script の権限承認と、新バージョンでの再デプロイを確認してください"); }
    if (!json.ok) {
        if (json.error === "unknown action") throw new Error("サーバー側が古いままです。Apps Script を新バージョンで再デプロイしてください");
        throw new Error(json.error || "通信エラー");
    }
    return json;
}

const EventAPI = {
    async listPublic() {
        if (EV_IS_LOCAL) return localRead().filter(function (e) { return e.published !== false; });
        const res = await fetch(EVENTS_API_URL + "?action=list");
        const json = await res.json();
        return json.events || [];
    },
    async listAll(pw) {
        if (EV_IS_LOCAL) return localRead();
        return (await apiPost({ action: "adminList", password: pw })).events || [];
    },
    // imageDataUrl があれば、画像アップロードと保存を1回の通信でまとめて行う
    async save(ev, pw, imageDataUrl) {
        if (EV_IS_LOCAL) {
            if (imageDataUrl) ev.image = imageDataUrl;
            const list = localRead();
            if (!ev.id) ev.id = "e" + Date.now().toString(36);
            ev.updatedAt = new Date().toISOString();
            const i = list.findIndex(function (x) { return x.id === ev.id; });
            if (i >= 0) list[i] = ev; else list.push(ev);
            localWrite(list);
            return ev;
        }
        const body = { action: "save", password: pw, event: ev };
        if (imageDataUrl) body.imageData = imageDataUrl.split(",")[1];
        return (await apiPost(body)).event;
    },
    async remove(id, pw) {
        if (EV_IS_LOCAL) {
            localWrite(localRead().filter(function (x) { return x.id !== id; }));
            return;
        }
        await apiPost({ action: "delete", password: pw, id: id });
    },
    // お客様の予約（パスワード不要）
    async reserve(r) {
        if (EV_IS_LOCAL) {
            let list = [];
            try { list = JSON.parse(localStorage.getItem(EV_RES_LOCAL_KEY) || "[]"); } catch (e) {}
            r.createdAt = new Date().toISOString();
            list.push(r);
            localStorage.setItem(EV_RES_LOCAL_KEY, JSON.stringify(list));
            return { ok: true, mailed: false };
        }
        return await apiPost(Object.assign({ action: "reserve" }, r));
    },
    async uploadImage(dataUrl, pw) {
        if (EV_IS_LOCAL) return dataUrl; // テストモードでは画像をそのまま保持
        return (await apiPost({ action: "upload", password: pw, data: dataUrl.split(",")[1] })).url;
    }
};
