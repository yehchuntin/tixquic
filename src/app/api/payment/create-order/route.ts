// 修正後的 /app/api/payment/create-order/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

// ✅ 測試環境固定值
const ECPAY_CONFIG = {
  merchantId: '2000132',
  hashKey: '5294y06JbISpM5x9',
  hashIV: 'v77hoKGq4kWxNNIS',
  paymentUrl: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
  // ✅ 暫時用可訪問的網址測試
  returnUrl: 'https://www.google.com',
  notifyUrl: 'https://www.google.com'
};

function generateOrderId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `T${timestamp}${random}`.substring(0, 20);
}

// ✅ 完全按照綠界文件的檢查碼生成方式
function generateCheckMacValue(params: Record<string, any>): string {
  // 1. 移除 CheckMacValue（如果存在）
  const { CheckMacValue, ...filteredParams } = params;
  
  // 2. 按照 A-Z 排序（注意：區分大小寫）
  const sortedKeys = Object.keys(filteredParams).sort();
  
  // 3. 組成查詢字串
  let queryString = sortedKeys
    .map(key => `${key}=${filteredParams[key]}`)
    .join('&');
    
  console.log('🔍 步驟1 - 原始參數排序後:', queryString);
  
  // 4. 前後加上 HashKey 和 HashIV
  queryString = `HashKey=${ECPAY_CONFIG.hashKey}&${queryString}&HashIV=${ECPAY_CONFIG.hashIV}`;
  console.log('🔍 步驟2 - 加上金鑰:', queryString);
  
  // 5. URL encode
  queryString = encodeURIComponent(queryString);
  console.log('🔍 步驟3 - URL encode:', queryString);
  
  // 6. 轉小寫
  queryString = queryString.toLowerCase();
  console.log('🔍 步驟4 - 轉小寫:', queryString);
  
  // 7. SHA256 加密並轉大寫
  const checkMacValue = crypto.createHash('sha256').update(queryString).digest('hex').toUpperCase();
  console.log('🔍 步驟5 - 最終檢查碼:', checkMacValue);
  
  return checkMacValue;
}

export async function POST(request: NextRequest) {
  try {
    const { packageId, packageName, price, points, userId } = await request.json();

    console.log('📝 收到的購買請求:', { packageId, packageName, price, points, userId });

    const orderId = generateOrderId();
    console.log('📝 生成的訂單編號:', orderId);

    // 創建訂單記錄
    await adminDb.collection('orders').doc(orderId).set({
      orderId,
      userId,
      packageId,
      packageName,
      price,
      points,
      status: 'pending',
      createdAt: new Date(),
      paymentMethod: 'ecpay'
    });

    // ✅ 使用真實時間
    const now = new Date();
    const merchantTradeDate = 
      now.getFullYear() + '/' + 
      String(now.getMonth() + 1).padStart(2, '0') + '/' + 
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
      
    console.log('🕐 當前時間:', merchantTradeDate);

    // ✅ 使用最簡化的必要參數，避免可能的問題
    const paymentParams = {
      ChoosePayment: 'ALL',
      EncryptType: 1,
      ItemName: `Package${packageId}`,
      MerchantID: ECPAY_CONFIG.merchantId,
      MerchantTradeDate: merchantTradeDate,
      MerchantTradeNo: orderId,
      PaymentType: 'aio',
      ReturnURL: ECPAY_CONFIG.returnUrl,
      TotalAmount: price,
      TradeDesc: 'test'
    };

    console.log('📝 支付參數:', paymentParams);

    // 生成檢查碼
    const checkMacValue = generateCheckMacValue(paymentParams);

    console.log('✅ 最終要送出的完整參數:', {
      ...paymentParams,
      CheckMacValue: checkMacValue
    });

    return NextResponse.json({
      paymentForm: {
        action: ECPAY_CONFIG.paymentUrl,
        data: {
          ...paymentParams,
          CheckMacValue: checkMacValue
        }
      }
    });

  } catch (error) {
    console.error('❌ 創建訂單失敗:', error);
    return NextResponse.json(
      { error: '創建訂單失敗' },
      { status: 500 }
    );
  }
}

// ✅ 測試函數 - 使用英文參數測試
export async function GET(request: NextRequest) {
  console.log('🧪 開始測試檢查碼生成...');
  
  // 使用英文參數避免編碼問題
  const testParams = {
    ChoosePayment: 'ALL',
    EncryptType: 1,
    ItemName: 'TestPackage',
    MerchantID: '2000132',
    MerchantTradeDate: '2024/12/06 12:00:00',
    MerchantTradeNo: 'TEST20241206001',
    PaymentType: 'aio',
    ReturnURL: 'https://www.google.com',
    TotalAmount: 100,
    TradeDesc: 'test'
  };
  
  console.log('🧪 測試參數:', testParams);
  
  const testCheckMacValue = generateCheckMacValue(testParams);
  
  return NextResponse.json({
    message: '檢查碼測試',
    testParams,
    generatedCheckMacValue: testCheckMacValue,
    logs: '請查看伺服器 console 輸出'
  });
}