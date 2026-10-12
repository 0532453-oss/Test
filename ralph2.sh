#!/bin/bash
set -euo pipefail

MAX=${1:-100}
SLEEP=${2:-2}

echo "Starting Ralph (PRD2) - Max $MAX iterations"
echo ""

for ((i=1; i<=MAX; i++)); do
    echo "==========================================="
    echo "  Iteration $i of $MAX"
    echo "==========================================="

    if ! command -v claude &>/dev/null; then
        echo "Error: 'claude' command not found. Install with: npm install -g @anthropic-ai/claude"
        exit 1
    fi

    prompt="You are Ralph, an autonomous coding agent. Do exactly ONE task per iteration.

## Steps
1. Read PRD2.md and find the first task that is NOT complete (marked [ ]).
2. Read progress2.txt - check the Learnings section first for patterns from previous iterations.
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
- If ALL tasks are [x], output exactly: <promise>COMPLETE</promise>
- Otherwise, end response and continue next iteration."

    result=$(claude --dangerously-skip-permissions -p "$prompt" 2>&1 || true)
    echo "$result"
    echo ""

    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo "==========================================="
        echo "  All tasks complete after $i iterations!"
        echo "==========================================="
        exit 0
    fi

    sleep "$SLEEP"
done

echo "==========================================="
echo "  Reached max iterations ($MAX)"
echo "==========================================="
exit 1
