// 全局变量
let selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '["tyyszy","dyttzy", "bfzy", "ruyi", "wujin"]'); // 默认选中资源
let customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]'); // 存储自定义API列表

// 添加当前播放的集数索引
let currentEpisodeIndex = 0;
// 添加当前视频的所有集数
let currentEpisodes = [];
// 添加当前视频的标题
let currentVideoTitle = '';
// 全局变量用于倒序状态
let episodesReversed = false;

// 页面初始化
document.addEventListener('DOMContentLoaded', function () {
    // 初始化API复选框
    initAPICheckboxes();

    // 初始化自定义API列表
    renderCustomAPIsList();

    // 初始化显示选中的API数量
    updateSelectedApiCount();

    // 渲染搜索历史
    renderSearchHistory();

    // 设置默认API选择（如果是第一次加载）
    if (!localStorage.getItem('hasInitializedDefaults')) {
        // 默认选中资源
        selectedAPIs = ["tyyszy", "bfzy", "dyttzy", "ruyi", "wujin"];
        localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

        // 默认选中过滤开关
        localStorage.setItem('yellowFilterEnabled', 'true');
        localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, 'true');

        // 默认启用豆瓣功能
        localStorage.setItem('doubanEnabled', 'true');

        // 标记已初始化默认值
        localStorage.setItem('hasInitializedDefaults', 'true');
    }

    // 设置黄色内容过滤器开关初始状态
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.checked = localStorage.getItem('yellowFilterEnabled') === 'true';
    }

    // 设置广告过滤开关初始状态
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.checked = localStorage.getItem(PLAYER_CONFIG.adFilteringStorage) !== 'false'; // 默认为true
    }

    // 设置事件监听器
    setupEventListeners();

    // 初始检查成人API选中状态
    setTimeout(checkAdultAPIsSelected, 100);
});

// (已修改) 初始化API复选框 - 添加状态指示器
function initAPICheckboxes() {
    const container = document.getElementById('apiCheckboxes');
    if (!container) return; // 健壮性检查
    container.innerHTML = '';

    // 添加普通API组标题
    const normaldiv = document.createElement('div');
    normaldiv.id = 'normaldiv';
    normaldiv.className = 'grid grid-cols-2 gap-2';
    const normalTitle = document.createElement('div');
    normalTitle.className = 'api-group-title';
    normalTitle.textContent = '普通资源';
    normaldiv.appendChild(normalTitle);

    // 创建普通API源的复选框
    Object.keys(API_SITES).forEach(apiKey => {
        const api = API_SITES[apiKey];
        if (api.adult) return; // 跳过成人内容API，稍后添加

        const checked = selectedAPIs.includes(apiKey);

        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center'; // (修改) 确保 flex 布局
        checkbox.innerHTML = `
            <input type="checkbox" id="api_${apiKey}" 
                   class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333]" 
                   ${checked ? 'checked' : ''} 
                   data-api="${apiKey}">
            <label for="api_${apiKey}" class="ml-1 text-xs text-gray-400 truncate">${api.name}</label>
            <span class="api-status ml-auto" id="status_api_${apiKey}" title="未测试"></span>
        `;
        normaldiv.appendChild(checkbox);

        // 添加事件监听器
        checkbox.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
    container.appendChild(normaldiv);

    // 添加成人API列表
    addAdultAPI();

    // 初始检查成人内容状态
    checkAdultAPIsSelected();
}

// (已修改) 添加成人API列表 - 添加状态指示器
function addAdultAPI() {
    // 仅在隐藏设置为false时添加成人API组
    if (!HIDE_BUILTIN_ADULT_APIS && (localStorage.getItem('yellowFilterEnabled') === 'false')) {
        const container = document.getElementById('apiCheckboxes');
        if (!container) return; // 健壮性检查

        // 添加成人API组标题
        const adultdiv = document.createElement('div');
        adultdiv.id = 'adultdiv';
        adultdiv.className = 'grid grid-cols-2 gap-2';
        const adultTitle = document.createElement('div');
        adultTitle.className = 'api-group-title adult';
        adultTitle.innerHTML = `黄色资源采集站 <span class="adult-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </span>`;
        adultdiv.appendChild(adultTitle);

        // 创建成人API源的复选框
        Object.keys(API_SITES).forEach(apiKey => {
            const api = API_SITES[apiKey];
            if (!api.adult) return; // 仅添加成人内容API

            const checked = selectedAPIs.includes(apiKey);

            const checkbox = document.createElement('div');
            checkbox.className = 'flex items-center'; // (修改) 确保 flex 布局
            checkbox.innerHTML = `
                <input type="checkbox" id="api_${apiKey}" 
                       class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333] api-adult" 
                       ${checked ? 'checked' : ''} 
                       data-api="${apiKey}">
                <label for="api_${apiKey}" class="ml-1 text-xs text-pink-400 truncate">${api.name}</label>
                <span class="api-status ml-auto" id="status_api_${apiKey}" title="未测试"></span>
            `;
            adultdiv.appendChild(checkbox);

            // 添加事件监听器
            checkbox.querySelector('input').addEventListener('change', function () {
                updateSelectedAPIs();
                checkAdultAPIsSelected();
            });
        });
        container.appendChild(adultdiv);
    }
}

// 检查是否有成人API被选中
function checkAdultAPIsSelected() {
    // 查找所有内置成人API复选框
    const adultBuiltinCheckboxes = document.querySelectorAll('#apiCheckboxes .api-adult:checked');

    // 查找所有自定义成人API复选框
    const customApiCheckboxes = document.querySelectorAll('#customApisList .api-adult:checked');

    const hasAdultSelected = adultBuiltinCheckboxes.length > 0 || customApiCheckboxes.length > 0;

    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    const yellowFilterContainer = yellowFilterToggle.closest('div').parentNode;
    const filterDescription = yellowFilterContainer.querySelector('p.filter-description');

    // 如果选择了成人API，禁用黄色内容过滤器
    if (hasAdultSelected) {
        yellowFilterToggle.checked = false;
        yellowFilterToggle.disabled = true;
        localStorage.setItem('yellowFilterEnabled', 'false');

        // 添加禁用样式
        yellowFilterContainer.classList.add('filter-disabled');

        // 修改描述文字
        if (filterDescription) {
            filterDescription.innerHTML = '<strong class="text-pink-300">选中黄色资源站时无法启用此过滤</strong>';
        }

        // 移除提示信息（如果存在）
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    } else {
        // 启用黄色内容过滤器
        yellowFilterToggle.disabled = false;
        yellowFilterContainer.classList.remove('filter-disabled');

        // 恢复原来的描述文字
        if (filterDescription) {
            filterDescription.innerHTML = '过滤"伦理片"等黄色内容';
        }

        // 移除提示信息
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }
}

// (已修改) 渲染自定义API列表 - 添加状态指示器
function renderCustomAPIsList() {
    const container = document.getElementById('customApisList');
    if (!container) return;

    if (customAPIs.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center my-2">未添加自定义API</p>';
        return;
    }

    container.innerHTML = '';
    customAPIs.forEach((api, index) => {
        const apiItem = document.createElement('div');
        apiItem.className = 'flex items-center justify-between p-1 mb-1 bg-[#222] rounded';
        const textColorClass = api.isAdult ? 'text-pink-400' : 'text-white';
        const adultTag = api.isAdult ? '<span class="text-xs text-pink-400 mr-1">(18+)</span>' : '';
        // 新增 detail 地址显示
        const detailLine = api.detail ? `<div class="text-xs text-gray-400 truncate">detail: ${api.detail}</div>` : '';
        apiItem.innerHTML = `
            <div class="flex items-center flex-1 min-w-0">
                <input type="checkbox" id="custom_api_${index}" 
                       class="form-checkbox h-3 w-3 text-blue-600 mr-1 ${api.isAdult ? 'api-adult' : ''}" 
                       ${selectedAPIs.includes('custom_' + index) ? 'checked' : ''} 
                       data-custom-index="${index}">
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium ${textColorClass} truncate">
                        ${adultTag}${api.name}
                    </div>
                    <div class="text-xs text-gray-500 truncate">${api.url}</div>
                    ${detailLine}
                </div>
                <span class="api-status ml-2" id="status_custom_${index}" title="未测试"></span>
            </div>
            <div class="flex items-center flex-shrink-0 ml-1"> <button class="text-blue-500 hover:text-blue-700 text-xs px-1" onclick="editCustomApi(${index})">✎</button>
                <button class="text-red-500 hover:text-red-700 text-xs px-1" onclick="removeCustomApi(${index})">✕</button>
            </div>
        `;
        container.appendChild(apiItem);
        apiItem.querySelector('input').addEventListener('change', function () {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
}

// 编辑自定义API
function editCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const api = customAPIs[index];
    document.getElementById('customApiName').value = api.name;
    document.getElementById('customApiUrl').value = api.url;
    document.getElementById('customApiDetail').value = api.detail || '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) isAdultInput.checked = api.isAdult || false;
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
        const buttonContainer = form.querySelector('div:last-child');
        buttonContainer.innerHTML = `
            <button onclick="updateCustomApi(${index})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">更新</button>
            <button onclick="cancelEditCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
        `;
    }
}

// 更新自定义API
function updateCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const detailInput = document.getElementById('customApiDetail');
    const isAdultInput = document.getElementById('customApiIsAdult');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const detail = detailInput ? detailInput.value.trim() : '';
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    if (url.endsWith('/')) url = url.slice(0, -1);
    // 保存 detail 字段
    customAPIs[index] = { name, url, detail, isAdult };
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    renderCustomAPIsList();
    checkAdultAPIsSelected();
    restoreAddCustomApiButtons();
    nameInput.value = '';
    urlInput.value = '';
    if (detailInput) detailInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    showToast('已更新自定义API: ' + name, 'success');
}

// 取消编辑自定义API
function cancelEditCustomApi() {
    // 清空表单
    document.getElementById('customApiName').value = '';
    document.getElementById('customApiUrl').value = '';
    document.getElementById('customApiDetail').value = '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) isAdultInput.checked = false;

    // 隐藏表单
    document.getElementById('addCustomApiForm').classList.add('hidden');

    // 恢复添加按钮
    restoreAddCustomApiButtons();
}

// 恢复自定义API添加按钮
function restoreAddCustomApiButtons() {
    const form = document.getElementById('addCustomApiForm');
    const buttonContainer = form.querySelector('div:last-child');
    buttonContainer.innerHTML = `
        <button onclick="addCustomApi()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">添加</button>
        <button onclick="cancelAddCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
    `;
}

// 更新选中的API列表
function updateSelectedAPIs() {
    // 获取所有内置API复选框
    const builtInApiCheckboxes = document.querySelectorAll('#apiCheckboxes input:checked');

    // 获取选中的内置API
    const builtInApis = Array.from(builtInApiCheckboxes).map(input => input.dataset.api);

    // 获取选中的自定义API
    const customApiCheckboxes = document.querySelectorAll('#customApisList input:checked');
    const customApiIndices = Array.from(customApiCheckboxes).map(input => 'custom_' + input.dataset.customIndex);

    // 合并内置和自定义API
    selectedAPIs = [...builtInApis, ...customApiIndices];

    // 保存到localStorage
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 更新显示选中的API数量
    updateSelectedApiCount();
}

// 更新选中的API数量显示
function updateSelectedApiCount() {
    const countEl = document.getElementById('selectedApiCount');
    if (countEl) {
        countEl.textContent = selectedAPIs.length;
    }
}

// 全选或取消全选API
function selectAllAPIs(selectAll = true, excludeAdult = false) {
    const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        if (excludeAdult && checkbox.classList.contains('api-adult')) {
            checkbox.checked = false;
        } else {
            checkbox.checked = selectAll;
        }
    });

    updateSelectedAPIs();
    checkAdultAPIsSelected();
}

// 显示添加自定义API表单
function showAddCustomApiForm() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
    }
}

// 取消添加自定义API - 修改函数来重用恢复按钮逻辑
function cancelAddCustomApi() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.add('hidden');
        document.getElementById('customApiName').value = '';
        document.getElementById('customApiUrl').value = '';
        document.getElementById('customApiDetail').value = '';
        const isAdultInput = document.getElementById('customApiIsAdult');
        if (isAdultInput) isAdultInput.checked = false;

        // 确保按钮是添加按钮
        restoreAddCustomApiButtons();
    }
}

// 添加自定义API
function addCustomApi() {
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const detailInput = document.getElementById('customApiDetail');
    const isAdultInput = document.getElementById('customApiIsAdult');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const detail = detailInput ? detailInput.value.trim() : '';
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    // 保存 detail 字段
    customAPIs.push({ name, url, detail, isAdult });
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    const newApiIndex = customAPIs.length - 1;
    selectedAPIs.push('custom_' + newApiIndex);
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 重新渲染自定义API列表
    renderCustomAPIsList();
    updateSelectedApiCount();
    checkAdultAPIsSelected();
    nameInput.value = '';
    urlInput.value = '';
    if (detailInput) detailInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    showToast('已添加自定义API: ' + name, 'success');
}

// 移除自定义API
function removeCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;

    const apiName = customAPIs[index].name;

    // 从列表中移除API
    customAPIs.splice(index, 1);
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));

    // 从选中列表中移除此API
    const customApiId = 'custom_' + index;
    selectedAPIs = selectedAPIs.filter(id => id !== customApiId);

    // 更新大于此索引的自定义API索引
    selectedAPIs = selectedAPIs.map(id => {
        if (id.startsWith('custom_')) {
            const currentIndex = parseInt(id.replace('custom_', ''));
            if (currentIndex > index) {
                return 'custom_' + (currentIndex - 1);
            }
        }
        return id;
    });

    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    // 重新渲染自定义API列表
    renderCustomAPIsList();

    // 更新选中的API数量
    updateSelectedApiCount();

    // 重新检查成人API选中状态
    checkAdultAPIsSelected();

    showToast('已移除自定义API: ' + apiName, 'info');
}

function toggleSettings(e) {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;

    // 检查是否有管理员密码
    const hasAdminPassword = window.__ENV__?.ADMINPASSWORD && 
                           window.__ENV__.ADMINPASSWORD.length === 64 && 
                           !/^0+$/.test(window.__ENV__.ADMINPASSWORD);

    if (settingsPanel.classList.contains('show')) {
        settingsPanel.classList.remove('show');
    } else {
        // 只有设置了管理员密码且未验证时才拦截
        if (hasAdminPassword && !isAdminVerified()) {
            e.preventDefault();
            e.stopPropagation();
            showAdminPasswordModal();
            return;
        }
        settingsPanel.classList.add('show');
    }

    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 回车搜索
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            search();
        }
    });

    // 点击外部关闭设置面板和历史记录面板
    document.addEventListener('click', function (e) {
        // 关闭设置面板
        const settingsPanel = document.querySelector('#settingsPanel.show');
        const settingsButton = document.querySelector('#settingsPanel .close-btn');

        if (settingsPanel && settingsButton &&
            !settingsPanel.contains(e.target) &&
            !settingsButton.contains(e.target)) {
            settingsPanel.classList.remove('show');
        }

        // 关闭历史记录面板
        const historyPanel = document.querySelector('#historyPanel.show');
        const historyButton = document.querySelector('#historyPanel .close-btn');

        if (historyPanel && historyButton &&
            !historyPanel.contains(e.target) &&
            !historyButton.contains(e.target)) {
            historyPanel.classList.remove('show');
        }
    });

    // 黄色内容过滤开关事件绑定
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.addEventListener('change', function (e) {
            localStorage.setItem('yellowFilterEnabled', e.target.checked);

            // 控制黄色内容接口的显示状态
            const adultdiv = document.getElementById('adultdiv');
            if (adultdiv) {
                if (e.target.checked === true) {
                    adultdiv.style.display = 'none';
                } else if (e.target.checked === false) {
                    adultdiv.style.display = ''
                }
            } else {
                // 添加成人API列表
                addAdultAPI();
            }
        });
    }

    // 广告过滤开关事件绑定
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.addEventListener('change', function (e) {
            localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, e.target.checked);
        });
    }
}

// 重置搜索区域
function resetSearchArea() {
    // 清理搜索结果
    document.getElementById('results').innerHTML = '';
    document.getElementById('searchInput').value = '';

    // 恢复搜索区域的样式
    document.getElementById('searchArea').classList.add('flex-1');
    document.getElementById('searchArea').classList.remove('mb-8');
    document.getElementById('resultsArea').classList.add('hidden');

    // 确保页脚正确显示，移除相对定位
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.position = '';
    }

    // 如果有豆瓣功能，检查是否需要显示豆瓣推荐区域
    if (typeof updateDoubanVisibility === 'function') {
        updateDoubanVisibility();
    }

    // 重置URL为主页
    try {
        window.history.pushState(
            {},
            `LibreTV - 免费在线视频搜索与观看平台`,
            `/`
        );
        // 更新页面标题
        document.title = `LibreTV - 免费在线视频搜索与观看平台`;
    } catch (e) {
        console.error('更新浏览器历史失败:', e);
    }
}

// 获取自定义API信息
function getCustomApiInfo(customApiIndex) {
    const index = parseInt(customApiIndex);
    if (isNaN(index) || index < 0 || index >= customAPIs.length) {
        return null;
    }
    return customAPIs[index];
}

// 用于清理和标准化标题，以便聚合
function normalizeTitle(title) {
    if (!title) return '';
    // 转换为小写，移除常见质量标签和多余空格
    return title.toString().toLowerCase()
        .replace(/hd|fhd|4k|1080p|720p|蓝光|高清|超清/g, '')
        .trim();
}

// 用于过滤不想显示的内容
function filterBanned(results) {
    const yellowFilterEnabled = localStorage.getItem('yellowFilterEnabled') === 'true';
    if (!yellowFilterEnabled) {
        return results; // 未开启过滤，返回所有
    }
    
    const banned = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑', '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码', '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];
    return results.filter(item => {
        const typeName = item.type_name || '';
        return !banned.some(keyword => typeName.includes(keyword));
    });
}

// 安全转义HTML，防止XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;');
}

// 获取“无结果”的HTML
function getNoResultsHTML() {
    return `
        <div class="col-span-full text-center py-16" id="noResultsMessage">
            <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-400">没有找到匹配的结果</h3>
            <p class="mt-1 text-sm text-gray-500">请尝试其他关键词或更换数据源</p>
        </div>
    `;
}

// 全局变量，用于存储聚合后的搜索结果
let aggregatedResultsMap = new Map();

/**
 * (新增) 处理单个API返回的结果，并将其添加到聚合地图中
 */
function processAndAggregate(results, aggregatedMap) {
    results.forEach(item => {
        const key = normalizeTitle(item.vod_name); // 使用标准化的标题作为Key
        if (!key) return; // 跳过没有标题的项

        if (!aggregatedMap.has(key)) {
            // 如果是第一次看到这个节目，创建一个新条目
            aggregatedMap.set(key, {
                // 存储第一个条目的详细信息作为“主信息”
                masterDetails: { 
                    vod_name: item.vod_name, // 保留原始名称用于显示
                    vod_pic: item.vod_pic,
                    type_name: item.type_name,
                    vod_year: item.vod_year,
                    vod_remarks: item.vod_remarks
                },
                sources: [] // 存储所有来源
            });
        }

        // 将当前来源添加到对应的节目条目中
        aggregatedMap.get(key).sources.push({
            source_name: item.source_name,
            source_code: item.source_code,
            vod_id: item.vod_id,
            api_url: item.api_url // 传递自定义API的URL（如果有）
        });
    });
}

// (Replaced) Creates a single aggregated card element using safe DOM methods
function createAggregatedCard(details, sources, mapKey) { // Added mapKey
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-full shadow-sm hover:shadow-md';
    // Use addEventListener instead of inline onclick for better practice
    cardDiv.addEventListener('click', () => handleAggregatedClick(mapKey)); // Pass mapKey

    const flexContainer = document.createElement('div');
    flexContainer.className = 'flex h-full';

    const hasCover = details.vod_pic && details.vod_pic.startsWith('http');

    // Image Part
    if (hasCover) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative flex-shrink-0 search-card-img-container';

        const img = document.createElement('img');
        img.src = details.vod_pic;
        img.alt = details.vod_name || 'Poster';
        img.className = 'h-full w-full object-cover transition-transform hover:scale-110';
        img.loading = 'lazy';
        img.onerror = function() {
            this.onerror = null;
            this.src = 'https://via.placeholder.com/300x450?text=No+Cover';
            this.classList.add('object-contain');
        };
        imgContainer.appendChild(img);

        const gradientOverlay = document.createElement('div');
        gradientOverlay.className = 'absolute inset-0 bg-gradient-to-r from-black/30 to-transparent';
        imgContainer.appendChild(gradientOverlay);

        flexContainer.appendChild(imgContainer);
    }

    // Text Content Part
    const textContainer = document.createElement('div');
    textContainer.className = 'p-2 flex flex-col flex-grow';

    const textGrow = document.createElement('div');
    textGrow.className = 'flex-grow';

    // Title
    const titleH3 = document.createElement('h3');
    titleH3.className = `font-semibold mb-2 break-words line-clamp-2 ${hasCover ? '' : 'text-center'}`;
    titleH3.title = details.vod_name || 'Unknown Title';
    titleH3.textContent = details.vod_name || 'Unknown Title'; // Safe
    textGrow.appendChild(titleH3);

    // Tags (Type, Year)
    const tagsDiv = document.createElement('div');
    tagsDiv.className = `flex flex-wrap ${hasCover ? '' : 'justify-center'} gap-1 mb-2`;
    if (details.type_name) {
        const typeSpan = document.createElement('span');
        typeSpan.className = 'text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-blue-500 text-blue-300';
        typeSpan.textContent = details.type_name; // Safe
        tagsDiv.appendChild(typeSpan);
    }
    if (details.vod_year) {
        const yearSpan = document.createElement('span');
        yearSpan.className = 'text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-purple-500 text-purple-300';
        yearSpan.textContent = details.vod_year; // Safe
        tagsDiv.appendChild(yearSpan);
    }
    textGrow.appendChild(tagsDiv);

    // Remarks/Description
    const remarksP = document.createElement('p');
    remarksP.className = `text-gray-400 line-clamp-2 overflow-hidden ${hasCover ? '' : 'text-center'} mb-2`;
    remarksP.title = details.vod_remarks || 'No description';
    remarksP.textContent = details.vod_remarks || 'No description'; // Safe
    textGrow.appendChild(remarksP);

    textContainer.appendChild(textGrow); // Add grow section to text container

    // Footer Part (Sources)
    const footerDiv = document.createElement('div');
    footerDiv.className = 'flex justify-start items-center mt-1 pt-1 border-t border-gray-800'; // Changed to justify-start

    const sourcesContainer = document.createElement('div');
    sourcesContainer.className = 'flex flex-wrap gap-1';
    sources.forEach(s => {
        const sourceSpan = document.createElement('span');
        sourceSpan.className = 'bg-[#222] text-xs px-1.5 py-0.5 rounded-full';
        sourceSpan.textContent = s.source_name; // Safe
        sourcesContainer.appendChild(sourceSpan);
    });
    footerDiv.appendChild(sourcesContainer);
    textContainer.appendChild(footerDiv); // Add footer to text container

    flexContainer.appendChild(textContainer); // Add text container to flex container
    cardDiv.appendChild(flexContainer); // Add flex container to card

    return cardDiv; // Return the created DOM element
}

// (Replaced) Renders aggregated results using safe DOM elements
function renderAggregatedResults(aggregatedMap) {
    const resultsDiv = document.getElementById('results');

    // If the map is empty and the "no results" message isn't there, add it.
    if (aggregatedMap.size === 0 && !document.getElementById('noResultsMessage')) {
        resultsDiv.innerHTML = getNoResultsHTML();
         if (document.getElementById('searchResultsCount')) {
             document.getElementById('searchResultsCount').textContent = '0';
         }
        return;
    }

    // If the map has items and the "no results" message is there, remove it.
    if (aggregatedMap.size > 0) {
         const noResultsMsg = document.getElementById('noResultsMessage');
         if (noResultsMsg) noResultsMsg.remove();
    }


    if (document.getElementById('searchResultsCount')) {
        document.getElementById('searchResultsCount').textContent = aggregatedMap.size;
    }

    // Sort results by name
    const sortedResults = Array.from(aggregatedMap.entries()).sort(([, a], [, b]) => {
        return (a.masterDetails.vod_name || '').localeCompare(b.masterDetails.vod_name || '');
    });

    // Create card elements
    const cardElements = sortedResults.map(([key, value]) =>
        createAggregatedCard(value.masterDetails, value.sources, key) // Pass map key
    );

    // Efficiently replace children
    resultsDiv.replaceChildren(...cardElements);
}

// (Modified) Handle aggregated click using mapKey
function handleAggregatedClick(mapKey) { // Changed parameter
    // Password protection check (remains the same)
     if (window.isPasswordProtected && window.isPasswordVerified) {
         if (window.isPasswordProtected() && !window.isPasswordVerified()) {
             showPasswordModal && showPasswordModal();
             return;
         }
     }

    if (!aggregatedResultsMap.has(mapKey)) return;

    const { masterDetails, sources } = aggregatedResultsMap.get(mapKey);
    const vod_name = masterDetails.vod_name; // Get name from stored details

    if (!sources || sources.length === 0) return;

    if (sources.length === 1) {
        const s = sources[0];
        // Use showDetails (assumes it handles source_code like 'custom_X' correctly)
        showDetails(s.vod_id, vod_name, s.source_code);
        return;
    }

    showSourceSelector(sources, vod_name); // Show modal to choose source
}

// (Replaced) showSourceSelector - Uses safe DOM methods
function showSourceSelector(sources, vod_name) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    if(!modal || !modalTitle || !modalContent) return;

    modalTitle.innerHTML = ''; // Clear
    const titleSpan = document.createElement('span');
    titleSpan.className = 'break-words';
    titleSpan.textContent = vod_name; // Set title safely
    modalTitle.appendChild(titleSpan);

    modalContent.innerHTML = ''; // Clear

    const infoText = document.createElement('div');
    infoText.className = 'mb-4 text-gray-400';
    infoText.textContent = `Found ${sources.length} available resources for ${vod_name}. Please choose one:`; // Safe text
    modalContent.appendChild(infoText);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2';

    sources.forEach(s => {
        const button = document.createElement('button');
        button.className = 'w-full px-4 py-3 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors text-left';

        // Use addEventListener
        button.addEventListener('click', () => {
            // Call showDetails with the original vod_name
            showDetails(s.vod_id, vod_name, s.source_code);
        });

        // Set button content safely
        button.textContent = s.source_name; // Safe source name

        gridContainer.appendChild(button);
    });

    modalContent.appendChild(gridContainer);
    modal.classList.remove('hidden');
}

// (已修改) 搜索功能 - 修复了 Promise.all 错误和 customAPIs 参数缺失
async function search() {
    // 密码保护校验
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        showToast('请输入搜索内容', 'info');
        return;
    }

    if (selectedAPIs.length === 0) {
        showToast('请至少选择一个API源', 'warning');
        return;
    }

    showLoading();

    try {
        // 保存搜索历史
        saveSearchHistory(query);

        // 从所有选中的API源搜索
        let allResults = [];
        
        // (修复) 1. 正确传递 customAPIs (全局变量)
        const searchPromises = selectedAPIs.map(apiId => 
            searchByAPIAndKeyWord(apiId, query, customAPIs) // <--- 修复点 1
        );

        // (修复) 2. 使用 Promise.allSettled 等待所有搜索完成，无论成功与否
        const resultsArray = await Promise.allSettled(searchPromises); // <--- 修复点 2

        // 合并所有 *成功* 的结果
        resultsArray.forEach(result => {
            if (result.status === 'fulfilled' && Array.isArray(result.value) && result.value.length > 0) {
                allResults = allResults.concat(result.value);
            } else if (result.status === 'rejected') {
                console.warn("一个搜索源失败了:", result.reason); // 打印失败，但不中断
            }
        });

        // 对搜索结果进行排序：按名称优先，名称相同时按接口源排序
        allResults.sort((a, b) => {
            const nameCompare = (a.vod_name || '').localeCompare(b.vod_name || '');
            if (nameCompare !== 0) return nameCompare;
            return (a.source_name || '').localeCompare(b.source_name || '');
        });

        // 更新搜索结果计数
        const searchResultsCount = document.getElementById('searchResultsCount');
        if (searchResultsCount) {
            searchResultsCount.textContent = allResults.length;
        }

        // 显示结果区域，调整搜索区域
        document.getElementById('searchArea').classList.remove('flex-1');
        document.getElementById('searchArea').classList.add('mb-8');
        document.getElementById('resultsArea').classList.remove('hidden');

        // 隐藏豆瓣推荐区域（如果存在）
        const doubanArea = document.getElementById('doubanArea');
        if (doubanArea) {
            doubanArea.classList.add('hidden');
        }

        const resultsDiv = document.getElementById('results');

        // 如果没有结果
        if (!allResults || allResults.length === 0) {
            resultsDiv.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-gray-400">没有找到匹配的结果</h3>
                    <p class="mt-1 text-sm text-gray-500">请尝试其他关键词或更换数据源</p>
                </div>
            `;
            hideLoading();
            return;
        }

        // 有搜索结果时，才更新URL
        try {
            // ... (更新 URL 逻辑不变) ...
            const encodedQuery = encodeURIComponent(query);
            window.history.pushState(
                { search: query },
                `搜索: ${query} - LibreTV`,
                `/s=${encodedQuery}`
            );
            document.title = `搜索: ${query} - LibreTV`;
        } catch (e) {
            console.error('更新浏览器历史失败:', e);
        }

        // 处理搜索结果过滤
        const yellowFilterEnabled = localStorage.getItem('yellowFilterEnabled') === 'true';
        if (yellowFilterEnabled) {
            // ... (过滤逻辑不变) ...
            const banned = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑', '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码', '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];
            allResults = allResults.filter(item => {
                const typeName = item.type_name || '';
                return !banned.some(keyword => typeName.includes(keyword));
            });
        }

        // 添加XSS保护，使用textContent和属性转义
        const safeResults = allResults.map(item => {
            // ... (原版的 innerHTML 字符串拼接逻辑不变) ...
            const safeId = item.vod_id ? item.vod_id.toString().replace(/[^\w-]/g, '') : '';
            const safeName = (item.vod_name || '').toString()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            const sourceInfo = item.source_name ?
                `<span class="bg-[#222] text-xs px-1.5 py-0.5 rounded-full">${item.source_name}</span>` : '';
            const sourceCode = item.source_code || '';
            const apiUrlAttr = item.api_url ?
                `data-api-url="${item.api_url.replace(/"/g, '&quot;')}"` : '';
            const hasCover = item.vod_pic && item.vod_pic.startsWith('http');

            return `
                <div class="card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-full shadow-sm hover:shadow-md" 
                     onclick="showDetails('${safeId}','${safeName}','${sourceCode}')" ${apiUrlAttr}>
                    <div class="flex h-full">
                        ${hasCover ? `
                        <div class="relative flex-shrink-0 search-card-img-container">
                            <img src="${item.vod_pic}" alt="${safeName}" 
                                 class="h-full w-full object-cover transition-transform hover:scale-110" 
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=无封面'; this.classList.add('object-contain');" 
                                 loading="lazy">
                            <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
                        </div>` : ''}
                        
                        <div class="p-2 flex flex-col flex-grow">
                            <div class="flex-grow">
                                <h3 class="font-semibold mb-2 break-words line-clamp-2 ${hasCover ? '' : 'text-center'}" title="${safeName}">${safeName}</h3>
                                
                                <div class="flex flex-wrap ${hasCover ? '' : 'justify-center'} gap-1 mb-2">
                                    ${(item.type_name || '').toString().replace(/</g, '&lt;') ?
                    `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-blue-500 text-blue-300">
                                          ${(item.type_name || '').toString().replace(/</g, '&lt;')}
                                      </span>` : ''}
                                    ${(item.vod_year || '') ?
                    `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-purple-500 text-purple-300">
                                          ${item.vod_year}
                                      </span>` : ''}
                                </div>
                                <p class="text-gray-400 line-clamp-2 overflow-hidden ${hasCover ? '' : 'text-center'} mb-2">
                                    ${(item.vod_remarks || '暂无介绍').toString().replace(/</g, '&lt;')}
                                </p>
                            </div>
                            
                            <div class="flex justify-between items-center mt-1 pt-1 border-t border-gray-800">
                                ${sourceInfo ? `<div>${sourceInfo}</div>` : '<div></div>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        resultsDiv.innerHTML = safeResults;
    } catch (error) {
        // (修复) catch 块现在只会在极少数情况下触发，例如 saveSearchHistory 失败
        console.error('搜索时发生意外错误:', error);
        if (error.name === 'AbortError') {
            showToast('搜索请求超时，请检查网络连接', 'error');
        } else {
            showToast('搜索请求失败，请稍后重试', 'error');
        }
    } finally {
        hideLoading();
    }
}

// 切换清空按钮的显示状态
function toggleClearButton() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearchInput');
    if (searchInput.value !== '') {
        clearButton.classList.remove('hidden');
    } else {
        clearButton.classList.add('hidden');
    }
}

// 清空搜索框内容
function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    const clearButton = document.getElementById('clearSearchInput');
    clearButton.classList.add('hidden');
}

// 劫持搜索框的value属性以检测外部修改
function hookInput() {
    const input = document.getElementById('searchInput');
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    // 重写 value 属性的 getter 和 setter
    Object.defineProperty(input, 'value', {
        get: function () {
            // 确保读取时返回字符串（即使原始值为 undefined/null）
            const originalValue = descriptor.get.call(this);
            return originalValue != null ? String(originalValue) : '';
        },
        set: function (value) {
            // 显式将值转换为字符串后写入
            const strValue = String(value);
            descriptor.set.call(this, strValue);
            this.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // 初始化输入框值为空字符串（避免初始值为 undefined）
    input.value = '';
}
document.addEventListener('DOMContentLoaded', hookInput);

// (Replaced) showDetails - Uses safe DOM methods for details and episodes
async function showDetails(id, vod_name, sourceCode) {
    // Password check (remains the same)
     if (window.isPasswordProtected && window.isPasswordVerified) {
         if (window.isPasswordProtected() && !window.isPasswordVerified()) {
             showPasswordModal && showPasswordModal();
             return;
         }
     }
    if (!id) {
        showToast('Invalid video ID', 'error');
        return;
    }

    showLoading();
    try {
        // API parameter building (remains the same)
        let apiParams = '';
        let sourceNameForDisplay = ''; // To store the friendly name
        const customAPIsList = JSON.parse(localStorage.getItem('customAPIs') || '[]'); // Fetch once

        if (sourceCode.startsWith('custom_')) {
            const customIndex = sourceCode.replace('custom_', '');
            const customApi = getCustomApiInfo(customIndex, customAPIsList); // Use helper
            if (!customApi) throw new Error('Invalid custom API configuration');

            sourceNameForDisplay = customApi.name || 'Custom Source'; // Get friendly name
            if (customApi.detail) {
                apiParams = `&customApi=${encodeURIComponent(customApi.url)}&customDetail=${encodeURIComponent(customApi.detail)}&source=custom`;
            } else {
                apiParams = `&customApi=${encodeURIComponent(customApi.url)}&source=custom`;
            }
        } else {
             // Ensure API_SITES is accessible (might need to load config.js if not already)
             if (typeof API_SITES !== 'undefined' && API_SITES[sourceCode]) {
                 sourceNameForDisplay = API_SITES[sourceCode].name || sourceCode; // Get friendly name
             } else {
                 sourceNameForDisplay = sourceCode; // Fallback
             }
            apiParams = `&source=${sourceCode}`;
        }


        const timestamp = new Date().getTime();
        const cacheBuster = `&_t=${timestamp}`;
        const response = await fetch(`/api/detail?id=${encodeURIComponent(id)}${apiParams}${cacheBuster}`);
        const data = await response.json();

        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = ''; // Clear previous content

        // Set Modal Title Safely
        const titleSpan = document.createElement('span');
        titleSpan.className = 'break-words';
        titleSpan.textContent = vod_name || 'Unknown Video';
        modalTitle.innerHTML = ''; // Clear previous
        modalTitle.appendChild(titleSpan);

        if (sourceNameForDisplay) {
            const sourceSpan = document.createElement('span');
            sourceSpan.className = 'text-sm font-normal text-gray-400';
            sourceSpan.textContent = ` (${sourceNameForDisplay})`;
            modalTitle.appendChild(sourceSpan);
        }

        currentVideoTitle = vod_name || 'Unknown Video'; // Update global title

        if (data.episodes && data.episodes.length > 0) {
            currentEpisodes = data.episodes; // Update global episodes list
            currentEpisodeIndex = 0; // Reset index

            // Render Detail Info Safely
            if (data.videoInfo) {
                const detailInfoDiv = document.createElement('div');
                detailInfoDiv.className = 'modal-detail-info mb-4'; // Added margin

                const hasGridContent = data.videoInfo.type || data.videoInfo.year || data.videoInfo.area || data.videoInfo.director || data.videoInfo.actor || data.videoInfo.remarks;
                if (hasGridContent) {
                    const gridDiv = document.createElement('div');
                    gridDiv.className = 'detail-grid';
                    const items = [
                        { label: 'Type:', value: data.videoInfo.type },
                        { label: 'Year:', value: data.videoInfo.year },
                        { label: 'Area:', value: data.videoInfo.area },
                        { label: 'Director:', value: data.videoInfo.director },
                        { label: 'Actor:', value: data.videoInfo.actor },
                        { label: 'Remarks:', value: data.videoInfo.remarks }
                    ];
                    items.forEach(item => {
                        if (item.value) {
                            const itemDiv = document.createElement('div');
                            itemDiv.className = 'detail-item';
                            const labelSpan = document.createElement('span');
                            labelSpan.className = 'detail-label';
                            labelSpan.textContent = item.label;
                            const valueSpan = document.createElement('span');
                            valueSpan.className = 'detail-value';
                            valueSpan.textContent = item.value; // Safe
                            itemDiv.appendChild(labelSpan);
                            itemDiv.appendChild(valueSpan);
                            gridDiv.appendChild(itemDiv);
                        }
                    });
                    detailInfoDiv.appendChild(gridDiv);
                }

                // Prepare description text safely
                const descriptionText = (data.videoInfo.desc || '').replace(/<[^>]+>/g, '').trim(); // Strip HTML
                if (descriptionText) {
                    const descDiv = document.createElement('div');
                    descDiv.className = 'detail-desc mt-2'; // Added margin
                    const descLabel = document.createElement('p');
                    descLabel.className = 'detail-label';
                    descLabel.textContent = 'Synopsis:';
                    const descContent = document.createElement('p');
                    descContent.className = 'detail-desc-content';
                    descContent.textContent = descriptionText; // Safe
                    descDiv.appendChild(descLabel);
                    descDiv.appendChild(descContent);
                    detailInfoDiv.appendChild(descDiv);
                }
                 modalContent.appendChild(detailInfoDiv); // Add details to modal
            }


            // Render Control Bar (Sort, Count, Copy)
            const controlBarDiv = document.createElement('div');
            controlBarDiv.className = 'flex flex-wrap items-center justify-between mb-4 gap-2';

            const leftControls = document.createElement('div');
            leftControls.className = 'flex items-center gap-2';

            // Sort Button
            const sortButton = document.createElement('button');
            sortButton.className = 'px-3 py-1.5 bg-[#333] hover:bg-[#444] border border-[#444] rounded text-sm transition-colors flex items-center gap-1';
            const sortIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            sortIcon.setAttribute('class', `w-4 h-4 transform ${episodesReversed ? 'rotate-180' : ''}`);
            sortIcon.setAttribute('fill', 'none');
            sortIcon.setAttribute('stroke', 'currentColor');
            sortIcon.setAttribute('viewBox', '0 0 24 24');
            sortIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>';
            const sortSpan = document.createElement('span');
            sortSpan.textContent = episodesReversed ? 'Ascending' : 'Descending';
            sortButton.appendChild(sortIcon);
            sortButton.appendChild(sortSpan);
            sortButton.addEventListener('click', () => {
                 // Call toggle function, passing necessary info to re-render
                 toggleEpisodeOrder(sourceCode, id, vod_name);
                 // Update button text/icon immediately
                 sortSpan.textContent = episodesReversed ? 'Ascending' : 'Descending';
                 sortIcon.style.transform = episodesReversed ? 'rotate(180deg)' : 'rotate(0deg)';
            });
            leftControls.appendChild(sortButton);


            // Episode Count
            const countSpan = document.createElement('span');
            countSpan.className = 'text-gray-400 text-sm';
            countSpan.textContent = `Total ${data.episodes.length} episodes`; // Safe
            leftControls.appendChild(countSpan);

            controlBarDiv.appendChild(leftControls);

            // Copy Button
            const copyButton = document.createElement('button');
            copyButton.className = 'px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors';
            copyButton.textContent = 'Copy Links';
            copyButton.addEventListener('click', copyLinks); // Assumes copyLinks exists
            controlBarDiv.appendChild(copyButton);

            modalContent.appendChild(controlBarDiv); // Add controls to modal

            // Render Episodes Grid
            const episodesGridContainer = document.createElement('div');
            episodesGridContainer.id = 'episodesGrid'; // Keep ID for potential updates
            episodesGridContainer.className = 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2';
             renderEpisodes(episodesGridContainer, vod_name, sourceCode, id); // Pass container
            modalContent.appendChild(episodesGridContainer);


        } else {
            // No Episodes Found Message
            const noEpisodesDiv = document.createElement('div');
            noEpisodesDiv.className = 'text-center py-8';
            noEpisodesDiv.innerHTML = `
                <div class="text-red-400 mb-2">❌ No playback resources found</div>
                <div class="text-gray-500 text-sm">This video might not be available currently. Please try another one.</div>
            `;
            modalContent.appendChild(noEpisodesDiv);
        }

        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching details:', error);
        showToast('Failed to fetch details, please try again later', 'error');
    } finally {
        hideLoading();
    }
}

// (Replaced) playVideo function - Passes essential info via URL
function playVideo(url, vod_name, sourceCode, episodeIndex = 0, vodId = '') {
    // Password protection check (remains the same)
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }

    // Ensure essential parameters are present
    const safe_vod_name = vod_name || '未知视频';
    const safe_sourceCode = sourceCode || '';
    const safe_vodId = vodId || ''; // vodId might be empty for direct link plays, but needed for fetching details
    const safe_episodeIndex = parseInt(episodeIndex, 10) || 0;
    const safe_url = url || '';

    // Save episodes to localStorage (still useful for player navigation and source switching)
    try {
        // Only save if currentEpisodes is a valid array
        if (Array.isArray(currentEpisodes)) {
             localStorage.setItem('currentEpisodes', JSON.stringify(currentEpisodes));
        } else {
             localStorage.removeItem('currentEpisodes'); // Clear invalid data
        }
        // Save other potentially useful context
        localStorage.setItem('currentVideoTitle', safe_vod_name);
        localStorage.setItem('currentEpisodeIndex', safe_episodeIndex);
        localStorage.setItem('currentSourceCode', safe_sourceCode);
        localStorage.setItem('lastPlayTime', Date.now());
        localStorage.setItem('lastPageUrl', window.location.href); // Save return URL
    } catch (e) {
        console.error('Failed to save state to localStorage:', e);
    }

    // Construct watch URL with all necessary parameters
    const watchUrlParams = new URLSearchParams({
        id: safe_vodId,
        source: safe_sourceCode,
        url: safe_url, // URL encode happens automatically with URLSearchParams
        index: safe_episodeIndex,
        title: safe_vod_name
        // 'back' parameter is omitted, player.js's goBack handles return logic
    });

    const watchUrl = `watch.html?${watchUrlParams.toString()}`;

    // Navigate to the player page in the current tab
    window.location.href = watchUrl;
}

// 弹出播放器页面
function showVideoPlayer(url) {
    // 在打开播放器前，隐藏详情弹窗
    const detailModal = document.getElementById('modal');
    if (detailModal) {
        detailModal.classList.add('hidden');
    }
    // 临时隐藏搜索结果和豆瓣区域，防止高度超出播放器而出现滚动条
    document.getElementById('resultsArea').classList.add('hidden');
    document.getElementById('doubanArea').classList.add('hidden');
    // 在框架中打开播放页面
    videoPlayerFrame = document.createElement('iframe');
    videoPlayerFrame.id = 'VideoPlayerFrame';
    videoPlayerFrame.className = 'fixed w-full h-screen z-40';
    videoPlayerFrame.src = url;
    document.body.appendChild(videoPlayerFrame);
    // 将焦点移入iframe
    videoPlayerFrame.focus();
}

// 关闭播放器页面
function closeVideoPlayer(home = false) {
    videoPlayerFrame = document.getElementById('VideoPlayerFrame');
    if (videoPlayerFrame) {
        videoPlayerFrame.remove();
        // 恢复搜索结果显示
        document.getElementById('resultsArea').classList.remove('hidden');
        // 关闭播放器时也隐藏详情弹窗
        const detailModal = document.getElementById('modal');
        if (detailModal) {
            detailModal.classList.add('hidden');
        }
        // 如果启用豆瓣区域则显示豆瓣区域
        if (localStorage.getItem('doubanEnabled') === 'true') {
            document.getElementById('doubanArea').classList.remove('hidden');
        }
    }
    if (home) {
        // 刷新主页
        window.location.href = '/'
    }
}

// 播放上一集
function playPreviousEpisode(sourceCode) {
    if (currentEpisodeIndex > 0) {
        const prevIndex = currentEpisodeIndex - 1;
        const prevUrl = currentEpisodes[prevIndex];
        playVideo(prevUrl, currentVideoTitle, sourceCode, prevIndex);
    }
}

// 播放下一集
function playNextEpisode(sourceCode) {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
        const nextIndex = currentEpisodeIndex + 1;
        const nextUrl = currentEpisodes[nextIndex];
        playVideo(nextUrl, currentVideoTitle, sourceCode, nextIndex);
    }
}

// 处理播放器加载错误
function handlePlayerError() {
    hideLoading();
    showToast('视频播放加载失败，请尝试其他视频源', 'error');
}

// (Replaced) renderEpisodes (app.js version) - Renders into a container using safe DOM methods
// Takes container element as first argument
function renderEpisodes(container, vodName, sourceCode, vodId) {
    if (!container) return;
    container.innerHTML = ''; // Clear previous buttons

    const episodesToRender = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;

    episodesToRender.forEach((episodeUrl, index) => {
        const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;

        const button = document.createElement('button');
        button.id = `episode-${realIndex}`;
        button.className = 'px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors text-center episode-btn';
        button.textContent = realIndex + 1; // Display episode number safely

        // Use addEventListener for click handling
        button.addEventListener('click', () => {
            // Ensure vodName is passed correctly (it should be the original, unescaped name)
            playVideo(episodeUrl, vodName, sourceCode, realIndex, vodId);
        });

        container.appendChild(button);
    });
}

// 复制视频链接到剪贴板
function copyLinks() {
    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
    const linkList = episodes.join('\r\n');
    navigator.clipboard.writeText(linkList).then(() => {
        showToast('播放链接已复制', 'success');
    }).catch(err => {
        showToast('复制失败，请检查浏览器权限', 'error');
    });
}

// (Modified) toggleEpisodeOrder - Needs vod_name to re-render correctly
function toggleEpisodeOrder(sourceCode, vodId, vodName) { // Added vodName
    episodesReversed = !episodesReversed;
    // Re-render episode grid
    const episodesGridContainer = document.getElementById('episodesGrid');
    if (episodesGridContainer) {
         renderEpisodes(episodesGridContainer, vodName, sourceCode, vodId); // Pass container and name
    }

    // Update sort button in the modal (if it's currently open)
    // Note: This assumes the button's structure hasn't changed drastically
    const sortButton = document.querySelector('#modalContent button[onclick*="toggleEpisodeOrder"]'); // Find button more dynamically
     if (sortButton) {
         const sortSpan = sortButton.querySelector('span');
         const sortIcon = sortButton.querySelector('svg');
         if(sortSpan) sortSpan.textContent = episodesReversed ? 'Ascending' : 'Descending';
         if(sortIcon) sortIcon.style.transform = episodesReversed ? 'rotate(180deg)' : 'rotate(0deg)';
     }
}

// 从URL导入配置
async function importConfigFromUrl() {
    // 创建模态框元素
    let modal = document.getElementById('importUrlModal');
    if (modal) {
        document.body.removeChild(modal);
    }

    modal = document.createElement('div');
    modal.id = 'importUrlModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40';

    modal.innerHTML = `
        <div class="bg-[#191919] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button id="closeUrlModal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
            
            <h3 class="text-xl font-bold mb-4">从URL导入配置</h3>
            
            <div class="mb-4">
                <input type="text" id="configUrl" placeholder="输入配置文件URL" 
                       class="w-full px-3 py-2 bg-[#222] border border-[#333] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
            </div>
            
            <div class="flex justify-end space-x-2">
                <button id="confirmUrlImport" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">导入</button>
                <button id="cancelUrlImport" class="bg-[#444] hover:bg-[#555] text-white px-4 py-2 rounded">取消</button>
            </div>
        </div>`;

    document.body.appendChild(modal);

    // 关闭按钮事件
    document.getElementById('closeUrlModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // 取消按钮事件
    document.getElementById('cancelUrlImport').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // 确认导入按钮事件
    document.getElementById('confirmUrlImport').addEventListener('click', async () => {
        const url = document.getElementById('configUrl').value.trim();
        if (!url) {
            showToast('请输入配置文件URL', 'warning');
            return;
        }

        // 验证URL格式
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                showToast('URL必须以http://或https://开头', 'warning');
                return;
            }
        } catch (e) {
            showToast('URL格式不正确', 'warning');
            return;
        }

        showLoading('正在从URL导入配置...');

        try {
            // 获取配置文件 - 直接请求URL
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw '获取配置文件失败';

            // 验证响应内容类型
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw '响应不是有效的JSON格式';
            }

            const config = await response.json();
            if (config.name !== 'LibreTV-Settings') throw '配置文件格式不正确';

            // 验证哈希
            const dataHash = await sha256(JSON.stringify(config.data));
            if (dataHash !== config.hash) throw '配置文件哈希值不匹配';

            // 导入配置
            for (let item in config.data) {
                localStorage.setItem(item, config.data[item]);
            }

            showToast('配置文件导入成功，3 秒后自动刷新本页面。', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            const message = typeof error === 'string' ? error : '导入配置失败';
            showToast(`从URL导入配置出错 (${message})`, 'error');
        } finally {
            hideLoading();
            document.body.removeChild(modal);
        }
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 配置文件导入功能
async function importConfig() {
    showImportBox(async (file) => {
        try {
            // 检查文件类型
            if (!(file.type === 'application/json' || file.name.endsWith('.json'))) throw '文件类型不正确';

            // 检查文件大小
            if (file.size > 1024 * 1024 * 10) throw new Error('文件大小超过 10MB');

            // 读取文件内容
            const content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject('文件读取失败');
                reader.readAsText(file);
            });

            // 解析并验证配置
            const config = JSON.parse(content);
            if (config.name !== 'LibreTV-Settings') throw '配置文件格式不正确';

            // 验证哈希
            const dataHash = await sha256(JSON.stringify(config.data));
            if (dataHash !== config.hash) throw '配置文件哈希值不匹配';

            // 导入配置
            for (let item in config.data) {
                localStorage.setItem(item, config.data[item]);
            }

            showToast('配置文件导入成功，3 秒后自动刷新本页面。', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            const message = typeof error === 'string' ? error : '配置文件格式错误';
            showToast(`配置文件读取出错 (${message})`, 'error');
        }
    });
}

// 配置文件导出功能
async function exportConfig() {
    // 存储配置数据
    const config = {};
    const items = {};

    const settingsToExport = [
        'selectedAPIs',
        'customAPIs',
        'yellowFilterEnabled',
        'adFilteringEnabled',
        'doubanEnabled',
        'hasInitializedDefaults'
    ];

    // 导出设置项
    settingsToExport.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
            items[key] = value;
        }
    });

    // 导出历史记录
    const viewingHistory = localStorage.getItem('viewingHistory');
    if (viewingHistory) {
        items['viewingHistory'] = viewingHistory;
    }

    const searchHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (searchHistory) {
        items[SEARCH_HISTORY_KEY] = searchHistory;
    }

    const times = Date.now().toString();
    config['name'] = 'LibreTV-Settings';  // 配置文件名，用于校验
    config['time'] = times;               // 配置文件生成时间
    config['cfgVer'] = '1.0.0';           // 配置文件版本
    config['data'] = items;               // 配置文件数据
    config['hash'] = await sha256(JSON.stringify(config['data']));  // 计算数据的哈希值，用于校验

    // 将配置数据保存为 JSON 文件
    saveStringAsFile(JSON.stringify(config), 'LibreTV-Settings_' + times + '.json');
}

// 将字符串保存为文件
function saveStringAsFile(content, fileName) {
    // 创建Blob对象并指定类型
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    // 生成临时URL
    const url = window.URL.createObjectURL(blob);
    // 创建<a>标签并触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    // 清理临时对象
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// 移除Node.js的require语句，因为这是在浏览器环境中运行的

// --- (新增) API 健康检查功能 ---

/**
 * 异步测试单个API的健康状况
 * @param {string} apiKey - API的键 (例如 "tyyszy" 或 "custom_0")
 */
async function testApi(apiKey) {
    const isCustom = apiKey.startsWith('custom_');
    const statusElement = document.getElementById(isCustom ? `status_${apiKey}` : `status_api_${apiKey}`);
    
    if (!statusElement) return; // 找不到状态元素

    // 设置基础样式
    let baseClasses = 'api-status';
    if (isCustom) {
        baseClasses += ' ml-2';
    } else {
        baseClasses += ' ml-auto';
    }

    // 1. 设置为 "测试中" 状态
    statusElement.className = `${baseClasses} testing`;
    statusElement.title = '正在测试...';

    const startTime = performance.now();
    let latency = -1;
    let status = 'bad'; // 默认失败

    try {
        // 检查 searchByAPIAndKeyWord 是否存在 (它在 search.js 中)
        if (typeof searchByAPIAndKeyWord !== 'function') {
            throw new Error('searchByAPIAndKeyWord 函数未定义');
        }
        
        // (修复) 正确传递全局变量 customAPIs
        const results = await searchByAPIAndKeyWord(apiKey, "test", customAPIs);
        const endTime = performance.now();
        latency = Math.round(endTime - startTime);

        // 检查返回结果是否有效
        if (Array.isArray(results)) {
            // 即使返回 0 个结果，也算 API 响应成功
            if (latency < 1000) {
                status = 'good';
            } else if (latency < 3000) {
                status = 'medium';
            } else {
                status = 'bad'; // 响应太慢
            }
        } else {
            // API 返回了无效数据 (非数组)
            status = 'bad';
        }

    } catch (error) {
        // 请求失败 (超时、网络错误、JSON解析失败等)
        console.warn(`API 测试失败 ${apiKey}:`, error);
        status = 'bad';
    }

    // 2. 更新最终状态
    statusElement.className = `${baseClasses} ${status}`;
    if (status === 'bad') {
        statusElement.title = '失效 / 超时';
    } else if (status === 'medium') {
         statusElement.title = `缓慢 (延迟: ${latency}ms)`;
    } else {
        statusElement.title = `畅通 (延迟: ${latency}ms)`;
    }
}

/**
 * (新增) 运行所有 API 的健康检查
 * 由 "测试所有源" 按钮触发
 */
async function testAllApis() {
    // 检查 searchByAPIAndKeyWord 是否存在
    if (typeof searchByAPIAndKeyWord !== 'function') {
        showToast('搜索功能 (search.js) 尚未加载!', 'error');
        return;
    }

    showToast('开始测试所有API源...', 'info');

    const testPromises = [];

    // 1. 获取所有内置 API
    if (typeof API_SITES !== 'undefined') {
        Object.keys(API_SITES).forEach(apiKey => {
            // 为每个 API 创建一个测试 Promise
            testPromises.push(testApi(apiKey));
        });
    }

    // 2. 获取所有自定义 API
    customAPIs.forEach((api, index) => {
        const apiKey = `custom_${index}`;
        testPromises.push(testApi(apiKey));
    });

    // 3. 并行运行所有测试，并等待它们全部完成
    await Promise.allSettled(testPromises);

    showToast('API源测试完成!', 'success');
}