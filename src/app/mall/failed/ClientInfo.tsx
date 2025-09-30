// src/app/mall/failed/ClientInfo.tsx
'use client'

import { useEffect, useState } from 'react'

export default function ClientInfo() {
  const [orderId, setOrderId]   = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setOrderId(params.get('order'))
    setErrorMsg(params.get('error'))
  }, [])

  return (
    <>
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
          <p className="text-red-700 dark:text-red-400 text-sm">
            錯誤原因：{decodeURIComponent(errorMsg)}
          </p>
        </div>
      )}
      {orderId && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          訂單編號：{orderId}
        </p>
      )}
    </>
  )
}
