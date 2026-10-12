param(
    [int]$MaxIterations = 100,
    [int]$SleepSeconds = 2
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Ensure npm global bin directory is in PATH
$npmBinPath = "$env:APPDATA\npm"
if ($env:Path -notlike "*$npmBinPath*") {
    $env:Path += ";$npmBinPath"
}

Write-Host "Starting Ralph - Max $MaxIterations iterations"
Write-Host ""

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host "==========================================="
    Write-Host "  Iteration $i of $MaxIterations"
    Write-Host "==========================================="

    if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
        Write-Error "claude command not found. Install with: npm install -g @anthropic-ai/claude-code"
        exit 1
    }

    $prompt = @"
You are Ralph, an autonomous coding agent. Do exactly ONE task per iteration.

## Steps
1. Read PRD2.md and find the first task that is NOT complete (marked [ ]).
2. Read progress.txt - check the Learnings section first for patterns from previous iterations.
3. Implement that ONE task only.
4. Run tests/typecheck to verify it works.

## Critical: Only Complete If Tests Pass
- If tests PASS:
  - Update PRD2.md to mark the task complete (change [ ] to [x])
  - Commit your changes with message: feat: [task description]
  - Append what worked to progress2.txt
- If tests FAIL:
  - Do NOT mark the task complete
  - Do NOT commit broken code
  - Append what went wrong to progress2.txt

## End Condition
- If ALL tasks are [x], output exactly: <promise>COMPLETE2</promise>
- Otherwise, end response and continue next iteration.
"@

    try {
        $result = (& claude --dangerously-skip-permissions -p $prompt 2>&1 | Out-String)
    } catch {
        Write-Warning "Error running claude: $_"
        $result = ""
    }

    Write-Host $result
    Write-Host ""

    if ($result -match "<promise>COMPLETE2</promise>") {
        Write-Host "==========================================="
        Write-Host "  All tasks complete after $i iterations!"
        Write-Host "==========================================="
        exit 0
    }

    Start-Sleep -Seconds $SleepSeconds
}

Write-Host "==========================================="
Write-Host "  Reached max iterations ($MaxIterations)"
Write-Host "==========================================="
exit 1
