🕒 AI Chat Time Tracker (DeepSeek & Qwen)
中文 | English
🇨🇳 中文介绍
一个轻量级、无感知的 Chrome / Edge / FireFox 浏览器插件，专为 DeepSeek 和 通义千问 (Qwen) 网页端深度定制。它不仅能精准记录你的每一次对话和提示词（Prompt），还能将时间戳完美、无缝地融入到原生聊天界面中。
🚀 核心功能 (Core Features)
• ✨ 界面无缝融合 (UI Injection)：告别只在后台记录，直接在 DeepSeek 和千问的聊天气泡上方原生显示发送时间，视觉效果干净纯粹。
• 🛡️ 完美路由拦截 (Perfect Routing)：深入 Hook History API，搭配独创的“孤儿领养”算法，彻底解决由于网页极速跳转导致的“新建对话第一句话没有时间”的历史痛点。
• 👑 霸道标题同步 (Title Sync)：智能监听侧边栏动态，自动将底层数据里的“新对话”等废话标题强行覆盖为真实的聊天主题，让历史记录永远整洁明了。
• ⚡ 极速渲染兼容 (Anti-Race Condition)：底层同步推入内存，专为 Edge 等极速浏览器打造了“防竞态时间差”优化，告别时间戳闪烁与丢失。
• 🔒 绝对隐私 & 导出 (Privacy & Export)：数据仅保存在浏览器本地 (chrome.storage.local)，绝不上云；依然支持一键导出所有历史记录为 .csv 格式，方便复盘分析。
🛠️ 安装说明 (本地加载)
1. 下载本项目并解压文件夹。
2. 打开浏览器扩展页面（可在地址栏输入 chrome://extensions/ 或 edge://extensions/ 或 about:debugging）。
3. 开启右上角的 “开发者模式”（FireFox 用户请点击“临时载入附加组件”）。
4. 点击 “加载已解压的扩展程序”，选择刚刚解压的文件夹即可。
5. 打开或刷新 DeepSeek / 通义千问 网页，享受完整的时光记录！

🇬🇧 English
A lightweight, highly-optimized Chrome / Edge / FireFox extension tailored for both DeepSeek and Tongyi Qianwen (Qwen) web interfaces. It accurately records the exact timestamps and prompts of every conversation, and seamlessly injects those timestamps directly into the native chat UI.
🚀 Core Features
• ✨ Seamless UI Injection: Say goodbye to background-only logging. This extension natively displays precise timestamps right above your chat bubbles in both DeepSeek and Qwen, matching the original UI perfectly.
• 🛡️ Perfect Routing & Orphan Pickup: By hooking into the History API and utilizing a unique "orphan adoption" algorithm, it completely resolves the notorious issue where the "first message in a new chat" fails to get a timestamp due to rapid URL redirects.
• 👑 Dominant Title Sync: Smartly monitors the sidebar to automatically overwrite default/useless titles (like "New Chat") with the actual chat topic in your local database, keeping your history meticulously organized.
• ⚡ Anti-Race Condition: Optimized specifically for fast-rendering browsers like Edge. By pushing data directly to memory synchronously, it prevents timestamp flashing or data loss caused by millisecond-level execution delays.
• 🔒 Local Privacy & Easy Export: Data is stored exclusively in your browser's chrome.storage.local. It fully respects your privacy and still supports one-click export of all chat history to a .csv file for easy analysis.
🛠️ Installation (Developer Mode)
1. Download and unzip this repository.
2. Open the extensions page (chrome://extensions/ or edge://extensions/ or about:debugging).
3. Enable "Developer mode" in the top right corner (For FireFox, click "Load Temporary Add-on...").
4. Click "Load unpacked" and select the unzipped folder.
5. Open or refresh your DeepSeek / Qwen tab and enjoy the fully tracked chat experience!