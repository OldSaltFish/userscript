document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // 2. 获取当前页面的基础 URL 和查询参数
  const currentUrl = new URL(window.location.href);
  const baseUrl = currentUrl.origin + currentUrl.pathname;
  // 2. 动态判断并获取 first 参数
  // 如果存在 first 参数，则获取其值并转换为数字，否则默认为 0（表示第一页）
  let currentFirst = 1;
  if (currentUrl.searchParams.has("first")) {
    // 使用 parseInt 确保值是整数
    currentFirst = parseInt(currentUrl.searchParams.get("first"), 10);
    // 确保获取到的值是有效的数字，如果无效则重置为 0
    if (isNaN(currentFirst) || currentFirst < 0) {
      currentFirst = 1;
    }
  }

  // 3. 根据当前页面的 first 值，生成后续的 first 索引
  // 目标：获取当前页（currentFirst）的下一页、下下页，直到第 N 页。
  // 步长为 10 (Bing 默认每页 10 条结果)
  const nextFirst = currentFirst + 10;

  // 我们需要获取从 nextFirst 开始的 4 个后续索引
  const firstIndices = [];
  for (let i = 0; i < 4; i++) {
    firstIndices.push(nextFirst + i * 10);
  }
  // 移除可能存在的 'first' 参数，以确保每次拼接都使用正确的起始值
  currentUrl.searchParams.delete("first");
  const baseQueryString = currentUrl.searchParams.toString();

  // 3. 目标容器：b_results 是 Bing 结果的主容器
  const resultsContainer = document.getElementById("b_results");
  if (!resultsContainer) {
    console.error("无法找到当前页面 ID 为 b_results 的元素.");
    return;
  }

  /**
   * 执行跨域请求并解析 HTML，获取指定 ID 元素的子节点。
   * @param {string} url 要请求的完整 URL
   * @param {string} targetId 要提取内容的元素 ID (e.g., 'b_results')
   * @returns {Promise<DocumentFragment|null>} 包含目标元素子节点的文档片段
   */
  function fetchAndExtract(url, targetId) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: url,
        headers: {
          referer: "https://cn.bing.com",
        },
        onload: function (response) {
          if (response.status !== 200) {
            console.error(`请求失败: ${url}, 状态码: ${response.status}`);
            return resolve(null);
          }

          try {
            // 使用 DOMParser 将 HTML 字符串解析为一个 Document
            const parser = new DOMParser();
            const doc = parser.parseFromString(
              response.responseText,
              "text/html"
            );

            // 查找目标元素
            const remoteResults = doc.getElementById(targetId);

            if (remoteResults) {
              // 创建一个 DocumentFragment 容器，用于存放所有子节点
              const fragment = document.createDocumentFragment();

              // 遍历并将子节点移动到 Fragment 中 (注意：appendChild 会移动节点)
              // 只要 remoteResults.firstChild 存在就一直循环
              while (remoteResults.firstChild) {
                fragment.appendChild(remoteResults.firstChild);
              }
              resolve(fragment);
            } else {
              console.warn(`远程页面未找到 ID 为 ${targetId} 的元素: ${url}`);
              resolve(null);
            }
          } catch (e) {
            console.error("解析远程 HTML 失败:", e);
            resolve(null);
          }
        },
        onerror: function (error) {
          console.error(`网络错误: ${url}`, error);
          resolve(null);
        },
      });
    });
  }

  // 4. 执行所有异步请求并等待结果
  async function fetchAllResults() {
    console.log(`开始获取 ${firstIndices.length} 个额外页面的搜索结果...`);

    // 使用 Promise.all 来并行处理所有请求，提高效率
    const requests = firstIndices.map((first) => {
      // 构造新的 URL
      const newUrl = `${baseUrl}?${baseQueryString}&first=${first}`;
      console.log("请求地址", newUrl);
      return fetchAndExtract(newUrl, "b_results");
    });

    const fragments = await Promise.all(requests);

    // 5. 将获取到的新结果追加到当前页面
    fragments.forEach((fragment, index) => {
      if (fragment) {
        // 可选：添加分隔符以便区分不同页面的结果
        const separator = document.createElement("div");
        separator.style.cssText =
          "margin: 20px 0; border-top: 2px dashed #ccc; padding-top: 10px;";
        separator.innerHTML = `<h2>--- 额外加载的第 ${index + 2} 页 (first=${
          firstIndices[index]
        }) 结果 ---</h2>`;

        resultsContainer.appendChild(separator);
        resultsContainer.appendChild(fragment); // 批量添加子元素
        console.log(`成功将 first=${firstIndices[index]} 的结果添加到页面。`);
      }
    });

    console.log("所有额外页面结果加载完成。");
  }

  // 启动流程
  // fetchAllResults();
  /**
   * 使用 iframe 加载远程 URL，并提取目标 ID 的内容。
   * @param {number} first 要请求的 first 参数值
   * @returns {Promise<DocumentFragment|null>} 包含目标元素子节点的文档片段
   */
  function fetchAndExtractWithIframe(first) {
    return new Promise((resolve) => {
      const newUrl = `${baseUrl}?${baseQueryString}&first=${first}`;

      // 1. 创建隐藏的 iframe 元素
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      // 添加到 DOM 中才能加载内容
      document.body.appendChild(iframe);

      // 2. 监听 iframe 加载完成事件
      iframe.onload = function () {
        try {
          // 3. 访问 iframe 的文档内容
          const doc = iframe.contentDocument || iframe.contentWindow.document;

          if (!doc) {
            console.error(
              "无法访问 iframe 的文档内容 (可能是跨域限制或加载失败)"
            );
            resolve(null);
            return;
          }

          // 4. 查找目标元素
          const remoteResults = doc.getElementById("b_results");

          if (remoteResults) {
            const fragment = document.createDocumentFragment();
            // 提取所有子节点
            while (remoteResults.firstChild) {
              fragment.appendChild(remoteResults.firstChild);
            }
            resolve(fragment);
          } else {
            console.warn(
              `iframe 加载的远程页面未找到 ID 为 b_results 的元素: ${newUrl}`
            );
            resolve(null);
          }
        } catch (e) {
          console.error("在 iframe 中访问 DOM 时发生同源策略错误:", e);
          resolve(null); // 跨域失败返回 null
        } finally {
          // 5. 无论成功失败，移除 iframe 元素
          iframe.remove();
        }
      };

      // 设置 iframe 的源 URL，开始加载
      iframe.src = newUrl;
    });
  }

  // 6. 异步执行所有 iframe 请求
  async function fetchAllResultsIframe() {
    console.log(
      `开始使用 iframe 串行获取 ${firstIndices.length} 个额外页面的搜索结果...`
    );

    // 注意：Iframe 加载是资源密集型操作，推荐串行或限制并发数。
    // 这里使用 for...of 循环实现串行加载。
    for (let index = 0; index < firstIndices.length; index++) {
      const first = firstIndices[index];

      // 添加加载指示器
      const loadingIndicator = document.createElement("div");
      loadingIndicator.id = `loading-indicator-${first}`;
      loadingIndicator.style.cssText =
        "margin: 20px 0; border-top: 2px dashed #ccc; padding-top: 10px; text-align: center; color: #999;";
      loadingIndicator.innerHTML = `<h2>--- 正在加载第 ${
        index + 2
      } 页 (first=${first}) 结果... ---</h2>`;
      resultsContainer.appendChild(loadingIndicator);

      // 等待单个 iframe 加载完成并提取内容
      const fragment = await fetchAndExtractWithIframe(first);

      const indicator = document.getElementById(`loading-indicator-${first}`);

      if (fragment) {
        // 成功加载
        if (indicator) {
          indicator.remove();
        }

        const separator = document.createElement("div");
        separator.style.cssText =
          "margin: 20px 0; border-top: 2px solid #0078d4; padding-top: 10px;";
        separator.innerHTML = `<h2>--- 已合并第 ${
          index + 2
        } 页 (first=${first}) 结果 ---</h2>`;
        resultsContainer.appendChild(separator);

        resultsContainer.appendChild(fragment);
        console.log(`[Iframe 成功] first=${first} 的结果已添加到页面。`);
      } else {
        // 加载失败
        if (indicator) {
          indicator.style.cssText =
            "margin: 20px 0; border-top: 2px dashed #ff0000; padding-top: 10px; text-align: center; color: #ff0000;";
          indicator.innerHTML = `<h2>--- [Iframe 失败] 加载第 ${
            index + 2
          } 页 (first=${first}) 结果 ---</h2>`;
        }
      }
    }

    console.log("所有后续页面结果加载完成。");
  }

  // 启动流程
  fetchAllResultsIframe();
});
