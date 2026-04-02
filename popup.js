
document.addEventListener('DOMContentLoaded', function() {
    let currentMode = 'qwen'; // 'qwen' or 'ds'
    const listDiv = document.getElementById('list');

    function render() {
        const storageKey = currentMode === 'qwen' ? 'qwenRecords' : 'records';
        chrome.storage.local.get({ [storageKey]: [] }, function(result) {
            const items = result[storageKey];
            listDiv.innerHTML = '';
            if (!items || items.length === 0) {
                listDiv.innerHTML = '<div class="empty">暂无该平台的对话记录</div>';
                return;
            }
            items.slice().reverse().forEach(item => {
                const row = document.createElement('div');
                row.className = 'record';
                const topic = currentMode === 'qwen' ? item.topic : item.topic;
                const time = currentMode === 'qwen' ? item.time : item.timestamp;
                const text = currentMode === 'qwen' ? item.topicText : item.prompt;

                // 千问标题兜底：如果还是“新对话”或空，用首条问题自动生成标题
                let displayTopic;
                if (currentMode === 'qwen') {
                    const rawText = (item.topicText || '').trim();
                    const fallback = rawText ? rawText.slice(0, 20) : '';
                    if (!topic || topic === '新对话') {
                        displayTopic = fallback || '新对话';
                    } else {
                        displayTopic = topic;
                    }
                } else {
                    displayTopic = topic || '新对话';
                }

                row.innerHTML = `
                    <div class="header">
                        <span class="topic-tag">${displayTopic}</span>
                        <span class="time-tag">${time}</span>
                    </div>
                    <div class="text">${text}</div>
                `;
                listDiv.appendChild(row);
            });
        });
    }

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.tab.active').classList.remove('active');
            tab.classList.add('active');
            currentMode = tab.dataset.target;
            render();
        });
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        if (confirm('确定要清空当前列表吗？')) {
            const storageKey = currentMode === 'qwen' ? 'qwenRecords' : 'records';
            chrome.storage.local.set({ [storageKey]: [] }, render);
        }
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
        const storageKey = currentMode === 'qwen' ? 'qwenRecords' : 'records';
        chrome.storage.local.get({ [storageKey]: [] }, function(result) {
            const data = result[storageKey];
            if (!data || data.length === 0) return alert('没有数据！');
            let csv = "\uFEFF话题,时间,提问\r\n";
            data.forEach(r => {
                const rawTopic = currentMode === 'qwen' ? r.topic : r.topic;
                const rawText = (currentMode === 'qwen' ? r.topicText : r.prompt) || '';
                let exportTopic;
                if (currentMode === 'qwen') {
                    const fallback = rawText.trim() ? rawText.trim().slice(0, 20) : '';
                    if (!rawTopic || rawTopic === '新对话') {
                        exportTopic = fallback || '新对话';
                    } else {
                        exportTopic = rawTopic;
                    }
                } else {
                    exportTopic = rawTopic || '新对话';
                }

                const topic = exportTopic;
                const time = currentMode === 'qwen' ? r.time : r.timestamp;
                const text = rawText.replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
                csv += `"${topic}","${time}","${text}"\r\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${currentMode}_records.csv`;
            link.click();
        });
    });

    render();
});
