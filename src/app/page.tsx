'use client'; 

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Ticket, Settings, BookOpen, ShieldCheck, Lightbulb, Mail, MessageCircle, MapPin } from "lucide-react"; 
import { AppLogo } from "@/components/icons/app-logo"; 
import Image from 'next/image';
import { collection, getDocs, query, Timestamp, limit, orderBy, where } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

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
                      alt={event.name || '活動圖片'}
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
    <div className="min-h-screen flex flex-col">
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
              您的專業搶票助理 - 協助您搶購拓元系統的熱門演唱會門票
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                title: "探索所有活動", 
                description: "發現即將開賣的演唱會、音樂節等活動", 
                href: "/events", 
                Icon: Ticket 
              }, 
              { 
                title: "使用教學", 
                description: "學習搶票技巧與驗證碼使用方式", 
                href: "/how-to-use", 
                Icon: BookOpen 
              },
              { 
                title: "管理帳號", 
                description: "更新您的個人資料與搶票偏好設定", 
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
            <h2 className="text-2xl md:text-3xl font-bold">熱門活動</h2>
            <Link href="/events" legacyBehavior> 
              <a className="text-purple-600 hover:underline flex items-center">
                查看所有活動 <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Link>
          </div>
          <FeaturedEventList /> 
        </section>

        {/* Features Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-green-500" />
              <CardTitle>安全可靠</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                我們重視您的資訊安全，提供可靠的搶票助理服務。
                每個驗證碼都是獨一無二，確保您的權益受到保障。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <Lightbulb className="h-8 w-8 text-yellow-500" />
              <CardTitle>即時資訊</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                獲得最新的演唱會開賣資訊、搶票技巧與專屬優惠。
                不再錯過您喜愛的藝人演出！
              </p>
            </CardContent>
          </Card>
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
                您的專業搶票助理平台<br />
                協助您成功搶購熱門演唱會門票
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">快速連結</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/events" className="hover:text-purple-600 dark:hover:text-purple-400 transition">所有活動</Link></li>
                <li><Link href="/access" className="hover:text-purple-600 dark:hover:text-purple-400 transition">輸入驗證碼</Link></li>
                <li><Link href="/how-to-use" className="hover:text-purple-600 dark:hover:text-purple-400 transition">使用教學</Link></li>
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
          </div>
        </div>
      </footer>
    </div>
  );
}