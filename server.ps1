$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server started at http://localhost:$port/"
Write-Host "Press Ctrl+C to stop."

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $path = $request.Url.LocalPath.TrimStart('/')
    if ($path -eq "") { $path = "index.html" }
    
    $fullPath = Join-Path $PWD $path

    if (Test-Path $fullPath) {
        $content = [System.IO.File]::ReadAllBytes($fullPath)
        $response.ContentLength64 = $content.Length
        
        if ($path.EndsWith(".html")) { $response.ContentType = "text/html" }
        elseif ($path.EndsWith(".js")) { $response.ContentType = "application/javascript" }
        elseif ($path.EndsWith(".css")) { $response.ContentType = "text/css" }
        elseif ($path.EndsWith(".json")) { $response.ContentType = "application/json" }
        
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}
