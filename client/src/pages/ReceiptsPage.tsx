import MainLayout from "@/components/layout/MainLayout";
import ReceiptWidget from "@/components/receipts/ReceiptWidget";

export default function ReceiptsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Warehouse Receipts</h1>
        <div className="grid grid-cols-1 gap-6">
          <ReceiptWidget />
        </div>
      </div>
    </MainLayout>
  );
}
