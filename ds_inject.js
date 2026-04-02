
const XHR = XMLHttpRequest.prototype;
const originalOpen = XHR.open;
const originalSend = XHR.send;
XHR.open = function(method, url) { this._method = method; this._url = url; return originalOpen.apply(this, arguments); };
XHR.send = function(postData) {
    if (this._method === 'POST' && this._url && this._url.includes('/api/v0/chat/completion')) {
        try {
            const body = JSON.parse(postData);
            if (body && body.prompt) {
                window.postMessage({
                    type: 'DEEPSEEK_PROMPT_INTERCEPTED',
                    prompt: body.prompt,
                    timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
                    topic: document.title.replace(/ - DeepSeek/g, '').trim()
                }, '*');
            }
        } catch (e) {}
    }
    return originalSend.apply(this, arguments);
};
