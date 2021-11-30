// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const AWS = require('aws-sdk');
const s3Client = new AWS.S3();
const connect = new AWS.Connect();
const {
    INSTANCE_URL,
    TASK_QUEUE_ARN,
    INSTANCE_ID,
    CONTACT_FLOW_ID,
} = process.env;
exports.handler = async (event) => {

    const s3 = JSON.parse(event.Records[0].Sns.Message).Records[0].s3;
    const bucket = s3.bucket.name;
    const key = s3.object.key;
    const resp = await s3Client.getObject({
        Bucket: bucket,
        Key: key,
    }).promise();
    const contactLensContent = resp.Body.toString('utf-8')
    const transcriptArray = JSON.parse(contactLensContent).Transcript;
    let issuesText = "";
    let outcomeText = "";
    let actionItemText = "";
    for (const line of transcriptArray) {
      if (line.IssuesDetected) {
        // Issue detected
          issuesText = line.IssuesDetected
      }
      if (line.OutcomesDetected) {
        // Outcomes Detected
          outcomeText = line.OutcomesDetected;
      }
      if (line.ActionItemsDetected) {
        // Action items detected
          actionItemText = line.ActionItemsDetected;
      }
    }
    if (actionItemText) {
        console.log("We have action item")
        const contactId = JSON.parse(contactLensContent).CustomerMetadata.ContactId;
        const taskParams = {
            Attributes: {
                IssueDetected: issuesText ? JSON.stringify(issuesText[0].Text) : "No issue detected",
                OutcomeDetected: outcomeText? JSON.stringify(outcomeText[0].Text) : "No outcome detected",
                QueueArn: TASK_QUEUE_ARN,
            },
            ContactFlowId: CONTACT_FLOW_ID,
            InstanceId: INSTANCE_ID,
            Description: JSON.stringify(actionItemText[0].Text),
            Name: "Action Items for contact " + contactId.toString(),
            // PreviousContactId: contactId,
            References: {
                ContactUrl: {
                    Type: "URL",
                    Value: INSTANCE_URL + "/contact-trace-records/details/" + contactId
                }
            }
        }
        console.log(taskParams)
        const res = await connect.startTaskContact(taskParams).promise();
        console.log("created task")
    }
};
