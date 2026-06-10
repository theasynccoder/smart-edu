import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

client.messages.create({
    body: `Hello! This is a test message from Edu-StreamLiners School Management System. SMS notifications are working correctly.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: '+919353327770'
})
.then(msg => {
    console.log('SMS sent! SID:', msg.sid);
    console.log('Status:', msg.status);
})
.catch(err => {
    console.error('Error:', err.message);
});
