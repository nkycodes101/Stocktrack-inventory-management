$base = "http://127.0.0.1:5000"
$health = Invoke-RestMethod "$base/api/health"
if ($health.status -ne "ok") { throw "Health failed" }
$products = Invoke-RestMethod "$base/api/products"
if (-not $products) { throw "Products failed" }
$productId = ($products | Where-Object { $_.isActive -eq $true } | Select-Object -First 1).id
$inventory = Invoke-RestMethod "$base/api/inventory"
if (-not ($inventory | Where-Object { $_.productId -eq $productId })) { throw "Inventory failed" }
$customer = Invoke-RestMethod -Method Post -Uri "$base/api/customers" -ContentType "application/json" -Body '{"name":"Customer Check","phone":"555-0101","email":"a@shoptrack.test","address":"Main Street"}'
$customerId = $customer.id
$customerGet = Invoke-RestMethod "$base/api/customers/$customerId"
if ($customerGet.name -ne "Customer Check") { throw "Customer GET failed" }
$supplier = Invoke-RestMethod -Method Post -Uri "$base/api/suppliers" -ContentType "application/json" -Body '{"name":"Supplier Check","contactName":"Jane","phone":"555-0202","email":"b@supplier.test","address":"Warehouse Road"}'
$supplierId = $supplier.id
$supplierGet = Invoke-RestMethod "$base/api/suppliers/$supplierId"
if ($supplierGet.name -ne "Supplier Check") { throw "Supplier GET failed" }
$link = Invoke-RestMethod -Method Post -Uri "$base/api/products/$productId/suppliers" -ContentType "application/json" -Body "{\"supplierId\":$supplierId,\"notes\":\"Primary\"}"
if (-not $link.linked) { throw "Product-supplier link failed" }
$dashboard = Invoke-RestMethod "$base/api/dashboard"
if (-not $dashboard.summary) { throw "Dashboard failed" }
$alerts = Invoke-RestMethod "$base/api/alerts"
if ($null -eq $alerts) { throw "Alerts failed" }
$reports = Invoke-RestMethod "$base/api/reports?period=month&type=summary"
if (-not $reports.summary) { throw "Reports failed" }
$validSale = Invoke-RestMethod -Method Post -Uri "$base/api/sales" -ContentType "application/json" -Body "{\"customerId\":$customerId,\"amountPaid\":12.5,\"paymentMethod\":\"cash\",\"items\":[{\"productId\":$productId,\"quantity\":1,\"unitPrice\":12.5}]}"
if (-not $validSale.saleId) { throw "Valid sale failed" }
$invReject = Invoke-RestMethod "$base/api/inventory" | Where-Object { $_.stockQuantity -gt 0 } | Select-Object -First 1
$invalidQty = [int]$invReject.stockQuantity + 1
$invalidSale = Invoke-RestMethod -Method Post -Uri "$base/api/sales" -ContentType "application/json" -Body "{\"customerId\":$customerId,\"amountPaid\":999,\"paymentMethod\":\"cash\",\"items\":[{\"productId\":$($invReject.productId),\"quantity\":$invalidQty,\"unitPrice\":25.0}]}" -ErrorAction SilentlyContinue
if ($invalidSale -and $invalidSale.error -eq $null) { throw "Invalid sale should fail" }
Write-Host "PASS health products inventory customers suppliers dashboard alerts reports sales"
Write-Host "customerId=$customerId supplierId=$supplierId productId=$productId"
