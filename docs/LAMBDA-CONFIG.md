# AWS Lambda Configuration for Code Judge

## Reserved Concurrency Setup

### 1. AWS Console Configuration

```bash
# Set Reserved Concurrency to 100
aws lambda put-function-concurrency \
  --function-name your-lambda-function-name \
  --reserved-concurrent-executions 100
```

### 2. Terraform Configuration (recommended)

```hcl
resource "aws_lambda_function" "code_judge" {
  # ... other config

  reserved_concurrent_executions = 100
}

# Or use aws_lambda_provisioned_concurrency_config for faster cold starts
resource "aws_lambda_provisioned_concurrency_config" "code_judge" {
  function_name                     = aws_lambda_function.code_judge.function_name
  provisioned_concurrent_executions = 100
  qualifier                         = "$LATEST"
}
```

### 3. CloudFormation Configuration

```yaml
Resources:
  CodeJudgeLambda:
    Type: AWS::Lambda::Function
    Properties:
      # ... other properties
      ReservedConcurrentExecutions: 100
```

## Environment Variables for Lambda

Add these environment variables to your Lambda function:

```bash
ENABLE_PARALLEL_EXECUTION=true
MAX_CONCURRENT_TEST_CASES=10
MEMORY_SIZE=1024
TIMEOUT=300
```

## Monitoring Setup

### CloudWatch Alarms

```bash
# Alert when concurrency limit is reached
aws cloudwatch put-metric-alarm \
  --alarm-name "Lambda-Concurrency-Limit" \
  --alarm-description "Lambda function hitting concurrency limit" \
  --metric-name ConcurrentExecutions \
  --namespace AWS/Lambda \
  --statistic Maximum \
  --period 60 \
  --threshold 95 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=your-lambda-function-name
```

### X-Ray Tracing

Enable X-Ray tracing in Lambda console for performance monitoring.

## Cost Estimation

### Monthly Cost Calculation

- **Lambda Requests**: 1,000,000 requests × $0.20/million = $200
- **Lambda Duration**: 100 instances × 10 seconds × 1,000,000/100 × $0.0000166667/GB-second = ~$1,667
- **Total**: ~$1,867/month

## Performance Expectations

With 100 concurrent instances:

- **Throughput**: 100-200 submissions/second
- **Latency**: 5-15 seconds per submission
- **Cold Start Impact**: Minimal with provisioned concurrency

## Scaling Strategy

1. **Start with 50 instances** for testing
2. **Monitor metrics** (duration, errors, throttling)
3. **Gradually increase** to 100 based on performance
4. **Use auto-scaling** based on queue depth

## Worker Configuration

Update worker concurrency to match Lambda capacity:

````typescript
// apps/worker/src/index.ts
const worker = new Worker(JUDGE_SUBMISSIONS_QUEUE_NAME, processSubmission, {
  connection,
  concurrency: 50, // Match Lambda concurrency
});
```</content>
<parameter name="filePath">d:\Full-Stack\project\code-judge\docs\LAMBDA-CONFIG.md
````
