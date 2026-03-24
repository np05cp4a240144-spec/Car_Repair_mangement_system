import React from 'react';

const InvoiceModal = ({ isOpen, onClose, invoice }) => {

    if (!isOpen || !invoice) return null;

    const laborCost = invoice.laborCost || 0;
    const discount = invoice.discountAmount ?? 0;
    const vat = invoice.taxAmount ?? invoice.tax ?? 0;
    const partsTotal = invoice.partsTotal || 0;
    const total = invoice.totalAmount ?? (partsTotal + laborCost - discount + vat);
    // Hide modal if total is zero or less
    if (total <= 0) return null;
    const parts = Array.isArray(invoice.parts) ? invoice.parts : [];
    const vehicleName = invoice.vehicleName || '';

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;

        const partsMarkup = parts.length > 0
            ? parts.map((item) => {
                const name = item.part?.name || item.name || item.partName || '-';
                const qty = item.quantity ?? 1;
                const price = item.priceAtTime ?? item.part?.price ?? 0;
                const lineTotal = price * qty;
                return `<tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;">${name}</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:center;color:#111827;">${qty}</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;">Rs. ${lineTotal.toLocaleString()}</td>
                </tr>`;
            }).join('')
            : `<tr><td colspan="3" style="padding:14px 0;color:#6b7280;text-align:center;">No parts were recorded for this invoice.</td></tr>`;

        printWindow.document.write(`<!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <meta charset="UTF-8" />
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 32px; color: #22223b; background: #f8f9fa; }
                .sheet { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); padding: 40px 48px 32px 48px; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .brand { font-size: 32px; font-weight: 900; color: #ea580c; margin-bottom: 4px; letter-spacing: 1px; }
                .muted { color: #6b7280; font-size: 15px; text-transform: uppercase; letter-spacing: 0.08em; }
                .invoice-number { font-size: 22px; font-weight: 700; margin-top: 4px; color: #22223b; }
                .vehicle-badge { display: inline-block; background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 8px; padding: 7px 18px; font-size: 16px; font-weight: 700; color: #ea580c; margin-bottom: 24px; }
                .section-title { font-size: 18px; font-weight: 700; color: #ea580c; margin-top: 32px; margin-bottom: 12px; }
                .summary { margin-top: 32px; margin-left: auto; width: 340px; background: #f6f6f6; border-radius: 10px; padding: 18px 24px 10px 24px; }
                .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 17px; }
                .summary-row.total { font-size: 26px; font-weight: 900; color: #ea580c; border-bottom: none; padding-top: 18px; }
                .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 15px; }
                .signature { margin-top: 40px; display: flex; justify-content: flex-end; }
                .signature-box { border-top: 2px solid #ea580c; width: 180px; text-align: center; color: #ea580c; font-weight: 700; font-size: 18px; padding-top: 8px; }
                @media print { body { padding: 0; background: #fff; } .sheet { box-shadow: none; border-radius: 0; padding: 0; } }
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
                ${vehicleName ? `<div class="vehicle-badge">🚗 ${vehicleName}</div>` : ''}
                <div class="section-title">Parts Used</div>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding-bottom:8px;color:#6b7280;font-size:14px;">Part</th>
                            <th style="text-align:center;padding-bottom:8px;color:#6b7280;font-size:14px;">Qty</th>
                            <th style="text-align:right;padding-bottom:8px;color:#6b7280;font-size:14px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${partsMarkup}</tbody>
                </table>
                <div class="section-title">Summary</div>
                <div class="summary">
                    <div class="summary-row"><span>Labor Cost</span><strong>Rs. ${laborCost.toLocaleString()}</strong></div>
                    <div class="summary-row"><span>Discount</span><strong style="color:#15803d;">- Rs. ${discount.toLocaleString()}</strong></div>
                    <div class="summary-row"><span>VAT</span><strong>Rs. ${vat.toLocaleString()}</strong></div>
                    <div class="summary-row total"><span>Total</span><span>Rs. ${total.toLocaleString()}</span></div>
                </div>
                <div class="signature"><div class="signature-box">Authorized Signature</div></div>
                <div class="footer">
                    Thank you for choosing Auto Assist. For queries, contact us at info@autoassist.com<br/>
                    <span style="font-size:13px;">This is a system-generated invoice.</span>
                </div>
            </div>
        </body>
        </html>`);
        printWindow.print();
    };

    return (
        <div
            style={{
                display: isOpen ? 'flex' : 'none',
                alignItems: 'center', justifyContent: 'center',
                position: 'fixed', top: 0, left: 0,
                width: '100vw', height: '100vh',
                background: 'rgba(0,0,0,0.5)', zIndex: 9999, padding: '16px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff', maxWidth: 480, width: '100%',
                    borderRadius: 20, overflow: 'hidden', position: 'relative',
                    fontFamily: "'Segoe UI', Arial, sans-serif",
                    maxHeight: '90vh', overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    padding: '28px 28px 24px', textAlign: 'center', position: 'relative',
                }}>
                    <button onClick={onClose} style={{
                        position: 'absolute', top: 14, right: 16,
                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                        width: 32, height: 32, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', color: '#fff',
                        fontSize: 18, fontWeight: 700, lineHeight: 1,
                    }}>×</button>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                        Service Invoice
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', wordBreak: 'break-all' }}>
                        #{invoice.invoiceNumber}
                    </div>
                    {/* Vehicle name in header */}
                    {vehicleName && (
                        <div style={{
                            marginTop: 10,
                            display: 'inline-block',
                            background: 'rgba(255,255,255,0.18)',
                            borderRadius: 20,
                            padding: '4px 14px',
                            fontSize: 13,
                            color: '#fff',
                            fontWeight: 600,
                        }}>
                            🚗 {vehicleName}
                        </div>
                    )}
                </div>

                {/* Parts list */}
                <div style={{ padding: '20px 28px 0' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                        Parts Used
                    </div>
                    {parts.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', color: '#9ca3af', fontWeight: 500, paddingBottom: 6 }}>Part</th>
                                    <th style={{ textAlign: 'center', color: '#9ca3af', fontWeight: 500, paddingBottom: 6 }}>Qty</th>
                                    <th style={{ textAlign: 'right', color: '#9ca3af', fontWeight: 500, paddingBottom: 6 }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parts.map((item, i) => {
                                    const name = item.part?.name || item.name || item.partName || '-';
                                    const qty = item.quantity ?? 1;
                                    const price = item.priceAtTime ?? item.part?.price ?? 0;
                                    return (
                                        <tr key={i}>
                                            <td style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', color: '#111827' }}>{name}</td>
                                            <td style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', textAlign: 'center', color: '#374151' }}>{qty}</td>
                                            <td style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', textAlign: 'right', color: '#111827', fontWeight: 600 }}>
                                                Rs. {(price * qty).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>
                            No parts recorded for this invoice.
                        </div>
                    )}
                </div>

                {/* Summary rows */}
                <div style={{ padding: '16px 28px 8px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                        Summary
                    </div>
                    {[
                        { label: 'Labor Cost', value: `Rs. ${laborCost.toLocaleString()}`, color: '#111827' },
                        { label: 'Discount', value: `− Rs. ${discount.toLocaleString()}`, color: '#15803d' },
                        { label: 'VAT', value: `Rs. ${vat.toLocaleString()}`, color: '#111827' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #f3f4f6', fontSize: 15 }}>
                            <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
                            <span style={{ fontWeight: 700, color }}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div style={{
                    margin: '0 28px 20px',
                    background: '#fff7ed', border: '1.5px solid #fed7aa',
                    borderRadius: 12, padding: '14px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#9a3412' }}>Total Amount</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#ea580c' }}>Rs. {total.toLocaleString()}</span>
                </div>

                {/* Print button */}
                <div style={{ padding: '0 28px 24px' }}>
                    <button onClick={handlePrint} style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                        color: '#fff', border: 'none', borderRadius: 12,
                        padding: '14px 0', fontWeight: 800, fontSize: 16,
                        cursor: 'pointer', letterSpacing: '0.03em',
                    }}>
                        🖨️ Download / Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;