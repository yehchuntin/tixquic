import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, MonitorPlay, AppWindow, Apple } from "lucide-react";
import Link from "next/link";

export default function DownloadPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Download className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">下載 TixQuic 桌面應用程式</h1>
      </div>
      <CardDescription className="text-lg">
        下載 TixQuic 桌面應用程式，讓您透過本網站取得的驗證碼，自動化搶票流程，提升成功率。
      </CardDescription>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-6 w-6 text-primary" />
            <CardTitle>關於桌面應用程式</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            TixQuic 桌面應用程式是配合本網站運作的重要工具。當您在本網站中為某場活動成功獲得驗證碼後，
            您可以將該驗證碼輸入到桌面應用程式中。
          </p>
          <p>
            應用程式會自動讀取您設定的偏好（票數、場次、座位順序），
            並在開賣瞬間自動執行搶票腳本，幫助您優先完成購票流程。
          </p>
          <p className="font-semibold text-primary">
            桌面應用程式目前尚在開發中，敬請期待！
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>下載連結（即將開放）</CardTitle>
          <CardDescription>
            應用程式釋出後，您將可在此頁面下載對應版本。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="w-full sm:w-auto" disabled>
              <AppWindow className="mr-2 h-5 w-5" /> Windows 版本下載
            </Button>
            <Button size="lg" className="w-full sm:w-auto" disabled>
              <Apple className="mr-2 h-5 w-5" /> macOS 版本下載
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            系統需求與安裝說明將一併提供。
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-secondary/30">
        <CardHeader>
            <CardTitle>掌握最新消息</CardTitle>
        </CardHeader>
        <CardContent>
            <p>
                請持續關注本網站公告，或定期回來查看應用程式釋出進度。
                您也可以參考 <Link href="/how-to-use" className="text-primary hover:underline">使用指南</Link>，瞭解整體流程與操作方式。
            </p>
        </CardContent>
      </Card>
    </div>
  );
}