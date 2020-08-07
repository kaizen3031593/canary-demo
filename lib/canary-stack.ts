import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as synthetics from '@aws-cdk/aws-synthetics';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';


export class CanaryStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const canary = new synthetics.Canary(this, 'DemoCanary', {
      test: synthetics.Test.custom({
        handler: 'canary.handler',
        code: synthetics.Code.fromAsset(path.join(__dirname, '../canary')),
      }),
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(1)),
    });

    new cloudwatch.Alarm(this, 'DemoAlarm', {
      metric: canary.metricSuccessPercent({
        period: cdk.Duration.minutes(2),
      }),
      threshold: 90,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
    });
  }
}
