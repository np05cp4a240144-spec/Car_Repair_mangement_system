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

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;

        const partsMarkup = normalizedParts.length > 0
            ? normalizedParts
                .map(
                    (item) => `
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${item.name}</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: center; color: #111827;">${item.quantity}</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827;">Rs. ${item.lineTotal.toLocaleString()}</td>
                        </tr>
                    `
                )
                .join('')
            : `
                <tr>
                    <td colspan="3" style="padding: 14px 0; color: #6b7280; text-align: center;">No parts were recorded for this invoice.</td>
                </tr>
            `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Invoice ${invoice.invoiceNumber}</title>
                    <meta charset="UTF-8" />
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 32px;
                            color: #111827;
                            background: #ffffff;
                        }
                        .sheet {
                            max-width: 760px;
                            margin: 0 auto;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 28px;
                        }
                        .brand {
                            font-size: 24px;
                            font-weight: 700;
                            color: #ea580c;
                            margin-bottom: 6px;
                        }
                        .muted {
                            color: #6b7280;
                            font-size: 12px;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                        }
                        .invoice-number {
                            font-size: 18px;
                            font-weight: 700;
                            margin-top: 4px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 18px;
                        }
                        th {
                            text-align: left;
                            font-size: 12px;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                            color: #6b7280;
                            padding-bottom: 10px;
                            border-bottom: 2px solid #d1d5db;
                        }
                        th:nth-child(2), td:nth-child(2) {
                            text-align: center;
                        }
                        th:last-child, td:last-child {
                            text-align: right;
                        }
                        .summary {
                            margin-top: 26px;
                            margin-left: auto;
                            width: 320px;
                        }
                        .summary-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 10px 0;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .summary-row.total {
                            font-size: 20px;
                            font-weight: 700;
                            color: #ea580c;
                            border-bottom: none;
                            padding-top: 16px;
                        }
                        @media print {
                            body {
                                padding: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="sheet">
                        <div class="header">
                            <div>
                                <div class="brand">Auto Assist</div>
                                <div class="muted">Service Invoice</div>
                            </div>
                            <div>
                                <div class="muted">Invoice Number</div>
                                <div class="invoice-number">${invoice.invoiceNumber}</div>
                            </div>
                        </div>

                        <div class="muted">Parts Used</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Part</th>
                                    <th>Qty</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${partsMarkup}
                            </tbody>
                        </table>

                        <div class="summary">
                            <div class="summary-row">
                                <span>Parts Total</span>
                                <strong>Rs. ${partsTotal.toLocaleString()}</strong>
                            </div>
                            <div class="summary-row">
                                <span>Labor Cost</span>
                                <strong>Rs. ${laborCost.toLocaleString()}</strong>
                            </div>
                            ${tax > 0 ? `
                                <div class="summary-row">
                                    <span>Tax</span>
                                    <strong>Rs. ${tax.toLocaleString()}</strong>
                                </div>
                            ` : ''}
                            <div class="summary-row total">
                                <span>Total</span>
                                <span>Rs. ${displayTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

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
                        onClick={handlePrint}
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
