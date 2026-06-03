export const awsConfig = {
  region: 'us-east-1',
  identityPoolId: 'us-east-1:dfcf61c0-e0e4-45c5-954b-709070eabe0e',
  dynamoTableName: 'bank-abc-onboarding-cases',
  s3BucketName: 'bank-abc-onboarding-documents-074681445364',
  bedrockModelId: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
  classifyDocumentFunctionName: 'bank-abc-onboarding-classify-document',
  faceMatchFunctionName: 'bank-abc-onboarding-face-match',
}
