import json
import os
import base64
import boto3
from datetime import datetime, timezone

s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime')
ssm = boto3.client('ssm')
dynamodb = boto3.resource('dynamodb')

BUCKET = os.environ['BUCKET']
MODEL = os.environ['MODEL']
PROMPT_PARAM = os.environ['PROMPT_PARAM']
TABLE_NAME = os.environ['TABLE']

DOCUMENT_TYPES = {
    'Credit Card':       ['Passport', 'National ID', 'Utility Bill', 'Bank Statement', 'Selfie'],
    'Personal Loan':     ['Passport', 'National ID', 'Salary Certificate', 'Bank Statement', 'Selfie'],
    'SME Account':       ['Trade License', 'Certificate of Incorporation', 'Passport', 'National ID', 'Selfie'],
    'Corporate Account': ['Trade License', 'MOA', 'Power of Attorney', 'Passport', 'National ID', 'Selfie'],
}

# Loaded once on cold start — free on all warm invocations
CLASSIFICATION_PROMPT = ssm.get_parameter(Name=PROMPT_PARAM)['Parameter']['Value']


def _fetch_block(key):
    obj = s3.get_object(Bucket=BUCKET, Key=key)
    content_type = obj.get('ContentType', 'image/jpeg')
    b64 = base64.b64encode(obj['Body'].read()).decode('utf-8')
    block_type = 'document' if content_type == 'application/pdf' else 'image'
    return {'type': block_type, 'source': {'type': 'base64', 'media_type': content_type, 'data': b64}}


def lambda_handler(event, _context):
    app_id = event.get('appId')
    if not app_id:
        return {'statusCode': 400, 'body': json.dumps({'error': 'appId is required'})}

    table = dynamodb.Table(TABLE_NAME)
    case = table.get_item(Key={'appId': app_id}).get('Item')
    if not case:
        return {'statusCode': 404, 'body': json.dumps({'error': f'Case {app_id} not found'})}

    product_type = case.get('product')
    documents = case.get('documents', [])

    if not product_type:
        return {'statusCode': 400, 'body': json.dumps({'error': 'Case has no product type'})}
    if not documents:
        return {'statusCode': 400, 'body': json.dumps({'error': 'Case has no documents'})}

    expected_types = DOCUMENT_TYPES.get(product_type)
    if not expected_types:
        return {'statusCode': 400, 'body': json.dumps({'error': f'Unknown product type: {product_type}'})}

    content_blocks = [_fetch_block(doc['key']) for doc in documents]

    prompt = (CLASSIFICATION_PROMPT
              .replace('{product_type}', product_type)
              .replace('{expected_list}', ', '.join(expected_types))
              .replace('{doc_count}', str(len(documents))))
    content_blocks.append({'type': 'text', 'text': prompt})

    response = bedrock.invoke_model(
        modelId=MODEL,
        contentType='application/json',
        accept='application/json',
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens': 1024,
            'messages': [{'role': 'user', 'content': content_blocks}],
        }),
    )

    text = json.loads(response['body'].read())['content'][0]['text'].strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()

    classifications = json.loads(text)

    results = []
    for i, doc in enumerate(documents):
        result = classifications[i] if i < len(classifications) else {}
        if result.get('documentType') not in expected_types:
            result['documentType'] = 'Unclassified'
        results.append({'documentKey': doc['key'], 'documentName': doc.get('name', ''), **result})

    # Write results back to DynamoDB
    table.update_item(
        Key={'appId': app_id},
        UpdateExpression='SET aiResults = :ai, #st = :st, updatedAt = :ts',
        ExpressionAttributeNames={'#st': 'status'},
        ExpressionAttributeValues={
            ':ai': results,
            ':st': 'in_review',
            ':ts': datetime.now(timezone.utc).isoformat(),
        },
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'appId': app_id,
            'productType': product_type,
            'expectedTypes': expected_types,
            'results': results,
        }),
    }
