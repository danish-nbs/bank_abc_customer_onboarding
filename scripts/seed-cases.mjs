import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'

const REGION = 'us-east-1'
const IDENTITY_POOL_ID = 'us-east-1:dfcf61c0-e0e4-45c5-954b-709070eabe0e'
const TABLE_NAME = 'bank-abc-onboarding-cases'

const credentials = fromCognitoIdentityPool({
  identityPoolId: IDENTITY_POOL_ID,
  client: new CognitoIdentityClient({ region: REGION }),
})

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION, credentials }),
  { marshallOptions: { removeUndefinedValues: true } }
)

function iso(daysAgo, hoursAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

const cases = [
  // --- Individuals ---
  {
    appId: 'APP-I-001001',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Fixed Rate',
    status: 'approved',
    createdAt: iso(14, 2),
    updatedAt: iso(10, 1),
    profileData: {
      fullName: 'Sarah Mitchell',
      dateOfBirth: '1988-04-12',
      nationality: 'British',
      passportNumber: 'GBR7294810',
      issueDate: '2018-04-12',
      expiryDate: '2028-04-12',
      issuingCountry: 'United Kingdom',
      phoneNumber: '+44 7700 900123',
      email: 'sarah.mitchell@email.com',
      confirmedAt: iso(10, 1),
      confirmedBy: 'Jane Cooper',
    },
  },
  {
    appId: 'APP-I-001002',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Premier Global',
    status: 'in_review',
    createdAt: iso(7, 4),
    updatedAt: iso(6, 2),
    profileData: {
      fullName: 'James Okafor',
      dateOfBirth: '1993-09-27',
      nationality: 'Nigerian',
      passportNumber: 'NGA5512347',
      issueDate: '2020-09-27',
      expiryDate: '2030-09-27',
      issuingCountry: 'Nigeria',
      phoneNumber: '+234 802 345 6789',
      email: 'james.okafor@email.com',
      confirmedAt: iso(6, 2),
      confirmedBy: 'Jane Cooper',
    },
  },
  {
    appId: 'APP-I-001003',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Variable Rate',
    status: 'pending_docs',
    createdAt: iso(5, 1),
    updatedAt: iso(5, 1),
  },
  {
    appId: 'APP-I-001004',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Elite Cashback',
    status: 'rejected',
    createdAt: iso(20, 3),
    updatedAt: iso(15, 5),
    profileData: {
      fullName: 'David Chen',
      dateOfBirth: '1975-11-03',
      nationality: 'Singaporean',
      passportNumber: 'SGP8812901',
      issueDate: '2019-11-03',
      expiryDate: '2029-11-03',
      issuingCountry: 'Singapore',
      phoneNumber: '+65 9123 4567',
      email: 'david.chen@email.com',
      confirmedAt: iso(15, 5),
      confirmedBy: 'Jane Cooper',
    },
  },
  {
    appId: 'APP-I-001005',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Secured Loan',
    status: 'draft',
    createdAt: iso(1, 3),
    updatedAt: iso(1, 3),
  },
  {
    appId: 'APP-I-001006',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Standard Tier',
    status: 'in_review',
    createdAt: iso(3, 6),
    updatedAt: iso(2, 1),
    profileData: {
      fullName: 'Amira Hassan',
      dateOfBirth: '1990-06-18',
      nationality: 'Egyptian',
      passportNumber: 'EGY3301245',
      issueDate: '2021-06-18',
      expiryDate: '2031-06-18',
      issuingCountry: 'Egypt',
      phoneNumber: '+20 100 234 5678',
      email: 'amira.hassan@email.com',
      confirmedAt: iso(2, 1),
      confirmedBy: 'Jane Cooper',
    },
  },

  // --- Businesses ---
  {
    appId: 'APP-B-001001',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Multi-Currency',
    status: 'approved',
    createdAt: iso(30, 2),
    updatedAt: iso(25, 4),
    profileData: {
      companyName: 'Apex Ventures Ltd',
      tradeLicenseNumber: 'TL-2022-88421',
      businessType: 'Investment Holding',
      incorporationDate: '2015-03-10',
      address: '12 Sovereign Tower, Dubai, UAE',
      fullName: 'Omar Al-Rashidi',
      designation: 'Managing Director',
      confirmedAt: iso(25, 4),
      confirmedBy: 'Jane Cooper',
    },
  },
  {
    appId: 'APP-B-001002',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Plus',
    status: 'in_review',
    createdAt: iso(8, 5),
    updatedAt: iso(7, 2),
    profileData: {
      companyName: 'Nova Tech Solutions',
      tradeLicenseNumber: 'TL-2023-10293',
      businessType: 'Technology & Software',
      incorporationDate: '2019-07-22',
      address: '45 Innovation Hub, Abu Dhabi, UAE',
      fullName: 'Fatima Al-Zaabi',
      designation: 'CEO',
      confirmedAt: iso(7, 2),
      confirmedBy: 'Jane Cooper',
    },
  },
  {
    appId: 'APP-B-001003',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Treasury Account',
    status: 'pending_docs',
    createdAt: iso(4, 7),
    updatedAt: iso(4, 7),
    profileData: {
      companyName: 'Meridian Group Holdings',
      businessType: 'Diversified Conglomerate',
      fullName: 'Khalid Al-Mansoori',
      designation: 'CFO',
    },
  },
  {
    appId: 'APP-B-001004',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'Basic SME',
    status: 'rejected',
    createdAt: iso(45, 1),
    updatedAt: iso(40, 3),
    profileData: {
      companyName: 'Sunrise Trading Co.',
      tradeLicenseNumber: 'TL-2020-44512',
      businessType: 'General Trading',
      incorporationDate: '2010-01-15',
      address: '7 Commerce Street, Sharjah, UAE',
      fullName: 'Ravi Pillai',
      designation: 'Owner',
      confirmedAt: iso(40, 3),
      confirmedBy: 'Jane Cooper',
    },
  },
  {
    appId: 'APP-B-001005',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Standard Corporate',
    status: 'in_review',
    createdAt: iso(6, 3),
    updatedAt: iso(5, 1),
    profileData: {
      companyName: 'Atlas Capital Partners',
      tradeLicenseNumber: 'TL-2021-77831',
      businessType: 'Financial Services',
      incorporationDate: '2017-09-05',
      address: '88 DIFC Gate Avenue, Dubai, UAE',
      fullName: 'Sofia Andersen',
      designation: 'Managing Partner',
      confirmedAt: iso(5, 1),
      confirmedBy: 'Jane Cooper',
    },
  },
  {
    appId: 'APP-B-001006',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Premium',
    status: 'draft',
    createdAt: iso(0, 5),
    updatedAt: iso(0, 5),
  },
]

let inserted = 0
let skipped = 0

for (const item of cases) {
  try {
    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(appId)',
    }))
    console.log(`  ✓ ${item.appId} — ${item.profileData?.fullName ?? item.profileData?.companyName ?? '(no profile)'}`)
    inserted++
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      console.log(`  – ${item.appId} already exists, skipped`)
      skipped++
    } else {
      console.error(`  ✗ ${item.appId} failed: ${err.message}`)
    }
  }
}

console.log(`\nDone: ${inserted} inserted, ${skipped} skipped.`)
