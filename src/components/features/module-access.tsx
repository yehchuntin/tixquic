
"use client";

import { useState } from "react";
import { MOCK_MODULES, type ModuleItem } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Lock, Unlock, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export function ModuleAccess() {
  const [modules, setModules] = useState<ModuleItem[]>(MOCK_MODULES);
  const [accessKey, setAccessKey] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleActivateModule = (moduleId: string) => {
    // Mock validation: if key is "VALIDKEY", activate.
    // In a real app, this would involve backend validation.
    if (accessKey === "VALIDKEY") {
      setModules(
        modules.map((mod) =>
          mod.id === moduleId ? { ...mod, activated: true } : mod
        )
      );
      toast({
        title: "Module Activated!",
        description: `${modules.find(m => m.id === moduleId)?.name} is now active.`,
      });
      setAccessKey("");
      setSelectedModuleId(null);
    } else {
      toast({
        title: "Activation Failed",
        description: "Invalid access key.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
        <div className="flex items-center gap-3 mb-6">
            <Briefcase className="h-10 w-10 text-primary"/>
            <h1 className="text-3xl font-bold">Module Management</h1>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((moduleItem) => (
          <Card key={moduleItem.id} className={`shadow-lg transition-all ${moduleItem.activated ? 'border-green-500' : 'border-border'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  {moduleItem.activated ? <Unlock className="text-green-500" /> : <Lock className="text-muted-foreground" />} 
                  {moduleItem.name}
                </CardTitle>
                {moduleItem.activated ? (
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3"/> Activated
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <XCircle className="h-3 w-3"/> Inactive
                  </span>
                )}
              </div>
              <CardDescription className="pt-2">{moduleItem.description}</CardDescription>
            </CardHeader>
            {!moduleItem.activated && (
              <>
                <CardContent>
                    <Separator className="my-3"/>
                    <Label htmlFor={`accessKey-${moduleItem.id}`} className="text-sm font-medium">Access Key</Label>
                    <Input
                      id={`accessKey-${moduleItem.id}`}
                      type="text"
                      placeholder="Enter access key"
                      className="mt-1"
                      value={selectedModuleId === moduleItem.id ? accessKey : ""}
                      onChange={(e) => {
                        setAccessKey(e.target.value);
                        setSelectedModuleId(moduleItem.id);
                      }}
                    />
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleActivateModule(moduleItem.id)}
                    disabled={selectedModuleId === moduleItem.id && !accessKey.trim()}
                  >
                    Activate Module
                  </Button>
                </CardFooter>
              </>
            )}
             {moduleItem.activated && (
                <CardContent>
                    <p className="text-sm text-green-600">This module is currently active and enhancing your TicketSwift experience.</p>
                </CardContent>
             )}
          </Card>
        ))}
      </div>
      {modules.length === 0 && (
         <Card className="py-12">
            <CardContent className="text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No modules available at the moment.</p>
                <p>Check back later for new features and enhancements!</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
