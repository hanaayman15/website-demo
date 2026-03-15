# Example: Add body measurement for client ID 7
# You'll need a valid auth token from logging in as admin

$authToken = "YOUR_AUTH_TOKEN_HERE"  # Get this from logging in
$clientId = 7

$measurementData = @{
    height = 170.0  # cm
    weight = 65.0   # kg
    body_fat_percentage = 18.5
    skeletal_muscle = 30.0
    water_percentage = 60.0
    minerals = 3.5
    bmr = 1500.0
    tdee = 2200.0
    bmi = 22.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/admin/clients/$clientId/measurements" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    } `
    -Body $measurementData

Write-Host "Measurement added! Refresh the client detail page to see the data."
