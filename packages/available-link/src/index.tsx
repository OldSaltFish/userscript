import './main.css';
const googlePlayLinkReplace = () => {
    // 提取Google Play应用ID的函数
    function extractGooglePlayAppId(url: string): string | null {
        // 匹配格式: https://play.google.com/store/apps/details?id=com.vivaldi.browser
        const regex = /https:\/\/play\.google\.com\/store\/apps\/details\?(?:[^&]*&)*id=([^&]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
    const allLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('a');
    allLinks.forEach(item => {
        const href = item.href
        const googlePlayAppId = extractGooglePlayAppId(href);
        if(!googlePlayAppId) return;
        // https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=com.vivaldi.browser
        item.href = `https://apkpure.net/cn/search?q=${googlePlayAppId}`;
        console.log("谷歌商店链接已替换为Apkpure: ", href, " -> ", item.href);
    })
}

const dclHandler = () => {
    googlePlayLinkReplace();
    document.removeEventListener("DOMContentLoaded", dclHandler);
}
document.addEventListener("DOMContentLoaded", dclHandler);