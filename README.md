## Amazon Connect Contact lens action item reminders

This repo is attached to the blog ["Create action item reminders with Amazon Connect Tasks and Contact Lens for Amazon Connect"](https://aws.amazon.com/blogs/contact-center/create-action-item-reminders-with-amazon-connect-tasks-and-contact-lens-for-amazon-connect/). Head there to get the full set of steps for using this code.
### Deployment Steps

1. Install CDK and run the CDK bootstrap command if this is the first time running CDK in an AWS Account.
```
npm -g install typescript
npm -g install aws-cdk
cdk bootstrap aws://ACCOUNT_ID/AWS_REGION
```
2. Install dependencies 

```
npm install
```

3. Deploy the project

```
cdk deploy --context amazonConnectUrl=<YOUR INSTANCE URL> --context amazonConnectArn=<YOUR INSTANCE ARN> --context contactFlowId=<CONTACT FLOW ID> --context amazonConnectId=<INSTANCE ID> --context taskQueueArn=<TASK QUEUE ARN> --context contactLensS3BucketName=<YOUR BUCKET NAME>
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

