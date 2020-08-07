import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as path from 'path';

export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const backend = new lambda.Function(this, 'BackendLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')), // this.lambdaCode,
      handler: 'backend.handler',
    });

    // Add API gateways for the lambda backend
    new apigw.LambdaRestApi(this, 'Endpoint', {
      description: 'backend endpoint',
      handler: backend,
    });
  }
}
