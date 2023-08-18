const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')
// Read the email template file
const emailTemplatePath = path.join(
    __dirname,
    'templates',
    'email-template.html'
)
const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8')

const sendEmail = async ({
    email,
    subject,
    template,
    text,
    recipient,
    otp,
}) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 465,
        secure: true,
        auth: {
            user: 'apikey',
            pass: "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",
        },
    })

    let htmlTemplate

    htmlTemplate = emailTemplate.replace('[recipientName]', recipient)

    const mailOptions = {
        from: 'bilalchughtai.dev@gmail.com',
        to: email,
        subject: subject,
        html: htmlTemplate,
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Email sent:', info.messageId)
}

module.exports = {
    sendEmail,
}
