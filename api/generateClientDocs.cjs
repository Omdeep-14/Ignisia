const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const rootDir = process.cwd().replace(/\\api$/, '');

// 1. Create Legal Contract (.pdf)
const pdfPath = path.join(rootDir, 'Client_AcmeCorp_Contract.pdf');
const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(pdfPath));
doc.fontSize(24).text('AcmeCorp Master Service Agreement', { align: 'center' }).moveDown();
doc.fontSize(12).text('Date: January 1, 2023').moveDown();
doc.fontSize(14).text('Client Information:').moveDown();
doc.fontSize(12).text(
  'Client Name: AcmeCorp Industries\nAccount ID: ACME-9942\nRegion: North America\nPrimary Contact: John Doe (john.doe@acmecorp.com)'
).moveDown(2);
doc.fontSize(14).text('Service Level Agreement (SLA):').moveDown();
doc.fontSize(12).text(
  'AcmeCorp is currently enrolled in the Platinum Tier Support Plan. Under this agreement, any critical system outages require a mandatory guaranteed response time of 2 hours or less. Failure to respond within this window will result in SLA penalties.'
);
doc.end();
console.log('Created: ' + pdfPath);

// 2. Create Internal Support Email (.eml)
const emailPath = path.join(rootDir, 'Client_AcmeCorp_SupportLog.eml');
const emailContent = `Date: Mon, 14 Aug 2024 09:15:00 +0000
From: "Tech Support" <support@ignisia.com>
To: "Escalations Team" <escalations@ignisia.com>
Subject: URGENT: AcmeCorp Database Connectivity Outage

Hi Team,

Just logging a critical alert from AcmeCorp (Account: ACME-9942). 
They just called in reporting a complete database connectivity issue and extreme packet loss. They are completely down right now.

John Doe mentioned they are on a premium tier and are expecting an immediate engineer assignment. 

Can someone look up their exact SLA terms and let me know how much time we have to resolve this before penalties hit?

Thanks,
Support Desk
`;
fs.writeFileSync(emailPath, emailContent);
console.log('Created: ' + emailPath);
