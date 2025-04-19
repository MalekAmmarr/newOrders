const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
require('dotenv').config();
const uri = process.env.MONGO_URI;
const user = process.env.GMAIL_USER
const pass = process.env.GMAIL_PASS


// Replace these with your actual credentials
const client = new MongoClient(uri);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user,
    pass
  },
});

// Mail options template
const sendEmail = (order) => {
  const mailOptions = {
    from: user,
    to: user,
    subject: 'New Order Received!',
    text: `A new order was placed.\n\nCustomer: ${order.customerName || 'N/A'}\nTotal: ${order.total || 'N/A'}\nDetails: ${JSON.stringify(order)}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log('Error sending email:', error);
    }
    console.log('Email sent:', info.response);
  });
};

async function watchOrders() {
  try {
    await client.connect();
    const db = client.db('test'); // e.g., 'perfume-store'
    const orders = db.collection('orders');

    const changeStream = orders.watch([
      { $match: { operationType: 'insert' } } // Only new orders
    ]);

    console.log('Watching for new orders...');

    changeStream.on('change', (change) => {
      console.log('New order detected:', change.fullDocument);
      sendEmail(change.fullDocument); // Send email
    });

  } catch (err) {
    console.error('Failed to watch orders:', err);
  }
}

watchOrders();