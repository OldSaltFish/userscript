param(
    [Parameter(Mandatory=$true)][string]$meta,
    [Parameter(Mandatory=$true)][string]$css,
    [Parameter(Mandatory=$true)][string]$js,
    [Parameter(Mandatory=$true)][string]$output
)

# 验证参数有效性
if (-not (Test-Path -Path $meta -PathType Leaf)) { 
    Write-Error "--meta 参数错误：文件 '$meta' 不存在或不是有效文件" 
    exit 1
}
if (-not (Test-Path -Path $css -PathType Container)) { 
    Write-Error "--css 参数错误：目录 '$css' 不存在" 
    exit 1
}
if (-not (Test-Path -Path $js -PathType Container)) { 
    Write-Error "--js 参数错误：目录 '$js' 不存在" 
    exit 1
}

# 核心拼接逻辑
try {
    # 1. 读取meta文件内容
    $metaContent = Get-Content -Path $meta -Raw

    $cssFiles = Get-ChildItem -Path $css -File | Sort-Object Name
    $cssContent = $cssFiles | ForEach-Object { 
        Get-Content -Path $_.FullName -Raw 
    } | Out-String
    
    # 3. 拼接自定义内容B + JS文件内容
    $jsFiles = Get-ChildItem -Path $js -File | Sort-Object Name
    $jsContent = $jsFiles | ForEach-Object { 
        Get-Content -Path $_.FullName -Raw 
    } | Out-String

    # 4. 组合最终内容
    $finalContent = @"
$metaContent

(function() {
  'use strict';
  // 添加全局样式
  GM_addStyle(``$cssContent``);
  $jsContent
})();
"@
    
    # 5. 写入输出文件
    $finalContent | Out-File -FilePath $output -Encoding UTF8
    Write-Host "✅ 文件已生成: $(Convert-Path -Path $output)" -ForegroundColor Green
}
catch {
    Write-Error "❌ 处理失败: $_"
    exit 1
}