'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ticket, Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: string;
  name: string;
  imageUrl?: string;
  date?: Timestamp; 
  venue?: string;
  onSaleDate?: Timestamp; 
  endDate?: Timestamp;   
  description?: string;
}

export default function AllEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const eventsCollection = collection(db, 'events');
        const today = Timestamp.now();
        const q = query(
          eventsCollection,
          where('endDate', '>=', today),
          orderBy('onSaleDate', 'asc'), 
          orderBy('endDate', 'asc')    
        );
        
        const eventSnapshot = await getDocs(q);
        const eventsData = eventSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`[AllEventsPage] Raw data for doc ${doc.id}:`, data);
          return { id: doc.id, ...data } as Event;
        });
        
        console.log('[AllEventsPage] Fetched events data:', eventsData);
        setEvents(eventsData);
      } catch (err: any) {
        console.error("[AllEventsPage] Error fetching events:", err);
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
    fetchAllEvents();
  }, []);

  // 判斷活動狀態
  const getEventStatus = (event: Event) => {
    if (!event.onSaleDate || !event.endDate) return null;
    
    const now = new Date();
    const onSaleDate = new Date(event.onSaleDate.seconds * 1000);
    const endDate = new Date(event.endDate.seconds * 1000);
    
    if (now < onSaleDate) {
      return { text: "即將開賣", color: "bg-yellow-500" };
    } else if (now <= endDate) {
      return { text: "On Sale", color: "bg-green-500" };
    } else {
      return { text: "已結束", color: "bg-gray-500" };
    }
  };

  // 格式化日期範圍
  const formatDateRange = (event: Event) => {
    // 優先使用 date 和 endDate，如果沒有則使用 onSaleDate 和 endDate
    const startDate = event.date ? new Date(event.date.seconds * 1000) : 
                     event.onSaleDate ? new Date(event.onSaleDate.seconds * 1000) : null;
    const endDate = event.endDate ? new Date(event.endDate.seconds * 1000) : null;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    if (startDate && endDate) {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      // 如果是同一天
      if (startDate.toDateString() === endDate.toDateString()) {
        return `${formatDate(startDate)}, ${startYear}`;
      }
      
      // 如果同年
      if (startYear === endYear) {
        return `${formatDate(startDate)} - ${formatDate(endDate)}, ${startYear}`;
      }
      
      // 不同年
      return `${formatDate(startDate)}, ${startYear} - ${formatDate(endDate)}, ${endYear}`;
    } else if (startDate) {
      return `${formatDate(startDate)}, ${startDate.getFullYear()}`;
    } else if (endDate) {
      return `${formatDate(endDate)}, ${endDate.getFullYear()}`;
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Featured Events</h1>
          <Button variant="ghost" asChild className="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首頁
            </Link>
          </Button>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center min-h-[400px]">
            <p className="text-gray-600 dark:text-gray-400">載入活動中...</p>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center items-center min-h-[400px]">
            <p className="text-red-600 dark:text-red-400">錯誤: {error}</p>
          </div>
        )}
        
        {!loading && !error && events.length === 0 && (
          <div className="flex justify-center items-center min-h-[400px]">
            <p className="text-gray-600 dark:text-gray-400">目前沒有即將開賣的活動</p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(event => {
              const imageUrl = event.imageUrl;
              const status = getEventStatus(event);
              
              let isValidUrl = false;
              if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('https://')) {
                try {
                  new URL(imageUrl);
                  isValidUrl = true;
                } catch (e) {
                  console.error(`Invalid URL for ${event.name}:`, e);
                }
              }

              return (
                <Card key={event.id} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 overflow-hidden group cursor-pointer flex flex-col h-full transition-all duration-300 hover:shadow-2xl">
                  <Link href={`/event/${event.id}`} className="flex flex-col h-full">
                    {/* Image Section - 更扁的比例 */}
                    <div className="relative w-full aspect-[21/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {isValidUrl && imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={event.name || '活動圖片'}
                          layout="fill"
                          objectFit="cover"
                          className="transition-all duration-300 group-hover:scale-110 group-hover:brightness-75"
                          unoptimized={true} 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Ticket className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      {status && (
                        <Badge className={`absolute top-3 right-3 ${status.color} text-white border-0 z-10 text-xs`}>
                          {status.text}
                        </Badge>
                      )}
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-5 flex flex-col flex-grow">
                      <div className="flex-grow space-y-2">
                        {/* Event Name */}
                        <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 min-h-[2.5rem] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {event.name}
                        </h3>

                        {/* Date Range */}
                        {formatDateRange(event) && (
                          <div className="text-gray-600 dark:text-gray-400 text-sm group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                            <span>{formatDateRange(event)}</span>
                          </div>
                        )}

                        {/* Venue */}
                        {event.venue && (
                          <div className="text-gray-600 dark:text-gray-400 text-sm group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                            <span>{event.venue}</span>
                          </div>
                        )}

                        {/* Description Preview - 縮短為2行 */}
                        {event.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* View Details Button - Always at bottom */}
                      <div className="mt-4">
                        <Button 
                          className="w-full bg-transparent dark:bg-transparent border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-600 dark:hover:bg-purple-600 hover:text-white dark:hover:text-white hover:border-purple-600 dark:hover:border-purple-600 transition-all duration-300 py-2 text-sm"
                          variant="outline"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}