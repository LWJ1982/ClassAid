#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ClassAidStack } from '../lib/classaid-stack';

const app = new cdk.App();

new ClassAidStack(app, 'ClassAidStack', {
  env: {
    // Replace with your AWS account and region
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
    region: process.env.CDK_DEFAULT_REGION || 'eu-west-1',
  },
  description: 'Class AId - Readiness and Learning Assurance Platform (AWS Production Stack)',
});
