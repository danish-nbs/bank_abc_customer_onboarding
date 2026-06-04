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

// Random date between two dates, returned as ISO string
function randDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()
}

const START = new Date('2021-01-01T00:00:00Z')
const END   = new Date('2026-06-04T00:00:00Z')

const cases = [
  // --- Individuals ---
  {
    appId: 'APP-I-002001',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Standard Tier',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Lena Hoffmann', dateOfBirth: '1985-03-22', nationality: 'German', passportNumber: 'DEU4401928', issueDate: '2019-03-22', expiryDate: '2029-03-22', issuingCountry: 'Germany', email: 'lena.hoffmann@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002002',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Fixed Rate',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Mohammed Al-Farsi', dateOfBirth: '1990-11-05', nationality: 'Omani', passportNumber: 'OMN3319284', issueDate: '2020-11-05', expiryDate: '2030-11-05', issuingCountry: 'Oman', email: 'mfarsi@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002003',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Elite Cashback',
    status: 'rejected',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Anjali Menon', dateOfBirth: '1987-07-14', nationality: 'Indian', passportNumber: 'IND7723410', issueDate: '2021-07-14', expiryDate: '2031-07-14', issuingCountry: 'India', email: 'anjali.menon@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002004',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Variable Rate',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Carlos Reyes', dateOfBirth: '1979-05-30', nationality: 'Mexican', passportNumber: 'MEX5590123', issueDate: '2018-05-30', expiryDate: '2028-05-30', issuingCountry: 'Mexico', email: 'carlos.reyes@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002005',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Premier Global',
    status: 'pending_docs',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Yuki Tanaka', dateOfBirth: '1995-01-18', nationality: 'Japanese' },
  },
  {
    appId: 'APP-I-002006',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Secured Loan',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Nadia Petrov', dateOfBirth: '1983-09-08', nationality: 'Russian', passportNumber: 'RUS2201478', issueDate: '2022-09-08', expiryDate: '2032-09-08', issuingCountry: 'Russia', email: 'nadia.petrov@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002007',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Corporate Rewards',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Ethan Williams', dateOfBirth: '1991-12-25', nationality: 'American', passportNumber: 'USA8834512', issueDate: '2020-12-25', expiryDate: '2030-12-25', issuingCountry: 'United States', email: 'ethan.w@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002008',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Fixed Rate',
    status: 'draft',
    createdAt: randDate(new Date('2026-01-01'), END),
  },
  {
    appId: 'APP-I-002009',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Standard Tier',
    status: 'rejected',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Fatou Diallo', dateOfBirth: '1986-04-02', nationality: 'Senegalese', passportNumber: 'SEN1123845', issueDate: '2019-04-02', expiryDate: '2029-04-02', issuingCountry: 'Senegal', email: 'fatou.diallo@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002010',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Variable Rate',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Lucas Ferreira', dateOfBirth: '1994-08-16', nationality: 'Brazilian', passportNumber: 'BRA6612390', issueDate: '2022-08-16', expiryDate: '2032-08-16', issuingCountry: 'Brazil', email: 'lucas.ferreira@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002011',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Elite Cashback',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Zainab Al-Khalidi', dateOfBirth: '1989-02-11', nationality: 'Kuwaiti', passportNumber: 'KWT7712034', issueDate: '2021-02-11', expiryDate: '2031-02-11', issuingCountry: 'Kuwait', email: 'zainab.k@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002012',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Secured Loan',
    status: 'pending_docs',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Arjun Nair', dateOfBirth: '1982-06-29', nationality: 'Indian' },
  },
  {
    appId: 'APP-I-002013',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Premier Global',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Isabella Rossi', dateOfBirth: '1993-10-07', nationality: 'Italian', passportNumber: 'ITA5503918', issueDate: '2023-10-07', expiryDate: '2033-10-07', issuingCountry: 'Italy', email: 'isabella.rossi@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002014',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Fixed Rate',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Kevin Park', dateOfBirth: '1980-03-14', nationality: 'South Korean', passportNumber: 'KOR8812450', issueDate: '2020-03-14', expiryDate: '2030-03-14', issuingCountry: 'South Korea', email: 'kevin.park@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002015',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Standard Tier',
    status: 'draft',
    createdAt: randDate(new Date('2026-03-01'), END),
  },
  {
    appId: 'APP-I-002016',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Variable Rate',
    status: 'rejected',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Elena Vasquez', dateOfBirth: '1976-12-19', nationality: 'Colombian', passportNumber: 'COL4401823', issueDate: '2018-12-19', expiryDate: '2028-12-19', issuingCountry: 'Colombia', email: 'elena.vasquez@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002017',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Corporate Rewards',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Ahmed Siddiqui', dateOfBirth: '1988-05-23', nationality: 'Pakistani', passportNumber: 'PAK6623014', issueDate: '2021-05-23', expiryDate: '2031-05-23', issuingCountry: 'Pakistan', email: 'ahmed.siddiqui@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002018',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Fixed Rate',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Marie Dubois', dateOfBirth: '1984-08-31', nationality: 'French', passportNumber: 'FRA7712048', issueDate: '2020-08-31', expiryDate: '2030-08-31', issuingCountry: 'France', email: 'marie.dubois@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002019',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Elite Cashback',
    status: 'pending_docs',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Tariq Al-Ansari', dateOfBirth: '1997-01-04', nationality: 'Qatari' },
  },
  {
    appId: 'APP-I-002020',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Secured Loan',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Sofia Lindqvist', dateOfBirth: '1991-07-27', nationality: 'Swedish', passportNumber: 'SWE3312784', issueDate: '2022-07-27', expiryDate: '2032-07-27', issuingCountry: 'Sweden', email: 'sofia.lindqvist@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002021',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Premier Global',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Chinonso Obi', dateOfBirth: '1986-09-13', nationality: 'Nigerian', passportNumber: 'NGA8823416', issueDate: '2023-09-13', expiryDate: '2033-09-13', issuingCountry: 'Nigeria', email: 'chinonso.obi@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002022',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Variable Rate',
    status: 'rejected',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Mei-Ling Zhang', dateOfBirth: '1978-11-20', nationality: 'Chinese', passportNumber: 'CHN5503920', issueDate: '2019-11-20', expiryDate: '2029-11-20', issuingCountry: 'China', email: 'meiling.z@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002023',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Standard Tier',
    status: 'processing',
    createdAt: randDate(new Date('2026-04-01'), END),
    profileData: { fullName: 'Hamad Al-Thani', dateOfBirth: '1992-04-06', nationality: 'Qatari', passportNumber: 'QAT2201467', issueDate: '2022-04-06', expiryDate: '2032-04-06', issuingCountry: 'Qatar' },
  },
  {
    appId: 'APP-I-002024',
    customerType: 'individual',
    product: 'Personal Loan',
    productVariant: 'Fixed Rate',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Priscilla Otieno', dateOfBirth: '1983-02-28', nationality: 'Kenyan', passportNumber: 'KEN6612038', issueDate: '2021-02-28', expiryDate: '2031-02-28', issuingCountry: 'Kenya', email: 'priscilla.otieno@email.com', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-I-002025',
    customerType: 'individual',
    product: 'Credit Card',
    productVariant: 'Corporate Rewards',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { fullName: 'Viktor Kozlov', dateOfBirth: '1975-06-09', nationality: 'Ukrainian', passportNumber: 'UKR4412780', issueDate: '2020-06-09', expiryDate: '2030-06-09', issuingCountry: 'Ukraine', email: 'viktor.kozlov@email.com', confirmedBy: 'Jane Cooper' },
  },

  // --- Businesses ---
  {
    appId: 'APP-B-002001',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Multi-Currency',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Gulf Horizon Investments', tradeLicenseNumber: 'TL-2019-33210', businessType: 'Investment Management', incorporationDate: '2012-06-01', address: 'Floor 22, ADGM Square, Abu Dhabi', fullName: 'Mariam Al-Suwaidi', designation: 'CEO', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002002',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Plus',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Crescent Logistics LLC', tradeLicenseNumber: 'TL-2021-91023', businessType: 'Freight & Logistics', incorporationDate: '2016-03-15', address: 'Jebel Ali Free Zone, Dubai', fullName: 'Rajesh Kumar', designation: 'Operations Director', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002003',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Treasury Account',
    status: 'rejected',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Zenith Pharma Group', tradeLicenseNumber: 'TL-2018-44890', businessType: 'Pharmaceuticals', incorporationDate: '2009-11-22', address: 'Khalidiyah, Abu Dhabi', fullName: 'Sana Mirza', designation: 'CFO', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002004',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'Basic SME',
    status: 'pending_docs',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Desert Rose Catering', businessType: 'Food & Beverage', fullName: 'Hind Al-Mazrouei', designation: 'Owner' },
  },
  {
    appId: 'APP-B-002005',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Standard Corporate',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Falcon Digital Media', tradeLicenseNumber: 'TL-2020-77312', businessType: 'Media & Advertising', incorporationDate: '2014-08-10', address: 'Media City, Dubai', fullName: 'Patrick O\'Sullivan', designation: 'Managing Director', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002006',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Premium',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { companyName: 'TechBridge Solutions FZ', tradeLicenseNumber: 'TL-2022-10234', businessType: 'IT Consulting', incorporationDate: '2018-02-28', address: 'Dubai Internet City', fullName: 'Aryan Kapoor', designation: 'Founder & CTO', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002007',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Multi-Currency',
    status: 'draft',
    createdAt: randDate(new Date('2026-02-01'), END),
    profileData: { companyName: 'Harbour Gate Real Estate', businessType: 'Real Estate Development' },
  },
  {
    appId: 'APP-B-002008',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Plus',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Arabian Jewels Trading', tradeLicenseNumber: 'TL-2017-55219', businessType: 'Retail & Wholesale', incorporationDate: '2011-04-05', address: 'Gold Souk, Dubai', fullName: 'Hassan Al-Khatib', designation: 'General Manager', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002009',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Treasury Account',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Skyline Construction Group', tradeLicenseNumber: 'TL-2016-88310', businessType: 'Construction & Engineering', incorporationDate: '2008-09-17', address: 'Business Bay, Dubai', fullName: 'Sergei Volkov', designation: 'Director', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002010',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'Basic SME',
    status: 'rejected',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Blue Nile Import & Export', tradeLicenseNumber: 'TL-2015-22078', businessType: 'Import & Export', incorporationDate: '2007-01-30', address: 'Port Rashid, Dubai', fullName: 'Abebe Bekele', designation: 'Owner', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002011',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Standard Corporate',
    status: 'processing',
    createdAt: randDate(new Date('2026-05-01'), END),
    profileData: { companyName: 'Momentum Ventures Capital', tradeLicenseNumber: 'TL-2023-30019', businessType: 'Venture Capital', incorporationDate: '2020-07-12', address: 'DIFC, Dubai', fullName: 'Andrea Moretti', designation: 'Partner' },
  },
  {
    appId: 'APP-B-002012',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Premium',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Oasis Healthcare LLC', tradeLicenseNumber: 'TL-2019-66123', businessType: 'Healthcare Services', incorporationDate: '2013-05-20', address: 'Healthcare City, Dubai', fullName: 'Dr. Leila Hosseini', designation: 'CEO', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002013',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Multi-Currency',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Versailles Luxury Retail', tradeLicenseNumber: 'TL-2020-41234', businessType: 'Luxury Goods Retail', incorporationDate: '2017-10-08', address: 'Dubai Mall, Dubai', fullName: 'Isabelle Moreau', designation: 'Brand Director', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002014',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'Basic SME',
    status: 'pending_docs',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Sahara Solar Energy', businessType: 'Renewable Energy', fullName: 'Mohammed Bouazza', designation: 'Founder' },
  },
  {
    appId: 'APP-B-002015',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Standard Corporate',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Pacific Rim Shipping', tradeLicenseNumber: 'TL-2014-19823', businessType: 'Maritime Shipping', incorporationDate: '2005-03-22', address: 'Port Jebel Ali, Dubai', fullName: 'Takeshi Yamamoto', designation: 'Regional Director', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002016',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Plus',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Greenfield Agricultural Trading', tradeLicenseNumber: 'TL-2021-53409', businessType: 'Agricultural Commodities', incorporationDate: '2015-11-01', address: 'Al Quoz, Dubai', fullName: 'Amir Naseri', designation: 'Managing Partner', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002017',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Treasury Account',
    status: 'draft',
    createdAt: randDate(new Date('2026-04-01'), END),
  },
  {
    appId: 'APP-B-002018',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Premium',
    status: 'rejected',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Northstar Event Management', tradeLicenseNumber: 'TL-2018-37821', businessType: 'Events & Exhibitions', incorporationDate: '2010-06-14', address: 'Jumeirah, Dubai', fullName: 'Claudia Becker', designation: 'Director', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002019',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Multi-Currency',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Diamond Gate Properties', tradeLicenseNumber: 'TL-2016-70234', businessType: 'Property Development', incorporationDate: '2010-08-19', address: 'Downtown Dubai', fullName: 'Khalifa Al-Shamsi', designation: 'Chairman', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002020',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'Basic SME',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Olive Tree Restaurant Group', tradeLicenseNumber: 'TL-2022-80123', businessType: 'Hospitality & Dining', incorporationDate: '2019-03-10', address: 'JBR, Dubai', fullName: 'Nicolas Papadopoulos', designation: 'Owner', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002021',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Standard Corporate',
    status: 'pending_docs',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Quantum Cybersecurity FZ', businessType: 'Cybersecurity', fullName: 'Dmitri Orlov', designation: 'CEO' },
  },
  {
    appId: 'APP-B-002022',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Plus',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Silk Road Textile Trading', tradeLicenseNumber: 'TL-2013-28017', businessType: 'Textile Import & Export', incorporationDate: '2003-09-05', address: 'Deira, Dubai', fullName: 'Lin Wei', designation: 'Managing Director', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002023',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Treasury Account',
    status: 'in_review',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Iron Horse Mining Ltd', tradeLicenseNumber: 'TL-2020-91234', businessType: 'Mining & Resources', incorporationDate: '2016-12-03', address: 'ADGM, Abu Dhabi', fullName: 'Conrad Meyer', designation: 'VP Finance', confirmedBy: 'Jane Cooper' },
  },
  {
    appId: 'APP-B-002024',
    customerType: 'business',
    product: 'SME Account',
    productVariant: 'SME Premium',
    status: 'draft',
    createdAt: randDate(new Date('2026-05-01'), END),
  },
  {
    appId: 'APP-B-002025',
    customerType: 'business',
    product: 'Corporate Account',
    productVariant: 'Multi-Currency',
    status: 'approved',
    createdAt: randDate(START, END),
    profileData: { companyName: 'Emirates Aerospace Components', tradeLicenseNumber: 'TL-2011-60234', businessType: 'Aerospace Manufacturing', incorporationDate: '2006-07-28', address: 'Dubai Aerospace Enterprise', fullName: 'Yousef Al-Mulla', designation: 'COO', confirmedBy: 'Jane Cooper' },
  },
]

// Backfill updatedAt = createdAt for all items
for (const item of cases) {
  if (!item.updatedAt) item.updatedAt = item.createdAt
  if (item.profileData && !item.profileData.confirmedAt && item.profileData.confirmedBy) {
    item.profileData.confirmedAt = item.createdAt
  }
}

let inserted = 0
let skipped = 0

for (const item of cases) {
  try {
    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(appId)',
    }))
    const name = item.profileData?.fullName ?? item.profileData?.companyName ?? '(no profile)'
    console.log(`  ✓ ${item.appId} — ${name}`)
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
