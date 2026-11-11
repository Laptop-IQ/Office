import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { StockProvider, useStock } from "./store";
import { Loading, LoadError, Shell } from "./ui";
import {
  AlertsPage, ImportPage, LocationFormPage, LocationPage, LocationsPage, LogPage,
  Overview, ProductDetailPage, ProductFormPage, SettingsPage, TransferPage,
} from "./StockPages";
import { DispatchFormPage, DispatchHome, InvoicePage } from "./DispatchPages";

/** Layout route: one provider shared by /Stockmanager/* and /Dispatch/* */
export function StockLayout() {
  return (
    <StockProvider>
      <Outlet />
    </StockProvider>
  );
}

function Gate({ section, children }) {
  const { status, reload } = useStock();
  if (status === "loading") return <Loading section={section} />;
  if (status === "error") return <LoadError onRetry={reload} />;
  return <Shell section={section}>{children}</Shell>;
}

export function StockApp() {
  return (
    <Gate section="stock">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="locations/new" element={<LocationFormPage mode="add" />} />
        <Route path="locations/:locId/edit" element={<LocationFormPage mode="edit" />} />
        <Route path="l/:locId" element={<LocationPage />} />
        <Route path="l/:locId/add" element={<ProductFormPage mode="add" />} />
        <Route path="l/:locId/edit/:pid" element={<ProductFormPage mode="edit" />} />
        <Route path="l/:locId/p/:pid" element={<ProductDetailPage />} />
        <Route path="l/:locId/import" element={<ImportPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="transfer" element={<TransferPage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/Stockmanager" replace />} />
      </Routes>
    </Gate>
  );
}

export function DispatchApp() {
  return (
    <Gate section="dispatch">
      <Routes>
        <Route index element={<DispatchHome />} />
        <Route path="new" element={<DispatchFormPage mode="new" />} />
        <Route path=":id" element={<InvoicePage />} />
        <Route path=":id/edit" element={<DispatchFormPage mode="edit" />} />
        <Route path="*" element={<Navigate to="/Dispatch" replace />} />
      </Routes>
    </Gate>
  );
}
