// src/app/mall/failed/page.tsx
import { XCircle, RotateCcw } from 'lucide-react'
import { Button }             from '@/components/ui/button'
import Link                    from 'next/link'
import ClientInfo              from './ClientInfo'

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          付款失敗
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          很抱歉，您的付款處理失敗，請重新嘗試。
        </p>

        {/* 只在瀏覽器端執行的子元件 */}
        <ClientInfo />

        <div className="space-y-3">
          <Button asChild className="w-full bg-red-600 hover:bg-red-700">
            <Link href="/mall">
              <RotateCcw className="mr-2 h-4 w-4" />
              重新購買
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">返回首頁</Link>
          </Button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            常見失敗原因：
          </h3>
          <ul className="text-xs text-gray-600 dark:text-gray-300 text-left space-y-1">
            <li>• 信用卡餘額不足</li>
            <li>• 信用卡資料輸入錯誤</li>
            <li>• 銀行系統暫時異常</li>
            <li>• 網路連線中斷</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
