// ds_content.js
console.log("🛡️ DeepSeek 独立拦截器：霸道标题同步 + 界面渲染完整版已启动");

const defaultTitles = ['DeepSeek', '探索未至之境', 'DeepSeek - 探索未至之境', '探索未至之境 - DeepSeek', '探索未知之境', 'DeepSeek - 探索未知之境', '探索未知之境 - DeepSeek', '新对话', ''];

let dsRecords = [];

// 1. 初始化并监听内存同步
chrome.storage.local.get({ records: [] }, (r) => { 
    dsRecords = r.records || []; 
    triggerRender(); // 初始化时尝试画时间
});
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.records) {
        dsRecords = changes.records.newValue;
        triggerRender(); // 数据更新时触发画时间
    }
});

// ==========================================
// 🌟 2. 恢复：完美的路由拦截 (解决第一句话没户口的问题)
// ==========================================
function hookHistory() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
        originalPushState.apply(this, arguments);
        handleUrlChange(location.pathname);
    };
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        handleUrlChange(location.pathname);
    };
    window.addEventListener('popstate', () => {
        handleUrlChange(location.pathname);
    });
}
hookHistory();

function handleUrlChange(newPathname) {
    // DeepSeek 的房间号特征
    const isValidSession = /^\/a\/chat\/s\/[a-zA-Z0-9-]+/.test(newPathname);
    
    if (isValidSession) {
        let changed = false;
        const now = Date.now();
        for (let i = dsRecords.length - 1; i >= 0; i--) {
            let r = dsRecords[i];
            if ((!r.sessionId || r.sessionId === '/a/chat' || r.sessionId === '/') && (now - r.id < 60000)) {
                r.sessionId = newPathname;
                changed = true;
            }
        }
        if (changed) {
            chrome.storage.local.set({ records: dsRecords });
            triggerRender();
        }
    }
}

// ==========================================
// 🌟 3. 接收拦截到的提问并保存
// ==========================================
window.addEventListener('message', function(event) {
    if (event.source !== window || !event.data || event.data.type !== 'DEEPSEEK_PROMPT_INTERCEPTED') {
        return;
    }
    let currentTitle = document.title.replace(/ - DeepSeek/g, '').trim();
    const newRecord = {
        id: Date.now(), 
        topic: defaultTitles.includes(currentTitle) ? '新对话' : currentTitle,
        timestamp: event.data.timestamp,
        prompt: event.data.prompt,
        sessionId: location.pathname 
    };
    dsRecords.push(newRecord);
    if (dsRecords.length > 1000) dsRecords.shift(); 
    chrome.storage.local.set({ records: dsRecords });
    triggerRender(); // 拿到新消息立刻画时间
});

// ==========================================
// 🌟 4. 霸道同步版：标题修复监听
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    let titleObserver = new MutationObserver(() => {
        let newTitle = document.title.replace(/ - DeepSeek/g, '').trim();
        
        if (newTitle && !defaultTitles.includes(newTitle)) {
            let changed = false;
            dsRecords.forEach(r => {
                // 霸道修改：只要属于当前聊天室，统统改成新标题
                if (r.sessionId === location.pathname && r.topic !== newTitle) {
                    r.topic = newTitle;
                    changed = true;
                }
            });
            
            if (changed) {
                chrome.storage.local.set({ records: dsRecords }, () => {
                    console.log("✅ DeepSeek 话题已强行同步为:", newTitle);
                });
            }
        }
    });
    
    const targetNode = document.querySelector('title') || document.head;
    if (targetNode) titleObserver.observe(targetNode, { childList: true, characterData: true, subtree: true });
});

// ==========================================
// 🌟 5. 恢复：核心对齐与纯净渲染 (丢失的“装修队”)
// ==========================================
let renderTimer = null;
let chatObserver = null;

function triggerRender() {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(renderTimestamps, 150); 
}

// 每秒检查聊天框是否需要重新绑定观察器
setInterval(() => {
    const list = document.querySelector('.ds-virtual-list-items');
    if (list && !list.dataset.observed) {
        if (chatObserver) chatObserver.disconnect(); 
        chatObserver = new MutationObserver(triggerRender);
        chatObserver.observe(list, { childList: true, subtree: true, characterData: true });
        list.dataset.observed = 'true';
        triggerRender(); 
    }
}, 1000);

function renderTimestamps() {
    if (dsRecords.length === 0) return;
    const chatContainer = document.querySelector('.ds-virtual-list-items');
    if (!chatContainer) return;

    // 擦黑板：防止时间重复出现
    const allInjected = chatContainer.querySelectorAll('.ds-wechat-time');
    allInjected.forEach(el => el.remove());

    let currentSessionId = location.pathname;
    const now = Date.now();

    // 跨房免签：连大厅刚发的孤儿消息一起捞出来
    let sessionRecords = dsRecords.filter(r => {
        if (currentSessionId.length > 10 && r.sessionId === currentSessionId) return true;
        if ((currentSessionId === '/a/chat' || currentSessionId === '/') && 
            (!r.sessionId || r.sessionId === '/a/chat' || r.sessionId === '/')) {
            if (now - r.id < 300000) return true; 
        }
        return false;
    });

    if (sessionRecords.length === 0) return;

    // 找到网页上所有用户的发言气泡
    const rows = Array.from(chatContainer.querySelectorAll('[data-virtual-list-item-key]'));
    const userRows = rows.filter(row => !row.querySelector('.ds-markdown')); 
    if (userRows.length === 0) return;

    const SEARCH_WINDOW = 50;
    const recentRecords = sessionRecords.slice(-SEARCH_WINDOW);

    let rTexts = userRows.map(row => row.textContent.replace(/\s+/g, ''));
    let dTexts = recentRecords.map(r => r.prompt.replace(/\s+/g, ''));

    let rIdx = 0; 
    let dIdx = 0; 
    const MAX_LOOKAHEAD = 4; 

    // 连连看逻辑
    while (rIdx < rTexts.length && dIdx < dTexts.length) {
        if (rTexts[rIdx] === dTexts[dIdx]) {
            injectTimeUI(userRows[rIdx], recentRecords[dIdx]);
            rIdx++;
            dIdx++;
        } else {
            let foundMatch = false;
            for (let step = 1; step <= MAX_LOOKAHEAD; step++) {
                if (dIdx + step < dTexts.length && rTexts[rIdx] === dTexts[dIdx + step]) {
                    dIdx += step; 
                    foundMatch = true;
                    break;
                }
            }
            if (!foundMatch) {
                rIdx++;
            }
        }
    }
}

// 往网页塞 HTML 标签的工序
function injectTimeUI(row, record) {
    if (!record || !record.timestamp) return;

    let displayTime = '??:??';
    try {
        const timeParts = record.timestamp.split(':');
        if (timeParts.length >= 2 && !isNaN(parseInt(timeParts[0]))) {
            displayTime = `${timeParts[0]}:${timeParts[1]}`;
        } else if (!isNaN(new Date(record.timestamp))) {
            const d = new Date(record.timestamp);
            displayTime = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        }
    } catch (e) {
        console.error("时间解析失败", e);
    }
    
    const timeWrapper = document.createElement('div');
    timeWrapper.className = 'ds-wechat-time';
    timeWrapper.style.cssText = `
        width: 100%; display: flex; justify-content: center;
        margin: 16px 0 8px 0; user-select: none;
    `;
    
    const timePill = document.createElement('span');
    timePill.textContent = displayTime;
    timePill.style.cssText = `
        background-color: rgba(135, 135, 135, 0.15); color: #999;
        font-size: 12px; padding: 4px 12px; border-radius: 4px;
    `;
    
    timeWrapper.appendChild(timePill);
    row.parentElement.insertBefore(timeWrapper, row);
}