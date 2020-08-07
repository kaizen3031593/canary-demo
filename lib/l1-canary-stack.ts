import * as cdk from '@aws-cdk/core';
import { CfnCanary } from '@aws-cdk/aws-synthetics';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';

export class CanaryL1Stack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const artifactsBucket = new s3.Bucket(this, 'bucket');

        const policy = new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ['*'],
              actions: ['s3:ListAllMyBuckets'],
            }),
            new iam.PolicyStatement({
              resources: [artifactsBucket.arnForObjects('*')],
              actions: ['s3:PutObject', 's3:GetBucketLocation'],
            }),
            new iam.PolicyStatement({
              resources: ['*'],
              actions: ['cloudwatch:PutMetricData'],
              conditions: {StringEquals: {'cloudwatch:namespace': 'CloudWatchSynthetics'}},
            }),
            new iam.PolicyStatement({
              resources: ['arn:aws:logs:::*'],
              actions: ['logs:CreateLogStream', 'logs:CreateLogGroup', 'logs:PutLogEvents'],
            }),
          ],
        });
    
        const role = new iam.Role(this, 'ServiceRole', {
          assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
          inlinePolicies: {
            canaryPolicy: policy,
          },
        });


        const canary = new CfnCanary(this, 'test-lambda-canary-A', {
          artifactS3Location: artifactsBucket.s3UrlForObject(),
          code: {
              handler: 'index.handler',
              script: `var synthetics = require('Synthetics');
                const log = require('SyntheticsLogger');
                const https = require('https');
                
                const apiCanaryBlueprint = async function () {
                    const postData = "";
                
                    const verifyRequest = async function (requestOption) {
                      return new Promise((resolve, reject) => {
                        log.info("Making request with options: " + JSON.stringify(requestOption));
                        let req = https.request(requestOption);
                        req.on('response', (res) => {
                          log.info(\`Status Code: \${res.statusCode}\`)
                          log.info(\`Response Headers: \${JSON.stringify(res.headers)}\`)
                          if (res.statusCode !== 200) {
                            reject("Failed: " + requestOption.path);
                          }
                          res.on('data', (d) => {
                            log.info("Response: " + d);
                          });
                          res.on('end', () => {
                            resolve();
                          })
                        });
                
                        req.on('error', (error) => {
                          reject(error);
                        });
                
                        if (postData) {
                          req.write(postData);
                        }
                        req.end();
                      });
                    }
                
                    const password = 'canary';
                    const path = \`/prod/?password=\${password}\`;
                    const headers = {};
                    headers['User-Agent'] = [synthetics.getCanaryUserAgentString(), headers['User-Agent']].join(' ');
                    const requestOptions = {"hostname":"gqrq48v15f.execute-api.us-east-1.amazonaws.com","method":"GET","path":path,"port":443}
                    requestOptions['headers'] = headers;
                    await verifyRequest(requestOptions);
                };
                
                exports.handler = async () => {
                    return await apiCanaryBlueprint();
                };`,
          },
          executionRoleArn: role.roleArn,
          name: 'testlambdacanaryA',
          runtimeVersion: 'syn-1.0',
          schedule: { durationInSeconds: '3600', expression: 'rate(1 minute)'},
          startCanaryAfterCreation: true,
      });

        const canaryMetric = new cloudwatch.Metric({
            namespace: 'CloudWatchSynthetics',
            metricName: 'SuccessPercent',
            dimensions: { CanaryName: canary.ref },
            statistic: 'avg',
            period: cdk.Duration.minutes(2),
        }).attachTo(canary);

        new cloudwatch.Alarm(this, 'CanaryAlarm5', {
            metric: canaryMetric,
            threshold: 99,
            comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            evaluationPeriods: 2,
        });
    }
}