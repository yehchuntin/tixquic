// src/app/mall/success/page.tsx
import { CheckCircle } from 'lucide-react'
import { Button }      from '@/components/ui/button'
import Link            from 'next/link'
import SuccessInfo     from './SuccessInfo'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          付款成功
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          感謝您的購買！
        </p>

        {/* 完全在瀏覽器端解析參數 */}
        <SuccessInfo />

        <div className="space-y-3">
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link href="/mall">查看更多商品</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">返回首頁</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
