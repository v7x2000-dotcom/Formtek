import React, { useState, useEffect, useCallback } from 'react';
import { toast } from './ui/Toast';
import { uploadAPI, usersAPI, settingsAPI, productsAPI, messagesAPI, statsAPI } from '../services/api';

// Runtime API base — works from both file:// and http://localhost:5000
const getApiBase = () =>
  window.location.protocol === 'file:' ? 'http://localhost:5000' : window.location.origin;

// Resolve image src: prepend API base for /uploads/ paths
const resolveImg = (src) => {
  if (!src) return '';
  if (src.startsWith('/uploads')) return `${getApiBase()}${src}`;
  return src;
};
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  Image as ImageIcon, 
  MessageSquare, 
  Settings, 
  Activity, 
  Plus, 
  Trash2, 
  Check, 
  Truck, 
  FileSpreadsheet, 
  ShieldCheck,
  Edit,
  Save
} from 'lucide-react';

export default function AdminDashboard({ 
  products, 
  onAddProduct, 
  onDeleteProduct, 
  onUpdateProduct,
  orders, 
  onUpdateOrderStatus, 
  activityLogs,
  activeVisitors
}) {
  const [activeTab, setActiveTab] = useState("overview");

  // Form states for product management
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    nameEn: "",
    category: "protein",
    categoryAr: "بروتين",
    price: "",
    oldPrice: "",
    goal: "muscle",
    goalAr: "ضخامة وبناء عضلات",
    brand: "",
    stock: "",
    description: "",
    image: "",
    weight: "",
    size: "",
    flavor: "",
    specProtein: "",
    specCarbs: "",
    specFats: "",
    specCalories: ""
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  // Image uploader: shows instant preview then uploads to Firebase in background
  const handleImageUpload = async (e, target = 'new') => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);

    // ① Show instant local preview immediately — zero wait
    const reader = new FileReader();
    reader.onload = (event) => {
      const previewUrl = event.target.result;
      if (target === 'new') {
        setNewProduct(prev => ({ ...prev, image: previewUrl }));
      } else {
        setEditingProduct(prev => ({ ...prev, image: previewUrl }));
      }
    };
    reader.readAsDataURL(file);

    // ② Try Firebase Storage in background (8s timeout built-in)
    try {
      const formData = new FormData();
      formData.append('images', file);

      const { data } = await uploadAPI.productImages(formData);

      if (data.success && data.urls?.length > 0) {
        const imageUrl = data.urls[0];
        // Update with final URL (Storage CDN or same base64)
        if (target === 'new') {
          setNewProduct(prev => ({ ...prev, image: imageUrl }));
        } else {
          setEditingProduct(prev => ({ ...prev, image: imageUrl }));
        }
        toast.success("تم رفع الصورة بنجاح! 📸");
      } else {
        toast.success("تم حفظ الصورة محلياً! 📸");
      }
    } catch (err) {
      console.warn("Upload failed, keeping local preview:", err);
      toast.success("تم حفظ الصورة محلياً! 📸");
    } finally {
      setUploadingImage(false);
    }
  };


  // Banners & Offers management mock
  const [banners, setBanners] = useState([
    { id: 1, title: "خصم الشتاء الحار 10%", active: true, image: "banner1.jpg" },
    { id: 2, title: "شحن مجاني لجميع المحافظات", active: true, image: "banner2.jpg" }
  ]);
  const [newBannerTitle, setNewBannerTitle] = useState("");

  // Customers management (Live API integration)
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data } = await usersAPI.getAll();
        if (data.success) {
          const mapped = data.users.map(u => ({
            id: u._id || u.id,
            email: u.email,
            name: u.name,
            role: u.role || 'customer',
            points: u.points || 0,
            status: u.isActive === false ? 'محظور' : 'نشط'
          }));
          setCustomers(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  const handleToggleBlockCustomer = async (customerId) => {
    try {
      const { data } = await usersAPI.toggleStatus(customerId);
      if (data.success) {
        setCustomers(prev => prev.map(c => {
          if (c.id === customerId) {
            return { ...c, status: c.status === "نشط" ? "محظور" : "نشط" };
          }
          return c;
        }));
        toast.success(data.message || "تم تعديل حالة الحساب بنجاح! 👤");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل تعديل حالة الحساب");
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا العميل نهائياً؟ سيتم حذف جميع طلباته أيضاً.")) return;
    try {
      const { data } = await usersAPI.deleteUser(customerId);
      if (data.success) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        toast.success(data.message || "تم حذف العميل بنجاح! 🗑️");
        fetchAdminStats(); // Refresh stats
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل حذف العميل");
    }
  };

  // ─── ADMIN COMPREHENSIVE STATS (Live database aggregated) ───────────────────
  const [adminStats, setAdminStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    unreadMessages: 0,
    todayVisits: 0,
    monthVisits: 0,
    recentOrders: [],
    recentReviews: [],
    recentMessages: []
  });

  const fetchAdminStats = useCallback(async () => {
    try {
      const { data } = await statsAPI.getAdmin();
      if (data.success && data.stats) {
        setAdminStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats from server:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
    window.addEventListener('formtek_product_changed', fetchAdminStats);
    window.addEventListener('formtek_orders_changed', fetchAdminStats);
    window.addEventListener('formtek_users_changed', fetchAdminStats);
    window.addEventListener('formtek_new_message', fetchAdminStats);
    return () => {
      window.removeEventListener('formtek_product_changed', fetchAdminStats);
      window.removeEventListener('formtek_orders_changed', fetchAdminStats);
      window.removeEventListener('formtek_users_changed', fetchAdminStats);
      window.removeEventListener('formtek_new_message', fetchAdminStats);
    };
  }, [fetchAdminStats]);

  // ─── MESSAGES (Contact Us inbox) ──────────────────────────────────────────────
  const [messages, setMessages] = useState([]);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await messagesAPI.getAll();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch contact messages:', err.message);
    }
  }, []);

  const handleDeleteMessage = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة نهائياً؟")) return;
    try {
      const { data } = await messagesAPI.delete(id);
      if (data.success) {
        toast.success(data.message || "تم حذف الرسالة بنجاح ✅");
        fetchMessages();
        fetchAdminStats();
      }
    } catch (err) {
      toast.error("فشل حذف الرسالة");
    }
  };

  const handleMarkMessageRead = async (id) => {
    try {
      const { data } = await messagesAPI.markRead(id);
      if (data.success) {
        fetchMessages();
        fetchAdminStats();
      }
    } catch (err) {
      console.error("Failed to mark message as read:", err.message);
    }
  };

  useEffect(() => {
    fetchMessages();
    window.addEventListener('formtek_new_message', fetchMessages);
    return () => {
      window.removeEventListener('formtek_new_message', fetchMessages);
    };
  }, [fetchMessages]);

  // Review & Comments management (Live API integration)
  const [reviews, setReviews] = useState([]);

  const fetchReviews = useCallback(async () => {
    try {
      const { data } = await productsAPI.getAllReviews();
      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setReviews([]);
    }
  }, []);

  const handleUpdateReviewStatus = async (productId, reviewId, status) => {
    try {
      const { data } = await productsAPI.updateReviewStatus(productId, reviewId, status);
      if (data.success) {
        toast.success(data.message || "تم تحديث حالة التقييم بنجاح!");
        fetchReviews();
        fetchAdminStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل تحديث حالة التقييم");
    }
  };

  useEffect(() => {
    fetchReviews();
    window.addEventListener('formtek_product_changed', fetchReviews);
    return () => window.removeEventListener('formtek_product_changed', fetchReviews);
  }, [fetchReviews]);

  const handleDeleteReview = async (productId, reviewId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق نهائياً؟")) return;
    
    try {
      const { data } = await productsAPI.deleteReview(productId, reviewId);
      if (data.success) {
        toast.success(data.message || "تم حذف التعليق بنجاح ✅");
        fetchReviews();
      }
    } catch (err) {
      console.warn("API delete review failed:", err);
      toast.error("فشل حذف التعليق");
    }
  };

  // Store general settings
  const [settings, setSettings] = useState({
    storeName: "فورمتك | Formtek",
    supportEmail: "support@formtek.com",
    contactPhone: "01020988478",
    shippingCost: "0",
    instaPayAddress: "aymanahmed@instapay",
    vodafoneNumber: "01020988478",
    facebookLink: "https://facebook.com/formtek",
    instagramLink: "https://instagram.com/formtek",
    accentColor: "#00ff66"
  });

  // ── FAQ Management ────────────────────────────────────────────────────────
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({ q: '', a: '' });
  const [editingFaq, setEditingFaq] = useState(null);

  // ── Hero Slides Editor ────────────────────────────────────────────────────
  const [slides, setSlides] = useState([]);

  // ── Footer Editor ─────────────────────────────────────────────────────────
  const [footerData, setFooterData] = useState({
    ownerName: 'Ayman Ahmed', phone: '01020988478', address: 'القنطرة شرق - المدينة',
    description: 'فورمتك هي علامة تجارية رائدة متخصصة في توفير المكملات الغذائية وبناء اللياقة البدنية للأبطال الرياضيين.',
    facebookUrl: 'https://facebook.com/formtek', facebookLabel: 'فيسبوك: فورمتك',
    instagramUrl: 'https://instagram.com/formtek', instagramLabel: 'إنستجرام: فورمتك',
    tiktokUrl: '', tiktokLabel: '', whatsappNumber: '',
    copyright: 'حقوق الطبع والنشر © 2026 فورمتك | جميع الحقوق محفوظة لـ Ayman Ahmed',
    customSocialLinks: []
  });
  const [newSocial, setNewSocial] = useState({ title: '', url: '', label: '' });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // ── Offline Default Fallbacks ─────────────────────────────────────────────
  const DEFAULT_SLIDES = [
    {
      badge: 'بروتين • كرياتين • أمينو أسيد',
      title: 'ابنِ قوتك مع',
      titleHl: 'فورمتك',
      titleSub: 'العالمية',
      sub: 'مكملات أصلية 100% بمستوى عالمي — بروتينات، كرياتين، أحماض أمينية، وفيتامينات لأقصى أداء رياضي.',
      cta: 'تسوق المكملات الغذائية',
      ctaPage: 'supplements',
      accent: '#00ff66',
      img: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=900&auto=format&fit=crop',
    },
    {
      badge: 'أدوات • معدات • إكسسوارات',
      title: 'جهّز نفسك',
      titleHl: 'بأفضل',
      titleSub: 'الأدوات الرياضية',
      sub: 'شاكرز، أحزمة رفع، وإكسسوارات رياضية عالية الجودة لتكتمل رحلتك نحو القوة.',
      cta: 'تسوق الأدوات الرياضية',
      ctaPage: 'equipment',
      accent: '#00b4ff',
      img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=900&auto=format&fit=crop',
    },
    {
      badge: 'عروض • خصومات • كوبونات',
      title: 'أفضل الأسعار',
      titleHl: 'عروض',
      titleSub: 'حصرية اليوم فقط',
      sub: 'لا تفوّت أقوى العروض والتخفيضات على أشهر المكملات الرياضية العالمية.',
      cta: 'تسوق العروض الآن',
      ctaPage: 'deals',
      accent: '#ff6b35',
      img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=900&auto=format&fit=crop',
    },
  ];

  const DEFAULT_FAQS = [
    { id: 1, q: "هل المنتجات أصلية؟", a: "نعم، جميع منتجاتنا مستوردة مباشرة من المصنع والوكلاء الرسميين وأصلية 100%." },
    { id: 2, q: "ما هي وسائل الدفع المتاحة؟", a: "نوفر الدفع الفوري الآمن عبر محفظة فودافون كاش، InstaPay، أو الدفع نقداً عند الاستلام." }
  ];

  // ── Load settings from API on mount ────────────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setSettingsLoading(true);
        const { data } = await settingsAPI.get();
        if (data.success && data.settings) {
          const s = data.settings;
          setFaqs(s.faqs?.length ? s.faqs : DEFAULT_FAQS);
          setSlides(s.slides?.length ? s.slides : DEFAULT_SLIDES);
          if (s.footer) {
            setFooterData(prev => ({
              ...prev,
              ...(s.footer.phone     && { phone: s.footer.phone }),
              ...(s.footer.address   && { address: s.footer.address }),
              ...(s.footer.about     && { description: s.footer.about }),
              ...(s.footer.socialLinks?.facebook  && { facebookUrl:  s.footer.socialLinks.facebook }),
              ...(s.footer.socialLinks?.instagram && { instagramUrl: s.footer.socialLinks.instagram }),
              ...(s.footer.socialLinks?.whatsapp  && { whatsappNumber: s.footer.socialLinks.whatsapp }),
              customSocialLinks: s.footer.customSocialLinks || []
            }));
          }
        } else {
          setFaqs(DEFAULT_FAQS);
          setSlides(DEFAULT_SLIDES);
        }
      } catch (err) {
        console.warn('Failed to load settings from API, using defaults:', err.message);
        setFaqs(DEFAULT_FAQS);
        setSlides(DEFAULT_SLIDES);
      } finally {
        setSettingsLoading(false);
      }
    };
    loadSettings();
  }, []);
   // ── API-backed save helper ─────────────────────────────────────────────────
  const saveSettingsToAPI = useCallback(async (patch) => {
    try {
      const { data } = await settingsAPI.update(patch);
      if (data.success) {
        toast.success('تم حفظ الإعدادات في قاعدة البيانات بنجاح! ✅');
        // Notify App.jsx to refetch settings from the API
        window.dispatchEvent(new Event('formtek_settings_updated'));
      } else {
        toast.error(data.message || 'فشل حفظ الإعدادات');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الاتصال بالخادم لحفظ الإعدادات');
      console.error('Settings save failed:', err);
    }
  }, []);

  const saveFaqs = (updated) => {
    setFaqs(updated);
    saveSettingsToAPI({ faqs: updated });
  };
  const handleAddFaq = (e) => {
    e.preventDefault();
    if (!newFaq.q || !newFaq.a) return;
    saveFaqs([...faqs, { id: Date.now(), ...newFaq }]);
    setNewFaq({ q: '', a: '' });
  };
  const handleDeleteFaq = (id) => saveFaqs(faqs.filter(f => f.id !== id));
  const handleUpdateFaq = (e) => {
    e.preventDefault();
    saveFaqs(faqs.map(f => f.id === editingFaq.id ? editingFaq : f));
    setEditingFaq(null);
  };

  const handleSlideImageUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast.error("حجم الصورة كبير جداً! الحد الأقصى هو 5 ميجابايت.");
      return;
    }

    const useBase64Fallback = () => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        setSlides(prev => prev.map((s, i) => i === idx ? { ...s, img: imageUrl } : s));
        toast.success("تم تحميل صورة البنر محلياً بنجاح! 📸");
      };
      reader.readAsDataURL(file);
    };

    try {
      const formData = new FormData();
      formData.append('images', file);
      const { data } = await uploadAPI.productImages(formData);
      if (data.success && data.urls?.length > 0) {
        const imageUrl = data.urls[0];
        setSlides(prev => prev.map((s, i) => i === idx ? { ...s, img: imageUrl } : s));
        toast.success('تم رفع صورة البنر بنجاح! 📸');
      } else {
        useBase64Fallback();
      }
    } catch (err) {
      console.warn("Server banner upload failed, using Base64:", err);
      useBase64Fallback();
    }
  };
  const saveSlides = () => saveSettingsToAPI({ slides });
  const saveFooter = () => saveSettingsToAPI({
    footer: {
      about: footerData.description,
      address: footerData.address,
      phone: footerData.phone,
      email: footerData.email || 'support@formtek.com',
      socialLinks: {
        facebook: footerData.facebookUrl,
        instagram: footerData.instagramUrl,
        whatsapp: footerData.whatsappNumber
      },
      customSocialLinks: footerData.customSocialLinks || []
    }
  });


  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return;

    // Use default fallback image if uploader is empty
    const finalImage = newProduct.image || "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=300&auto=format&fit=crop";

    onAddProduct({
      ...newProduct,
      id: Date.now(),
      image: finalImage,
      price: Number(newProduct.price),
      oldPrice: newProduct.oldPrice ? Number(newProduct.oldPrice) : null,
      stock: Number(newProduct.stock),
      rating: 5.0,
      reviewsCount: 0,
      specs: {
        "الوزن": newProduct.weight || "غير محدد",
        "الحجم": newProduct.size || "غير محدد",
        "النكهة": newProduct.flavor || "غير محدد",
        "البروتين": newProduct.specProtein ? `${newProduct.specProtein} جرام` : "غير محدد",
        "الكربوهيدرات": newProduct.specCarbs ? `${newProduct.specCarbs} جرام` : "غير محدد",
        "الدهون": newProduct.specFats ? `${newProduct.specFats} جرام` : "غير محدد",
        "السعرات": newProduct.specCalories ? `${newProduct.specCalories} سعرة` : "غير محدد"
      }
    });

    setNewProduct({
      name: "",
      nameEn: "",
      category: "protein",
      categoryAr: "بروتين",
      price: "",
      oldPrice: "",
      goal: "muscle",
      goalAr: "ضخامة وبناء عضلات",
      brand: "",
      stock: "",
      description: "",
      image: "",
      weight: "",
      size: "",
      flavor: "",
      specProtein: "",
      specCarbs: "",
      specFats: "",
      specCalories: ""
    });
    setShowAddForm(false);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) return;

    const updatedSpecs = {
      "الوزن": editingProduct.weight || "غير محدد",
      "الحجم": editingProduct.size || "غير محدد",
      "النكهة": editingProduct.flavor || "غير محدد",
      "البروتين": editingProduct.specProtein ? `${editingProduct.specProtein} جرام` : "غير محدد",
      "الكربوهيدرات": editingProduct.specCarbs ? `${editingProduct.specCarbs} جرام` : "غير محدد",
      "الدهون": editingProduct.specFats ? `${editingProduct.specFats} جرام` : "غير محدد",
      "السعرات": editingProduct.specCalories ? `${editingProduct.specCalories} سعرة` : "غير محدد"
    };

    onUpdateProduct({
      ...editingProduct,
      price: Number(editingProduct.price),
      oldPrice: editingProduct.oldPrice ? Number(editingProduct.oldPrice) : null,
      stock: Number(editingProduct.stock),
      specs: updatedSpecs
    });
    setEditingProduct(null);
  };

  const handleExportCSV = () => {
    const headers = "رقم الطلب,العميل,الهاتف,الإجمالي,طريقة الدفع,الحالة\n";
    const rows = orders.map(o => `${o.id || 'FTK-Mock'},${o.shippingInfo.name},${o.shippingInfo.phone},${o.total},${o.paymentMethod},${o.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Formtek_Orders_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalEarnings = orders.reduce((sum, o) => sum + (o.status === "Paid" || o.status === "Delivered" ? o.total : 0), 0);
  const pendingOrders = orders.filter(o => o.status === "Pending").length;
  const lowStockProducts = products.filter(p => p.stock <= 5);

  return (
    <section className="py-24 px-[5%] max-w-[1400px] mx-auto text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-4">
        <button 
          onClick={handleExportCSV}
          className="bg-neonGreen hover:bg-neonGreenHover text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all transform hover:-translate-y-0.5 shadow-md flex items-center gap-1.5 cursor-pointer font-body"
        >
          <FileSpreadsheet className="w-4 h-4 text-black" />
          <span>تصدير تقرير المبيعات (CSV)</span>
        </button>
        <div>
          <h2 className="text-xl font-black text-white">لوحة الإدارة والتحكم الكاملة</h2>
          <p className="text-xs text-textSecondary mt-1">التحكم في مخزون المكملات، الطلبات، بنرات العروض، وتعديل إعدادات المتجر بالكامل.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 bg-secondary/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 h-fit flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "overview" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>الملخص العام</span>
            <TrendingUp className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "orders" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>إدارة الطلبات ({orders.length})</span>
            <ShoppingCart className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("products")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "products" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>كتالوج المنتجات</span>
            <Package className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("customers")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "customers" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>إدارة العملاء</span>
            <Users className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("banners")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "banners" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>إدارة العروض والبنرات</span>
            <ImageIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("reviews")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "reviews" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>التعليقات والتقييمات</span>
            <MessageSquare className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("messages")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 relative ${
              activeTab === "messages" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            {adminStats.unreadMessages > 0 && (
              <span className="absolute -top-1 -left-1 bg-accentRed text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {adminStats.unreadMessages}
              </span>
            )}
            <span>الرسائل الواردة</span>
            <MessageSquare className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "settings" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>إعدادات المتجر الكاملة</span>
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "logs" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>سجلات النشاط والأمن</span>
            <Activity className="w-4 h-4" />
          </button>

          <div className="border-t border-white/5 my-1 pt-2">
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest text-right mb-2 px-1">تخصيص المتجر</p>
          </div>

          <button 
            onClick={() => setActiveTab("hero_editor")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "hero_editor" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>تعديل الصفحة الرئيسية</span>
            <ImageIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("faq_editor")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "faq_editor" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>إدارة الأسئلة الشائعة</span>
            <MessageSquare className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab("footer_editor")}
            className={`flex-grow lg:flex-grow-0 text-right text-xs font-bold px-4 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-end gap-2 ${
              activeTab === "footer_editor" ? 'bg-neonGreen/10 border border-neonGreen/20 text-neonGreen shadow-[0_0_8px_rgba(0,255,102,0.1)]' : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>تعديل الفوتر والتذييل</span>
            <Settings className="w-4 h-4" />
          </button>
        </aside>

        {/* Main Content Box */}
        <div className="flex-grow bg-secondary/40 border border-white/5 p-6 md:p-8 rounded-2xl shadow-lg">
          
          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-primary/50 border border-white/5 rounded-xl p-5 shadow text-right">
                  <span className="text-[10px] text-textSecondary uppercase block font-bold">إجمالي الأرباح المستلمة</span>
                  <h3 className="text-xl md:text-2xl font-black text-neonGreen font-display mt-2 font-mono">{(adminStats.totalRevenue || 0).toLocaleString()} EGP</h3>
                </div>
                <div className="bg-primary/50 border border-white/5 rounded-xl p-5 shadow text-right">
                  <span className="text-[10px] text-textSecondary uppercase block font-bold">الطلبات المسجلة</span>
                  <h3 className="text-xl md:text-2xl font-black text-white font-display mt-2 font-mono">{(adminStats.totalOrders || 0)} طلب</h3>
                </div>
                <div className="bg-primary/50 border border-white/5 rounded-xl p-5 shadow text-right">
                  <span className="text-[10px] text-textSecondary uppercase block font-bold">زوار اليوم (فريد)</span>
                  <h3 className="text-xl md:text-2xl font-black text-accentGold font-display mt-2 font-mono">{(adminStats.todayVisits || 0)} زيارة</h3>
                </div>
                <div className="bg-primary/50 border border-white/5 rounded-xl p-5 shadow text-right">
                  <span className="text-[10px] text-textSecondary uppercase block font-bold">زوار الشهر (فريد)</span>
                  <h3 className="text-xl md:text-2xl font-black text-neonBlue font-display mt-2 font-mono">{(adminStats.monthVisits || 0)} زيارة</h3>
                </div>
                <div className="bg-primary/50 border border-white/5 rounded-xl p-5 shadow text-right relative overflow-hidden group col-span-2 lg:col-span-1">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-neonGreen/10 border border-neonGreen/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-ping" />
                    <span className="text-[8px] text-neonGreen font-extrabold uppercase">Live</span>
                  </div>
                  <span className="text-[10px] text-textSecondary uppercase block font-bold mt-1">المتصلين الآن</span>
                  <h3 className="text-xl md:text-2xl font-black text-neonGreen font-display mt-2 font-mono">{activeVisitors || 1} بطل</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-primary/50 border border-white/5 rounded-xl p-5 shadow text-right">
                  <h3 className="font-extrabold text-sm text-white mb-4">أداء المبيعات الأسبوعي</h3>
                  <div className="h-44 flex items-end justify-between px-4 pb-2 border-b border-white/5 pt-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 bg-white/10 rounded-t h-12"></div>
                      <span className="text-[9px] text-textSecondary">الأسبوع 1</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 bg-white/10 rounded-t h-24"></div>
                      <span className="text-[9px] text-textSecondary">الأسبوع 2</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 bg-neonGreen/35 rounded-t h-32 border border-neonGreen/20"></div>
                      <span className="text-[9px] text-neonGreen font-bold">الأسبوع 3</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 bg-neonGreen rounded-t h-40 shadow-[0_0_15px_rgba(0,255,102,0.3)]"></div>
                      <span className="text-[9px] text-neonGreen font-bold">الحالي</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/50 border border-white/5 rounded-xl p-5 shadow text-right">
                  <h3 className="font-extrabold text-sm text-accentRed mb-4 flex items-center justify-end gap-1.5">
                    <span>مخزون حرج (5 قطع أو أقل)</span>
                    <Package className="w-4 h-4 text-accentRed" />
                  </h3>
                  
                  {lowStockProducts.length === 0 ? (
                    <p className="text-xs text-textSecondary">لا توجد منتجات منخفضة في المخزون حالياً.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {lowStockProducts.map(p => (
                        <div key={p._id || p.id} className="flex justify-between items-center bg-secondary/50 border border-white/5 p-2 rounded-lg text-xs">
                          <span className="bg-accentRed/10 border border-accentRed/30 text-accentRed font-bold px-2 py-0.5 rounded font-mono">
                            مخزون: {p.stock}
                          </span>
                          <span className="text-textSecondary line-clamp-1 flex-grow ml-3 text-right">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Orders */}
          {activeTab === "orders" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="font-extrabold text-sm text-white mb-2 text-right">إدارة الطلبات وقبول المدفوعات والتحويلات</h3>
              
              {orders.length === 0 ? (
                <p className="text-xs text-textSecondary text-right">لا توجد طلبات مسجلة في المتجر حتى الآن.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-primary/70 text-textSecondary border-b border-white/5 font-bold">
                      <tr>
                        <th className="p-3">العميل والهاتف</th>
                        <th className="p-3">طريقة الدفع ومصدر التحويل</th>
                        <th className="p-3">القيمة</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-primary/20 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white">{o.shippingInfo.name}</div>
                            <div className="text-[10px] text-textSecondary font-mono mt-0.5">{o.shippingInfo.phone}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{o.paymentMethod}</div>
                            <div className="text-[10px] text-textSecondary mt-0.5">محول من: {o.paymentDetail}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-neonGreen">{o.total.toLocaleString()} EGP</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${
                              o.status === "Pending" ? 'bg-accentGold/10 border-accentGold/30 text-accentGold' :
                              o.status === "Paid" ? 'bg-neonGreen/10 border-neonGreen/30 text-neonGreen' :
                              'bg-neonBlue/10 border-neonBlue/30 text-neonBlue'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3 text-center flex justify-center gap-2">
                            {o.status === "Pending" && (
                              <button 
                                onClick={() => onUpdateOrderStatus(o.id, "Paid")}
                                className="bg-neonGreen text-black font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-neonGreenHover cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>تأكيد الدفع</span>
                              </button>
                            )}
                            {o.status === "Paid" && (
                              <button 
                                onClick={() => onUpdateOrderStatus(o.id, "Shipped")}
                                className="bg-neonBlue text-black font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-cyan-400 cursor-pointer flex items-center gap-1"
                              >
                                <Truck className="w-3 h-3" />
                                <span>شحن الطلب</span>
                              </button>
                            )}
                             {o.status === "Shipped" && (
                              <button 
                                onClick={() => onUpdateOrderStatus(o.id, "Delivered")}
                                className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer"
                              >
                                تسليم الطلب
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Products */}
          {activeTab === "products" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <button 
                  onClick={() => { setShowAddForm(!showAddForm); setEditingProduct(null); }}
                  className="bg-neonGreen text-black font-extrabold text-[10px] px-4 py-2.5 rounded-lg hover:bg-neonGreenHover flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-black" />
                  <span>{showAddForm ? "إلغاء الإضافة" : "إضافة منتج جديد"}</span>
                </button>
                <h3 className="font-extrabold text-sm text-white">إدارة كتالوج المنتجات والمخزون</h3>
              </div>

              {/* Add form */}
              {showAddForm && (
                <form onSubmit={handleAddSubmit} className="bg-primary/50 border border-white/10 rounded-xl p-5 md:p-6 flex flex-col gap-4 text-right">
                  <h4 className="text-xs font-extrabold text-white border-r-2 border-neonGreen pr-2">تعبئة تفاصيل المنتج الجديد</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">اسم المنتج بالعربية *</label>
                      <input 
                        type="text" 
                        required
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/40 text-right"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">الاسم بالإنجليزية</label>
                      <input 
                        type="text" 
                        value={newProduct.nameEn}
                        onChange={(e) => setNewProduct({ ...newProduct, nameEn: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/40 text-left font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">السعر الحالي EGP *</label>
                      <input 
                        type="number" 
                        required
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">السعر القديم (اختياري)</label>
                      <input 
                        type="number" 
                        value={newProduct.oldPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, oldPrice: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">المخزون المتاح *</label>
                      <input 
                        type="number" 
                        required
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">العلامة التجارية (البراند) *</label>
                      <input 
                        type="text" 
                        required
                        value={newProduct.brand}
                        onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">التصنيف الأساسي للمنتج *</label>
                      <select 
                        value={newProduct.category}
                        onChange={(e) => {
                          const val = e.target.value;
                          const arNames = {
                            "protein": "بروتين", "creatine": "كرياتين", "vitamins": "فيتامينات",
                            "fat-burners": "حوارق دهون", "mass-gainer": "ماس جينر",
                            "amino-acids": "أمينو أسيد", "shakers": "شيكرات", "lifting-belts": "أحزمة رفع"
                          };
                          setNewProduct({ ...newProduct, category: val, categoryAr: arNames[val] || "مكمل" });
                        }}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/40"
                      >
                        <option value="protein">بروتين</option>
                        <option value="creatine">كرياتين</option>
                        <option value="vitamins">فيتامينات</option>
                        <option value="fat-burners">حوارق دهون</option>
                        <option value="mass-gainer">ماس جينر</option>
                        <option value="amino-acids">أمينو أسيد</option>
                        <option value="shakers">شيكرات (أدوات)</option>
                        <option value="lifting-belts">أحزمة رفع (أدوات)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">صورة المنتج (رفع ملف صورة) *</label>
                      <div className="flex items-center gap-4 bg-secondary border border-dashed border-white/20 rounded-lg p-2.5 hover:border-neonGreen/40 transition-colors">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, 'new')}
                          className="hidden" 
                          id="new-product-file"
                        />
                        <label htmlFor="new-product-file" className="cursor-pointer bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[10px] px-3 py-1.5 rounded-md font-bold">
                          اختر صورة
                        </label>
                        {newProduct.image ? (
                          <div className="flex items-center gap-2">
                            <img src={resolveImg(newProduct.image)} alt="Preview" className="w-8 h-8 object-cover rounded border border-neonGreen/30" onError={e => e.target.style.opacity='0.3'} />
                            <span className="text-[10px] text-neonGreen font-semibold">تم الرفع ✅</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-textSecondary">لم يتم اختيار صورة</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">الوزن (مثال: 1.8kg)</label>
                      <input 
                        type="text" 
                        placeholder="1.8kg"
                        value={newProduct.weight}
                        onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 text-center font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">الحجم (مثال: 50 حصة)</label>
                      <input 
                        type="text" 
                        placeholder="50 حصة"
                        value={newProduct.size}
                        onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">النكهة (مثال: Chocolate)</label>
                      <input 
                        type="text" 
                        placeholder="Chocolate"
                        value={newProduct.flavor}
                        onChange={(e) => setNewProduct({ ...newProduct, flavor: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">البروتين (جرام)</label>
                      <input 
                        type="number" 
                        placeholder="30"
                        value={newProduct.specProtein}
                        onChange={(e) => setNewProduct({ ...newProduct, specProtein: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 text-center font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">الكربوهيدرات (جرام)</label>
                      <input 
                        type="number" 
                        placeholder="3"
                        value={newProduct.specCarbs}
                        onChange={(e) => setNewProduct({ ...newProduct, specCarbs: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 text-center font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">الدهون (جرام)</label>
                      <input 
                        type="number" 
                        placeholder="1.5"
                        value={newProduct.specFats}
                        onChange={(e) => setNewProduct({ ...newProduct, specFats: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 text-center font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">السعرات (سعرة)</label>
                      <input 
                        type="number" 
                        placeholder="140"
                        value={newProduct.specCalories}
                        onChange={(e) => setNewProduct({ ...newProduct, specCalories: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 text-center font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-textSecondary">وصف تفصيلي للمكمل *</label>
                    <textarea 
                      required
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none h-20 resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="bg-neonGreen text-black font-extrabold text-xs py-3 rounded-lg hover:bg-neonGreenHover cursor-pointer"
                  >
                    حفظ ونشر المكمل الرياضي
                  </button>
                </form>
              )}

              {/* Edit form */}
              {editingProduct && (
                <form onSubmit={handleUpdateSubmit} className="bg-primary/50 border border-neonGreen/20 rounded-xl p-5 md:p-6 flex flex-col gap-4 text-right">
                  <h4 className="text-xs font-extrabold text-neonGreen border-r-2 border-neonGreen pr-2">تعديل مواصفات المنتج: {editingProduct.name}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">اسم المنتج بالعربية *</label>
                      <input 
                        type="text" 
                        required
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/40"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">السعر بالجنيه EGP *</label>
                      <input 
                        type="number" 
                        required
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                        onWheel={(e) => e.target.blur()}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">المخزون المتاح (Stock)</label>
                      <input 
                        type="number" 
                        required
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                        onWheel={(e) => e.target.blur()}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">السعر القديم (اختياري)</label>
                      <input 
                        type="number" 
                        value={editingProduct.oldPrice || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, oldPrice: e.target.value ? Number(e.target.value) : null })}
                        onWheel={(e) => e.target.blur()}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">العلامة التجارية (البراند)</label>
                      <input 
                        type="text" 
                        value={editingProduct.brand || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-textSecondary">صورة المنتج (تغيير الصورة)</label>
                    <div className="flex items-center gap-4 bg-secondary border border-dashed border-white/20 rounded-lg p-2.5 hover:border-neonGreen/40 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'edit')}
                        className="hidden" 
                        id="edit-product-file"
                      />
                      <label htmlFor="edit-product-file" className="cursor-pointer bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[10px] px-3 py-1.5 rounded-md font-bold">
                        اختر صورة جديدة
                      </label>
                      {editingProduct.image && (
                        <img src={resolveImg(editingProduct.image)} alt="Preview" className="w-8 h-8 object-cover rounded border border-neonGreen/30" onError={e => e.target.style.opacity='0.3'} />
                      )}
                    </div>
                  </div>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">الوزن</label>
                      <input 
                        type="text" 
                        value={editingProduct.weight || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white text-center font-mono outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">الحجم</label>
                      <input 
                        type="text" 
                        value={editingProduct.size || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, size: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white text-center outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">النكهة</label>
                      <input 
                        type="text" 
                        value={editingProduct.flavor || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, flavor: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white text-center outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">البروتين (جرام)</label>
                      <input 
                        type="number" 
                        value={editingProduct.specProtein || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, specProtein: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white text-center font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">الكربوهيدرات (جرام)</label>
                      <input 
                        type="number" 
                        value={editingProduct.specCarbs || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, specCarbs: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white text-center font-mono outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">الدهون (جرام)</label>
                      <input 
                        type="number" 
                        value={editingProduct.specFats || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, specFats: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white text-center font-mono outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-textSecondary">السعرات (سعرة)</label>
                      <input 
                        type="number" 
                        value={editingProduct.specCalories || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, specCalories: e.target.value })}
                        className="text-xs bg-secondary border border-white/10 rounded-lg p-2.5 text-white text-center font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button" 
                      onClick={() => setEditingProduct(null)}
                      className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="bg-neonGreen text-black font-extrabold text-xs px-6 py-2 rounded cursor-pointer"
                    >
                      حفظ التعديلات
                    </button>
                  </div>
                </form>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-primary/70 text-textSecondary border-b border-white/5 font-bold">
                    <tr>
                      <th className="p-3">اسم المنتج والبراند</th>
                      <th className="p-3">التصنيف</th>
                      <th className="p-3">السعر</th>
                      <th className="p-3">المخزون</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((p) => (
                      <tr key={p._id || p.id} className="hover:bg-primary/20 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-[10px] text-textSecondary mt-0.5 font-mono">{p.brand}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{p.categoryAr}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-neonGreen">{p.price.toLocaleString()} EGP</td>
                        <td className="p-3">
                          <span className={`font-bold font-mono ${p.stock <= 5 ? 'text-accentRed' : 'text-white'}`}>
                            {p.stock} قطعة
                          </span>
                        </td>
                        <td className="p-3 text-center flex justify-center gap-2">
                          <button 
                            onClick={() => { 
                              const specs = p.specs || {};
                              setEditingProduct({ 
                                ...p,
                                weight: p.weight || specs["الوزن"] || "",
                                size: p.size || specs["الحجم"] || "",
                                flavor: p.flavor || specs["النكهة"] || "",
                                specProtein: specs["البروتين"] ? specs["البروتين"].replace(" جرام", "") : "",
                                specCarbs: specs["الكربوهيدرات"] ? specs["الكربوهيدرات"].replace(" جرام", "") : "",
                                specFats: specs["الدهون"] ? specs["الدهون"].replace(" جرام", "") : "",
                                specCalories: specs["السعرات"] ? specs["السعرات"].replace(" سعرة", "") : ""
                              }); 
                              setShowAddForm(false); 
                            }}
                            className="bg-white/5 border border-white/10 hover:border-neonGreen/30 text-white font-bold text-[10px] px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button 
                            onClick={() => onDeleteProduct(p._id || p.id)}
                            className="bg-accentRed/10 border border-accentRed/20 hover:bg-accentRed hover:text-white text-accentRed font-bold text-[10px] px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Customers */}
          {activeTab === "customers" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="font-extrabold text-sm text-white mb-2 text-right">إدارة العملاء والحسابات المسجلة</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-primary/70 text-textSecondary border-b border-white/5 font-bold">
                    <tr>
                      <th className="p-3">البريد الإلكتروني للعميل</th>
                      <th className="p-3">الصلاحية</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-primary/20 transition-colors">
                        <td className="p-3 font-bold text-white">{c.email}</td>
                        <td className="p-3 font-mono">{c.role}</td>
                        <td className="p-3 text-neonGreen">{c.status}</td>
                        <td className="p-3 text-center">
                          {c.role !== 'admin' && (
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => handleToggleBlockCustomer(c.id)}
                                className="bg-accentRed/10 border border-accentRed/20 hover:bg-accentRed hover:text-white text-accentRed px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                {c.status === "نشط" ? "حظر الحساب" : "إلغاء الحظر"}
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm("هل أنت متأكد من حذف هذا العميل نهائياً؟")) {
                                    handleDeleteCustomer(c.id);
                                  }
                                }}
                                className="bg-white/5 border border-white/10 hover:bg-accentRed hover:text-white text-white px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                حذف العميل
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: Banners */}
          {activeTab === "banners" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="عنوان البنر الجديد" 
                    value={newBannerTitle}
                    onChange={(e) => setNewBannerTitle(e.target.value)}
                    className="text-xs bg-primary border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none focus:border-neonGreen/45"
                  />
                  <button 
                    onClick={() => {
                      if (!newBannerTitle) return;
                      setBanners([...banners, { id: Date.now(), title: newBannerTitle, active: true, image: "default_banner.jpg" }]);
                      setNewBannerTitle("");
                    }}
                    className="bg-neonGreen text-black font-extrabold text-[10px] px-4 rounded-lg hover:bg-neonGreenHover"
                  >
                    إضافة بنر
                  </button>
                </div>
                <h3 className="font-extrabold text-sm text-white">إدارة بنرات العروض الترويجية</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {banners.map((b) => (
                  <div key={b.id} className="bg-primary/50 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                    <button 
                      onClick={() => setBanners(banners.filter(ban => ban.id !== b.id))}
                      className="text-textSecondary hover:text-accentRed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-right">
                      <h4 className="text-xs font-bold text-white">{b.title}</h4>
                      <span className="text-[9px] text-neonGreen font-bold bg-neonGreen/5 px-2 py-0.5 rounded border border-neonGreen/10 mt-2 inline-block">نشط بالصفحة الرئيسية</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Reviews */}
          {activeTab === "reviews" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <h3 className="font-extrabold text-sm text-white mb-2 text-right">إدارة مراجعات وتعليقات العملاء</h3>
              
              {reviews.length === 0 ? (
                <p className="text-xs text-textSecondary text-right">لا توجد مراجعات أو تعليقات للعملاء حالياً.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((r) => (
                    <div key={r._id || r.id} className="bg-primary/45 border border-white/5 p-4 rounded-xl flex justify-between items-center text-right">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDeleteReview(r.productId || r.product?._id || r.product, r._id || r.id)}
                          className="bg-accentRed/10 border border-accentRed/20 text-accentRed p-2 rounded-lg hover:bg-accentRed/20 transition-colors cursor-pointer"
                          title="حذف المراجعة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {r.status !== 'approved' && (
                          <button 
                            onClick={() => handleUpdateReviewStatus(r.productId || r.product?._id || r.product, r._id || r.id, 'approved')}
                            className="bg-neonGreen/10 border border-neonGreen/20 text-neonGreen p-2 rounded-lg hover:bg-neonGreen/25 transition-colors cursor-pointer"
                            title="موافقة ونشر"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button 
                            onClick={() => handleUpdateReviewStatus(r.productId || r.product?._id || r.product, r._id || r.id, 'rejected')}
                            className="bg-accentGold/10 border border-accentGold/20 text-accentGold px-2.5 py-2 rounded-lg hover:bg-accentGold/20 transition-colors cursor-pointer text-[10px] font-bold"
                            title="رفض وحظر"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-end gap-2.5 items-center text-[10px] text-textSecondary mb-1">
                          {r.status === 'approved' ? (
                            <span className="text-[9px] font-bold text-neonGreen bg-neonGreen/5 px-2 py-0.5 rounded border border-neonGreen/10">مقبول ومقروء</span>
                          ) : r.status === 'rejected' ? (
                            <span className="text-[9px] font-bold text-accentRed bg-accentRed/5 px-2 py-0.5 rounded border border-accentRed/10">مرفوض ومخفي</span>
                          ) : (
                            <span className="text-[9px] font-bold text-accentGold bg-accentGold/5 px-2 py-0.5 rounded border border-accentGold/10 animate-pulse">بانتظار المراجعة</span>
                          )}
                          <span>التقييم: {r.rating}★</span>
                          <span className="font-bold text-white">{r.author || r.name}</span>
                        </div>
                        <h4 className="text-[11px] text-neonBlue font-semibold mb-1">{r.productName || (r.product && r.product.name) || 'مكمل غذائي'}</h4>
                        <p className="text-xs text-textSecondary leading-relaxed">{r.comment || r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Messages (Contact Us Inbox) */}
          {activeTab === "messages" && (
            <div className="flex flex-col gap-4 animate-fadeIn text-right">
              <h3 className="font-extrabold text-sm text-white mb-2">صندوق الرسائل والاتصالات الواردة 📨</h3>
              
              {messages.length === 0 ? (
                <p className="text-xs text-textSecondary py-8 text-center bg-primary/20 border border-white/5 rounded-xl">لا توجد رسائل واردة حالياً.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((m) => (
                    <div 
                      key={m._id || m.id} 
                      className={`bg-primary/45 border p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                        m.isRead ? 'border-white/5 opacity-75' : 'border-neonGreen/30 shadow-[0_0_8px_rgba(0,255,102,0.05)]'
                      }`}
                    >
                      <div className="flex gap-2 w-full sm:w-auto justify-start">
                        <button 
                          onClick={() => handleDeleteMessage(m._id || m.id)}
                          className="bg-accentRed/10 border border-accentRed/20 text-accentRed p-2 rounded-lg hover:bg-accentRed/20 transition-colors cursor-pointer text-xs font-bold"
                          title="حذف الرسالة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {!m.isRead && (
                          <button 
                            onClick={() => handleMarkMessageRead(m._id || m.id)}
                            className="bg-neonGreen/10 border border-neonGreen/20 text-neonGreen px-3 py-1.5 rounded-lg hover:bg-neonGreen/25 transition-colors cursor-pointer text-[10px] font-bold"
                          >
                            تحديد كمقروء
                          </button>
                        )}
                      </div>

                      <div className="flex-grow">
                        <div className="flex justify-end gap-2 items-center text-[10px] text-textSecondary mb-1.5 flex-wrap">
                          <span className="font-mono">{m.createdAt ? new Date(m.createdAt).toLocaleString('ar-EG') : ''}</span>
                          <span className="text-white/20">|</span>
                          <span className="font-mono text-neonBlue">{m.phone || 'بدون هاتف'}</span>
                          <span className="text-white/20">|</span>
                          <span className="font-mono text-white/70">{m.email}</span>
                          <span className="text-white/20">|</span>
                          <span className="font-bold text-white text-[11px]">{m.name}</span>
                          {!m.isRead && (
                            <span className="text-[8px] font-extrabold text-neonGreen bg-neonGreen/10 border border-neonGreen/20 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">جديد</span>
                          )}
                        </div>
                        <h4 className="text-xs text-white font-extrabold mb-1">{m.subject || 'بدون موضوع'}</h4>
                        <p className="text-xs text-textSecondary leading-relaxed bg-black/25 p-3 rounded-lg border border-white/5 mt-2">{m.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 7: Store Settings */}
          {activeTab === "settings" && (
            <form onSubmit={(e) => { e.preventDefault(); toast.success("تم حفظ إعدادات المتجر بالكامل بنجاح! ✅"); }} className="flex flex-col gap-6 animate-fadeIn">
              <h3 className="font-extrabold text-sm text-white border-r-2 border-neonGreen pr-2.5">تعديل إعدادات المتجر والدفع والسوشيال ميديا</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-textSecondary">اسم المتجر</label>
                  <input 
                    type="text" 
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-textSecondary">هاتف التواصل للمتجر</label>
                  <input 
                    type="text" 
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-textSecondary">مصاريف الشحن (EGP)</label>
                  <input 
                    type="number" 
                    value={settings.shippingCost}
                    onChange={(e) => setSettings({ ...settings, shippingCost: e.target.value })}
                    className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-textSecondary">رقم محفظة فودافون كاش الرسمية</label>
                  <input 
                    type="text" 
                    value={settings.vodafoneNumber}
                    onChange={(e) => setSettings({ ...settings, vodafoneNumber: e.target.value })}
                    className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-textSecondary">عنوان InstaPay للتحويل البنكي</label>
                  <input 
                    type="text" 
                    value={settings.instaPayAddress}
                    onChange={(e) => setSettings({ ...settings, instaPayAddress: e.target.value })}
                    className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-textSecondary">رابط صفحة الفيسبوك</label>
                  <input 
                    type="text" 
                    value={settings.facebookLink}
                    onChange={(e) => setSettings({ ...settings, facebookLink: e.target.value })}
                    className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-textSecondary">رابط حساب الإنستجرام</label>
                  <input 
                    type="text" 
                    value={settings.instagramLink}
                    onChange={(e) => setSettings({ ...settings, instagramLink: e.target.value })}
                    className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="bg-neonGreen text-black font-extrabold text-xs py-3 rounded-lg hover:bg-neonGreenHover mt-2 cursor-pointer"
              >
                حفظ إعدادات المتجر بالكامل
              </button>
            </form>
          )}

          {/* Tab 8: Logs */}
          {activeTab === "logs" && (
            <div className="bg-primary/50 border border-white/5 rounded-xl p-5 shadow text-right">
              <h3 className="font-extrabold text-sm text-white mb-4">سجل أحداث النظام والأمان والعمليات (Activity Logs)</h3>
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pl-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="bg-secondary/40 border border-white/5 p-3 rounded-lg flex justify-between items-center gap-4 text-xs font-mono">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      log.type === "success" ? 'bg-neonGreen/10 text-neonGreen border border-neonGreen/20' :
                      log.type === "warning" ? 'bg-accentGold/10 text-accentGold border border-accentGold/20' :
                      'bg-accentRed/10 text-accentRed border border-accentRed/20'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      {log.type}
                    </span>
                    <div className="flex flex-col gap-1 text-right flex-grow">
                      <p className="text-white leading-normal font-sans font-semibold">{log.message}</p>
                      <span className="text-[9px] text-textSecondary">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 9: Hero Slides Editor */}
          {activeTab === "hero_editor" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h3 className="font-extrabold text-sm text-white border-r-2 border-neonGreen pr-2.5">تعديل بنرات الصفحة الرئيسية (Hero Slides)</h3>
              {slides.map((s, idx) => (
                <div key={idx} className="bg-primary/50 border border-white/5 rounded-xl p-5 text-right flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-neonGreen border-b border-white/5 pb-2">البنر {idx + 1}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-textSecondary">الشارة (Badge)</label>
                      <input type="text" value={s.badge} onChange={e => { const u = [...slides]; u[idx] = { ...u[idx], badge: e.target.value }; setSlides(u); }} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-textSecondary">العنوان الرئيسي</label>
                      <input type="text" value={s.title} onChange={e => { const u = [...slides]; u[idx] = { ...u[idx], title: e.target.value }; setSlides(u); }} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-textSecondary">الكلمة المميزة (Highlight)</label>
                      <input type="text" value={s.titleHl} onChange={e => { const u = [...slides]; u[idx] = { ...u[idx], titleHl: e.target.value }; setSlides(u); }} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-textSecondary">النص الفرعي</label>
                      <input type="text" value={s.titleSub} onChange={e => { const u = [...slides]; u[idx] = { ...u[idx], titleSub: e.target.value }; setSlides(u); }} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45" />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] text-textSecondary">وصف البنر</label>
                      <textarea value={s.sub} onChange={e => { const u = [...slides]; u[idx] = { ...u[idx], sub: e.target.value }; setSlides(u); }} rows={2} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 resize-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-textSecondary">نص زر الـ CTA</label>
                      <input type="text" value={s.cta} onChange={e => { const u = [...slides]; u[idx] = { ...u[idx], cta: e.target.value }; setSlides(u); }} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-textSecondary">لون التمييز (Hex)</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={s.accent} onChange={e => { const u = [...slides]; u[idx] = { ...u[idx], accent: e.target.value }; setSlides(u); }} className="w-10 h-9 rounded cursor-pointer bg-transparent border-0" />
                        <input type="text" value={s.accent} onChange={e => { const u = [...slides]; u[idx] = { ...u[idx], accent: e.target.value }; setSlides(u); }} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none flex-grow font-mono" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] text-textSecondary">صورة البنر (رفع من الجهاز أو URL)</label>
                      <div className="flex gap-2 items-center">
                        <input type="text" value={s.img.startsWith('data:') ? '📷 صورة مرفوعة' : s.img} onChange={e => { const u = [...slides]; u[idx] = { ...u[idx], img: e.target.value }; setSlides(u); }} placeholder="رابط الصورة..." className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none flex-grow focus:border-neonGreen/45 font-mono" />
                        <label className="cursor-pointer bg-white/5 border border-white/10 text-textSecondary hover:text-white text-xs px-3 py-2.5 rounded-lg whitespace-nowrap">
                          رفع صورة
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleSlideImageUpload(e, idx)} />
                        </label>
                      </div>
                      {s.img && (
                        <img src={s.img} alt={`بنر ${idx+1}`} className="w-full h-24 object-cover rounded-lg mt-1 border border-white/5" onError={e => e.target.style.display='none'} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={saveSlides} className="bg-neonGreen text-black font-extrabold text-xs py-3 rounded-lg hover:bg-neonGreenHover cursor-pointer flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                حفظ بنرات الصفحة الرئيسية وتحديثها فوراً
              </button>
            </div>
          )}

          {/* Tab 10: FAQ Manager */}
          {activeTab === "faq_editor" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h3 className="font-extrabold text-sm text-white border-r-2 border-neonGreen pr-2.5">إدارة الأسئلة الشائعة (FAQ)</h3>

              {/* Add new FAQ */}
              <form onSubmit={handleAddFaq} className="bg-primary/50 border border-white/5 rounded-xl p-5 flex flex-col gap-3 text-right">
                <h4 className="text-xs font-bold text-neonGreen">إضافة سؤال شائع جديد</h4>
                <input type="text" placeholder="السؤال..." value={newFaq.q} onChange={e => setNewFaq({ ...newFaq, q: e.target.value })} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45" />
                <textarea placeholder="الإجابة..." value={newFaq.a} onChange={e => setNewFaq({ ...newFaq, a: e.target.value })} rows={3} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 resize-none" />
                <button type="submit" className="bg-neonGreen text-black font-extrabold text-xs py-2.5 rounded-lg hover:bg-neonGreenHover cursor-pointer flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> إضافة السؤال
                </button>
              </form>

              {/* Existing FAQs */}
              <div className="flex flex-col gap-3">
                {faqs.map(f => (
                  <div key={f.id} className="bg-primary/50 border border-white/5 rounded-xl p-4 text-right">
                    {editingFaq?.id === f.id ? (
                      <form onSubmit={handleUpdateFaq} className="flex flex-col gap-2">
                        <input type="text" value={editingFaq.q} onChange={e => setEditingFaq({ ...editingFaq, q: e.target.value })} className="text-xs bg-primary/60 border border-neonGreen/30 rounded-lg p-2.5 text-white outline-none" />
                        <textarea value={editingFaq.a} onChange={e => setEditingFaq({ ...editingFaq, a: e.target.value })} rows={3} className="text-xs bg-primary/60 border border-neonGreen/30 rounded-lg p-2.5 text-white outline-none resize-none" />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingFaq(null)} className="text-xs text-textSecondary hover:text-white px-3 py-1.5 cursor-pointer">إلغاء</button>
                          <button type="submit" className="text-xs bg-neonGreen text-black font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"><Save className="w-3 h-3" /> حفظ</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleDeleteFaq(f.id)} className="text-textSecondary hover:text-accentRed cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                          <button onClick={() => setEditingFaq(f)} className="text-textSecondary hover:text-neonGreen cursor-pointer"><Edit className="w-4 h-4" /></button>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white mb-1">{f.q}</p>
                          <p className="text-[11px] text-textSecondary leading-relaxed">{f.a}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 11: Footer Editor */}
          {activeTab === "footer_editor" && (
            <div className="flex flex-col gap-6 animate-fadeIn text-right">
              <h3 className="font-extrabold text-sm text-white border-r-2 border-neonGreen pr-2.5">تعديل الفوتر والتذييل</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'ownerName', label: 'اسم المالك / العلامة التجارية' },
                  { key: 'phone', label: 'رقم الهاتف / واتساب' },
                  { key: 'address', label: 'العنوان' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-textSecondary">{label}</label>
                    <input type="text" value={footerData[key] || ''} onChange={e => setFooterData({ ...footerData, [key]: e.target.value })} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45" />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] text-textSecondary">وصف المتجر في الفوتر</label>
                  <textarea value={footerData.description || ''} onChange={e => setFooterData({ ...footerData, description: e.target.value })} rows={3} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none resize-none focus:border-neonGreen/45" />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-textSecondary mb-3 border-b border-white/5 pb-2">روابط وبيانات السوشيال ميديا</p>
                </div>
                {[
                  { urlKey: 'facebookUrl', labelKey: 'facebookLabel', title: 'فيسبوك' },
                  { urlKey: 'instagramUrl', labelKey: 'instagramLabel', title: 'إنستجرام' },
                  { urlKey: 'tiktokUrl', labelKey: 'tiktokLabel', title: 'تيك توك' },
                ].map(({ urlKey, labelKey, title }) => (
                  <React.Fragment key={urlKey}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-textSecondary">رابط {title}</label>
                      <input type="text" value={footerData[urlKey] || ''} onChange={e => setFooterData({ ...footerData, [urlKey]: e.target.value })} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none font-mono focus:border-neonGreen/45" placeholder="https://..." />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-textSecondary">اسم ظاهر لـ {title}</label>
                      <input type="text" value={footerData[labelKey] || ''} onChange={e => setFooterData({ ...footerData, [labelKey]: e.target.value })} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45" placeholder={`${title}: فورمتك`} />
                    </div>
                  </React.Fragment>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-textSecondary">رقم واتساب</label>
                  <input type="text" value={footerData.whatsappNumber || ''} onChange={e => setFooterData({ ...footerData, whatsappNumber: e.target.value })} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none font-mono focus:border-neonGreen/45" placeholder="01xxxxxxxxx" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] text-textSecondary">نص حقوق الملكية (Copyright)</label>
                  <input type="text" value={footerData.copyright || ''} onChange={e => setFooterData({ ...footerData, copyright: e.target.value })} className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45" />
                </div>
              </div>

              {/* Dynamic Custom Social Links Builder */}
              <div className="border-t border-white/5 pt-6 mt-4 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-neonGreen">خانات تواصل اجتماعي إضافية (ديناميكية مخصصة)</h4>
                
                {footerData.customSocialLinks && footerData.customSocialLinks.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {footerData.customSocialLinks.map((link) => (
                      <div key={link.id} className="bg-secondary/40 border border-white/5 p-3 rounded-lg flex justify-between items-center gap-4 text-xs font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = footerData.customSocialLinks.filter(l => l.id !== link.id);
                            setFooterData({ ...footerData, customSocialLinks: updated });
                          }}
                          className="text-textSecondary hover:text-accentRed cursor-pointer p-1 shrink-0 transition-colors"
                          title="حذف هذا الرابط"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col gap-1 text-right flex-grow">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="bg-neonGreen/10 text-neonGreen text-[9px] px-2 py-0.5 rounded font-bold">{link.title}</span>
                            <span className="text-white font-semibold">{link.label || link.title}</span>
                          </div>
                          <span className="text-[10px] text-textSecondary font-mono">{link.url}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-textSecondary">لا توجد روابط تواصل اجتماعي مخصصة مضافة حالياً.</p>
                )}

                <div className="bg-secondary/20 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-white">إضافة منصة تواصل اجتماعي جديدة:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-textSecondary">اسم المنصة (يوتيوب، تلجرام، سناب...)</label>
                      <input
                        type="text"
                        placeholder="اسم المنصة..."
                        value={newSocial.title}
                        onChange={e => setNewSocial({ ...newSocial, title: e.target.value })}
                        className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-textSecondary">الاسم الظاهر في الفوتر</label>
                      <input
                        type="text"
                        placeholder="الاسم الظاهر..."
                        value={newSocial.label}
                        onChange={e => setNewSocial({ ...newSocial, label: e.target.value })}
                        className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-textSecondary">الرابط الكامل لحسابك</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={newSocial.url}
                        onChange={e => setNewSocial({ ...newSocial, url: e.target.value })}
                        className="text-xs bg-primary/60 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-neonGreen/45 font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSocial.title || !newSocial.url) {
                        toast.error('يرجى ملء اسم المنصة ورابط الحساب على الأقل!');
                        return;
                      }
                      const updated = [
                        ...(footerData.customSocialLinks || []),
                        { id: Date.now(), ...newSocial }
                      ];
                      setFooterData({ ...footerData, customSocialLinks: updated });
                      setNewSocial({ title: '', url: '', label: '' });
                      toast.success('تمت إضافة رابط السوشيال ميديا الجديد لقائمة التعديل!');
                    }}
                    className="bg-white/5 border border-white/10 hover:bg-neonGreen hover:text-black font-extrabold text-xs py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 text-white"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة الرابط الجديد للقائمة
                  </button>
                </div>
              </div>

              <button onClick={saveFooter} className="bg-neonGreen text-black font-extrabold text-xs py-3 rounded-lg hover:bg-neonGreenHover cursor-pointer flex items-center justify-center gap-2 mt-4">
                <Save className="w-4 h-4" />
                حفظ بيانات الفوتر بالكامل وتحديثها فوراً
              </button>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
