import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import Prescriptions from "@/pages/Prescriptions";
import PrescriptionBuilder from "@/pages/PrescriptionBuilder";
import PrescriptionDetail from "@/pages/PrescriptionDetail";
import Appointments from "@/pages/Appointments";
import Inventory from "@/pages/Inventory";
import Billing from "@/pages/Billing";
import Expenses from "@/pages/Expenses";
import Branches from "@/pages/Branches";
import Analytics from "@/pages/Analytics";
import Reports from "@/pages/Reports";
import AIInsights from "@/pages/AIInsights";
import Audit from "@/pages/Audit";
import Settings from "@/pages/Settings";
import PatientPortal from "@/pages/PatientPortal";
import Help from "@/pages/Help";
import NotFound from "@/pages/not-found";

function AuthedRoutes() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/patients" component={Patients} />
        <Route path="/patients/new" component={PatientDetail} />
        <Route path="/patients/:id" component={PatientDetail} />
        <Route path="/prescriptions" component={Prescriptions} />
        <Route path="/prescriptions/new" component={PrescriptionBuilder} />
        <Route path="/prescriptions/:id" component={PrescriptionDetail} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/billing" component={Billing} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/branches" component={Branches} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/reports" component={Reports} />
        <Route path="/ai-insights" component={AIInsights} />
        <Route path="/audit" component={Audit} />
        <Route path="/settings" component={Settings} />
        <Route path="/portal" component={PatientPortal} />
        <Route path="/help" component={Help} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function Gate() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return <AuthedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <Gate />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
