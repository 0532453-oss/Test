param(
    [int]$MaxIterations = 100,
    [int]$SleepSeconds = 2
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'


Write-Host "Starting Ralph - Max $MaxIterations iterations"
Write-Host ""

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host "==========================================="
    Write-Host "  Iteration $i of $MaxIterations"
    Write-Host "==========================================="


    $prompt = @"
You are Ralph, an autonomous coding agent. Do exactly ONE task per iteration.

## Steps
1. Read PRD.md and find the first task that is NOT complete (marked [ ]).
2. Read progress.txt - check the Learnings section first for patterns from previous iterations.
3. Implement that ONE task only.
4. Run tests/typecheck to verify it works.

## Critical: Only Complete If Tests Pass
- If tests PASS:
  - Update PRD.md to mark the task complete (change [ ] to [x])
  - Commit your changes with message: feat: [task description]
  - Append what worked to progress.txt
- If tests FAIL:
  - Do NOT mark the task complete
  - Do NOT commit broken code
  - Append what went wrong to progress.txt

## End Condition
- If ALL tasks are [x], output exactly: <promise>COMPLETE</promise>
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

    if ($result -match "<promise>COMPLETE</promise>") {
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
