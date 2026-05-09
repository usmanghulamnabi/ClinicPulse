import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import {
  Plus, Search, FileDown, Receipt, TrendingUp, AlertCircle, Banknote,
  Trash2, CheckCircle2,
} from "lucide-react";
import { fmtMoney, last30Days } from "@/lib/seed-data";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

const METHOD_COLORS: Record<string, string> = {
  Cash: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Card: "bg-primary/15 text-primary",
  JazzCash: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  Easypaisa: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Bank: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};
const METHODS = Object.keys(METHOD_COLORS);

export default function Billing() {
  const { user } = useAuth();
  const { payments, patients, prescriptions, addPayment, updatePayment, deletePayment } = useStore();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fPatientId, setFPatientId] = useState<string>("");
  const [fPrescriptionId, setFPrescriptionId] = useState<string>("");
  const [fAmount, setFAmount] = useState<string>("0");
  const [fMethod, setFMethod] = useState<string>("Cash");
  const [fStatus, setFStatus] = useState<"paid" | "due">("paid");

  const canCreate = !!user && (user.role === "admin" || user.role === "receptionist" || user.role === "pharmacist");
  const canDelete = user?.role === "admin";

  const list = useMemo(() => payments.filter(p => {
    if (!q) return true;
    const pat = patients.find(x => x.id === p.patientId);
    return p.invoiceNo.toLowerCase().includes(q.toLowerCase()) ||
           pat?.fullName.toLowerCase().includes(q.toLowerCase());
  }), [q, payments, patients]);

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const dues = payments.filter(p => p.status === "due").reduce((s, p) => s + p.amount, 0);
  const todayRevenue = last30Days[last30Days.length - 1]?.revenue ?? 0;

  const openDialog = () => {
    setFPatientId(patients[0]?.id ? String(patients[0].id) : "");
    setFPrescriptionId("");
    setFAmount("0");
    setFMethod("Cash");
    setFStatus("paid");
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!fPatientId) {
      toast({ title: "Patient required", variant: "destructive" });
      return;
    }
    const amount = parseFloat(fAmount || "0");
    if (!amount || amount < 0) {
      toast({ title: "Amount required", description: "Enter a positive amount.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await addPayment({
        patientId: parseInt(fPatientId),
        prescriptionId: fPrescriptionId ? parseInt(fPrescriptionId) : null,
        amount,
        method: fMethod,
        status: fStatus,
      });
      toast({ title: "Invoice created" });
      setOpen(false);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save invoice.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await updatePayment(id, { status: "paid" });
      toast({ title: "Invoice marked paid" });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePayment(id);
      toast({ title: "Invoice removed" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const header = ["invoice","patient","method","amount","date","status"];
    const rows = list.map(p => {
      const pat = patients.find(x => x.id === p.patientId);
      return [
        p.invoiceNo,
        pat?.fullName ?? "Unknown",
        p.method,
        String(p.amount),
        new Date(p.createdAt).toISOString().slice(0, 10),
        p.status,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `invoices-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "Export complete", description: `${list.length} invoices exported as CSV.` });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Billing & invoices"
        subtitle="Track invoices, dues, and payment methods across patients."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <FileDown className="h-4 w-4"/> Export
            </Button>
            {canCreate && (
              <Button size="sm" className="gap-1.5" onClick={openDialog}>
                <Plus className="h-4 w-4"/> New invoice
              </Button>
            )}
          </>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
            <DialogDescription>Create a payment record for a patient.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-[12px]">Patient *</Label>
              <Select value={fPatientId} onValueChange={setFPatientId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.fullName} · {p.mrn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px]">Prescription (optional)</Label>
              <Select value={fPrescriptionId} onValueChange={setFPrescriptionId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="No linked prescription" /></SelectTrigger>
                <SelectContent>
                  {prescriptions
                    .filter(rx => !fPatientId || rx.patientId === parseInt(fPatientId))
                    .map(rx => <SelectItem key={rx.id} value={String(rx.id)}>Rx #{rx.id} · {rx.diagnosis}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px]">Amount</Label>
                <Input type="number" min="0" step="0.01" className="mt-1.5" value={fAmount}
                  onChange={e => setFAmount(e.target.value)} />
              </div>
              <div>
                <Label className="text-[12px]">Method</Label>
                <Select value={fMethod} onValueChange={setFMethod}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[12px]">Status</Label>
              <Select value={fStatus} onValueChange={v => setFStatus(v as "paid"|"due")}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : "Create invoice"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Today revenue" value={todayRevenue} format={fmtMoney} icon={Banknote} delta={3.2} accent="primary" />
        <KpiCard label="MTD collected" value={totalPaid} format={fmtMoney} icon={Receipt} delta={5.8} accent="emerald" />
        <KpiCard label="Outstanding dues" value={dues} format={fmtMoney} icon={AlertCircle} delta={-1.4} accent="rose" />
        <KpiCard label="Avg invoice" value={payments.length ? Math.round(totalPaid / payments.length) : 0} format={fmtMoney} icon={TrendingUp} delta={1.1} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-5 lg:col-span-2 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Daily revenue</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Last 30 days</div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last30Days}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" interval={4}/>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoney(v as number)}/>
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Payment methods</div>
          <div className="text-[15px] font-semibold mt-0.5 mb-3">Distribution</div>
          <div className="space-y-2.5">
            {METHODS.map(m => {
              const sum = payments.filter(p => p.method === m && p.status === "paid").reduce((s, p) => s + p.amount, 0);
              const pct = totalPaid > 0 ? sum / totalPaid * 100 : 0;
              return (
                <div key={m}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium">{m}</span>
                    <span className="num text-muted-foreground">{fmtMoney(sum)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-3 mb-4 border-card-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input placeholder="Search by invoice or patient name…" className="pl-8 h-9" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
      </Card>

      <Card className="border-card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40">
              <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="text-left font-medium px-4 py-2.5">Invoice</th>
                <th className="text-left font-medium px-4 py-2.5">Patient</th>
                <th className="text-left font-medium px-4 py-2.5">Method</th>
                <th className="text-right font-medium px-4 py-2.5">Amount</th>
                <th className="text-left font-medium px-4 py-2.5">Date</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-right font-medium px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto opacity-40 mb-2"/>
                  No invoices to display.
                </td></tr>
              ) : list.slice(0, 200).map(p => {
                const pat = patients.find(x => x.id === p.patientId);
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono num">{p.invoiceNo}</td>
                    <td className="px-4 py-2.5">{pat?.fullName ?? "Unknown patient"}</td>
                    <td className="px-4 py-2.5"><span className={`text-[10.5px] uppercase tracking-wider px-1.5 py-0.5 rounded ${METHOD_COLORS[p.method] || "bg-muted"}`}>{p.method}</span></td>
                    <td className="px-4 py-2.5 text-right font-medium num">{fmtMoney(p.amount)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={p.status === "due" ? "border-rose-500/40 text-rose-600 dark:text-rose-400" : "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex gap-1">
                        {canCreate && p.status === "due" && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-emerald-700 dark:text-emerald-400" onClick={() => handleMarkPaid(p.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1"/> Mark paid
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-3.5 w-3.5"/>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
