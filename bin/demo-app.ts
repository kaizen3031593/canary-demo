#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { LambdaStack } from '../lib/lambda-stack';
import { CanaryStack } from '../lib/canary-stack';

const app = new cdk.App();
new LambdaStack(app, 'LambdaStack');
new CanaryStack(app, 'CanaryStack');
