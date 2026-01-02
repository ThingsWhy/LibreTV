// 改进的API请求处理函数
async function handleApiRequest(url) {
    const customApi = url.searchParams.get('customApi') || '';
    const customDetail = url.searchParams.get('customDetail') || '';
    const source = url.searchParams.get('source') || 'heimuer';
    
    try {
        // --- 搜索请求处理 ---
        if (url.pathname === '/api/search') {
            const searchQuery = url.searchParams.get('wd');
            if (!searchQuery) throw new Error('缺少搜索参数');
            
            if (source === 'custom' && !customApi) throw new Error('使用自定义API时必须提供API地址');
            if (!API_SITES[source] && source !== 'custom') throw new Error('无效的API来源');
            
            const apiUrl = customApi
                ? `${customApi}${API_CONFIG.search.path}${encodeURIComponent(searchQuery)}`
                : `${API_SITES[source].api}${API_CONFIG.search.path}${encodeURIComponent(searchQuery)}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await fetch(PROXY_URL + encodeURIComponent(apiUrl), {
                    headers: API_CONFIG.search.headers,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
                
                const data = await response.json();
                // 搜索接口通常返回 { list: [...] }
                if (!data || !Array.isArray(data.list)) throw new Error('API返回的数据格式无效');
                
                data.list.forEach(item => {
                    item.source_name = source === 'custom' ? '自定义源' : API_SITES[source].name;
                    item.source_code = source;
                    if (source === 'custom') item.api_url = customApi;
                });
                
                return JSON.stringify({ code: 200, list: data.list || [] });
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        }

        // --- 详情请求处理 ---
        if (url.pathname === '/api/detail') {
            const id = url.searchParams.get('id');
            const sourceCode = url.searchParams.get('source') || 'heimuer';
            
            if (!id) throw new Error('缺少视频ID');
            
            const detailUrl = customApi
                ? `${customApi}${API_CONFIG.detail.path}${id}`
                : `${API_SITES[sourceCode].api}${API_CONFIG.detail.path}${id}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await fetch(PROXY_URL + encodeURIComponent(detailUrl), {
                    headers: API_CONFIG.detail.headers,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) throw new Error(`详情请求失败: ${response.status}`);
                
                const data = await response.json();
                if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
                    throw new Error('获取详情内容为空');
                }
                
                const videoDetail = data.list[0];
                let episodes = [];
                
                if (videoDetail.vod_play_url) {
                    const playSources = videoDetail.vod_play_url.split('$$$');
                    let targetSource = playSources.find(s => s.includes('.m3u8')) || playSources.find(s => s.includes('.mp4'));
                    
                    if (targetSource) {
                        episodes = targetSource.split('#').map(ep => {
                            const parts = ep.split('$');
                            return parts.length > 1 ? parts[1] : parts[0];
                        }).filter(u => u && (u.startsWith('http') || u.startsWith('https')));
                    }
                }
                
                return JSON.stringify({
                    code: 200,
                    episodes: episodes,
                    detailUrl: detailUrl,
                    videoInfo: {
                        title: videoDetail.vod_name,
                        cover: videoDetail.vod_pic,
                        desc: videoDetail.vod_content,
                        type: videoDetail.type_name,
                        year: videoDetail.vod_year,
                        area: videoDetail.vod_area,
                        director: videoDetail.vod_director,
                        actor: videoDetail.vod_actor,
                        remarks: videoDetail.vod_remarks,
                        source_name: sourceCode === 'custom' ? '自定义源' : API_SITES[sourceCode].name,
                        source_code: sourceCode
                    }
                });
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        }

        throw new Error('未知的API路径');
    } catch (error) {
        console.error('API Proxy Error:', error);
        return JSON.stringify({
            code: 400,
            msg: error.message || '请求处理失败',
            list: [],
            episodes: [],
        });
    }
}

// 拦截API请求
(function() {
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
        // 兼容 input 为 Request 对象的情况
        let requestUrl;
        if (typeof input === 'string') {
            requestUrl = new URL(input, window.location.origin);
        } else if (input instanceof URL) {
            requestUrl = input;
        } else if (input && input.url) {
             requestUrl = new URL(input.url, window.location.origin);
        }

        if (requestUrl && requestUrl.pathname.startsWith('/api/')) {
            if (window.isPasswordProtected && window.isPasswordVerified) {
                if (window.isPasswordProtected() && !window.isPasswordVerified()) {
                    return new Response(JSON.stringify({code: 403, msg: 'Auth Required'}), {status: 403});
                }
            }
            try {
                const data = await handleApiRequest(requestUrl);
                return new Response(data, {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ code: 500, msg: 'Internal Error' }), { 
                    status: 500, headers: { 'Content-Type': 'application/json' } 
                });
            }
        }
        return originalFetch.apply(this, arguments);
    };
})();