import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Shield, MapPin, Monitor, Clock, KeyRound } from "lucide-react";
import { AUDIT_LOG, ACTIVE_SESSIONS, fmtRelative, USERS } from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";

export default function Audit() {
  const { toast } = useToast();
  return (
    <PageContainer>
      <PageHeader
        title="Audit & sessions"
        subtitle="Monitor user activity, active sessions, and login history."
      />

      <Tabs defaultValue="sessions">
        <TabsList className="h-9">
          <TabsTrigger value="sessions" className="text-[12px]">Active sessions</TabsTrigger>
          <TabsTrigger value="audit" className="text-[12px]">Audit log</TabsTrigger>
          <TabsTrigger value="users" className="text-[12px]">Users & RBAC</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4 space-y-2">
          {ACTIVE_SESSIONS.map(s => (
            <Card key={s.id} className="p-4 border-card-border flex items-center gap-4">
              <div className="h-9 w-9 rounded-md bg-primary/10 grid place-items-center"><Monitor className="h-4 w-4 text-primary"/></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[13.5px] font-medium">{s.device}</div>
                  {s.current && <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px]">This device</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground mt-0.5">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3"/>{s.location}</span>
                  <span className="font-mono">{s.ip}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3"/>{fmtRelative(s.lastActiveAt)}</span>
                </div>
              </div>
              {!s.current && <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Session revoked", description: s.device })}><LogOut className="h-3.5 w-3.5"/> Revoke</Button>}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card className="border-card-border overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40">
                <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">When</th>
                  <th className="text-left px-4 py-2.5 font-medium">User</th>
                  <th className="text-left px-4 py-2.5 font-medium">Action</th>
                  <th className="text-left px-4 py-2.5 font-medium">Entity</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map(a => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{fmtRelative(a.at)}</td>
                    <td className="px-4 py-2.5 font-medium">{a.user}</td>
                    <td className="px-4 py-2.5">{a.action}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-[11.5px]">{a.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-2">
          {USERS.map(u => (
            <Card key={u.id} className="p-4 border-card-border flex items-center gap-3">
              <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-[11.5px] font-semibold">{u.initials}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium">{u.fullName}</div>
                <div className="text-[11.5px] text-muted-foreground">{u.email} · <span className="capitalize">{u.role}</span>{u.specialty && ` · ${u.specialty}`}</div>
              </div>
              <Badge variant="outline" className={u.twoFactor ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 text-amber-700 dark:text-amber-300"}>
                <KeyRound className="h-3 w-3 mr-1"/>{u.twoFactor ? "2FA on" : "2FA off"}
              </Badge>
              <Badge variant="outline" className="capitalize">{u.role}</Badge>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
