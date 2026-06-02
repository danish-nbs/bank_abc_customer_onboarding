import json
import os
import base64
import logging
import boto3
from datetime import datetime, timezone

logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

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
    'Corporate Account': ['Trade License', 'Power of Attorney', 'Passport', 'National ID', 'Selfie'],
}

# Loaded once on cold start — free on all warm invocations
CLASSIFICATION_PROMPT = ssm.get_parameter(Name=PROMPT_PARAM)['Parameter']['Value']


def _log(event, **kwargs):
    logger.info(json.dumps({'event': event, **kwargs}))


def _fetch_block(key):
    obj = s3.get_object(Bucket=BUCKET, Key=key)
    content_type = obj.get('ContentType', 'image/jpeg')
    b64 = base64.b64encode(obj['Body'].read()).decode('utf-8')
    block_type = 'document' if content_type == 'application/pdf' else 'image'
    return {'type': block_type, 'source': {'type': 'base64', 'media_type': content_type, 'data': b64}}


def lambda_handler(event, context):
    app_id = event.get('appId')
    new_doc_keys = set(event.get('documentKeys') or [])
    _log('lambda_invoked', appId=app_id, requestId=context.aws_request_id, newDocKeys=list(new_doc_keys))

    if not app_id:
        _log('validation_error', error='appId is required')
        return {'statusCode': 400, 'body': json.dumps({'error': 'appId is required'})}

    table = dynamodb.Table(TABLE_NAME)
    case = table.get_item(Key={'appId': app_id}).get('Item')
    if not case:
        _log('case_not_found', appId=app_id)
        return {'statusCode': 404, 'body': json.dumps({'error': f'Case {app_id} not found'})}

    product_type = case.get('product')
    documents = case.get('documents', [])

    if not product_type:
        _log('validation_error', appId=app_id, error='Case has no product type')
        return {'statusCode': 400, 'body': json.dumps({'error': 'Case has no product type'})}
    if not documents:
        _log('validation_error', appId=app_id, error='Case has no documents')
        return {'statusCode': 400, 'body': json.dumps({'error': 'Case has no documents'})}

    expected_types = DOCUMENT_TYPES.get(product_type)
    if not expected_types:
        _log('validation_error', appId=app_id, error=f'Unknown product type: {product_type}')
        return {'statusCode': 400, 'body': json.dumps({'error': f'Unknown product type: {product_type}'})}

    # Only process the specified new documents; fall back to all docs if no filter given
    docs_to_process = [d for d in documents if d['key'] in new_doc_keys] if new_doc_keys else documents

    content_blocks = [_fetch_block(doc['key']) for doc in docs_to_process]

    prompt = (CLASSIFICATION_PROMPT
              .replace('{product_type}', product_type)
              .replace('{expected_list}', ', '.join(expected_types))
              .replace('{doc_count}', str(len(docs_to_process))))
    content_blocks.append({'type': 'text', 'text': prompt})

    bedrock_request_body = {
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 4096,
        'messages': [{'role': 'user', 'content': content_blocks}],
    }

    _log('bedrock_request',
         appId=app_id,
         modelId=MODEL,
         documentCount=len(docs_to_process),
         documentKeys=[doc['key'] for doc in docs_to_process],
         productType=product_type,
         expectedTypes=expected_types,
         prompt=prompt,
         maxTokens=1024)

    response = bedrock.invoke_model(
        modelId=MODEL,
        contentType='application/json',
        accept='application/json',
        body=json.dumps(bedrock_request_body),
    )

    response_body = json.loads(response['body'].read())
    text = response_body['content'][0]['text'].strip()

    _log('bedrock_response',
         appId=app_id,
         modelId=MODEL,
         stopReason=response_body.get('stop_reason'),
         inputTokens=response_body.get('usage', {}).get('input_tokens'),
         outputTokens=response_body.get('usage', {}).get('output_tokens'),
         rawText=text)

    if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()

    try:
        classifications = json.loads(text)
    except json.JSONDecodeError as e:
        _log('parse_error', appId=app_id, error=str(e), rawText=text)
        raise

    new_results = []
    for i, doc in enumerate(docs_to_process):
        result = classifications[i] if i < len(classifications) else {}
        if result.get('documentType') not in expected_types:
            result['documentType'] = 'Unclassified'
        new_results.append({'documentKey': doc['key'], 'documentName': doc.get('name', ''), **result})

    # Merge: keep existing aiResults for docs not in this batch, replace/add for new ones
    if new_doc_keys:
        processed_keys = {r['documentKey'] for r in new_results}
        existing_results = case.get('aiResults', [])
        final_results = [r for r in existing_results if r.get('documentKey') not in processed_keys] + new_results
    else:
        final_results = new_results

    table.update_item(
        Key={'appId': app_id},
        UpdateExpression='SET aiResults = :ai, #st = :st, updatedAt = :ts',
        ExpressionAttributeNames={'#st': 'status'},
        ExpressionAttributeValues={
            ':ai': final_results,
            ':st': 'in_review',
            ':ts': datetime.now(timezone.utc).isoformat(),
        },
    )

    _log('lambda_complete', appId=app_id, resultsCount=len(final_results),
         documentTypes=[r.get('documentType') for r in final_results])

    return {
        'statusCode': 200,
        'body': json.dumps({
            'appId': app_id,
            'productType': product_type,
            'expectedTypes': expected_types,
            'results': final_results,
        }),
    }
