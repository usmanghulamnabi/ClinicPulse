import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Scan, FileDown, AlertTriangle, Clock, Trash2 } from "lucide-react";
import { MEDICINES, fmtMoney } from "@/lib/demo-data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

export default function Inventory() {
  const [q, setQ] = useState("");
  const [medicines, setMedicines] = useState(MEDICINES);
  const { toast } = useToast();
  const { user } = useAuth();
  const canDelete = user?.role === "admin";

  const list = useMemo(() => medicines.filter(m => {
    if (!q) return true;
    const s = q.toLowerCase();
    return m.name.toLowerCase().includes(s) || m.generic.toLowerCase().includes(s) || m.company.toLowerCase().includes(s) || m.barcode.includes(q);
  }), [medicines, q]);

  const totalValue = medicines.reduce((s, m) => s + m.stock * m.purchasePrice, 0);
  const lowStock = medicines.filter(m => m.stock <= m.lowStockAt).length;
  const expiringSoon = medicines.filter(m => m.expiry - Date.now() < 60 * 86400_000).length;

  const deleteMedicine = (id: number, name: string) => {
    const ok = window.confirm(`Delete medicine "${name}" from inventory? This demo action removes the SKU from the current app session.`);
    if (!ok) return;
    setMedicines(current => current.filter(m => m.id !== id));
    toast({ title: "Medicine deleted", description: `${name} was removed from inventory.` });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        subtitle={`${medicines.length} medicines · ${fmtMoney(totalValue)} total value`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast({ title: "Scanner ready", description: "Point your barcode reader at a medicine." })}>
              <Scan className="h-4 w-4"/> Scan barcode
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"><FileDown className="h-4 w-4"/> Export</Button>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4"/> Add medicine</Button>
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
                const lowStock = m.stock <= m.lowStockAt;
                const expDays = Math.round((m.expiry - Date.now()) / 86400_000);
                const expiringSoon = expDays < 60;
                return (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground">{m.generic} · <span className="font-mono">{m.barcode}</span></div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.company}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <div className="font-mono text-[11.5px]">{m.batchNo}</div>
                      <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${expiringSoon ? "text-amber-600 dark:text-amber-400" : ""}`}>
                        {expiringSoon && <Clock className="h-3 w-3"/>}
                        {new Date(m.expiry).toLocaleDateString()} · {expDays}d
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className={`font-medium num ${lowStock ? "text-rose-600 dark:text-rose-400" : ""}`}>{m.stock}</div>
                      {lowStock && <Badge variant="outline" className="border-rose-500/40 text-rose-600 dark:text-rose-400 text-[9.5px] mt-0.5 gap-0.5"><AlertTriangle className="h-2.5 w-2.5"/> low</Badge>}
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
                          onClick={() => deleteMedicine(m.id, m.name)}
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
      </Card>
    </PageContainer>
  );
}
