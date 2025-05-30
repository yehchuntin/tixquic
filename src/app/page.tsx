'use client'; 

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Ticket, Settings, BookOpen, ShieldCheck, Lightbulb, Mail, MessageCircle, MapPin, Zap, Users, Clock } from "lucide-react"; 
import { AppLogo } from "@/components/icons/app-logo"; 
import Image from 'next/image';
import { collection, getDocs, query, Timestamp, limit, orderBy, where } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

import dynamic from 'next/dynamic';
const GoogleAd = dynamic(() => import('../components/GoogleAd'), { ssr: false });



interface Event {
  id: string;
  name: string;
  imageUrl?: string;
  date?: Timestamp; 
  venue?: string;
  onSaleDate?: Timestamp; 
  endDate?: Timestamp;   
}

const FeaturedEventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const eventsCollection = collection(db, 'events');
        const today = Timestamp.now();
        
        const q = query(
          eventsCollection,
          where('endDate', '>=', today),      
          orderBy('onSaleDate', 'asc'),     
          orderBy('endDate', 'asc'),        
          limit(3)                          
        );
        
        const eventSnapshot = await getDocs(q);
        const eventsData = eventSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`[HomePage - FeaturedEventList] Raw data for doc ${doc.id}:`, data);
          return { id: doc.id, ...data } as Event;
        });
        
        console.log('[HomePage - FeaturedEventList] Fetched featured events:', eventsData);
        setEvents(eventsData);
      } catch (err: any) {
        console.error("[HomePage - FeaturedEventList] Error fetching featured events:", err);
        if (err.code === 'permission-denied') {
          setError("權限不足：請確認 Firestore 安全規則已正確設定");
        } else if (err.code === 'failed-precondition') {
          setError("需要建立索引：請查看 Console 中的錯誤連結");
        } else {
          setError(`載入活動失敗: ${err.message || '未知錯誤'}`);
        }
      }
      setLoading(false);
    };
    fetchFeaturedEvents();
  }, []);

  if (loading) return <p className="text-center py-4">載入熱門活動中...</p>;
  if (error) return <p className="text-center py-4 text-red-500">錯誤: {error}</p>;
  if (events.length === 0) return <p className="text-center py-4 text-muted-foreground">目前沒有熱門活動</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map(event => {
        const imageUrl = event.imageUrl;
        console.log(`[HomePage - FeaturedEventList] Rendering event: ${event.name}, Original Image URL from data: ${imageUrl}`);
        
        let isValidUrl = false;
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('https://firebasestorage.googleapis.com/')) {
          try {
            new URL(imageUrl); 
            isValidUrl = true;
          } catch (e) {
            console.error(`[HomePage - FeaturedEventList] Invalid URL format for ${event.name}: ${imageUrl}`, e);
          }
        } else {
          console.warn(`[HomePage - FeaturedEventList] Image URL for ${event.name} is missing, undefined, or not a Firebase Storage URL: ${imageUrl}`);
        }

        return (
          <Card key={event.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
            <Link href={`/event/${event.id}`} className="block">
              <CardHeader className="p-0">
                <div className="relative h-52 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                  {isValidUrl && imageUrl ? (
                    <Image
                      src={imageUrl!}
                      alt={`${event.name} - 演唱會門票`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        console.error(`[HomePage - FeaturedEventList] Next/Image Error for ${event.name}: URL - ${imageUrl}. Details:`, e.currentTarget.currentSrc, e);
                      }}
                      unoptimized={true} 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Ticket className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                      {!imageUrl && <p className="text-xs text-gray-500 mt-1">No URL</p>}
                      {imageUrl && !isValidUrl && <p className="text-xs text-red-500 mt-1">Invalid URL</p>}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg font-semibold mb-1 truncate group-hover:text-primary">{event.name}</CardTitle>
                {event.onSaleDate && <p className="text-sm text-muted-foreground">開賣時間: {new Date(event.onSaleDate.seconds * 1000).toLocaleDateString('zh-TW')}</p>}
                {event.venue && <p className="text-sm text-muted-foreground truncate">{event.venue}</p>}
              </CardContent>
            </Link>
          </Card>
        );
      })}
    </div>
  );
};

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>TixQuic 拓元搶票助理 - AI 驅動演唱會購票神器</title>
        <meta name="description" content="TixQuic 專業搶票助理，整合 OpenAI 視覺辨識技術，毫秒級破解驗證碼。協助您在拓元系統快速搶購熱門演唱會門票，AI 智慧讓搶票成功率大幅提升。" />
        <meta name="keywords" content="搶票助理,拓元,演唱會門票,快速搶票,安全購票,TixQuic,拓元系統,演唱會搶票,門票代購,購票技巧,AI驗證碼辨識,OpenAI,人工智慧搶票" />
        <meta property="og:title" content="TixQuic - 您的專業搶票助理" />
        <meta property="og:description" content="協助你快速破解驗證碼、搶購拓元系統熱門演唱會門票，整合 OpenAI 技術與使用教學，一站式解決方案。" />
        <meta property="og:site_name" content="TixQuic 搶票助理" />
        <link rel="canonical" href="https://www.tixquic.com/" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2436395949894310"
     crossOrigin="anonymous"></script>
        <link rel="icon" href="/tixquic_logo_112x112.png" type="image/png" />

        <script type="application/ld+json">
        {`
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "TixQuic 搶票助理",
          "url": "https://www.tixquic.com",
          "logo": "https://www.tixquic.com/tixquic_logo_112x112.png"
        }
        `}
        </script>

      </Head>

      <div className="min-h-screen flex flex-col">
        {/* SEO Hidden Content */}
        <h1 className="sr-only">TixQuic - 拓元系統專業搶票助理</h1>
        
        {/* Main Content */}
        <div className="flex-1 space-y-8 p-4 md:p-8">
          {/* Hero Section */}
          <Card className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 p-6 md:p-8 rounded-xl shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AppLogo className="h-10 w-10 text-purple-600" />
                <CardTitle className="text-3xl md:text-4xl font-bold">歡迎來到 TixQuic！</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground mt-2 text-lg md:text-xl">
                您的專業搶票助理 - 協助您在拓元系統搶購熱門演唱會門票
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  title: "探索所有活動", 
                  description: "即時掌握演唱會開賣資訊，不錯過任何精彩演出", 
                  href: "/events", 
                  Icon: Ticket 
                }, 
                { 
                  title: "搶票技巧教學", 
                  description: "學習高效搶票策略，掌握驗證碼快速輸入技巧", 
                  href: "/how-to-use", 
                  Icon: BookOpen 
                },
                { 
                  title: "個人設定管理", 
                  description: "自訂搶票偏好，優化您的購票體驗", 
                  href: "/settings", 
                  Icon: Settings 
                },
              ].map(item => (
                <Link href={item.href} key={item.title} legacyBehavior>
                  <a className="block transform transition-all hover:scale-105">
                    <Card className="h-full hover:border-purple-600">
                      <CardHeader>
                        <item.Icon className="h-8 w-8 text-purple-600 mb-2" />
                        <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Featured Events Section */}
          <section className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">即將開賣活動</h2>
              <Link href="/events" legacyBehavior> 
                <a className="text-purple-600 hover:underline flex items-center">
                  查看所有活動 <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Link>
            </div>
            <FeaturedEventList /> 
          </section>
          {/* 廣告區塊：Featured Event 下方 */}
          <GoogleAd slot="1594898059" className="my-10" />


          {/* Features Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-green-500" />
                <CardTitle>安全可靠</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  採用加密技術保護您的個人資訊，確保購票過程安全無虞。每筆交易都經過嚴格驗證，讓您安心搶票。
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Zap className="h-8 w-8 text-blue-500" />
                <CardTitle>AI 極速搶票</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  整合 OpenAI 先進視覺辨識技術，毫秒級破解驗證碼。AI 智慧分析讓驗證碼不再是障礙，協助您在開賣瞬間完成購票。
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Lightbulb className="h-8 w-8 text-yellow-500" />
                <CardTitle>即時通知</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  第一時間推送開賣提醒，掌握搶票黃金時機。提供詳細座位圖與價格資訊，助您做出最佳選擇。
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Why Choose Us Section */}
          <div className="mt-12 bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
            <h2 className="text-2xl md:text:3xl font-bold text-center mb-8">為什麼選擇 TixQuic？</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <Lightbulb className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">OpenAI 技術支援</h3>
                  <p className="text-muted-foreground text-sm">
                    採用最新 OpenAI 視覺模型，精準辨識各類驗證碼，突破傳統限制
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">24小時待命服務</h3>
                  <p className="text-muted-foreground text-sm">
                    AI 全天候運作，隨時準備協助您搶購心儀門票
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Users className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">搶票社群交流</h3>
                  <p className="text-muted-foreground text-sm">
                    與其他粉絲分享搶票心得，交流最新演唱會資訊
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Ticket className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">成功率保證</h3>
                  <p className="text-muted-foreground text-sm">
                    AI 加持讓驗證碼辨識準確率達 90%，大幅提升搶票成功率
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Zap className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">毫秒級響應</h3>
                  <p className="text-muted-foreground text-sm">
                    AI 即時運算，快速完成驗證碼辨識，搶在第一時間下單
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <ShieldCheck className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">隱私安全保護</h3>
                  <p className="text-muted-foreground text-sm">
                    所有資料本地處理，確保您的隱私安全
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-6">值得信賴的搶票夥伴</h2>
            <div className="flex flex-wrap justify-center gap-8 items-center">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-purple-600">10,000+</div>
                <div className="text-muted-foreground">成功搶票次數</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-purple-600">95%</div>
                <div className="text-muted-foreground">用戶滿意度</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-purple-600">4~7秒</div>
                <div className="text-muted-foreground">平均完成時間</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Contact Information */}
        <footer className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-white mt-16 transition-colors">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Company Info */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AppLogo className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-xl font-bold">TixQuic</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  專業搶票助理服務<br />
                  讓您輕鬆搶到拓元系統熱門門票
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-4">快速連結</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li><Link href="/events" className="hover:text-purple-600 dark:hover:text-purple-400 transition">活動列表</Link></li>
                  <li><Link href="/access" className="hover:text-purple-600 dark:hover:text-purple-400 transition">輸入驗證碼</Link></li>
                  <li><Link href="/how-to-use" className="hover:text-purple-600 dark:hover:text-purple-400 transition">使用教學</Link></li>
                  <li><Link href="/download" className="hover:text-purple-600 dark:hover:text-purple-400 transition">下載 App</Link></li>
                  <li><Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400 transition">服務條款</Link></li>
                </ul>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold mb-4">聯絡我們</h4>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <a href="mailto:2017yehchunting@gmail.com" className="hover:text-purple-600 dark:hover:text-purple-400 transition">
                      2017yehchunting@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span>LINE: @tixquic</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span>台灣</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-300 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
              <p>&copy; 2024 TixQuic. All rights reserved.</p>
              <p className="text-sm mt-2">整合 OpenAI 技術，提供安全、快速、可靠的 AI 智慧搶票服務</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}