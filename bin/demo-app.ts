#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { DemoAppStack } from '../lib/demo-app-stack';

const app = new cdk.App();
new DemoAppStack(app, 'DemoAppStack');
