import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, Lightbulb, KeyRound, Settings, Star, Ticket, MonitorPlay, Globe, Download as DownloadIcon } from "lucide-react"; 
import Link from "next/link";
import Head from "next/head";


export default function HowToUsePage() {
  return (
    <>
      <Head>
        <title>如何使用 TixQuic | 拓元搶票助手使用教學</title>
        <meta name="description" content="完整介紹 TixQuic 使用方法：解鎖驗證碼、設定偏好、下載桌面應用程式，一站式教學。" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.tixquic.com/how-to-use" />
      </Head>

      <div className="container mx-auto py-8 space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpenText className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold">如何使用 TixQuic</h1>
        </div>
        <CardDescription className="text-lg">
          歡迎使用 TixQuic！本指南將說明系統的運作原理，以及如何使用本網站與未來推出的桌面應用程式。
        </CardDescription>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              <CardTitle>1. 認識 TixQuic</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>TixQuic 是一套協助你搶票的雙端系統：</p>
            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>
                <strong className="flex items-center gap-1"><Globe className="h-5 w-5 text-accent" />網站端：</strong>你可以在這裡瀏覽活動、取得專屬的 <strong className="text-primary">驗證碼</strong>，並設定搶票偏好（票數、場次、座位順序）。
              </li>
              <li>
                <strong className="flex items-center gap-1"><MonitorPlay className="h-5 w-5 text-accent" />桌面應用程式（開發中）：</strong>你會在此輸入驗證碼，應用程式會根據此驗證碼與偏好設定，自動執行搶票腳本。
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ticket className="h-6 w-6 text-primary" />
              <CardTitle>2. 取得活動驗證碼（網站端）</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>前往 <Link href="/" className="text-primary hover:underline font-medium">首頁</Link>，你會看到活動清單與票價資訊。</p>
            <p>若想獲得驗證碼，請依照以下步驟操作：</p>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>點擊活動卡片或「查看詳情」。</li>
              <li>若活動尚在販售中，點擊「立即解鎖驗證碼」。</li>
              <li>系統將產生你專屬的 16 碼驗證碼，並儲存至你的帳戶。</li>
              <li>目前購買流程為模擬流程（後續將接入金流）。</li>
              <li>取得驗證碼後，可點選「修改偏好設定」來設定票數、場次、座位偏好。</li>
              <li>驗證碼會顯示在頁面上，可複製使用。</li>
            </ol>
            <p className="text-sm text-muted-foreground">注意：你必須先登入才能取得驗證碼與設定偏好。</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg" id="download-app">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DownloadIcon className="h-6 w-6 text-primary" />
              <CardTitle>3. 下載桌面應用程式</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>完成驗證碼與偏好設定後，你將需要安裝 TixQuic 桌面應用程式。</p>
            <p>請前往 <Link href="/download" className="text-primary hover:underline font-medium">下載頁面</Link>，取得桌面版應用程式安裝檔與使用說明。</p>
            <p>在桌面程式中輸入驗證碼後，系統會自動比對活動與偏好設定並執行搶票腳本。</p>
            <p className="text-sm text-muted-foreground">目前桌面應用程式尚在開發中。</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-primary" />
              <CardTitle>4. 設定 OpenAI API 金鑰</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>為使用 TixQuic 的 AI 功能（如自動識別驗證碼、偏好預測等），你需要提供 OpenAI API 金鑰。</p>
            <p>請依照下列步驟設定：</p>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>前往 <a href="https://platform.openai.com/account/api-keys" target="_blank" className="text-primary hover:underline font-medium">OpenAI API 金鑰申請頁面</a>。</li>
              <li>登入或註冊帳號後，點選「+ Create new secret key」。</li>
              <li>複製產生的金鑰（類似於 <code>sk-xxxx</code> 的字串）。</li>
              <li>回到本網站，點選左側選單的 <Link href="/settings" className="text-primary hover:underline font-medium">設定頁面</Link>。</li>
              <li>將 API 金鑰貼上並儲存，即可啟用 AI 功能。</li>
            </ol>
            <p className="text-sm text-muted-foreground">注意：目前金鑰儲存在瀏覽器本地端。未來正式版本會改為安全的後端儲存機制。</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg" id="loyalty-info">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-primary" />
              <CardTitle>5. 忠誠度點數（Loyalty Points）</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>每次成功解鎖驗證碼（模擬購買），你都會獲得一定的點數獎勵！點數可用於未來折抵、活動兌換等功能。</p>
            <p>點數餘額可於登入後，在右上方帳戶資訊處查看。</p>
            <p className="text-sm text-muted-foreground">點數系統目前為概念階段，後續將加入更多使用方式。</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>常見建議</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              <li>請妥善保管你的 OpenAI API 金鑰，避免洩漏。</li>
              <li>管理員請確認新增活動時填寫正確資訊（名稱、價格、圖片、時段）。</li>
              <li>可透過側邊選單瀏覽所有功能頁面。</li>
              <li>可使用右上方的日／夜間模式切換調整介面風格。</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
