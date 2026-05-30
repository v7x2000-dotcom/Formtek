/**
 * test-db.js — اختبار الاتصال بـ MongoDB Atlas
 */

require('dotenv').config();
const dns = require('dns');
// Force Google DNS to bypass ISP DNS that may block SRV records
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');


console.log('\n🔍 Formtek MongoDB Connection Test\n' + '─'.repeat(50));
console.log('🔗 MONGO_URI:', process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@') : '❌ NOT SET');
console.log('');

async function test() {
  try {
    console.log('📡 Attempting connection...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });

    console.log('\n✅ CONNECTION SUCCESSFUL!');
    console.log('   Host     :', conn.connection.host);
    console.log('   Database :', conn.connection.name);
    console.log('   Port     :', conn.connection.port);

    // Count documents in each collection
    try {
      const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String, role: String }));
      const count = await User.countDocuments();
      console.log('\n📊 Users in database:', count);
    } catch (e) { /* collection may not exist yet */ }

    console.log('\n🚀 Database is ready! You can now run the server.');
    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.log('\n❌ CONNECTION FAILED!');
    console.log('   Error Code:', err.code || 'N/A');
    console.log('   Message   :', err.message);
    console.log('');
    console.log('📋 Troubleshooting steps:');
    console.log('   1. تأكد أن الـ Cluster موجود ونشط في لوحة MongoDB Atlas');
    console.log('      https://cloud.mongodb.com → Projects → Your Cluster');
    console.log('   2. تأكد أن IP الخاص بك مضاف في Network Access');
    console.log('      Atlas → Security → Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)');
    console.log('   3. تأكد صحة username وpassword في الـ connection string');
    console.log('   4. الـ Cluster الحالي في .env:', process.env.MONGO_URI?.match(/mongodb\+srv:\/\/[^@]+@([^/]+)/)?.[1] || 'غير محدد');
    console.log('');
    console.log('   💡 إذا كانت مشكلة DNS فهذا يعني أن الـ Cluster محذوف أو اسمه غلط.');
    console.log('      قم بإنشاء Cluster جديد من Atlas وانسخ الـ Connection String الجديد.');
    process.exit(1);
  }
}

test();
