# EPS Admin Orbit Flow

1. User describes the operation in chat.
2. Backend extracts `quantity`, `environment`, `codeType`, and optional `batchName`.
3. If required fields are missing, `/api/chat` returns `mode: "collect"` with the next field.
4. When complete, `/api/chat` returns `mode: "preview"`.
5. User types `Preview` or clicks Preview.
6. `/api/preview` returns the operation preview.
7. User clicks Confirm.
8. `/api/confirm` calls the selected backend provider.
9. Mock provider returns generated codes now; SOAP provider remains behind the provider interface.
10. Frontend displays formatted and raw code outputs with copy/download actions.
