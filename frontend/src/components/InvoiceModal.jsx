import React from 'react';

const InvoiceModal = ({ isOpen, onClose, invoice }) => {
    if (!isOpen || !invoice) return null;

    const invoiceParts = invoice.parts || invoice.appointment?.parts || [];
    const normalizedParts = invoiceParts
        .map((item) => {
            const quantity = Number(item?.quantity || 0);
            const unitPrice = Number(item?.priceAtTime ?? item?.part?.price ?? 0);
            const name = item?.part?.name || item?.name || 'Part';

            return {
                id: item?.id || `${name}-${quantity}-${unitPrice}`,
                name,
                quantity,
                lineTotal: quantity * unitPrice
            };
        })
        .filter((item) => item.quantity > 0);

    const partsTotal = invoice.partsTotal || 0;
    const laborCost = invoice.laborCost || 0;
    const tax = invoice.tax || 0;
    const displayTotal = invoice.totalAmount ?? (partsTotal + laborCost + tax);

    return (
        <div className="fixed inset-0 bg-[#1C1C1A]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-[500px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="text-[12px] font-bold text-[#ABABAB] uppercase tracking-wider mb-1">Invoice Number</div>
                            <div className="text-[14px] font-mono font-bold text-[#1C1C1A]">{invoice.invoiceNumber}</div>
                        </div>
                        <button onClick={onClose} className="text-[24px] text-[#ABABAB] hover:text-[#1C1C1A]">&times;</button>
                    </div>

                    <div className="space-y-6 mb-10">
                        {normalizedParts.length > 0 && (
                            <div className="pb-4 border-b border-[#F2F0EB]">
                                <div className="text-[14px] text-[#6B6B67] mb-3">Parts Used</div>
                                <div className="space-y-2">
                                    {normalizedParts.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start gap-4">
                                            <span className="text-[13px] text-[#1C1C1A]">{item.name} x{item.quantity}</span>
                                            <span className="text-[13px] font-semibold text-[#1C1C1A] whitespace-nowrap">Rs. {item.lineTotal.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-end pb-4 border-b border-[#F2F0EB]">
                            <span className="text-[14px] text-[#6B6B67]">Parts Total</span>
                            <span className="text-[16px] font-bold text-[#1C1C1A]">Rs. {partsTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-end pb-4 border-b border-[#F2F0EB]">
                            <span className="text-[14px] text-[#6B6B67]">Labor Cost</span>
                            <span className="text-[16px] font-bold text-[#1C1C1A]">Rs. {laborCost.toLocaleString()}</span>
                        </div>
                        {tax > 0 && (
                            <div className="flex justify-between items-end pb-4 border-b border-[#F2F0EB]">
                                <span className="text-[14px] text-[#6B6B67]">Tax</span>
                                <span className="text-[16px] font-bold text-[#1C1C1A]">Rs. {tax.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end pt-2">
                            <span className="text-[16px] font-bold text-[#1C1C1A]">Total Balance</span>
                            <span className="text-[24px] font-extrabold text-[#E8470A]">Rs. {displayTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="w-full bg-[#18160F] text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-black/10"
                    >
                        🖨️ Download / Print
                    </button>
                    <p className="text-center text-[11px] text-[#ABABAB] mt-6">Thank you for choosing Auto Assist. Drive safe!</p>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
