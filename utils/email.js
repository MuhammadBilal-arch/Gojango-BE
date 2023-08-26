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

const otpTemplatePath = path.join(__dirname, 'templates', 'otp-template.html')

const otpTemplate = fs.readFileSync(otpTemplatePath, 'utf-8')

const sendEmail = async ({
    email,
    subject,
    template,
    text,
    recipient,
    otp,
}) => {
    try {
        if (!email || !subject || !recipient) {
            return sendErrorMessage(
                statusCode.BAD_REQUEST,
                'Invalid Email or subject or recipient',
                res
            )
        }
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'bilalchughtai.dev@gmail.com',
                pass: 'hoacritefzosifir',
            },
        })
        let htmlTemplate
        if (otp && otp !== '') {
            htmlTemplate = otpTemplate
                .replace('[recipientName]', recipient)
                .replace('[otpCode]', otp)
        } else {
            htmlTemplate = emailTemplate.replace('[recipientName]', recipient)
        }

        const mailOptions = {
            from: 'bilalchughtai.dev@gmail.com',
            to: email,
            subject: subject,
            html: htmlTemplate,
        }

        const info = await transporter.sendMail(mailOptions)

        console.log('Email sent:', info?.messageId)
    } catch (error) {
        console.log('Failed to send email:', error.message);
        sendErrorMessage(statusCode.BAD_REQUEST, error.message, res)
    }
}

module.exports = {
    sendEmail,
}
