/**
 * 执行搜索操作
 * @param {string} apiId - API的ID (例如 'dyttzy' 或 'custom_0')
 * @param {string} query - 搜索关键词
 * @param {Array} customAPIsList - 自定义API列表 (可选，用于避免全局依赖)
 */
async function searchByAPIAndKeyWord(apiId, query, customAPIsList = []) {
    try {
        let apiUrl, apiName, apiBaseUrl;
        
        // 处理自定义API
        if (apiId.startsWith('custom_')) {
            const indexStr = apiId.replace('custom_', '');
            const customIndex = parseInt(indexStr, 10);
            
            // 尝试从传入的列表中获取，如果没有传入则尝试从 localStorage 获取 (兜底)
            let customApi = null;
            if (customAPIsList && customAPIsList[customIndex]) {
                customApi = customAPIsList[customIndex];
            } else {
                 // 最后的兜底，尝试读取 localStorage (不推荐，但为了兼容性)
                 try {
                     const stored = JSON.parse(localStorage.getItem('customAPIs') || '[]');
                     customApi = stored[customIndex];
                 } catch(e) {}
            }

            if (!customApi) return []; // 找不到对应的自定义API配置
            
            apiBaseUrl = customApi.url;
            apiName = customApi.name || '自定义源';
            apiUrl = apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);
        } else {
            // 内置API
            // 确保 API_SITES 已加载
            if (typeof API_SITES === 'undefined' || !API_SITES[apiId]) return [];
            
            apiBaseUrl = API_SITES[apiId].api;
            apiName = API_SITES[apiId].name;
            apiUrl = apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);
        }
        
        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.search.timeout || 8000);
        
        const response = await fetch(PROXY_URL + encodeURIComponent(apiUrl), {
            headers: API_CONFIG.search.headers,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            return []; // HTTP 错误直接返回空数组
        }
        
        const data = await response.json();
        
        // 验证数据格式
        if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
            return [];
        }
        
        // 处理结果，附加源信息
        const results = data.list.map(item => ({
            ...item,
            source_name: apiName,
            source_code: apiId,
            // 如果是自定义源，保存其原始URL以便后续获取详情
            api_url: apiId.startsWith('custom_') ? apiBaseUrl : undefined
        }));
        
        // --- 分页处理 (仅当需要获取更多结果时) ---
        // 注意：过度分页会导致请求过多，建议在 config.js 中适当限制 maxPages
        const pageCount = data.pagecount || 1;
        const pagesToFetch = Math.min(pageCount - 1, API_CONFIG.search.maxPages - 1);
        
        if (pagesToFetch > 0) {
            const additionalPagePromises = [];
            
            for (let page = 2; page <= pagesToFetch + 1; page++) {
                const pageUrl = apiBaseUrl + API_CONFIG.search.pagePath
                    .replace('{query}', encodeURIComponent(query))
                    .replace('{page}', page);
                
                const pagePromise = (async () => {
                    try {
                        const pageController = new AbortController();
                        const pageTimeoutId = setTimeout(() => pageController.abort(), 5000); // 分页超时可以短一点
                        
                        const pageResponse = await fetch(PROXY_URL + encodeURIComponent(pageUrl), {
                            headers: API_CONFIG.search.headers,
                            signal: pageController.signal
                        });
                        
                        clearTimeout(pageTimeoutId);
                        
                        if (!pageResponse.ok) return [];
                        const pageData = await pageResponse.json();
                        
                        if (!pageData || !pageData.list || !Array.isArray(pageData.list)) return [];
                        
                        return pageData.list.map(item => ({
                            ...item,
                            source_name: apiName,
                            source_code: apiId,
                            api_url: apiId.startsWith('custom_') ? apiBaseUrl : undefined
                        }));
                    } catch (error) {
                        return []; // 忽略分页错误
                    }
                })();
                
                additionalPagePromises.push(pagePromise);
            }
            
            // 等待所有分页（使用 allSettled 防止单个分页失败影响整体）
            const additionalResultsSettled = await Promise.allSettled(additionalPagePromises);
            
            additionalResultsSettled.forEach(res => {
                if (res.status === 'fulfilled' && Array.isArray(res.value)) {
                    results.push(...res.value);
                }
            });
        }
        
        return results;
    } catch (error) {
        console.warn(`API ${apiId} 搜索异常:`, error.message);
        return []; // 发生异常（如网络中断、超时、解析失败）返回空数组，不抛出错误
    }
}