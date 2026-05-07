import { useMemo, useState, useRef } from "react";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Scan, FileDown, AlertTriangle, Clock, Trash2, Loader2, Package } from "lucide-react";
import { fmtMoney } from "@/lib/seed-data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/lib/store";

export default function Inventory() {
  const [q, setQ] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { medicines, deleteMedicine, addMedicine, loading } = useStore();
  const canDelete = user?.role === "admin";

  /* form refs */
  const nameRef = useRef<HTMLInputElement>(null);
  const genericRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const buyRef = useRef<HTMLInputElement>(null);
  const sellRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => medicines.filter(m => {
    if (!q) return true;
    const s = q.toLowerCase();
    return m.name.toLowerCase().includes(s) || m.generic.toLowerCase().includes(s) || m.company.toLowerCase().includes(s) || m.barcode.includes(q);
  }), [medicines, q]);

  const totalValue = medicines.reduce((s, m) => s + m.stock * m.purchasePrice, 0);
  const lowStock = medicines.filter(m => m.stock <= m.lowStockAt).length;
  const expiringSoon = medicines.filter(m => m.expiry - Date.now() < 60 * 86400_000).length;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMedicine(deleteTarget.id);
      toast({ title: "Medicine deleted", description: `${deleteTarget.name} was removed from inventory.` });
    } catch {
      toast({ title: "Delete failed", description: "Could not remove medicine. Please try again.", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const handleAdd = async () => {
    const name = nameRef.current?.value.trim() ?? "";
    const generic = genericRef.current?.value.trim() ?? "";
    const company = companyRef.current?.value.trim() ?? "";
    const stock = parseInt(stockRef.current?.value ?? "0") || 0;
    const purchasePrice = parseFloat(buyRef.current?.value ?? "0") || 0;
    const sellingPrice = parseFloat(sellRef.current?.value ?? "0") || 0;
    const batchNo = batchRef.current?.value.trim() || `B${Date.now().toString().slice(-4)}`;
    if (!name || !generic) {
      toast({ title: "Missing fields", description: "Name and generic name are required.", variant: "destructive" });
      return;
    }
    try {
      const m = await addMedicine({
        name, generic, company, unit: "tab",
        purchasePrice, sellingPrice, stock, lowStockAt: 25,
        batchNo, expiry: Date.now() + 365 * 86400_000,
        barcode: `849${Date.now().toString().slice(-9)}`,
        sold30d: 0,
      });
      toast({ title: "Medicine added", description: `${m.name} added to inventory.` });
      setAddOpen(false);
    } catch {
      toast({ title: "Save failed", description: "Could not add medicine. Please try again.", variant: "destructive" });
    }
  };

  return (
    <PageContainer>
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete medicine?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong> from the inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="Inventory"
        subtitle={`${medicines.length} medicines · ${fmtMoney(totalValue)} total value`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Scanner ready", description: "Point your barcode reader at a medicine." })}>
              <Scan className="h-4 w-4"/> Scan barcode
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"><FileDown className="h-4 w-4"/> Export</Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4"/> Add medicine</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Add medicine to inventory</DialogTitle>
                  <DialogDescription>Enter medicine details to add a new SKU.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-[12px]">Brand name *</Label><Input className="mt-1" placeholder="Augmentin 625mg" ref={nameRef} /></div>
                    <div><Label className="text-[12px]">Generic name *</Label><Input className="mt-1" placeholder="Amoxicillin/Clavulanate" ref={genericRef} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-[12px]">Company</Label><Input className="mt-1" placeholder="GSK" ref={companyRef} /></div>
                    <div><Label className="text-[12px]">Initial stock</Label><Input className="mt-1" type="number" placeholder="100" ref={stockRef} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-[12px]">Buy price (₨)</Label><Input className="mt-1" type="number" placeholder="18" ref={buyRef} /></div>
                    <div><Label className="text-[12px]">Sell price (₨)</Label><Input className="mt-1" type="number" placeholder="28" ref={sellRef} /></div>
                    <div><Label className="text-[12px]">Batch No.</Label><Input className="mt-1" placeholder="B2450" ref={batchRef} /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd}>Add medicine</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-4 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Total value</div>
          <div className="text-xl font-semibold mt-1 num">{fmtMoney(totalValue)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{medicines.length} SKUs</div>
        </Card>
        <Card className="p-4 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Low stock</div>
          <div className="text-xl font-semibold mt-1 num text-rose-600 dark:text-rose-400">{lowStock}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Needs reorder</div>
        </Card>
        <Card className="p-4 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Expiring &lt; 60d</div>
          <div className="text-xl font-semibold mt-1 num text-amber-600 dark:text-amber-400">{expiringSoon}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Action recommended</div>
        </Card>
        <Card className="p-4 border-card-border">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Avg margin</div>
          <div className="text-xl font-semibold mt-1 num">42%</div>
          <div className="text-[11px] text-muted-foreground mt-1">Across catalog</div>
        </Card>
      </div>

      <Card className="p-3 mb-4 border-card-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input placeholder="Search by name, generic, company, or barcode" className="pl-8 h-9" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
      </Card>

      <Card className="border-card-border overflow-hidden">
        {loading && medicines.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-[13px] text-muted-foreground font-medium">
              {q ? "No medicines match your search" : "Inventory is empty"}
            </p>
            <p className="text-[11.5px] text-muted-foreground/70 mt-1">
              {q ? "Try a different name or barcode." : "Add your first medicine to get started."}
            </p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40">
              <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="text-left font-medium px-4 py-2.5">Medicine</th>
                <th className="text-left font-medium px-4 py-2.5">Company</th>
                <th className="text-left font-medium px-4 py-2.5">Batch · Expiry</th>
                <th className="text-right font-medium px-4 py-2.5">Stock</th>
                <th className="text-right font-medium px-4 py-2.5">Buy</th>
                <th className="text-right font-medium px-4 py-2.5">Sell</th>
                <th className="text-right font-medium px-4 py-2.5">Margin</th>
                {canDelete && <th className="text-right font-medium px-4 py-2.5">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {list.map(m => {
                const margin = ((m.sellingPrice - m.purchasePrice) / m.sellingPrice * 100).toFixed(0);
                const isLow = m.stock <= m.lowStockAt;
                const expDays = Math.round((m.expiry - Date.now()) / 86400_000);
                const isExpiring = expDays < 60;
                return (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground">{m.generic} · <span className="font-mono">{m.barcode}</span></div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.company}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <div className="font-mono text-[11.5px]">{m.batchNo}</div>
                      <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${isExpiring ? "text-amber-600 dark:text-amber-400" : ""}`}>
                        {isExpiring && <Clock className="h-3 w-3"/>}
                        {new Date(m.expiry).toLocaleDateString()} · {expDays}d
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className={`font-medium num ${isLow ? "text-rose-600 dark:text-rose-400" : ""}`}>{m.stock}</div>
                      {isLow && <Badge variant="outline" className="border-rose-500/40 text-rose-600 dark:text-rose-400 text-[9.5px] mt-0.5 gap-0.5"><AlertTriangle className="h-2.5 w-2.5"/> low</Badge>}
                    </td>
                    <td className="px-4 py-2.5 text-right num">₨ {m.purchasePrice}</td>
                    <td className="px-4 py-2.5 text-right num">₨ {m.sellingPrice}</td>
                    <td className="px-4 py-2.5 text-right num text-emerald-600 dark:text-emerald-400 font-medium">{margin}%</td>
                    {canDelete && (
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                          onClick={() => setDeleteTarget({ id: m.id, name: m.name })}
                          aria-label={`Delete ${m.name}`}
                          data-testid={`button-delete-medicine-${m.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </PageContainer>
  );
}
