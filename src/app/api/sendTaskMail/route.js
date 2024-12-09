import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    // Parse the JSON body
    const body = await request.json();
    const { to, subject, message } = body;
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or another SMTP service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log(process.env.EMAIL_USER,process.env.EMAIL_PASS);
    // Send mail with HTML content
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: message,
    });

    return new Response(JSON.stringify({ message: 'Email sent successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.log('Error while sending email ',error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
