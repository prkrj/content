# Monitoring Agent Execution in Real-Time

When you submit an agent job through the UI, you can monitor its progress in several ways:

## 1. Frontend UI Progress (Easiest)

The Agents page automatically polls for updates every 2 seconds and displays:

- **Progress Bar**: Visual percentage (0-100%)
- **Status Message**: Current step being executed
  - "Initializing agent..." (10%)
  - "Connecting to Claude AI..." (30%)
  - "Processing results..." (80%)
  - "Complete" (100%)

These update in real-time as the agent executes.

## 2. Backend Console Logs (Most Detailed)

**Look for the terminal window running `start-backend.bat`** - you'll see detailed logs like:

```
INFO:     [Job abc-123] Starting execution - Agent: content-developer
INFO:     [Job abc-123] Task: Create a 5th grade Texas Math lesson...
INFO:     [Job abc-123] Agent executor initialized
INFO:     [Job abc-123] Connecting to Claude API (model: claude-3-sonnet-20240229)
INFO:     [Job abc-123] Sending request to Claude API...
INFO:     [Job abc-123] Received response from Claude API
INFO:     [Job abc-123] Processing and storing results...
INFO:     [Job abc-123] ✓ SUCCESS - Generated 4523 characters of content
INFO:     [Job abc-123] Job status saved to database
```

This console shows:
- When the job starts
- Each processing step
- API calls to Claude
- Success/failure status
- Any errors that occur

## 3. API Endpoint for Job Status

You can also query the API directly to check job status:

```bash
curl http://localhost:8000/api/v1/agents/jobs/{job_id}
```

This returns JSON with:
- `status`: "pending", "running", "completed", "failed"
- `progress_percentage`: 0-100
- `progress_message`: Current step description
- `started_at`, `completed_at`: Timestamps
- `error_message`: If failed

## 4. View All Your Recent Jobs

The frontend shows a "Recent Jobs" table at the bottom of the Agents page with:
- Job ID
- Agent Type
- Status
- Created time
- Actions (View Result, Cancel)

## Typical Agent Execution Timeline

1. **Initialization (0-10%)** - ~1 second
   - Job created in database
   - Agent type validated
   - Background task spawned

2. **Connecting to Claude AI (10-30%)** - ~2-3 seconds
   - Agent executor loaded
   - Claude client initialized
   - System prompt prepared

3. **Claude API Execution (30-80%)** - **30 seconds to 3 minutes**
   - Request sent to Claude API
   - Claude generates content
   - **This is where most time is spent**
   - Response streamed back

4. **Processing Results (80-100%)** - ~1-2 seconds
   - Parse Claude response
   - Store in database
   - Update job status

## Troubleshooting

### Agent Stuck at "Connecting to Claude AI..."

**This is normal!** The Claude API call (step 3) takes 30 seconds to 3 minutes depending on:
- Task complexity
- Content length requested
- Current API load

**Check the backend console** to see the actual API request status.

### Agent Failed

Check the backend console for detailed error messages. Common issues:
- **API Key Invalid**: Check `backend/.env` has valid `ANTHROPIC_API_KEY`
- **Timeout**: Task too complex, try breaking it into smaller pieces
- **Rate Limit**: You've exceeded Anthropic API rate limits

### No Progress Updates

If the progress bar is stuck:
1. Check backend console - is it still processing?
2. Wait 5 minutes (timeout limit)
3. If truly stuck, you can cancel the job

## Performance Notes

- **Typical execution time**: 30 seconds - 3 minutes
- **Maximum timeout**: 5 minutes (automatically enforced)
- **Cost per invocation**: ~$0.01-0.50 (varies by complexity)
- **Model used**: Claude 3 Sonnet (claude-3-sonnet-20240229)

---

**Pro Tip**: Keep the backend console window visible while testing agents so you can see exactly what's happening in real-time!
