/**
 * Formtek Database Seeder
 * Run: node seeder.js
 * This seeds the admin user and sample products into MongoDB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

const products = [
  {
    name: 'بلاتينيوم هيدروليزد واي بروتين 100%',
    nameEn: 'Platinum Hydrowhey 100% Protein',
    brand: 'Optimum Nutrition',
    category: 'protein', categoryAr: 'بروتين',
    goal: 'muscle', goalAr: 'ضخامة وبناء عضلات',
    description: 'بروتين واي هيدروليزد عالي الجودة، يُمتص بسرعة فائقة لدعم بناء العضلات وتسريع الاستشفاء بعد التمرين. يحتوي على 30 جرام بروتين لكل حصة.',
    ingredients: 'هيدروليزد واي بروتين، كاكاو، ملح، ليسيتين صويا',
    usage: 'ذوّب قياساً واحداً (35 جرام) في 250 مل ماء أو لبن فور انتهاء التمرين مباشرةً.',
    warnings: 'للبالغين فقط. استشر الطبيب قبل الاستخدام إذا كنت تعاني من حالة طبية.',
    price: 2800, oldPrice: 3200,
    weight: '1.8kg', size: '50 حصة', flavor: 'Chocolate',
    stock: 25, isFeatured: true,
    image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=400',
    specs: { 'البروتين': '30g', 'الكربوهيدرات': '3g', 'الدهون': '1.5g', 'السعرات': '140 kcal' }
  },
  {
    name: 'كرياتين مونوهيدرات ميكرونايز نقي',
    nameEn: 'Micronized Creatine Monohydrate Pure',
    brand: 'Optimum Nutrition',
    category: 'creatine', categoryAr: 'كرياتين',
    goal: 'strength', goalAr: 'قوة وأداء',
    description: 'كرياتين مونوهيدرات نقي 100% ميكرونايز للذوبان السريع، يزيد من قوة العضلات ويدعم الأداء خلال التمارين عالية الشدة.',
    usage: 'تناول 5 جرام يومياً مع الماء أو عصير الفاكهة.',
    price: 850, oldPrice: 1100,
    weight: '300g', size: '60 حصة',
    stock: 40, isFeatured: true,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400',
    specs: { 'الكرياتين': '5g', 'الشوائب': '0%', 'الذوبانية': 'عالية جداً' }
  },
  {
    name: 'فيتامين D3 + K2 الترياق المتقدم',
    nameEn: 'Vitamin D3 + K2 Advanced Formula',
    brand: 'Now Foods',
    category: 'vitamins', categoryAr: 'فيتامينات',
    goal: 'health', goalAr: 'صحة عامة',
    description: 'تركيبة متقدمة من فيتامين D3 وK2 لدعم صحة العظام والمناعة وتحسين امتصاص الكالسيوم. مثالي للرياضيين والمجتهدين.',
    price: 420,
    weight: '120 كبسولة',
    stock: 60, isFeatured: false,
    image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?q=80&w=400',
    specs: { 'D3': '5000 IU', 'K2': '200mcg', 'الحصة': 'كبسولة واحدة يومياً' }
  },
  {
    name: 'ماس تك 2000 - ضخامة عضلية سريعة',
    nameEn: 'Mass Tech 2000 Advanced Gainer',
    brand: 'MuscleTech',
    category: 'mass-gainer', categoryAr: 'ماس جينر',
    goal: 'mass', goalAr: 'زيادة الوزن والكتلة',
    description: 'ماس جينر متقدم بـ2000 سعر حراري لكل حصة، مصمم للرياضيين الذين يجدون صعوبة في زيادة الوزن. يحتوي على مزيج احترافي من البروتينات والكربوهيدرات المعقدة.',
    price: 3200, oldPrice: 3800,
    weight: '7.3kg', size: '16 حصة', flavor: 'Chocolate Fudge',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400',
    specs: { 'السعرات': '2000 kcal', 'البروتين': '80g', 'الكربوهيدرات': '440g', 'الدهون': '10g' }
  },
  {
    name: 'BCAA بلاس - أحماض أمينية متشعبة متقدمة',
    nameEn: 'BCAA Plus Advanced Branched Chain',
    brand: 'Scitec Nutrition',
    category: 'amino-acids', categoryAr: 'أمينو أسيد',
    goal: 'recovery', goalAr: 'استشفاء',
    description: 'تركيبة 2:1:1 من ليوسين، إيزوليوسين وفالين لمنع هدم العضلات وتسريع الاستشفاء. مثالي أثناء وبعد التمرين.',
    price: 650, oldPrice: 800,
    weight: '300g', size: '30 حصة', flavor: 'Watermelon',
    stock: 35,
    image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?q=80&w=400',
    specs: { 'الليوسين': '5g', 'الإيزوليوسين': '2.5g', 'الفالين': '2.5g', 'نسبة المزج': '2:1:1' }
  },
  {
    name: 'حارق دهون مالتيميت ثيرمو برو',
    nameEn: 'Ultimate Thermo Pro Fat Burner',
    brand: 'Applied Nutrition',
    category: 'fat-burners', categoryAr: 'حوارق دهون',
    goal: 'cutting', goalAr: 'حرق الدهون وتنشيف',
    description: 'حارق دهون متقدم بمستخلصات طبيعية كالكافيين والأخضر للشاي والكارنيتين. يعزز الأيض ويزيد التركيز والطاقة خلال الحمية.',
    price: 580,
    weight: '120 كبسولة',
    stock: 28,
    image: 'https://images.unsplash.com/photo-1611073557433-7698e84d4d73?q=80&w=400',
    specs: { 'الكافيين': '200mg', 'الكارنيتين': '500mg', 'الحصة': '2 كبسولة يومياً' }
  },
  {
    name: 'شيكر بلينديرز برو 600 مل ذكي',
    nameEn: 'BlenderBottle Pro 600ml Smart Shaker',
    brand: 'BlenderBottle',
    category: 'shakers', categoryAr: 'شيكرات',
    goal: 'gear', goalAr: 'أدوات رياضية',
    description: 'شيكر رياضي احترافي بسعة 600 مل مع شبكة مزج فائقة وتصميم خالٍ من البيسفينول. مثالي لتحضير البروتين في أي مكان.',
    price: 180,
    weight: '600ml',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=400',
    specs: { 'السعة': '600ml', 'المادة': 'Tritan BPA-Free', 'الألوان': 'متعدد' }
  },
  {
    name: 'حزام رفع أثقال جلد أصلي احترافي',
    nameEn: 'Pro Leather Lifting Belt 4 Inch',
    brand: 'Harbinger',
    category: 'lifting-belts', categoryAr: 'أحزمة رفع',
    goal: 'gear', goalAr: 'أدوات رياضية',
    description: 'حزام رفع أثقال من الجلد الطبيعي 4 بوصة لدعم أسفل الظهر وحماية العمود الفقري أثناء تمارين السكوات والديدليفت.',
    price: 350,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400',
    specs: { 'العرض': '4 بوصة', 'المادة': 'جلد طبيعي', 'المقاسات': 'S/M/L/XL' }
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Ayman Ahmed',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      phone: '01020988478',
      role: 'admin',
      isActive: true
    });
    console.log(`✅ Admin created: ${adminUser.email}`);

    // Create sample products
    for (const p of products) {
      await Product.create(p);
    }
    console.log(`✅ ${products.length} products seeded`);

    console.log('\n🎉 Database seeded successfully!');
    console.log(`   Admin: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder Error:', err);
    process.exit(1);
  }
};

seed();
