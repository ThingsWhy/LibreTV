// 全局常量：统一管理默认选中的API源
// 整合了用户反馈的高质量源：电影天堂, 天涯, 如意, 无尽, 暴风
const DEFAULT_SELECTED_APIS = ["dyttzy", "tyyszy", "ruyi", "wujin", "bfzy"];

// 全局变量
// 1. 获取存储的值，如果没有则使用 DEFAULT_SELECTED_APIS 作为兜底
let selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || 'null');
if (!selectedAPIs || !Array.isArray(selectedAPIs)) {
    selectedAPIs = [...DEFAULT_SELECTED_APIS];
}

let customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]'); // 存储自定义API列表

// 添加当前播放的集数索引
let currentEpisodeIndex = 0;
// 添加当前视频的所有集数
let currentEpisodes = [];
// 添加当前视频的标题
let currentVideoTitle = '';
// 全局变量用于倒序状态
let episodesReversed = false;
// 全局聚合结果Map
let aggregatedResultsMap = new Map();

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

    // 设置默认API选择（如果是第一次加载，或者 localStorage 被意外清空或标记未初始化）
    if (!localStorage.getItem('hasInitializedDefaults')) {
        // 强制使用统一的默认列表
        selectedAPIs = [...DEFAULT_SELECTED_APIS];
        localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

        // 默认选中过滤开关
        localStorage.setItem('yellowFilterEnabled', 'true');
        localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, 'true');

        // 默认启用豆瓣功能
        localStorage.setItem('doubanEnabled', 'true');

        // 标记已初始化默认值
        localStorage.setItem('hasInitializedDefaults', 'true');
        
        // 刷新一下复选框状态以匹配新的默认值
        initAPICheckboxes();
        updateSelectedApiCount();
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

// 初始化API复选框 - 添加状态指示器
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
        if (api.adult) return; // 跳过成人内容API

        const checked = selectedAPIs.includes(apiKey);

        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center';
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
    checkAdultAPIsSelected();
}

// 添加成人API列表
function addAdultAPI() {
    if (!HIDE_BUILTIN_ADULT_APIS && (localStorage.getItem('yellowFilterEnabled') === 'false')) {
        const container = document.getElementById('apiCheckboxes');
        if (!container) return;

        const adultdiv = document.createElement('div');
        adultdiv.id = 'adultdiv';
        adultdiv.className = 'grid grid-cols-2 gap-2';
        const adultTitle = document.createElement('div');
        adultTitle.className = 'api-group-title adult';
        adultTitle.innerHTML = `黄色资源采集站 <span class="adult-warning"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></span>`;
        adultdiv.appendChild(adultTitle);

        Object.keys(API_SITES).forEach(apiKey => {
            const api = API_SITES[apiKey];
            if (!api.adult) return;

            const checked = selectedAPIs.includes(apiKey);
            const checkbox = document.createElement('div');
            checkbox.className = 'flex items-center';
            checkbox.innerHTML = `
                <input type="checkbox" id="api_${apiKey}" 
                       class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333] api-adult" 
                       ${checked ? 'checked' : ''} 
                       data-api="${apiKey}">
                <label for="api_${apiKey}" class="ml-1 text-xs text-pink-400 truncate">${api.name}</label>
                <span class="api-status ml-auto" id="status_api_${apiKey}" title="未测试"></span>
            `;
            adultdiv.appendChild(checkbox);

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
    const adultBuiltinCheckboxes = document.querySelectorAll('#apiCheckboxes .api-adult:checked');
    const customApiCheckboxes = document.querySelectorAll('#customApisList .api-adult:checked');
    const hasAdultSelected = adultBuiltinCheckboxes.length > 0 || customApiCheckboxes.length > 0;

    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    const yellowFilterContainer = yellowFilterToggle ? yellowFilterToggle.closest('div').parentNode : null;
    
    if(!yellowFilterContainer) return;

    const filterDescription = yellowFilterContainer.querySelector('p.filter-description');

    if (hasAdultSelected) {
        yellowFilterToggle.checked = false;
        yellowFilterToggle.disabled = true;
        localStorage.setItem('yellowFilterEnabled', 'false');
        yellowFilterContainer.classList.add('filter-disabled');
        if (filterDescription) filterDescription.innerHTML = '<strong class="text-pink-300">选中黄色资源站时无法启用此过滤</strong>';
    } else {
        yellowFilterToggle.disabled = false;
        yellowFilterContainer.classList.remove('filter-disabled');
        if (filterDescription) filterDescription.innerHTML = '过滤"伦理片"等黄色内容';
    }
}

// 渲染自定义API列表
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

// 编辑和更新自定义API相关函数保持不变...
// (略过 editCustomApi, updateCustomApi, cancelEditCustomApi, restoreAddCustomApiButtons 等辅助UI函数，它们逻辑通常不需要变更，保持原样即可)
// 为了完整性，这里保留核心引用
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
function updateCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const name = document.getElementById('customApiName').value.trim();
    let url = document.getElementById('customApiUrl').value.trim();
    const detail = document.getElementById('customApiDetail') ? document.getElementById('customApiDetail').value.trim() : '';
    const isAdult = document.getElementById('customApiIsAdult') ? document.getElementById('customApiIsAdult').checked : false;
    if (!name || !url) return showToast('请输入API名称和链接', 'warning');
    if (!/^https?:\/\/.+/.test(url)) return showToast('API链接格式错误', 'warning');
    if (url.endsWith('/')) url = url.slice(0, -1);
    
    customAPIs[index] = { name, url, detail, isAdult };
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    renderCustomAPIsList();
    checkAdultAPIsSelected();
    restoreAddCustomApiButtons();
    cancelEditCustomApi(); // Clear and hide form
    showToast('已更新: ' + name, 'success');
}
function cancelEditCustomApi() {
    document.getElementById('customApiName').value = '';
    document.getElementById('customApiUrl').value = '';
    document.getElementById('customApiDetail').value = '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    restoreAddCustomApiButtons();
}
function restoreAddCustomApiButtons() {
    const form = document.getElementById('addCustomApiForm');
    const buttonContainer = form.querySelector('div:last-child');
    buttonContainer.innerHTML = `
        <button onclick="addCustomApi()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">添加</button>
        <button onclick="cancelAddCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
    `;
}
function addCustomApi() {
    const name = document.getElementById('customApiName').value.trim();
    let url = document.getElementById('customApiUrl').value.trim();
    const detail = document.getElementById('customApiDetail') ? document.getElementById('customApiDetail').value.trim() : '';
    const isAdult = document.getElementById('customApiIsAdult') ? document.getElementById('customApiIsAdult').checked : false;
    if (!name || !url) return showToast('请输入API名称和链接', 'warning');
    if (!/^https?:\/\/.+/.test(url)) return showToast('API链接格式错误', 'warning');
    if (url.endsWith('/')) url = url.slice(0, -1);

    customAPIs.push({ name, url, detail, isAdult });
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    const newApiIndex = customAPIs.length - 1;
    selectedAPIs.push('custom_' + newApiIndex);
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));

    renderCustomAPIsList();
    updateSelectedApiCount();
    checkAdultAPIsSelected();
    cancelEditCustomApi(); 
    showToast('已添加: ' + name, 'success');
}
function cancelAddCustomApi() {
    cancelEditCustomApi();
}
function removeCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    const apiName = customAPIs[index].name;
    customAPIs.splice(index, 1);
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    
    // 更新选中列表
    const customApiId = 'custom_' + index;
    selectedAPIs = selectedAPIs.filter(id => id !== customApiId);
    // 调整剩余自定义API的ID引用
    selectedAPIs = selectedAPIs.map(id => {
        if (id.startsWith('custom_')) {
            const current = parseInt(id.replace('custom_', ''));
            if (current > index) return 'custom_' + (current - 1);
        }
        return id;
    });
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    
    renderCustomAPIsList();
    updateSelectedApiCount();
    checkAdultAPIsSelected();
    showToast('已移除: ' + apiName, 'info');
}

// 更新选中的API列表
function updateSelectedAPIs() {
    const builtInApis = Array.from(document.querySelectorAll('#apiCheckboxes input:checked')).map(i => i.dataset.api);
    const customApiIndices = Array.from(document.querySelectorAll('#customApisList input:checked')).map(i => 'custom_' + i.dataset.customIndex);
    selectedAPIs = [...builtInApis, ...customApiIndices];
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    updateSelectedApiCount();
}

function updateSelectedApiCount() {
    const countEl = document.getElementById('selectedApiCount');
    if (countEl) countEl.textContent = selectedAPIs.length;
}

function selectAllAPIs(selectAll = true, excludeAdult = false) {
    document.querySelectorAll('#apiCheckboxes input[type="checkbox"]').forEach(cb => {
        if (excludeAdult && cb.classList.contains('api-adult')) cb.checked = false;
        else cb.checked = selectAll;
    });
    updateSelectedAPIs();
    checkAdultAPIsSelected();
}

function showAddCustomApiForm() {
    document.getElementById('addCustomApiForm').classList.remove('hidden');
}

function toggleSettings(e) {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;
    const hasAdminPassword = window.__ENV__?.ADMINPASSWORD && window.__ENV__.ADMINPASSWORD.length === 64 && !/^0+$/.test(window.__ENV__.ADMINPASSWORD);
    
    if (settingsPanel.classList.contains('show')) {
        settingsPanel.classList.remove('show');
    } else {
        if (hasAdminPassword && !isAdminVerified()) {
            e.preventDefault(); e.stopPropagation();
            showAdminPasswordModal();
            return;
        }
        settingsPanel.classList.add('show');
    }
    if (e) { e.preventDefault(); e.stopPropagation(); }
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') search();
    });

    document.addEventListener('click', function (e) {
        const settingsPanel = document.querySelector('#settingsPanel.show');
        const settingsButton = document.querySelector('#settingsPanel .close-btn');
        if (settingsPanel && settingsButton && !settingsPanel.contains(e.target) && !settingsButton.contains(e.target)) {
            settingsPanel.classList.remove('show');
        }
        const historyPanel = document.querySelector('#historyPanel.show');
        const historyButton = document.querySelector('#historyPanel .close-btn');
        if (historyPanel && historyButton && !historyPanel.contains(e.target) && !historyButton.contains(e.target)) {
            historyPanel.classList.remove('show');
        }
    });

    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.addEventListener('change', function (e) {
            localStorage.setItem('yellowFilterEnabled', e.target.checked);
            const adultdiv = document.getElementById('adultdiv');
            if (adultdiv) {
                adultdiv.style.display = e.target.checked ? 'none' : '';
            } else {
                addAdultAPI(); // Re-render if switching off
            }
        });
    }

    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.addEventListener('change', function (e) {
            localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, e.target.checked);
        });
    }
}

// 辅助函数
function getCustomApiInfo(customApiIndex) {
    const index = parseInt(customApiIndex);
    if (isNaN(index) || index < 0 || index >= customAPIs.length) return null;
    return customAPIs[index];
}

function normalizeTitle(title) {
    if (!title) return '';
    return title.toString().toLowerCase()
        .replace(/hd|fhd|4k|1080p|720p|蓝光|高清|超清/g, '')
        .trim();
}

// 聚合逻辑：处理结果
function processAndAggregate(results, aggregatedMap) {
    const yellowFilterEnabled = localStorage.getItem('yellowFilterEnabled') === 'true';
    const banned = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑', '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码', '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];

    results.forEach(item => {
        // 过滤黄色内容
        if (yellowFilterEnabled) {
             const typeName = item.type_name || '';
             if (banned.some(keyword => typeName.includes(keyword))) return;
        }

        const key = normalizeTitle(item.vod_name);
        if (!key) return;

        if (!aggregatedMap.has(key)) {
            aggregatedMap.set(key, {
                masterDetails: { 
                    vod_name: item.vod_name, 
                    vod_pic: item.vod_pic,
                    type_name: item.type_name,
                    vod_year: item.vod_year,
                    vod_remarks: item.vod_remarks
                },
                sources: []
            });
        }
        aggregatedMap.get(key).sources.push({
            source_name: item.source_name,
            source_code: item.source_code,
            vod_id: item.vod_id,
            api_url: item.api_url
        });
    });
}

// 聚合逻辑：创建卡片DOM
function createAggregatedCard(details, sources, mapKey) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-full shadow-sm hover:shadow-md';
    cardDiv.addEventListener('click', () => handleAggregatedClick(mapKey));

    const flexContainer = document.createElement('div');
    flexContainer.className = 'flex h-full';

    const hasCover = details.vod_pic && details.vod_pic.startsWith('http');

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
        imgContainer.innerHTML += '<div class="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>';
        flexContainer.appendChild(imgContainer);
    }

    const textContainer = document.createElement('div');
    textContainer.className = 'p-2 flex flex-col flex-grow';
    
    const textGrow = document.createElement('div');
    textGrow.className = 'flex-grow';

    const titleH3 = document.createElement('h3');
    titleH3.className = `font-semibold mb-2 break-words line-clamp-2 ${hasCover ? '' : 'text-center'}`;
    titleH3.title = details.vod_name;
    titleH3.textContent = details.vod_name;
    textGrow.appendChild(titleH3);

    const tagsDiv = document.createElement('div');
    tagsDiv.className = `flex flex-wrap ${hasCover ? '' : 'justify-center'} gap-1 mb-2`;
    if (details.type_name) tagsDiv.innerHTML += `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-blue-500 text-blue-300">${escapeHTML(details.type_name)}</span>`;
    if (details.vod_year) tagsDiv.innerHTML += `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-purple-500 text-purple-300">${escapeHTML(details.vod_year)}</span>`;
    textGrow.appendChild(tagsDiv);

    const remarksP = document.createElement('p');
    remarksP.className = `text-gray-400 line-clamp-2 overflow-hidden ${hasCover ? '' : 'text-center'} mb-2`;
    remarksP.textContent = details.vod_remarks || '暂无介绍';
    textGrow.appendChild(remarksP);

    textContainer.appendChild(textGrow);

    const footerDiv = document.createElement('div');
    footerDiv.className = 'flex justify-start items-center mt-1 pt-1 border-t border-gray-800';
    const sourcesContainer = document.createElement('div');
    sourcesContainer.className = 'flex flex-wrap gap-1';
    sources.forEach(s => {
        const sourceSpan = document.createElement('span');
        sourceSpan.className = 'bg-[#222] text-xs px-1.5 py-0.5 rounded-full';
        sourceSpan.textContent = s.source_name;
        sourcesContainer.appendChild(sourceSpan);
    });
    footerDiv.appendChild(sourcesContainer);
    textContainer.appendChild(footerDiv);

    flexContainer.appendChild(textContainer);
    cardDiv.appendChild(flexContainer);
    return cardDiv;
}

// 聚合逻辑：渲染结果
function renderAggregatedResults(aggregatedMap) {
    const resultsDiv = document.getElementById('results');
    
    if (aggregatedMap.size === 0) {
        resultsDiv.innerHTML = `
            <div class="col-span-full text-center py-16" id="noResultsMessage">
                <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="mt-2 text-lg font-medium text-gray-400">没有找到匹配的结果</h3>
                <p class="mt-1 text-sm text-gray-500">请尝试其他关键词或更换数据源</p>
            </div>`;
        if (document.getElementById('searchResultsCount')) document.getElementById('searchResultsCount').textContent = '0';
        return;
    }

    if (document.getElementById('searchResultsCount')) {
        document.getElementById('searchResultsCount').textContent = aggregatedMap.size;
    }

    const sortedResults = Array.from(aggregatedMap.entries()).sort(([, a], [, b]) => {
        return (a.masterDetails.vod_name || '').localeCompare(b.masterDetails.vod_name || '');
    });

    const cardElements = sortedResults.map(([key, value]) =>
        createAggregatedCard(value.masterDetails, value.sources, key)
    );

    resultsDiv.replaceChildren(...cardElements);
}

function handleAggregatedClick(mapKey) {
    if (window.isPasswordProtected && window.isPasswordVerified && window.isPasswordProtected() && !window.isPasswordVerified()) {
        showPasswordModal && showPasswordModal();
        return;
    }

    if (!aggregatedResultsMap.has(mapKey)) return;
    const { masterDetails, sources } = aggregatedResultsMap.get(mapKey);
    const vod_name = masterDetails.vod_name;

    if (!sources || sources.length === 0) return;
    if (sources.length === 1) {
        showDetails(sources[0].vod_id, vod_name, sources[0].source_code);
        return;
    }
    showSourceSelector(sources, vod_name);
}

function showSourceSelector(sources, vod_name) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    if(!modal) return;

    modalTitle.innerHTML = '';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'break-words';
    titleSpan.textContent = vod_name;
    modalTitle.appendChild(titleSpan);

    modalContent.innerHTML = '';
    const infoText = document.createElement('div');
    infoText.className = 'mb-4 text-gray-400';
    infoText.textContent = `为 ${vod_name} 找到了 ${sources.length} 个可用片源，请选择：`;
    modalContent.appendChild(infoText);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2';

    sources.forEach(s => {
        const button = document.createElement('button');
        button.className = 'w-full px-4 py-3 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors text-left flex justify-between items-center';
        button.innerHTML = `<span>${s.source_name}</span> <span class="text-xs text-gray-500">Play</span>`;
        button.addEventListener('click', () => showDetails(s.vod_id, vod_name, s.source_code));
        gridContainer.appendChild(button);
    });
    modalContent.appendChild(gridContainer);
    modal.classList.remove('hidden');
}

// 核心搜索功能
async function search() {
    if (window.isPasswordProtected && window.isPasswordVerified && window.isPasswordProtected() && !window.isPasswordVerified()) {
        showPasswordModal && showPasswordModal();
        return;
    }
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return showToast('请输入搜索内容', 'info');
    if (selectedAPIs.length === 0) return showToast('请至少选择一个API源', 'warning');

    showLoading();

    try {
        saveSearchHistory(query);
        
        // 传递 customAPIs 列表，解决 search.js 作用域问题
        // 使用 map 创建 Promise 数组，searchByAPIAndKeyWord 内部已捕获错误并返回 []
        const searchPromises = selectedAPIs.map(apiId => 
            searchByAPIAndKeyWord(apiId, query, customAPIs) 
        );

        // 使用 allSettled 确保某个源挂掉不会影响其他源
        const resultsArray = await Promise.allSettled(searchPromises);

        // 清空之前的聚合结果
        aggregatedResultsMap.clear();

        // 处理结果
        resultsArray.forEach(result => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                processAndAggregate(result.value, aggregatedResultsMap);
            }
        });

        // UI 更新
        document.getElementById('searchArea').classList.remove('flex-1');
        document.getElementById('searchArea').classList.add('mb-8');
        document.getElementById('resultsArea').classList.remove('hidden');
        const doubanArea = document.getElementById('doubanArea');
        if (doubanArea) doubanArea.classList.add('hidden');

        // 使用聚合渲染函数
        renderAggregatedResults(aggregatedResultsMap);

        // 更新URL
        if (aggregatedResultsMap.size > 0) {
            try {
                const encodedQuery = encodeURIComponent(query);
                window.history.pushState({ search: query }, `搜索: ${query} - LibreTV`, `/s=${encodedQuery}`);
                document.title = `搜索: ${query} - LibreTV`;
            } catch (e) {}
        }

    } catch (error) {
        console.error('搜索流程发生意外错误:', error);
        showToast('搜索请求失败，请稍后重试', 'error');
    } finally {
        hideLoading();
    }
}

// 辅助工具：转义HTML
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;');
}

// 其他函数保持不变 (toggleClearButton, clearSearchInput, hookInput, showDetails, playVideo等)
// ... (此处省略未修改的函数代码，请确保在最终文件中包含它们，如 showDetails, playVideo, renderEpisodes 等)
// 为了文件完整性，以下是关键的剩余函数：

function toggleClearButton() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearchInput');
    if (searchInput.value !== '') clearButton.classList.remove('hidden');
    else clearButton.classList.add('hidden');
}

function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    document.getElementById('clearSearchInput').classList.add('hidden');
}

function hookInput() {
    const input = document.getElementById('searchInput');
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(input, 'value', {
        get: function () {
            const originalValue = descriptor.get.call(this);
            return originalValue != null ? String(originalValue) : '';
        },
        set: function (value) {
            const strValue = String(value);
            descriptor.set.call(this, strValue);
            this.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    input.value = '';
}
document.addEventListener('DOMContentLoaded', hookInput);

async function showDetails(id, vod_name, sourceCode) {
    if (window.isPasswordProtected && window.isPasswordVerified && window.isPasswordProtected() && !window.isPasswordVerified()) {
        showPasswordModal && showPasswordModal();
        return;
    }
    if (!id) return showToast('Invalid video ID', 'error');

    showLoading();
    try {
        let apiParams = '';
        let sourceNameForDisplay = ''; 
        
        // 重新获取 customAPIs 以防更新
        const currentCustomAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');

        if (sourceCode.startsWith('custom_')) {
            const customIndex = parseInt(sourceCode.replace('custom_', ''));
            const customApi = currentCustomAPIs[customIndex];
            if (!customApi) throw new Error('Invalid custom API configuration');

            sourceNameForDisplay = customApi.name || 'Custom Source';
            apiParams = `&customApi=${encodeURIComponent(customApi.url)}&source=custom`;
            if (customApi.detail) apiParams += `&customDetail=${encodeURIComponent(customApi.detail)}`;
        } else {
             if (typeof API_SITES !== 'undefined' && API_SITES[sourceCode]) {
                 sourceNameForDisplay = API_SITES[sourceCode].name || sourceCode;
             } else {
                 sourceNameForDisplay = sourceCode;
             }
            apiParams = `&source=${sourceCode}`;
        }

        const timestamp = new Date().getTime();
        const response = await fetch(`/api/detail?id=${encodeURIComponent(id)}${apiParams}&_t=${timestamp}`);
        const data = await response.json();

        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = '';
        modalTitle.innerHTML = '';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'break-words';
        titleSpan.textContent = vod_name || 'Unknown Video';
        modalTitle.appendChild(titleSpan);

        if (sourceNameForDisplay) {
            const sourceSpan = document.createElement('span');
            sourceSpan.className = 'text-sm font-normal text-gray-400';
            sourceSpan.textContent = ` (${sourceNameForDisplay})`;
            modalTitle.appendChild(sourceSpan);
        }

        currentVideoTitle = vod_name || 'Unknown Video';

        if (data.episodes && data.episodes.length > 0) {
            currentEpisodes = data.episodes;
            currentEpisodeIndex = 0;

            if (data.videoInfo) {
                const detailInfoDiv = document.createElement('div');
                detailInfoDiv.className = 'modal-detail-info mb-4';
                const hasGridContent = data.videoInfo.type || data.videoInfo.year || data.videoInfo.area || data.videoInfo.director || data.videoInfo.actor;
                
                if (hasGridContent) {
                    const gridDiv = document.createElement('div');
                    gridDiv.className = 'detail-grid';
                    [
                        { label: 'Type:', value: data.videoInfo.type },
                        { label: 'Year:', value: data.videoInfo.year },
                        { label: 'Area:', value: data.videoInfo.area },
                        { label: 'Director:', value: data.videoInfo.director },
                        { label: 'Actor:', value: data.videoInfo.actor }
                    ].forEach(item => {
                        if (item.value) {
                            const itemDiv = document.createElement('div');
                            itemDiv.className = 'detail-item';
                            itemDiv.innerHTML = `<span class="detail-label">${item.label}</span><span class="detail-value">${escapeHTML(item.value)}</span>`;
                            gridDiv.appendChild(itemDiv);
                        }
                    });
                    detailInfoDiv.appendChild(gridDiv);
                }

                const descriptionText = (data.videoInfo.desc || data.videoInfo.remarks || '').replace(/<[^>]+>/g, '').trim();
                if (descriptionText) {
                    const descDiv = document.createElement('div');
                    descDiv.className = 'detail-desc mt-2';
                    descDiv.innerHTML = `<p class="detail-label">简介:</p><p class="detail-desc-content">${escapeHTML(descriptionText)}</p>`;
                    detailInfoDiv.appendChild(descDiv);
                }
                modalContent.appendChild(detailInfoDiv);
            }

            const controlBarDiv = document.createElement('div');
            controlBarDiv.className = 'flex flex-wrap items-center justify-between mb-4 gap-2';
            
            const leftControls = document.createElement('div');
            leftControls.className = 'flex items-center gap-2';
            
            const sortButton = document.createElement('button');
            sortButton.className = 'px-3 py-1.5 bg-[#333] hover:bg-[#444] border border-[#444] rounded text-sm transition-colors flex items-center gap-1';
            sortButton.innerHTML = `<svg class="w-4 h-4 transform ${episodesReversed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg><span>${episodesReversed ? '正序' : '倒序'}</span>`;
            sortButton.onclick = () => toggleEpisodeOrder(sourceCode, id, vod_name);
            leftControls.appendChild(sortButton);
            
            leftControls.innerHTML += `<span class="text-gray-400 text-sm">共 ${data.episodes.length} 集</span>`;
            controlBarDiv.appendChild(leftControls);
            
            const copyButton = document.createElement('button');
            copyButton.className = 'px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors';
            copyButton.textContent = '复制链接';
            copyButton.onclick = copyLinks;
            controlBarDiv.appendChild(copyButton);
            
            modalContent.appendChild(controlBarDiv);

            const episodesGridContainer = document.createElement('div');
            episodesGridContainer.id = 'episodesGrid';
            episodesGridContainer.className = 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2';
            renderEpisodes(episodesGridContainer, vod_name, sourceCode, id);
            modalContent.appendChild(episodesGridContainer);

        } else {
            modalContent.innerHTML += `<div class="text-center py-8"><div class="text-red-400 mb-2">❌ 未找到播放资源</div><div class="text-gray-500 text-sm">请尝试切换其他源</div></div>`;
        }

        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        showToast('获取详情失败', 'error');
    } finally {
        hideLoading();
    }
}

function renderEpisodes(container, vodName, sourceCode, vodId) {
    if (!container) return;
    container.innerHTML = '';
    const episodesToRender = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;

    episodesToRender.forEach((episodeUrl, index) => {
        const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;
        const button = document.createElement('button');
        button.className = 'px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors text-center episode-btn truncate';
        
        // 尝试提取集数名称
        let epName = `第${realIndex + 1}集`;
        // 如果url中包含了$符号，说明有集数名
        if (episodeUrl.includes('$')) {
            // 这里仅仅是为了展示，实际上播放还是用完整url传给playVideo解析
            // 简单的名字提取逻辑，可以根据实际情况增强
        }
        
        button.textContent = epName;
        button.title = epName;
        button.addEventListener('click', () => playVideo(episodeUrl, vodName, sourceCode, realIndex, vodId));
        container.appendChild(button);
    });
}

function playVideo(url, vod_name, sourceCode, episodeIndex = 0, vodId = '') {
    if (window.isPasswordProtected && window.isPasswordVerified && window.isPasswordProtected() && !window.isPasswordVerified()) {
        showPasswordModal && showPasswordModal();
        return;
    }

    try {
        if (Array.isArray(currentEpisodes)) {
             localStorage.setItem('currentEpisodes', JSON.stringify(currentEpisodes));
        }
        localStorage.setItem('currentVideoTitle', vod_name || '未知视频');
        localStorage.setItem('currentEpisodeIndex', episodeIndex);
        localStorage.setItem('currentSourceCode', sourceCode || '');
        localStorage.setItem('lastPlayTime', Date.now());
    } catch (e) {}

    const watchUrlParams = new URLSearchParams({
        id: vodId || '',
        source: sourceCode || '',
        url: url || '',
        index: episodeIndex,
        title: vod_name || ''
    });

    window.location.href = `watch.html?${watchUrlParams.toString()}`;
}

function toggleEpisodeOrder(sourceCode, vodId, vodName) {
    episodesReversed = !episodesReversed;
    const episodesGridContainer = document.getElementById('episodesGrid');
    if (episodesGridContainer) {
         renderEpisodes(episodesGridContainer, vodName, sourceCode, vodId);
    }
    // Update button visual state...
    const sortButton = document.querySelector('#modalContent button svg');
    if(sortButton) sortButton.style.transform = episodesReversed ? 'rotate(180deg)' : 'rotate(0deg)';
    const sortSpan = document.querySelector('#modalContent button span:last-child');
    if(sortSpan) sortSpan.textContent = episodesReversed ? '正序' : '倒序';
}

function copyLinks() {
    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
    const linkList = episodes.join('\r\n');
    navigator.clipboard.writeText(linkList).then(() => showToast('已复制', 'success')).catch(() => showToast('复制失败', 'error'));
}

async function testApi(apiKey) {
    const isCustom = apiKey.startsWith('custom_');
    const statusElement = document.getElementById(isCustom ? `status_${apiKey}` : `status_api_${apiKey}`);
    if (!statusElement) return;

    statusElement.className = `api-status ${isCustom ? 'ml-2' : 'ml-auto'} testing`;
    statusElement.title = '正在测试...';

    const startTime = performance.now();
    let status = 'bad';
    
    try {
        let baseUrl = '';
        if (isCustom) {
            const index = parseInt(apiKey.replace('custom_', ''));
            if (customAPIs[index]) baseUrl = customAPIs[index].url;
        } else {
            if (API_SITES[apiKey]) baseUrl = API_SITES[apiKey].api;
        }
        if (!baseUrl) throw new Error('No URL');

        const testUrl = baseUrl + '?ac=list';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(PROXY_URL + encodeURIComponent(testUrl), {
            headers: API_CONFIG.search.headers,
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        
        const latency = Math.round(performance.now() - startTime);
        if (!response.ok) throw new Error(response.status);
        
        const data = await response.json();
        if (data && (data.code === 1 || Array.isArray(data.list) || data.list)) {
            status = latency < 1500 ? 'good' : (latency < 4000 ? 'medium' : 'bad');
            statusElement.title = `${status === 'good' ? '畅通' : '缓慢'} (延迟: ${latency}ms)`;
        } else {
            throw new Error('Invalid Data');
        }
    } catch (e) {
        statusElement.title = `失效 (${e.message || 'Error'})`;
    }
    statusElement.className = `api-status ${isCustom ? 'ml-2' : 'ml-auto'} ${status}`;
}

async function testAllApis() {
    if (typeof PROXY_URL === 'undefined') return showToast('Config Error', 'error');
    showToast('正在测试所有源...', 'info');
    const promises = [];
    Object.keys(API_SITES).forEach(k => promises.push(testApi(k)));
    customAPIs.forEach((_, i) => promises.push(testApi(`custom_${i}`)));
    await Promise.allSettled(promises);
    showToast('测试完成', 'success');
}