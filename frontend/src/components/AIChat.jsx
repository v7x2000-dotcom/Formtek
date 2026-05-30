import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

export default function AIChat({ onRecommendProduct, products }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: "ai", 
      text: "أهلاً بك يا بطل! أنا كوتش فورمتك المساعد بالذكاء الاصطناعي 🤖💪. أخبرني بهدفك الرياضي (ضخامة، تخسيس، طاقة، صحة عامة) لأرشح لك أفضل المكملات المضمونة فوراً!" 
    }
  ]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = { sender: "user", text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");

    // Simulate AI thinking and response
    setTimeout(() => {
      let botResponse = "";
      let recommendedProduct = null;

      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes("ضخامة") || lowerQuery.includes("عضل") || lowerQuery.includes("bulking") || lowerQuery.includes("بروتين")) {
        recommendedProduct = products.find(p => p.category === "protein" || p.category === "mass-gainer");
        botResponse = `لبناء كتلة عضلية ضخمة وصافية، أفضل ترشيح لك هو مكمل البروتين عالي الجودة. أرشح لك "${recommendedProduct?.name || 'بلاتينيوم واي بروتين'}" لأنه يحتوي على تركيز بروتين فائق للاستشفاء العضلي السريع.`;
      } else if (lowerQuery.includes("تخسيس") || lowerQuery.includes("حرق") || lowerQuery.includes("دهون") || lowerQuery.includes("weight loss")) {
        recommendedProduct = products.find(p => p.category === "fat-burners");
        botResponse = `للتنشيف والتخلص من الدهون الزائدة مع الحفاظ على الكتلة العضلية، أرشح لك حارق الدهون القوي "${recommendedProduct?.name || 'ليبودرين حارق دهون'}" لرفع عملية الحرق الحراري للجسم وسد الشهية.`;
      } else if (lowerQuery.includes("قوة") || lowerQuery.includes("تحمل") || lowerQuery.includes("كرياتين") || lowerQuery.includes("strength")) {
        recommendedProduct = products.find(p => p.category === "creatine" || p.category === "amino-acids");
        botResponse = `لزيادة قوة التحمل ورفع أوزان أثقل في الجيم، الكرياتين هو خيارك المثالي. أنصحك بـ "${recommendedProduct?.name || 'كرياتين ميكرونايز'}" لزيادة مخزون الطاقة ATP في الخلايا العضلية.`;
      } else if (lowerQuery.includes("صحة") || lowerQuery.includes("فيتامين") || lowerQuery.includes("نشاط") || lowerQuery.includes("health")) {
        recommendedProduct = products.find(p => p.category === "vitamins");
        botResponse = `لدعم المناعة وتغطية النقص اليومي من العناصر الغذائية للأبطال، أنصحك باستخدام "${recommendedProduct?.name || 'أنيمل باك فيتامين'}" وهو المالتي فيتامين الأكثر شمولاً للرياضيين.`;
      } else {
        botResponse = "حسناً يا بطل، لتسهيل الاختيار، ما هو هدفك الرياضي الحالي؟\n1. ضخامة عضلية وبناء كتلة\n2. تخسيس وحرق دهون وتنشيف\n3. زيادة القوة والتحمل البدني\n4. صحة عامة وفيتامينات";
      }

      const botMsg = { 
        sender: "ai", 
        text: botResponse,
        recommendation: recommendedProduct 
      };

      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Chat Bubble Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-neonGreen text-black flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
        title="كوتش ذكاء اصطناعي"
      >
        {isOpen ? <X className="w-6 h-6 text-black" /> : <MessageSquare className="w-6 h-6 text-black" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 w-80 sm:w-96 bg-secondary border border-white/10 rounded-2xl flex flex-col justify-between shadow-2xl overflow-hidden h-[450px] animate-fadeIn text-right">
          {/* Header */}
          <div className="bg-tertiary border-b border-white/5 p-4 flex items-center justify-between">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-textSecondary hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-neonGreen rounded-full shadow-[0_0_8px_rgba(0,255,102,0.6)] animate-pulse"></span>
              <span className="font-extrabold text-xs text-white">كوتش AI الذكي للمكملات</span>
            </div>
          </div>

          {/* Messages body */}
          <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.sender === "ai" 
                    ? 'bg-primary/50 text-textPrimary border border-white/5 self-start text-right' 
                    : 'bg-neonGreen text-black font-semibold self-end text-right'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                
                {/* Recommendation box */}
                {msg.recommendation && (
                  <div className="mt-3 border-t border-white/10 pt-2.5 flex items-center justify-between gap-3 bg-secondary/80 p-2 rounded">
                    <button 
                      onClick={() => onRecommendProduct(msg.recommendation)}
                      className="bg-neonGreen text-black text-[9px] font-black px-2 py-1 rounded shrink-0 hover:bg-neonGreenHover"
                    >
                      عرض التفاصيل
                    </button>
                    <span className="text-[10px] text-textSecondary font-bold line-clamp-1 flex-grow">{msg.recommendation.name}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick choices actions */}
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-white/5 bg-primary/20 justify-end">
            <button 
              onClick={() => handleSendMessage("أريد مكمل للضخامة العضلية")}
              className="text-[9px] bg-white/5 border border-white/10 hover:border-neonGreen/30 text-textSecondary hover:text-white px-2 py-1.5 rounded transition-all"
            >
              🏋️ ضخامة عضلية
            </button>
            <button 
              onClick={() => handleSendMessage("مكمل لحرق الدهون والتنشيف")}
              className="text-[9px] bg-white/5 border border-white/10 hover:border-neonGreen/30 text-textSecondary hover:text-white px-2 py-1.5 rounded transition-all"
            >
              🔥 حرق دهون
            </button>
            <button 
              onClick={() => handleSendMessage("كرياتين لزيادة القوة")}
              className="text-[9px] bg-white/5 border border-white/10 hover:border-neonGreen/30 text-textSecondary hover:text-white px-2 py-1.5 rounded transition-all"
            >
              ⚡ زيادة القوة
            </button>
          </div>

          {/* Input form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3 border-t border-white/5 bg-secondary flex gap-2"
          >
            <button 
              type="submit"
              className="bg-neonGreen text-black font-extrabold text-[11px] p-2.5 rounded hover:bg-neonGreenHover transition-colors flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اسأل الكوتش عن هدفك البدني..." 
              className="flex-grow text-xs bg-primary border border-white/10 rounded px-3 py-2 text-textPrimary outline-none focus:border-neonGreen/45 text-right"
            />
          </form>

        </div>
      )}
    </div>
  );
}
