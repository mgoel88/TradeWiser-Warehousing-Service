
# WebSocket Integration Guide

## Connection
Connect to WebSocket endpoint: `/ws`

## Message Types

### Subscribe
```json
{
  "type": "subscribe",
  "userId": "number",
  "entityType": "string",
  "entityId": "string"
}
```

### Process Update
```json
{
  "type": "process_update",
  "processId": "number",
  "status": "string",
  "progress": "number"
}
```

## Event Handling
Listen for events:
- connection
- message
- close
- error
