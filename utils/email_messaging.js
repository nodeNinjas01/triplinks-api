import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

let transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmail = async (receiver, vc) => {
  const message = await transport.sendMail({
    from: "airove@example.com",
    to: receiver,
    subject: "Ticket purchase",
    text: vc,
    html: `<b>Hello ${receiver}</b>`
  })
  console.log('mess sent to', receiver);
  return message.messageId
}