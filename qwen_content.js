// qwen_content.js
console.log("🚀 千问专属拦截器：全平台终极版已启动 (兼容 Edge 极速渲染)");

let globalRecords = [];

chrome.storage.local.get({ qwenRecords: [] }, function(result) {
    globalRecords = result.qwenRecords || [];
});
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.qwenRecords) {
        globalRecords = changes.qwenRecords.newValue;
        triggerRender(); 
    }
});

// ==========================================
// 🌟 1. 恢复：完美的路由拦截
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
    const isValidSession = newPathname.includes('/chat/');
    if (isValidSession) {
        let changed = false;
        const now = Date.now();
        for (let i = globalRecords.length - 1; i >= 0; i--) {
            let r = globalRecords[i];
            if ((!r.sessionId || r.sessionId === '/' || r.sessionId === '/qianwen/') && (now - r.id < 60000)) {
                r.sessionId = newPathname;
                changed = true;
            }
        }
        if (changed) {
            chrome.storage.local.set({ qwenRecords: globalRecords });
            triggerRender(); // 主动触发渲染
        }
    }
}

// ==========================================
// 🌟 2. 发消息拦截 (Edge 专属优化)
// ==========================================
let isComposing = false;
document.addEventListener('compositionstart', () => { isComposing = true; });
document.addEventListener('compositionend', () => { isComposing = false; });

document.addEventListener('keydown', function(event) {
    if (isComposing) return; 
    let target = event.target;
    if (target.nodeType === 3) target = target.parentNode;
    const editorDiv = target.closest ? target.closest('[data-slate-editor="true"]') : null;
    
    if (editorDiv && event.key === 'Enter' && !event.shiftKey) {
        // 【优化1：瞬间抓取文字】不要等，立刻抓取，防止 Edge 瞬间清空输入框
        const questionText = (editorDiv.innerText || editorDiv.textContent || '').trim();
        
        if (questionText) {
            setTimeout(() => {
                const newRecord = {
                    id: Date.now(),
                    time: new Date().toLocaleString(),
                    topicText: questionText, 
                    topic: '新对话', 
                    sessionId: location.pathname 
                };
                
                globalRecords.push(newRecord);
                if (globalRecords.length > 500) globalRecords.shift();
                chrome.storage.local.set({ qwenRecords: globalRecords });
                triggerRender(); // 【优化2：主动刷新】存完立刻画时间
            }, 10);
        }
    }
}, true); 

// ==========================================
// 🌟 3. 侧边栏真实话题轮询抓取
// ==========================================
setInterval(() => {
    let currentPath = location.pathname;
    let changed = false;

    if (currentPath.includes('/chat/')) {
        const now = Date.now();
        for (let i = globalRecords.length - 1; i >= 0; i--) {
            let r = globalRecords[i];
            if ((!r.sessionId || r.sessionId === '/' || r.sessionId === '/qianwen/') && (now - r.id < 60000)) {
                r.sessionId = currentPath;
                changed = true;
            }
        }
    }

    let activeTopicEl = document.querySelector('.\\!bg-option .text-title-attachment') || 
                        document.querySelector('.text-title-attachment');

    if (activeTopicEl && activeTopicEl.textContent) {
        let realTopic = activeTopicEl.textContent.trim();
        
        const isInvalid = !realTopic || 
                          realTopic === '新对话' || 
                          realTopic.includes('千问AI助手') || 
                          realTopic.includes('千问-Qwen') ||
                          realTopic === '通义千问' ||
                          realTopic === '通义';

        if (!isInvalid) {
            for (let i = globalRecords.length - 1; i >= 0; i--) {
                let r = globalRecords[i];
                if (r.sessionId === currentPath && r.topic !== realTopic) {
                    r.topic = realTopic;
                    changed = true;
                }
            }
        }
    }
    
    if (changed) {
        chrome.storage.local.set({ qwenRecords: globalRecords });
        triggerRender(); // 主动刷新
    }
}, 1500);

// ==========================================
// 🌟 4. 强力包容渲染 (跨房免签版)
// ==========================================
let renderTimer = null;
let chatObserver = null;

function triggerRender() {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(renderTimestamps, 150); 
}

setInterval(() => {
    const listArea = document.getElementById('qwen-message-list-area');
    if (listArea && !listArea.dataset.observed) {
        if (chatObserver) chatObserver.disconnect(); 
        chatObserver = new MutationObserver(triggerRender);
        chatObserver.observe(listArea, { childList: true, subtree: true, characterData: true });
        listArea.dataset.observed = 'true';
        triggerRender(); 
    }
}, 1000);

function renderTimestamps() {
    if (globalRecords.length === 0) return;
    const chatContainer = document.getElementById('qwen-message-list-area');
    if (!chatContainer) return;

    const allInjected = chatContainer.querySelectorAll('.qwen-inject-time');
    allInjected.forEach(el => el.remove());

    let currentSessionId = location.pathname;
    const now = Date.now();
    
    // 【优化3：跨房免签特权】
    // 不管当前房间号是什么，只要是最近 1 分钟内在“大厅”发的孤儿消息，统统拿出来准备渲染！
    let sessionRecords = globalRecords.filter(r => {
        if (r.sessionId === currentSessionId) return true;
        if ((r.sessionId === '/' || r.sessionId === '/qianwen/') && (now - r.id < 60000)) return true;
        return false;
    });

    if (sessionRecords.length === 0) return;

    const userRows = Array.from(chatContainer.querySelectorAll('div[class*="questionItem"]')); 
    if (userRows.length === 0) return;

    let rTexts = userRows.map(row => {
        let bubble = row.querySelector('div[class*="bubble"]') || row.querySelector('div[class*="contentBox"]') || row;
        return bubble.textContent.replace(/\s+/g, '');
    });
    let dTexts = sessionRecords.map(r => r.topicText.replace(/\s+/g, ''));

    let rIdx = 0, dIdx = 0;
    const MAX_LOOKAHEAD = 4;

    while (rIdx < rTexts.length && dIdx < dTexts.length) {
        if (rTexts[rIdx].includes(dTexts[dIdx]) || dTexts[dIdx].includes(rTexts[rIdx])) {
            injectTimeUI(userRows[rIdx], sessionRecords[dIdx]);
            rIdx++; dIdx++;
        } else {
            let foundMatch = false;
            for (let step = 1; step <= MAX_LOOKAHEAD; step++) {
                if (dIdx + step < dTexts.length && (rTexts[rIdx].includes(dTexts[dIdx + step]) || dTexts[dIdx + step].includes(rTexts[rIdx]))) {
                    dIdx += step;
                    foundMatch = true;
                    break;
                }
            }
            if (!foundMatch) rIdx++;
        }
    }
}

function injectTimeUI(row, record) {
    let displayTime = record.time;
    try {
        const d = new Date(record.time);
        displayTime = `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch (e) {}
    const timeWrapper = document.createElement('div');
    timeWrapper.className = 'qwen-inject-time';
    timeWrapper.style.cssText = "width: 100%; display: flex; justify-content: flex-end; margin-bottom: 4px; user-select: none; padding-right: 4px;";
    timeWrapper.innerHTML = `<span style="color: #b4b4b4; font-size: 12px; font-weight: 500;">${displayTime}</span>`;
    row.insertBefore(timeWrapper, row.firstChild);
}