// /app/api/payment/notify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

// 驗證綠界回傳的檢查碼
function verifyCheckMacValue(params: Record<string, any>, receivedCheckMacValue: string) {
  const { CheckMacValue, ...paymentParams } = params;
  
  // 按照 key 排序
  const sortedKeys = Object.keys(paymentParams).sort();
  
  // 組成查詢字串
  let queryString = sortedKeys
    .map(key => `${key}=${paymentParams[key]}`)
    .join('&');
  
  // 前後加上 HashKey 和 HashIV
  queryString = `HashKey=${process.env.ECPAY_HASH_KEY}&${queryString}&HashIV=${process.env.ECPAY_HASH_IV}`;
  
  // URL encode
  queryString = encodeURIComponent(queryString).toLowerCase();
  
  // SHA256 加密並轉大寫
  const calculatedCheckMacValue = crypto.createHash('sha256').update(queryString).digest('hex').toUpperCase();
  
  return calculatedCheckMacValue === receivedCheckMacValue;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, any> = {};
    
    // 轉換 FormData 為普通物件
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    console.log('綠界回傳參數:', params);

    // 驗證檢查碼
    if (!verifyCheckMacValue(params, params.CheckMacValue)) {
      console.error('檢查碼驗證失敗');
      return NextResponse.json({ error: '檢查碼驗證失敗' }, { status: 400 });
    }

    const { MerchantTradeNo, RtnCode, TradeAmt, PaymentDate } = params;

    // 查找訂單
    const orderDoc = await adminDb.collection('orders').doc(MerchantTradeNo).get();
    
    if (!orderDoc.exists) {
      console.error('訂單不存在:', MerchantTradeNo);
      return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    }

    const orderData = orderDoc.data();

    // ✅ 檢查 orderData 是否存在
    if (!orderData) {
      console.error('訂單資料為空:', MerchantTradeNo);
      return NextResponse.json({ error: '訂單資料為空' }, { status: 404 });
    }

    // 檢查付款是否成功 (RtnCode = 1 表示成功)
    if (RtnCode === '1') {
      // 更新訂單狀態
      await adminDb.collection('orders').doc(MerchantTradeNo).update({
        status: 'completed',
        paidAt: new Date(),
        paymentDate: PaymentDate,
        tradeAmount: parseInt(TradeAmt)
      });

      // ✅ 檢查 userId 是否存在
      if (!orderData.userId) {
        console.error('訂單中沒有 userId:', MerchantTradeNo);
        return NextResponse.json({ error: '訂單中沒有使用者ID' }, { status: 400 });
      }

      // 更新使用者點數
      const userRef = adminDb.collection('users').doc(orderData.userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // ✅ 檢查 userData 是否存在
        if (!userData) {
          console.error('使用者資料為空:', orderData.userId);
          return NextResponse.json({ error: '使用者資料為空' }, { status: 404 });
        }

        const currentPoints = userData.loyaltyPoints || 0;
        const pointsToAdd = orderData.points || 0;
        const newPoints = currentPoints + pointsToAdd;

        await userRef.update({
          loyaltyPoints: newPoints,
          lastPointsUpdate: new Date()
        });

        // 記錄點數交易
        await adminDb.collection('users').doc(orderData.userId).collection('pointsHistory').add({
          type: 'purchase',
          amount: pointsToAdd,
          orderId: MerchantTradeNo,
          description: `購買${orderData.packageName || '點數包'}`,
          createdAt: new Date(),
          balanceAfter: newPoints
        });

        console.log(`用戶 ${orderData.userId} 點數更新成功: +${pointsToAdd} (總計: ${newPoints})`);
      } else {
        console.error('使用者不存在:', orderData.userId);
        return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
      }

      // 返回成功回應給綠界
      return new NextResponse('1|OK', { status: 200 });
      
    } else {
      // 付款失敗
      await adminDb.collection('orders').doc(MerchantTradeNo).update({
        status: 'failed',
        failReason: params.RtnMsg || '付款失敗'
      });

      return new NextResponse('0|FAIL', { status: 200 });
    }

  } catch (error) {
    console.error('處理付款通知失敗:', error);
    return new NextResponse('0|ERROR', { status: 500 });
  }
}