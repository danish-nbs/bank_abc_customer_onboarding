import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from './awsClients'
import { awsConfig } from '../aws-config'

export function logActivity(appId, { type, category, actor, description }) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    category,
    actor,
    description,
    timestamp: new Date().toISOString(),
  }
  return dynamoClient
    .send(new UpdateCommand({
      TableName: awsConfig.dynamoTableName,
      Key: { appId },
      UpdateExpression: 'SET activityLog = list_append(if_not_exists(activityLog, :empty), :entry), updatedAt = :ts',
      ExpressionAttributeValues: { ':empty': [], ':entry': [entry], ':ts': new Date().toISOString() },
    }))
    .then(() => entry)
    .catch(err => { console.error('logActivity failed:', err); return null })
}
