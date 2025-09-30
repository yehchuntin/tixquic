import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

// 驗證綠界回傳的檢查碼
function verifyCheckMacValue(params: Record<string, any>) {
  const { CheckMacValue, ...paymentParams } = params;
  
  const sortedKeys = Object.keys(paymentParams).sort();
  let queryString = sortedKeys
    .map(key => `${key}=${paymentParams[key]}`)
    .join('&');
  
  queryString = `HashKey=${process.env.ECPAY_HASH_KEY || '5294y06JbISpM5x9'}&${queryString}&HashIV=${process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS'}`;
  queryString = encodeURIComponent(queryString).toLowerCase();
  
  const calculatedCheckMacValue = crypto.createHash('sha256').update(queryString).digest('hex').toUpperCase();
  
  return calculatedCheckMacValue === CheckMacValue;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    console.log('付款返回參數:', params);

    const { MerchantTradeNo, RtnCode, RtnMsg } = params;

    // 驗證檢查碼（可選，有些情況綠界不會送檢查碼到ReturnURL）
    // 這裡主要用於用戶體驗，實際驗證在NotifyURL完成
    
    // 查詢訂單狀態
    let orderStatus = 'unknown';
    try {
      const orderDoc = await adminDb.collection('orders').doc(MerchantTradeNo).get();
      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        orderStatus = orderData?.status || 'unknown';
      }
    } catch (error) {
      console.error('查詢訂單狀態失敗:', error);
    }

    // 根據返回結果決定跳轉頁面
    let redirectUrl: string;
    
    if (RtnCode === '1' || orderStatus === 'completed') {
      // 付款成功
      redirectUrl = `/mall/success?order=${MerchantTradeNo}`;
    } else {
      // 付款失敗
      const errorMsg = RtnMsg ? encodeURIComponent(RtnMsg) : '';
      redirectUrl = `/mall/failed?order=${MerchantTradeNo}&error=${errorMsg}`;
    }

    console.log(`訂單 ${MerchantTradeNo} 跳轉到: ${redirectUrl}`);

    return NextResponse.redirect(new URL(redirectUrl, request.url));

  } catch (error) {
    console.error('處理付款返回失敗:', error);
    return NextResponse.redirect(new URL('/mall/failed?error=系統錯誤', request.url));
  }
}