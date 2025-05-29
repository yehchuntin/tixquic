'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, Timestamp, updateDoc, collection, addDoc } from "firebase/firestore"; 
import Image from 'next/image';
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon, TicketIcon, StarIcon, DollarSignIcon, AlertTriangle, ArrowLeft, InfoIcon, ShoppingCart, FileTextIcon, LightbulbIcon, CheckCircleIcon, Copy, Eye, EyeOff } from "lucide-react"; 
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TicketEvent {
  id: string;
  name: string;
  date?: Timestamp;
  endDate?: Timestamp;
  actualTicketTime?: Timestamp;
  venue: string;
  description: string;
  price: number;
  totalTickets: number;
  ticketsSold: number;
  imageUrl?: string; 
  category?: string;
  organizer?: string;
  onSaleDate?: Timestamp;
  status?: string; 
  activityUrl?: string;
  prefix?: string; // 驗證碼前綴
  pointsAwarded?: number; // 購買獲得的點數
}

interface EventDetailPageProps {
  params: { id: string };
}

interface VerificationCodeData {
  verificationCode: string;
  eventId: string;
  eventName: string;
  userId: string;
  seatPreferenceOrder?: string;
  sessionPreference?: number;
  ticketCount?: number;
  createdAt: string;
  lastUsed?: string;
  usageCount?: number;
  purchaseDate?: string;
  modificationCount?: number; // 偏好設定修改次數
  maxModifications?: number; // 最大修改次數
}

const calculateEventStatus = (event: TicketEvent | null): { text: string; badgeClass: string; isActionable: boolean } | null => {
  if (!event || !event.onSaleDate?.seconds || !event.endDate?.seconds) {
    return { text: "Status Unavailable", badgeClass: "bg-gray-500 text-white", isActionable: false };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const onSale = new Date(event.onSaleDate.seconds * 1000); 
  onSale.setHours(0, 0, 0, 0);
  const end = new Date(event.endDate.seconds * 1000); 
  end.setHours(0, 0, 0, 0);

  if (today > end) return { text: "Past Event", badgeClass: "bg-red-600 text-white", isActionable: false };
  if (today >= onSale) {
    if (event.ticketsSold >= event.totalTickets) return { text: "Sold Out", badgeClass: "bg-red-600 text-white", isActionable: false };
    return { text: "On Sale", badgeClass: "bg-green-500 text-white", isActionable: true }; 
  }
  return { text: "Upcoming", badgeClass: "bg-yellow-500 text-black", isActionable: false }; 
};

const generateVerificationCode = (prefix: string = ""): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 16; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `${prefix}${randomString}`.toUpperCase();
};

export default function EventDetailPage({ params: routePassedParams }: EventDetailPageProps) {
  const pathParams = useParams();
  const eventId = (pathParams.id || routePassedParams?.id) as string; 

  const [event, setEvent] = useState<TicketEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [statusInfo, setStatusInfo] = useState<{ text: string; badgeClass: string; isActionable: boolean } | null>(null); 
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number | string>("");
  
  // 新增：驗證碼相關狀態
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showVerificationResult, setShowVerificationResult] = useState(false);
  const [verificationCodeData, setVerificationCodeData] = useState<VerificationCodeData | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  
  // 新增：購票偏好設定
  const [seatPreferences, setSeatPreferences] = useState<string>("");
  const [sessionPreference, setSessionPreference] = useState<string>("1");
  const [ticketCount, setTicketCount] = useState<string>("1");
  
  // 新增：使用者購買狀態
  const [userVerificationCode, setUserVerificationCode] = useState<VerificationCodeData | null>(null);
  const [loadingUserStatus, setLoadingUserStatus] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  
  // 新增：偏好設定修改
  const [showEditPreferences, setShowEditPreferences] = useState(false);
  const [editSeatPreferences, setEditSeatPreferences] = useState<string>("");
  const [editSessionPreference, setEditSessionPreference] = useState<string>("1");
  const [editTicketCount, setEditTicketCount] = useState<string>("1");
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  
  // 新增：付款方式選擇
  const [paymentMethod, setPaymentMethod] = useState<'points' | 'card' | 'mixed'>('card');

  const { toast } = useToast();
  const { 
    user, 
    loading: authLoading, 
    updateUserLoyaltyPoints, 
    loyaltyPoints,
    callAuthenticatedFunction 
  } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        setLoadingEvent(true);
        try {
          const eventDocRef = doc(db, "events", eventId);
          const eventSnap = await getDoc(eventDocRef);
          if (eventSnap.exists()) {
            const eventData = { id: eventSnap.id, ...eventSnap.data() } as TicketEvent;
            setEvent(eventData);
            setStatusInfo(calculateEventStatus(eventData));
          } else {
            setEvent(null);
            setStatusInfo({ text: "Event Not Found", badgeClass: "bg-red-600 text-white", isActionable: false });
          }
        } catch (error) {
          console.error("Error fetching event:", error);
          toast({ title: "Error", description: "Could not fetch event details.", variant: "destructive" });
          setEvent(null);
          setStatusInfo({ text: "Error Loading", badgeClass: "bg-red-600 text-white", isActionable: false });
        }
        setLoadingEvent(false);
      };
      fetchEvent();
    }
  }, [eventId, toast]);

  // 檢查使用者是否已購買此活動的驗證碼
  useEffect(() => {
    const checkUserPurchaseStatus = async () => {
      if (!user || !eventId) return;
      
      setLoadingUserStatus(true);
      try {
        // 查詢使用者是否已有此活動的驗證碼
        const { getDocs, collection: firestoreCollection, query, where } = await import("firebase/firestore");
        
        const verificationsQuery = query(
          firestoreCollection(db, "userEventVerifications"),
          where("userId", "==", user.uid),
          where("eventId", "==", eventId),
          where("status", "==", "active")
        );
        
        const verificationsSnap = await getDocs(verificationsQuery);
        
        if (!verificationsSnap.empty) {
          const verificationDoc = verificationsSnap.docs[0];
          const verificationData = verificationDoc.data();
          
          setUserVerificationCode({
            verificationCode: verificationData.verificationCode,
            eventId: verificationData.eventId,
            eventName: verificationData.eventName,
            userId: verificationData.userId,
            seatPreferenceOrder: verificationData.seatPreferenceOrder,
            sessionPreference: verificationData.sessionPreference,
            ticketCount: verificationData.ticketCount,
            createdAt: verificationData.createdAt?.toDate?.()?.toISOString() || verificationData.createdAt,
            lastUsed: verificationData.lastUsed?.toDate?.()?.toISOString() || verificationData.lastUsed,
            usageCount: verificationData.usageCount || 0,
            purchaseDate: verificationData.purchaseDate?.toDate?.()?.toISOString() || verificationData.purchaseDate,
            modificationCount: verificationData.modificationCount || 0,
            maxModifications: 5
          });
        } else {
          setUserVerificationCode(null);
        }
      } catch (error) {
        console.error("Error checking user purchase status:", error);
        setUserVerificationCode(null);
      } finally {
        setLoadingUserStatus(false);
      }
    };

    checkUserPurchaseStatus();
  }, [user, eventId]);

  // 生成驗證碼
  const handleGenerateVerificationCode = async (paymentData: { 
    pointsUsed: number; 
    finalPrice: number; 
    paymentMethod: string 
  }) => {
    if (!user || !event || !statusInfo || !statusInfo.isActionable) return;

    setIsGeneratingCode(true);
    
    try {
      // 先處理購買邏輯（扣點數、記錄訂單等）
      const orderRef = await addDoc(collection(db, "users", user.uid, "orders"), {
        eventId: event.id,
        eventName: event.name,
        purchaseDate: Timestamp.now(),
        pricePaid: paymentData.finalPrice,
        pointsRedeemed: paymentData.pointsUsed,
        paymentMethod: paymentData.paymentMethod,
        ticketCode: `TIX-${generateVerificationCode()}`,
        status: "verified",
        preferences: {
          seatPreferences: seatPreferences || "自動選擇",
          sessionPreference: sessionPreference,
          ticketCount: ticketCount
        }
      });

      // 更新活動售票數量
      await updateDoc(doc(db, "events", eventId), { 
        ticketsSold: (event.ticketsSold || 0) + parseInt(ticketCount) 
      });

      // 扣除兌換的點數
      if (paymentData.pointsUsed > 0 && updateUserLoyaltyPoints) {
        await updateUserLoyaltyPoints(-paymentData.pointsUsed);
      }
      
      // 獎勵購買點數 - 直接使用 pointsAwarded
      const pointsAwardedForPurchase = event.pointsAwarded || 0;
      if (pointsAwardedForPurchase > 0 && updateUserLoyaltyPoints) {
        await updateUserLoyaltyPoints(pointsAwardedForPurchase);
      }

      // 創建驗證碼記錄到 Firestore
      const verificationCode = generateVerificationCode(event.prefix || "");
      const verificationDocData = {
        verificationCode,
        userId: user.uid,
        eventId: event.id,
        eventName: event.name,
        orderId: orderRef.id,
        seatPreferenceOrder: seatPreferences || "自動選擇",
        sessionPreference: parseInt(sessionPreference),
        ticketCount: parseInt(ticketCount),
        createdAt: Timestamp.now(),
        purchaseDate: Timestamp.now(),
        lastUsed: null,
        usageCount: 0,
        modificationCount: 0,
        maxModifications: 5,
        status: 'active'
      };

      await addDoc(collection(db, "userEventVerifications"), verificationDocData);

      // 設定驗證碼資料用於顯示
      setVerificationCodeData({
        verificationCode,
        eventId: event.id,
        eventName: event.name,
        userId: user.uid,
        seatPreferenceOrder: seatPreferences || "自動選擇",
        sessionPreference: parseInt(sessionPreference),
        ticketCount: parseInt(ticketCount),
        createdAt: new Date().toISOString()
      });

      // 更新 userVerificationCode 狀態以觸發 UI 更新
      const checkUserPurchaseStatus = async () => {
        try {
          const { getDocs, collection: firestoreCollection, query, where } = await import("firebase/firestore");
          
          const verificationsQuery = query(
            firestoreCollection(db, "userEventVerifications"),
            where("userId", "==", user.uid),
            where("eventId", "==", eventId),
            where("status", "==", "active")
          );
          
          const verificationsSnap = await getDocs(verificationsQuery);
          
          if (!verificationsSnap.empty) {
            const verificationDoc = verificationsSnap.docs[0];
            const verificationData = verificationDoc.data();
            
            setUserVerificationCode({
              verificationCode: verificationData.verificationCode,
              eventId: verificationData.eventId,
              eventName: verificationData.eventName,
              userId: verificationData.userId,
              seatPreferenceOrder: verificationData.seatPreferenceOrder,
              sessionPreference: verificationData.sessionPreference,
              ticketCount: verificationData.ticketCount,
              createdAt: verificationData.createdAt?.toDate?.()?.toISOString() || verificationData.createdAt,
              lastUsed: verificationData.lastUsed?.toDate?.()?.toISOString() || verificationData.lastUsed,
              usageCount: verificationData.usageCount || 0,
              purchaseDate: verificationData.purchaseDate?.toDate?.()?.toISOString() || verificationData.purchaseDate,
              modificationCount: verificationData.modificationCount || 0,
              maxModifications: 5
            });
          }
        } catch (error) {
          console.error("Error refreshing user purchase status:", error);
        }
      };
      
      await checkUserPurchaseStatus();
      
      setShowVerificationResult(true);
      
      toast({ 
        title: "購買成功！", 
        description: `已為 ${event.name} 生成驗證碼。您獲得了 ${pointsAwardedForPurchase} 忠誠度點數。`,
        variant: "default"
      });

    } catch (error) {
      console.error("Error generating verification code:", error);
      toast({ 
        title: "生成驗證碼失敗", 
        description: "請稍後再試", 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingCode(false);
      setShowRedeemDialog(false);
      setShowVerificationDialog(false);
      setPointsToRedeem("");
    }
  };

  // 處理點數兌換
  const handleRedeemPoints = () => {
    if (!event) return;
    
    const points = Number(pointsToRedeem);
    const maxPointsUsable = Math.min(loyaltyPoints || 0, event.price);
    
    if (isNaN(points) || points < 0 || points > maxPointsUsable) {
      toast({ 
        title: "無效的點數", 
        description: `請輸入有效的點數，最多可使用 ${maxPointsUsable} 點`, 
        variant: "destructive" 
      });
      return;
    }
    
    const finalPrice = Math.max(0, event.price - points);
    handleGenerateVerificationCode({
      pointsUsed: points,
      finalPrice: finalPrice,
      paymentMethod: points >= event.price ? 'points' : 'mixed'
    });
  };

  // 處理信用卡付款
  const handleCardPayment = () => {
    if (!event) return;
    
    handleGenerateVerificationCode({
      pointsUsed: 0,
      finalPrice: event.price,
      paymentMethod: 'card'
    });
  };

  // 更新偏好設定
  const handleUpdatePreferences = async () => {
    if (!user || !userVerificationCode) return;
    
    const remainingModifications = (userVerificationCode.maxModifications || 5) - (userVerificationCode.modificationCount || 0);
    if (remainingModifications <= 0) {
      toast({
        title: "無法修改",
        description: "您已達到最大修改次數限制",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPreferences(true);
    
    try {
      const { getDocs, collection: firestoreCollection, query, where, updateDoc: firestoreUpdateDoc, doc: firestoreDoc } = await import("firebase/firestore");
      
      // 找到使用者的驗證碼文件
      const verificationsQuery = query(
        firestoreCollection(db, "userEventVerifications"),
        where("userId", "==", user.uid),
        where("eventId", "==", eventId),
        where("status", "==", "active")
      );
      
      const verificationsSnap = await getDocs(verificationsQuery);
      
      if (!verificationsSnap.empty) {
        const verificationDoc = verificationsSnap.docs[0];
        
        await firestoreUpdateDoc(verificationDoc.ref, {
          seatPreferenceOrder: editSeatPreferences || "自動選擇",
          sessionPreference: parseInt(editSessionPreference),
          ticketCount: parseInt(editTicketCount),
          modificationCount: (userVerificationCode.modificationCount || 0) + 1,
          lastModified: Timestamp.now()
        });
        
        // 更新本地狀態
        setUserVerificationCode({
          ...userVerificationCode,
          seatPreferenceOrder: editSeatPreferences || "自動選擇",
          sessionPreference: parseInt(editSessionPreference),
          ticketCount: parseInt(editTicketCount),
          modificationCount: (userVerificationCode.modificationCount || 0) + 1
        });
        
        setShowEditPreferences(false);
        
        toast({
          title: "偏好設定已更新",
          description: `剩餘修改次數：${remainingModifications - 1}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "更新失敗",
        description: "請稍後再試",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  // 複製驗證碼到剪貼板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "已複製",
        description: "驗證碼已複製到剪貼板",
        variant: "default"
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "複製失敗",
        description: "請手動複製驗證碼",
        variant: "destructive"
      });
    }
  };

  // 處理未登入使用者點擊購買
  const handleUnauthorizedPurchase = () => {
    toast({
      title: "請先登入",
      description: "您需要登入帳號才能購買驗證碼",
      variant: "destructive"
    });
  };

  // 渲染購買按鈕區域
  const renderPurchaseSection = () => {
    if (!statusInfo?.isActionable) {
      return (
        <Button 
          size="lg" 
          className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg bg-gray-700 text-gray-400 cursor-not-allowed" 
          disabled
        >
          <InfoIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          {statusInfo?.text}
        </Button>
      );
    }

    // 情況1：已登入且已購買 - 顯示驗證碼區域
    if (user && userVerificationCode) {
      return (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="text-green-400 font-semibold">您已擁有此活動驗證碼</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-gray-300 text-sm">驗證碼：</Label>
                <div className="flex items-center gap-2 flex-1">
                  <div className="bg-gray-800 p-2 rounded font-mono text-purple-400 font-bold tracking-wider flex-1">
                    {showVerificationCode 
                      ? userVerificationCode.verificationCode 
                      : "••••••••••••"
                    }
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVerificationCode(!showVerificationCode)}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    {showVerificationCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(userVerificationCode.verificationCode)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <span className="block">座位偏好：</span>
                  <span className="text-gray-200">{userVerificationCode.seatPreferenceOrder}</span>
                </div>
                <div>
                  <span className="block">票券數量：</span>
                  <span className="text-gray-200">{userVerificationCode.ticketCount} 張</span>
                </div>
              </div>
            </div>
          </div>
          
          {event.activityUrl && (
            <Button
              onClick={() => window.open(event.activityUrl, '_blank')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              前往售票網站
            </Button>
          )}
        </div>
      );
    }

    // 情況2：已登入但未購買 - 顯示付費解鎖按鈕
    if (user && !userVerificationCode) {
      return (
        <Button 
          size="lg" 
          className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg bg-purple-600 hover:bg-purple-700 text-white" 
          onClick={() => setShowVerificationDialog(true)}
          disabled={isGeneratingCode || loadingUserStatus}
        >
          <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          {isGeneratingCode ? "處理中..." : "付費解鎖驗證碼"}
        </Button>
      );
    }

    // 情況3：未登入 - 顯示付費解鎖但點擊時警告
    return (
      <Button 
        size="lg" 
        className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg bg-purple-600 hover:bg-purple-700 text-white" 
        onClick={handleUnauthorizedPurchase}
      >
        <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
        付費解鎖驗證碼
      </Button>
    );
  };

  if (loadingEvent || authLoading || loadingUserStatus) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-300">Loading event details...</p>
      </div>
    );
  }

  if (!event || !statusInfo) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
          <p className="text-gray-400 mb-6">ID: {eventId || 'Unknown'} not found.</p>
          <Button asChild variant="outline" className="text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const imageUrl = event.imageUrl;
  let isValidDisplayUrl = false;
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('https://firebasestorage.googleapis.com/')) {
    try { 
      new URL(imageUrl); 
      isValidDisplayUrl = true; 
    } catch (e) { 
      console.error('Invalid image URL:', imageUrl, e); 
    }
  }
  
  const calculatedPointsEarned = event?.pointsAwarded || 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 py-6">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6 text-gray-400 hover:text-gray-200" asChild>
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Events</Link>
        </Button>

        <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] mb-8 shadow-2xl rounded-lg overflow-hidden group">
          {isValidDisplayUrl && imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={event.name || "Event image"} 
              layout="fill" 
              objectFit="cover" 
              priority 
              unoptimized={true} 
              className="transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gray-800 flex items-center justify-center">
              <TicketIcon className="h-32 w-32 text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 sm:p-6 md:p-8 flex flex-col justify-end">
            {statusInfo && (
              <Badge className={`text-xs md:text-sm px-3 py-1 self-start mb-2 md:mb-3 shadow-md ${statusInfo.badgeClass}`}>
                {statusInfo.text}
              </Badge>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {event.name}
            </h1>
          </div>
        </div>
        
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
              <div className="flex items-center mb-4">
                <FileTextIcon className="h-6 w-6 mr-3 text-purple-400" />
                <h2 className="text-xl sm:text-2xl font-semibold text-purple-400">Event Description</h2>
              </div>
              <div className="text-sm sm:text-base text-gray-300 whitespace-pre-line leading-relaxed space-y-3">
                <p>{event.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:sticky md:top-6 h-fit">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
              <h3 className="text-xl md:text-2xl font-semibold text-gray-100 mb-6">Event Details</h3>
              <div className="space-y-5">
                {[
                  { 
                    icon: CalendarIcon, 
                    label: "On Sale:", 
                    value: event?.onSaleDate && new Date(event.onSaleDate.seconds * 1000).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) 
                  },
                  { 
                    icon: CalendarIcon, 
                    label: "Ends:", 
                    value: event?.endDate && new Date(event.endDate.seconds * 1000).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) 
                  },
                  { 
                    icon: CalendarIcon, 
                    label: "Ticket Time:", 
                    value: event?.actualTicketTime && new Date(event.actualTicketTime.seconds * 1000).toLocaleString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  },
                  { 
                    icon: MapPinIcon, 
                    label: "Venue:", 
                    value: event?.venue 
                  },
                  (calculatedPointsEarned > 0 && { 
                    icon: StarIcon, 
                    label: "Points Earned:", 
                    value: `${calculatedPointsEarned} points` 
                  })
                ].filter(Boolean).map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <item.icon className={`h-5 w-5 ${item.label === "Points Earned:" ? "text-yellow-500" : "text-gray-400"} mt-0.5`} />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">{item.label}</p>
                      <p className="text-sm sm:text-base font-medium text-gray-200">{item.value}</p>
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-700 pt-5">
                  <div className="flex items-center gap-2 md:gap-3">
                    <DollarSignIcon className="h-7 w-7 md:h-8 md:w-8 text-purple-400" />
                    <span className="text-3xl md:text-4xl font-bold text-purple-400">
                      ${event?.price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <div className="pt-3">
                  {renderPurchaseSection()}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
              <div className="flex items-center mb-3">
                <LightbulbIcon className="h-6 w-6 mr-3 text-yellow-400" />
                <h4 className="text-lg font-semibold text-yellow-400">AI Seat Predictor</h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Want the best chance for this event? Our AI can help predict optimal sections and improve your ticket-buying success rate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 購票偏好設定對話框 */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-100">購票偏好設定</DialogTitle>
            <DialogDescription className="text-gray-400">
              設定您的購票偏好，系統將根據這些設定為您生成專屬的驗證碼
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seatPreferences" className="text-gray-300">座位偏好（用逗號分隔）</Label>
              <Textarea
                id="seatPreferences"
                placeholder="例如：搖滾區, VIP區, 一樓前排"
                value={seatPreferences}
                onChange={(e) => setSeatPreferences(e.target.value)}
                className="bg-gray-800 text-gray-200 border-gray-700 focus:ring-purple-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionPreference" className="text-gray-300">場次偏好</Label>
                <Select value={sessionPreference} onValueChange={setSessionPreference}>
                  <SelectTrigger className="bg-gray-800 text-gray-200 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="1">第一場次</SelectItem>
                    <SelectItem value="2">第二場次</SelectItem>
                    <SelectItem value="3">第三場次</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketCount" className="text-gray-300">票券數量</Label>
                <Select value={ticketCount} onValueChange={setTicketCount}>
                  <SelectTrigger className="bg-gray-800 text-gray-200 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="1">1 張</SelectItem>
                    <SelectItem value="2">2 張</SelectItem>
                    <SelectItem value="3">3 張</SelectItem>
                    <SelectItem value="4">4 張</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVerificationDialog(false)}
              className="text-gray-300 border-gray-700 hover:bg-gray-800"
            >
              取消
            </Button>
            <Button
              onClick={() => setShowRedeemDialog(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              下一步：選擇付款方式
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 點數兌換對話框 */}
      {user && event && (
        <AlertDialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
          <AlertDialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-100">選擇付款方式</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                您有 {loyaltyPoints || 0} 忠誠度點數。票價：${event.price?.toFixed(2) || '0.00'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-3">
                <Label className="text-gray-300">選擇付款方式：</Label>
                
                {/* 純信用卡付款 */}
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="card-only"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="text-purple-600"
                  />
                  <Label htmlFor="card-only" className="text-gray-300">
                    信用卡付款 - ${event?.price?.toFixed(2) || '0.00'}
                  </Label>
                </div>
                
                {/* 混合付款 */}
                {loyaltyPoints > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="mixed"
                        name="payment"
                        checked={paymentMethod === 'mixed'}
                        onChange={() => setPaymentMethod('mixed')}
                        className="text-purple-600"
                      />
                      <Label htmlFor="mixed" className="text-gray-300">
                        點數 + 信用卡
                      </Label>
                    </div>
                    
                    {paymentMethod === 'mixed' && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="points" className="text-gray-300 text-sm">
                          使用點數 (最多 {Math.min(loyaltyPoints || 0, event?.price || 0)} 點)
                        </Label>
                        <Input 
                          id="points" 
                          type="number" 
                          value={pointsToRedeem} 
                          onChange={(e) => setPointsToRedeem(e.target.value)} 
                          className="bg-gray-800 text-gray-200 border-gray-700" 
                          max={Math.min(loyaltyPoints || 0, event?.price || 0)}
                          min="0"
                        />
                        {pointsToRedeem && event && (
                          <div className="text-sm text-gray-400">
                            折抵後金額：${Math.max(0, event.price - Number(pointsToRedeem)).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 純點數付款 */}
                {loyaltyPoints >= (event?.price || 0) && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="points-only"
                      name="payment"
                      checked={paymentMethod === 'points'}
                      onChange={() => {
                        setPaymentMethod('points');
                        setPointsToRedeem((event?.price || 0).toString());
                      }}
                      className="text-purple-600"
                    />
                    <Label htmlFor="points-only" className="text-gray-300">
                      全額點數付款 - {event?.price || 0} 點
                    </Label>
                  </div>
                )}
              </div>
            </div>
            <AlertDialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowRedeemDialog(false)}
                className="text-gray-300 border-gray-700 hover:bg-gray-800"
              >
                取消
              </Button>
              <Button 
                onClick={() => {
                  if (paymentMethod === 'card') {
                    handleCardPayment();
                  } else if (paymentMethod === 'points') {
                    handleGenerateVerificationCode({
                      pointsUsed: event?.price || 0,
                      finalPrice: 0,
                      paymentMethod: 'points'
                    });
                  } else {
                    handleRedeemPoints();
                  }
                }}
                disabled={isGeneratingCode || (paymentMethod === 'mixed' && (!pointsToRedeem || Number(pointsToRedeem) <= 0))}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGeneratingCode ? "處理中..." : "確認付款"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 偏好設定修改對話框 */}
      <Dialog open={showEditPreferences} onOpenChange={setShowEditPreferences}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-100">修改偏好設定</DialogTitle>
            <DialogDescription className="text-gray-400">
              剩餘修改次數：{userVerificationCode ? ((userVerificationCode.maxModifications || 5) - (userVerificationCode.modificationCount || 0)) : 0} 次
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSeatPreferences" className="text-gray-300">座位偏好（用逗號分隔）</Label>
              <Textarea
                id="editSeatPreferences"
                placeholder="例如：搖滾區, VIP區, 一樓前排"
                value={editSeatPreferences}
                onChange={(e) => setEditSeatPreferences(e.target.value)}
                className="bg-gray-800 text-gray-200 border-gray-700"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editSessionPreference" className="text-gray-300">場次偏好</Label>
                <Select value={editSessionPreference} onValueChange={setEditSessionPreference}>
                  <SelectTrigger className="bg-gray-800 text-gray-200 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="1">第一場次</SelectItem>
                    <SelectItem value="2">第二場次</SelectItem>
                    <SelectItem value="3">第三場次</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTicketCount" className="text-gray-300">票券數量</Label>
                <Select value={editTicketCount} onValueChange={setEditTicketCount}>
                  <SelectTrigger className="bg-gray-800 text-gray-200 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="1">1 張</SelectItem>
                    <SelectItem value="2">2 張</SelectItem>
                    <SelectItem value="3">3 張</SelectItem>
                    <SelectItem value="4">4 張</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditPreferences(false)}
              className="text-gray-300 border-gray-700 hover:bg-gray-800"
            >
              取消
            </Button>
            <Button
              onClick={handleUpdatePreferences}
              disabled={isUpdatingPreferences}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isUpdatingPreferences ? "更新中..." : "確認修改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驗證碼結果對話框 */}
      <Dialog open={showVerificationResult} onOpenChange={setShowVerificationResult}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <DialogTitle className="text-gray-100 text-xl">驗證碼生成成功！</DialogTitle>
            </div>
            <DialogDescription className="text-gray-400">
              請保存您的專屬驗證碼，並在搶票軟體中使用
            </DialogDescription>
          </DialogHeader>
          
          {verificationCodeData && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-300 font-semibold">驗證碼</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(verificationCodeData.verificationCode)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    複製
                  </Button>
                </div>
                <div className="bg-gray-700 p-3 rounded font-mono text-lg text-center text-purple-400 font-bold tracking-wider">
                  {verificationCodeData.verificationCode}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">座位偏好</Label>
                  <p className="text-gray-200">{verificationCodeData.seatPreferenceOrder}</p>
                </div>
                <div>
                  <Label className="text-gray-400">票券數量</Label>
                  <p className="text-gray-200">{verificationCodeData.ticketCount} 張</p>
                </div>
              </div>
              
              {event?.activityUrl && (
                <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
                  <Label className="text-blue-400 font-semibold">售票網址</Label>
                  <p className="text-blue-300 text-sm mt-1 break-all">{event.activityUrl}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowVerificationResult(false)}
              className="text-gray-300 border-gray-700 hover:bg-gray-800"
            >
              關閉
            </Button>
            {event?.activityUrl && (
              <Button
                onClick={() => window.open(event.activityUrl, '_blank')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                前往售票網站
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}