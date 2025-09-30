'use client'

import { useEffect, useState } from 'react'

export default function SuccessInfo() {
  const [orderId, setOrderId] = useState<string | null>(null)
  const [amt, setAmt]         = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setOrderId(params.get('order'))
    setAmt(params.get('amt'))
  }, [])

  return (
    <>
      {orderId && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          訂單編號：{orderId}
        </p>
      )}
      {amt && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
          付款金額：{amt} 元
        </p>
      )}
    </>
  )
}
