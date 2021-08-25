tools.bedrock.dev server tool managment deploy action

Your workflow should look like this:
```yaml
- uses: @bedrock-oss/query-endpoint-action
  with:
    webhook: 'http://test.com:5000/webhook'
    queryInterval: 1000
    auth: 'QWERTY=='
    timeout: 5000
