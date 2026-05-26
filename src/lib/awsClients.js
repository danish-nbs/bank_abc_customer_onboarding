import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import { LambdaClient } from '@aws-sdk/client-lambda'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { awsConfig } from '../aws-config'

const credentials = fromCognitoIdentityPool({
  identityPoolId: awsConfig.identityPoolId,
  clientConfig: { region: awsConfig.region },
})

const baseConfig = {
  region: awsConfig.region,
  credentials,
}

export const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient(baseConfig),
  { marshallOptions: { removeUndefinedValues: true } }
)

export const s3Client = new S3Client(baseConfig)

export const bedrockClient = new BedrockRuntimeClient(baseConfig)

export const lambdaClient = new LambdaClient(baseConfig)
