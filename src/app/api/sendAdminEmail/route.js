import nodemailer from 'nodemailer';
const useremail='mohitmongia2005@gmail.com';
const password='gpuc cyte sgva nmou';
export async function POST(request) {
  const { email, name, approvalLink, to } = await request.json();

  try {
    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or use another service like SendGrid
      auth: {
        user: useremail, // Your email address
        pass: password, // Your email password or app-specific password
      },
    });

    // Email details
    const mailOptions = {
      from: useremail,
      to: useremail, // Your email address to receive notifications
      subject: `Admin Signup Request: ${name}`,
      text: `A user (${name}, ${email}) has requested to sign up as an admin. Approve the request here: ${approvalLink}`,
    };
    const testmail= process.env.EMAIL_USER;
    const testpass= process.env.EMAIL_PASS;
    // Send email
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ success: true, testmail, testpass }), { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ success: false, error }), { status: 500 });
  }
}


