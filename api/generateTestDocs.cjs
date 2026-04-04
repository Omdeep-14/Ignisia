const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const rootDir = process.cwd().replace(/\\api$/, '');

// 1. Create Old Email (.eml)
const emailPath = path.join(rootDir, 'Old_Sales_Email_2022.eml');
const emailContent = `Date: Tue, 10 May 2022 14:00:00 +0000
From: "Sarah (Sales)" <sarah.sales@acmecorp.com>
To: "Legal Desk" <legal@acmecorp.com>
Subject: Fwd: Enterprise License Pricing Structure

Hi Legal,

Just confirming the current pricing block for the standard enterprise contract.
The official quoted price for the Enterprise Software License is 45,000 USD.

We sent this to the vendor yesterday.

Thanks,
Sarah
`;
fs.writeFileSync(emailPath, emailContent);
console.log('Created: ' + emailPath);

// 2. Create New Policy (.pdf)
const pdfPath = path.join(rootDir, 'New_Pricing_Policy_2024.pdf');
const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(pdfPath));
doc.fontSize(24).text('AcmeCorp Internal Policy: 2024 Update', { align: 'center' }).moveDown();
doc.fontSize(12).text('Date: January 15, 2024').moveDown();
doc.fontSize(14).text('To All Departments:').moveDown();
doc.fontSize(12).text(
  'This is the official corporate policy regarding enterprise software sales for the 2024 fiscal year.'
).moveDown();
doc.text(
  'Effective immediately, due to inflation and added server density costs, the base price for the Enterprise Software License is definitively adjusted to 85,000 USD.'
).moveDown();
doc.text(
  'All previous quotes, emails, or verbal agreements reflecting the 2022 pricing model are now strictly null and void.'
);
doc.end();
console.log('Created: ' + pdfPath);
