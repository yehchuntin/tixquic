// types/next.d.ts - 在你的專案根目錄建立這個檔案
import { NextRequest, NextResponse } from 'next/server';

// 為了 Next.js 15 相容性，定義全域類型
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// 如果你有其他動態路由頁面，也需要類似的修復
export interface DynamicPageProps {
  params: Promise<{ [key: string]: string | string[] }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// API 路由的類型定義
export interface ApiRouteProps {
  params: Promise<{ [key: string]: string | string[] }>;
}

export {};