import nodemailer from 'nodemailer';
// const useremail='mohitmongia2005@gmail.com';
// const password='gpuc cyte sgva nmou';
export async function POST(request) {
  const { email, name, approvalLink, to } = await request.json();
  const usermail=process.env.EMAIL_USER;
  const userpass=process.env.EMAIL_PASS;
  try {
    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or use another service like SendGrid
      auth: {
        user: usermail, // Your email address
        pass: userpass, // Your email password or app-specific password
      },
    });

    // Email details
    const mailOptions = {
      from: usermail,
      to: usermail, // Your email address to receive notifications
      subject: `Admin Signup Request: ${name}`,
      text: `A user (${name}, ${email}) has requested to sign up as an admin. Approve the request here: ${approvalLink}`,
    };
    // Send email
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ success: false, error }), { status: 500 });
  }
}


