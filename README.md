tools.bedrock.dev server tool managment deploy action

Your workflow should look like this:
```yaml
- uses: bedrock-oss/query-endpoint-action@main
  with:
    hostname: 'test.com'
    path: '/deploy'
    post: 5000
    queryInterval: 1000
    auth: 'QWERTY=='
    timeout: 5000
```
