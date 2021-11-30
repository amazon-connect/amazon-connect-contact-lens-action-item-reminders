// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sns from '@aws-cdk/aws-sns';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
import * as iam from '@aws-cdk/aws-iam';
import * as path from 'path';
import { Duration } from '@aws-cdk/core';

export class ContactLensActionItemReminderStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const amazonConnectArn = this.node.tryGetContext("amazonConnectArn");
    const amazonConnectUrl = this.node.tryGetContext("amazonConnectUrl");
    // .my.connect.aws 
    // .awsapps.com/connect
    const contactFlowId = this.node.tryGetContext("contactFlowId");
    const amazonConnectId = this.node.tryGetContext("amazonConnectId");
    const taskQueueArn = this.node.tryGetContext("taskQueueArn");
    const contactLensS3BucketName = this.node.tryGetContext("contactLensS3BucketName");
    
    // Validating that environment variables are present 
    if(amazonConnectArn === undefined){
      throw new Error("Missing amazonConnectArn in the context");
    }

    if(contactLensS3BucketName === undefined){
      throw new Error("Missing contactLensS3BucketName in the context");
    }


    if(amazonConnectUrl === undefined){
      throw new Error("Missing amazonConnectUrl in the context");
    }

    if(contactFlowId === undefined){
      throw new Error("Missing contactFlowId in the context");
    }

    if(amazonConnectId === undefined){
      throw new Error("Missing amazonConnectId in the context");
    }

    if(taskQueueArn === undefined){
      throw new Error("Missing taskQueueArn in the context");
    }

    const contactLensOutputHandler = new lambda.Function(
      this,
      'contactLensOutputHandlerFunction',
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.resolve(__dirname, '../src/lambda/contactLensHandler')
        ),
        memorySize: 512,
        environment: {
          INSTANCE_URL: amazonConnectUrl,
          TASK_QUEUE_ARN: taskQueueArn,
          INSTANCE_ID: amazonConnectId,
          CONTACT_FLOW_ID: contactFlowId
        },
      }
    );

    contactLensOutputHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        effect: iam.Effect.ALLOW,
        resources: [
          `arn:aws:s3:::${contactLensS3BucketName}/*`,
        ],
      })
    );
    
    contactLensOutputHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['connect:StartTaskContact'],
        effect: iam.Effect.ALLOW,
        resources: [
          `${amazonConnectArn}/contact-flow/${contactFlowId}`,
        ],
      })
    );

    const contactLensBucketTopic = new sns.Topic(
      this,
      'contactLensBucketTopic',
      {}
    );

    const contactLensBucketTopicStatement = new iam.PolicyStatement({
      actions: [
        'sns:Publish'
      ],
      principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
      resources: [contactLensBucketTopic.topicArn],
    });

    contactLensBucketTopic.addToResourcePolicy(contactLensBucketTopicStatement)

    new cdk.CfnOutput(this, 'SmsInboundTopic', {
      value: contactLensBucketTopic.topicArn.toString(),
    }); 

    contactLensBucketTopic.addSubscription(
      new subscriptions.LambdaSubscription(contactLensOutputHandler)
    );


  }
}
