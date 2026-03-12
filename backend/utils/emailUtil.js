const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendCredentialsEmail = async (email, password, name) => {
    const mailOptions = {
        from: `"Auto Assist" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Auto Assist Mechanic Credentials',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #F06A00;">Welcome to Auto Assist, ${name}!</h2>
                <p>You have been added as a mechanic to the Auto Assist dashboard.</p>
                <p>Here are your login credentials:</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #F06A00; margin: 20px 0;">
                    <p style="margin: 0; margin-bottom: 8px;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
                </div>
                <p>Please log in at your earliest convenience and change your password in the settings.</p>
                <p style="color: #64748B; font-size: 12px; margin-top: 30px;">This is an automated message. Please do not reply.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Credentials email sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send credentials email');
    }
};

const sendConfirmationEmail = async (email, name, bookingDetails) => {
    const mailOptions = {
        from: `"Auto Assist" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Booking Confirmation - Auto Assist',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #10B981;">Booking Confirmed!</h2>
                <p>Hello ${name},</p>
                <p>Your booking for <strong>${bookingDetails.service}</strong> has been confirmed.</p>
                <p>Thank you for choosing Auto Assist!</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

const sendUpdateEmail = async (email, name, service, updateMessage) => {
    const mailOptions = {
        from: `"Auto Assist" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Job Update - Auto Assist',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #3B82F6;">Update on your Vehicle</h2>
                <p>Hello ${name},</p>
                <p>There is an update regarding your <strong>${service}</strong> service:</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #3B82F6; margin: 20px 0;">
                    <p style="margin: 0; white-space: pre-wrap;">${updateMessage}</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Update email sent to ${email}`);
    } catch (error) {
        console.error('Error sending update email:', error);
    }
};

const sendReminderEmail = async (email, name, bookingDetails) => {
    const mailOptions = {
        from: `"Auto Assist" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Upcoming Appointment Reminder - Auto Assist',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #F59E0B;">Appointment Reminder</h2>
                <p>Hello ${name},</p>
                <p>This is a reminder for your upcoming <strong>${bookingDetails.service}</strong> service tomorrow.</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #F59E0B; margin: 20px 0;">
                    <p style="margin: 0; margin-bottom: 8px;"><strong>Date/Time:</strong> ${new Date(bookingDetails.time).toLocaleString()}</p>
                </div>
                <p>We look forward to seeing you!</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reminder email sent to ${email}`);
    } catch (error) {
        console.error('Error sending reminder email:', error);
    }
};

const sendPaymentReceivedEmail = async (email, name, paymentDetails = {}) => {
    const amount = Number(paymentDetails?.amount || 0);
    const formattedAmount = amount > 0 ? `NPR ${amount.toLocaleString()}` : 'NPR 0';
    const reference = paymentDetails?.reference || paymentDetails?.pidx || 'N/A';
    const typeLabel = paymentDetails?.mode === 'parts' ? 'Parts Purchase' : 'Service Payment';

    const mailOptions = {
        from: `"Auto Assist" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Payment Received - Auto Assist',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #10B981;">Payment Successfully Received</h2>
                <p>Hello ${name},</p>
                <p>Your payment has been received successfully.</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #10B981; margin: 20px 0;">
                    <p style="margin: 0; margin-bottom: 8px;"><strong>Type:</strong> ${typeLabel}</p>
                    <p style="margin: 0; margin-bottom: 8px;"><strong>Amount:</strong> ${formattedAmount}</p>
                    <p style="margin: 0;"><strong>Reference:</strong> ${reference}</p>
                </div>
                <p>Thank you for choosing Auto Assist.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Payment received email sent to ${email}`);
    } catch (error) {
        console.error('Error sending payment received email:', error);
        throw new Error('Failed to send payment received email');
    }
};

module.exports = {
    sendCredentialsEmail,
    sendConfirmationEmail,
    sendUpdateEmail,
    sendReminderEmail,
    sendPaymentReceivedEmail
};
