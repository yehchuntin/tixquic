'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function MallPage() {
  const [loading, setLoading] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const pointPackages = [
    { id: 1, name: '體驗點數包', priceNTD: 30, points: 36, description: '初次體驗，小額嘗試的最佳選擇。' },
    { id: 2, name: '入門點數包', priceNTD: 100, points: 120, description: '適合解鎖一場活動，平價入門。' },
    { id: 3, name: '標準點數包', priceNTD: 230, points: 280, description: 'CP值高，適合小資族群。' },
    { id: 4, name: '基礎點數包', priceNTD: 370, points: 460, description: '中等預算的熱門選擇。' },
    { id: 5, name: '進階點數包', priceNTD: 630, points: 800, description: '一次購足，點數更划算。' },
    { id: 6, name: '高階點數包', priceNTD: 870, points: 1130, description: '高頻使用者的超值選項。' },
    { id: 7, name: '尊榮點數包', priceNTD: 1690, points: 2250, description: '專業用戶、票務重度玩家首選。' },
    { id: 8, name: '終極點數包', priceNTD: 3290, points: 4500, description: '最大化回饋，尊榮尊享。' }
  ];

  const handlePurchase = async (pkg: typeof pointPackages[0]) => {
    if (!user) {
      toast({
        title: "請先登入",
        description: "您需要登入帳號才能購買點數",
        variant: "destructive"
      });
      return;
    }

    setLoading(pkg.id);

    try {
      // 調用 API 創建訂單並獲取綠界支付表單
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.name,
          price: pkg.priceNTD,
          points: pkg.points,
          userId: user.uid
        }),
      });

      if (!response.ok) {
        throw new Error('創建訂單失敗');
      }

      const { paymentForm } = await response.json();

     // 創建隱藏表單並自動提交到綠界
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentForm.action;
    form.style.display = 'none';

    Object.entries(paymentForm.data).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value); // ✅ 強制轉字串
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();


    } catch (error) {
      console.error('購買失敗:', error);
      toast({
        title: "購買失敗",
        description: "請稍後再試",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          點數商城
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          選購點數包以兌換服務或參與活動，買越多越划算！
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pointPackages.map((pkg) => (
          <Card key={pkg.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105 dark:bg-gray-800">
            <CardHeader className="bg-gray-50 dark:bg-gray-700 p-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">{pkg.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow p-6 space-y-4">
              <div className="mb-2">
                <span className="text-4xl font-extrabold text-primary dark:text-primary-400">{pkg.points}</span>
                <span className="ml-1 text-base font-medium text-gray-500 dark:text-gray-400">點</span>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                價格： NT$ {pkg.priceNTD}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow">{pkg.description}</p>
              <Button 
                size="lg" 
                className="w-full mt-auto"
                onClick={() => handlePurchase(pkg)}
                disabled={loading === pkg.id}
              >
                {loading === pkg.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    處理中...
                  </>
                ) : (
                  '立即購買'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}