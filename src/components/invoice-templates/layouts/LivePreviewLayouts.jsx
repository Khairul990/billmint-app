import React from 'react';
import { getInvoiceColumns, getItemValue } from '../../../utils/invoiceSchema';
import { formatCurrency } from '../../../utils/invoiceUtils';

const MinimalClassic = ({ data }) => (
  <div className="bg-white p-10 font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto ">
    <div className="flex justify-between items-start mb-12">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
        <p className="text-gray-500 text-sm font-medium">{data.invoiceNumber}</p>
        <p className="text-gray-500 text-sm">{data.date}</p>
      </div>
      <div className="text-right">
        {data.businessSettings?.logoUrl && (
          <img src={data.businessSettings.logoUrl} alt="Logo" className="h-12 object-contain ml-auto mb-2" />
        )}
        <h2 className="text-lg font-bold text-gray-900">{data.businessSettings?.businessName || 'Your Business'}</h2>
        <p className="text-sm text-gray-600">{data.businessSettings?.email}</p>
        <p className="text-sm text-gray-600">{data.businessSettings?.phone}</p>
      </div>
    </div>

    <div className="mb-10">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-2">Billed To</h3>
      <p className="font-bold text-gray-800">{data.customerName}</p>
      {data.customerPhone && <p className="text-sm text-gray-600">{data.customerPhone}</p>}
    </div>

    <table className="w-full text-left mb-8 text-sm">
      <thead>
        <tr className="border-b-2 border-gray-900 text-gray-900">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-3 px-2 font-bold text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-200">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-3 px-2 text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="flex justify-end mb-10">
      <div className="w-64">
        <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Subtotal:</span><span>{formatCurrency(data.totals?.subtotal)}</span></div>
        <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Discount:</span><span>{formatCurrency(data.totals?.discount)}</span></div>
        <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Tax:</span><span>{formatCurrency(data.totals?.tax)}</span></div>
        <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-gray-900 mt-2">
          <span>Total:</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
        </div>
      </div>
    </div>

    <div className="flex justify-between items-end mt-12">
      <div className="w-1/2">
        {data.qrCodeBase64 && (
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Scan to Pay</p>
            <img src={data.qrCodeBase64} alt="QR Code" className="w-24 h-24 border p-1 rounded-lg" />
          </div>
        )}
      </div>
      <div className="w-1/2 text-right">
        {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
          <div className="text-sm text-gray-500 border-t pt-4">
            <p className="font-bold mb-1 text-gray-700">Notes / Terms</p>
            <p>{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const ModernCorporate = ({ data }) => (
  <div className="bg-white font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto ">
    <div className="bg-blue-600 p-10 flex justify-between items-center text-white">
      <div>
        <h1 className="text-3xl font-black tracking-wider uppercase">Invoice</h1>
        <p className="text-blue-200 text-sm mt-1"># {data.invoiceNumber} | {data.date}</p>
      </div>
      {data.businessSettings?.logoUrl ? (
        <img src={data.businessSettings.logoUrl} alt="Logo" className="h-12 bg-white p-1 rounded object-contain" />
      ) : (
        <h2 className="text-xl font-bold">{data.businessSettings?.businessName || 'Your Business'}</h2>
      )}
    </div>

    <div className="p-10">
      <div className="flex justify-between mb-10">
        <div>
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Invoice To</h3>
          <p className="font-bold text-lg">{data.customerName}</p>
          {data.customerPhone && <p className="text-sm text-gray-600 mt-1">{data.customerPhone}</p>}
        </div>
        <div className="text-right">
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Pay To</h3>
          <p className="font-bold">{data.businessSettings?.businessName || 'Your Business'}</p>
          <p className="text-sm text-gray-600">{data.businessSettings?.email}</p>
        </div>
      </div>

      <table className="w-full text-left mb-8 text-sm border-collapse">
        <thead>
        <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-3 px-4 font-bold text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
        <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-100">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-4 text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
      </table>

      <div className="flex justify-end mb-10">
        <div className="w-64 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Discount</span><span className="font-medium">{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-1 text-sm"><span className="text-gray-600">Tax</span><span className="font-medium">{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-3 text-lg font-black text-blue-600 border-t border-gray-200 mt-2">
            <span>Total</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start mt-12">
        <div className="w-1/3">
          {data.qrCodeBase64 && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl inline-block">
              <p className="text-[10px] font-bold text-blue-800 uppercase text-center mb-1">Scan & Pay</p>
              <img src={data.qrCodeBase64} alt="QR Code" className="w-20 h-20 rounded bg-white p-1 shadow-sm" />
            </div>
          )}
        </div>
        <div className="w-2/3 pl-4">
          {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
            <div className="text-sm text-gray-500 border-l-4 border-blue-600 pl-4 bg-blue-50 py-2">
              <p className="font-bold text-blue-800 mb-1">Notes</p>
              <p className="text-blue-900/80">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const TealBoldHeader = ({ data }) => (
  <div className="bg-white font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto  flex">
    <div className="w-1/3 bg-teal-800 p-8 text-white">
      {data.businessSettings?.logoUrl ? (
        <img src={data.businessSettings.logoUrl} alt="Logo" className="h-16 w-16 rounded-xl bg-white p-1 object-contain mb-6" />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-teal-600 flex items-center justify-center font-black text-2xl mb-6">
          {data.businessSettings?.businessName?.charAt(0) || 'B'}
        </div>
      )}
      <h2 className="text-xl font-bold mb-4">{data.businessSettings?.businessName || 'Your Business'}</h2>
      <div className="text-xs text-teal-200 space-y-2 opacity-80">
        <p>{data.businessSettings?.email}</p>
        <p>{data.businessSettings?.phone}</p>
      </div>

      <div className="mt-16">
        <h3 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Billed To</h3>
        <p className="font-bold text-lg leading-tight">{data.customerName}</p>
        <p className="text-xs text-teal-200 mt-2 opacity-80">{data.customerPhone}</p>
      </div>
    </div>
    
    <div className="w-2/3 p-8 bg-gray-50/50">
      <div className="text-right mb-12">
        <h1 className="text-5xl font-black text-teal-900 mb-2 tracking-tighter">INVOICE</h1>
        <p className="text-sm font-bold text-teal-600">No. {data.invoiceNumber}</p>
        <p className="text-xs text-gray-500 font-medium">Date: {data.date}</p>
      </div>

      <table className="w-full text-left text-sm border-collapse">
        <thead>
        <tr className="border-b-2 border-teal-800 text-teal-900">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-3 px-4 font-black text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
        <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-200/60">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-4 text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
      </table>

      <div className="flex justify-end mt-8">
        <div className="w-full max-w-[200px]">
          <div className="flex justify-between py-1.5 text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-800">{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-1.5 text-sm"><span className="text-gray-500">Discount</span><span className="font-medium text-gray-800">{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-1.5 text-sm border-b border-gray-200 pb-3"><span className="text-gray-500">Tax</span><span className="font-medium text-gray-800">{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 text-xl font-black text-teal-900">
            <span>Total</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-12 items-end">
        <div className="w-1/2">
          {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
            <div className="text-xs text-gray-500">
              <p className="font-bold text-gray-800 mb-1 uppercase tracking-wider">Thank You</p>
              <p className="opacity-80">{data.notes}</p>
            </div>
          )}
        </div>
        <div className="w-1/2 text-right">
          {data.qrCodeBase64 && (
            <div className="inline-block border-2 border-teal-100 p-2 rounded-xl bg-white text-center">
              <img src={data.qrCodeBase64} alt="QR Code" className="w-20 h-20" />
              <p className="text-[9px] font-bold text-teal-800 mt-1 uppercase">Scan to Pay</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const SageGreenCurved = ({ data }) => (
  <div className="bg-[#f8faf9] font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto  flex flex-col">
    <div className="bg-[#6b8e7b] text-white p-10 rounded-br-[80px] relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h1 className="text-4xl font-serif mb-2">Invoice</h1>
          <p className="text-sm opacity-90">{data.invoiceNumber}</p>
          <p className="text-sm opacity-90">{data.date}</p>
        </div>
        <div className="text-right">
          {data.businessSettings?.logoUrl ? (
            <img src={data.businessSettings.logoUrl} alt="Logo" className="h-14 object-contain ml-auto mb-2 rounded bg-white/20 p-1" />
          ) : (
            <h2 className="text-xl font-bold">{data.businessSettings?.businessName || 'Your Business'}</h2>
          )}
        </div>
      </div>
    </div>
    
    <div className="p-10 flex-1">
      <div className="flex justify-between mb-12">
        <div className="w-1/2 pr-4">
          <h3 className="text-xs font-bold text-[#6b8e7b] uppercase tracking-wider mb-3">Bill To</h3>
          <p className="font-bold text-lg">{data.customerName}</p>
          <p className="text-sm text-gray-600 mt-1">{data.customerPhone}</p>
        </div>
        <div className="w-1/2 pl-4 border-l border-[#d1dbd5]">
          <h3 className="text-xs font-bold text-[#6b8e7b] uppercase tracking-wider mb-3">From</h3>
          <p className="font-bold">{data.businessSettings?.businessName || 'Your Business'}</p>
          <p className="text-sm text-gray-600">{data.businessSettings?.email}</p>
        </div>
      </div>

      <table className="w-full text-left text-sm mb-10">
        <thead>
        <tr className="border-b-2 border-[#6b8e7b] text-[#3d5a49]">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-3 px-4 font-bold text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
        <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-200">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-4 text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 bg-white p-6 rounded-2xl shadow-sm border border-[#e8efe9]">
          <div className="flex justify-between py-1.5 text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-1.5 text-sm"><span className="text-gray-500">Discount</span><span className="font-medium">{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-1.5 text-sm"><span className="text-gray-500">Tax</span><span className="font-medium">{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 text-xl font-bold text-[#3d5a49] border-t border-gray-100 mt-2">
            <span>Total</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-12">
        <div>
          {data.qrCodeBase64 && (
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-[#e8efe9]">
              <img src={data.qrCodeBase64} alt="QR Code" className="w-16 h-16 rounded-lg" />
              <div>
                <p className="text-xs font-bold text-[#3d5a49] uppercase tracking-wider">Scan to Pay</p>
                <p className="text-[10px] text-gray-500">Use any supported app</p>
              </div>
            </div>
          )}
        </div>
        {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
          <div className="text-sm text-gray-600 max-w-[250px] text-right">
            <p className="font-bold text-[#3d5a49] mb-1">Notes</p>
            <p className="text-xs">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const CreativeAgency = ({ data }) => (
  <div className="bg-[#111111] font-sans text-gray-200 shadow-xl w-[595px] min-h-fit mx-auto ">
    <div className="flex items-stretch">
      <div className="w-12 bg-[#ff4a6e] flex flex-col justify-between items-center py-10">
        <div className="rotate-[-90deg] whitespace-nowrap text-white font-black text-2xl tracking-[0.2em] w-0 -mt-20">INVOICE</div>
      </div>
      
      <div className="flex-1 p-12">
        <div className="flex justify-between items-start mb-16">
          <div>
            {data.businessSettings?.logoUrl ? (
              <img src={data.businessSettings.logoUrl} alt="Logo" className="h-14 object-contain mb-4 bg-white p-1" />
            ) : (
              <h2 className="text-2xl font-black text-white mb-2">{data.businessSettings?.businessName || 'AGENCY'}</h2>
            )}
            <p className="text-xs text-gray-400">{data.businessSettings?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[#ff4a6e] font-bold text-lg mb-1">#{data.invoiceNumber}</p>
            <p className="text-xs text-gray-500">{data.date}</p>
          </div>
        </div>

        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-widest text-[#ff4a6e] font-bold mb-3">Client</p>
          <p className="text-xl font-bold text-white mb-1">{data.customerName}</p>
          <p className="text-sm text-gray-400">{data.customerPhone}</p>
        </div>

        <div className="mb-16">
          <div className="flex text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-4 mb-4 font-bold">
            <div className="flex-1">Task / Item</div>
            <div className="w-16 text-center">Qty</div>
            <div className="w-24 text-right">Price</div>
          </div>
          {data.items?.map((item, i) => (
            <div key={i} className="flex text-sm border-b border-gray-900 py-4 items-center">
              <div className="flex-1 text-gray-300 font-medium">{item.name || 'Item'}</div>
              <div className="w-16 text-center text-gray-500">{item.qty}</div>
              <div className="w-24 text-right text-white font-bold">{formatCurrency(item.qty * item.price)}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <div className="w-64 border border-gray-800 rounded-xl p-6 bg-[#161616]">
            <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-300">{formatCurrency(data.totals?.subtotal)}</span></div>
            <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Discount</span><span className="text-gray-300">{formatCurrency(data.totals?.discount)}</span></div>
            <div className="flex justify-between py-1 text-sm"><span className="text-gray-500">Tax</span><span className="text-gray-300">{formatCurrency(data.totals?.tax)}</span></div>
            <div className="flex justify-between py-4 mt-4 border-t border-gray-800 text-xl font-black text-white">
              <span className="text-[#ff4a6e]">Total</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-16 pt-8 border-t border-gray-900 items-center">
          <div className="w-1/2">
            {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
              <div className="text-xs text-gray-400">
                <p className="font-bold text-[#ff4a6e] mb-1 tracking-widest uppercase">Remarks</p>
                <p>{data.notes}</p>
              </div>
            )}
          </div>
          <div className="w-1/2 text-right flex justify-end">
            {data.qrCodeBase64 && (
              <div className="bg-[#161616] border border-gray-800 p-2 rounded-lg flex flex-col items-center">
                <img src={data.qrCodeBase64} alt="QR Code" className="w-16 h-16 rounded bg-white p-1" />
                <p className="text-[8px] font-bold text-gray-500 mt-2 uppercase tracking-widest">Pay Now</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PurpleCorporate = ({ data }) => (
  <div className="bg-white font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto  p-10 relative">
    <div className="flex items-center justify-between border-b-[3px] border-[#6A5ACD] pb-6 mb-10 relative">
      <div className="absolute -bottom-2.5 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#6A5ACD] to-transparent"></div>
      <div className="w-20 h-20 bg-gradient-to-br from-[#6A5ACD] to-[#7B68EE] rounded-xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
        {data.businessSettings?.logoUrl ? (
          <img src={data.businessSettings.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
        ) : (
          data.businessSettings?.businessName?.charAt(0) || 'B'
        )}
      </div>
      <div className="text-right">
        <h1 className="text-5xl font-black text-[#6A5ACD] tracking-wider">Invoice</h1>
        <p className="text-sm text-[#6A5ACD] mt-1 font-semibold">#{data.invoiceNumber}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-5 mb-8 p-5 bg-gradient-to-br from-[#6A5ACD]/10 to-[#7B68EE]/5 rounded-lg">
      <div>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Invoice Date</h3>
        <p className="text-[13px] text-gray-800 font-medium mb-3">{data.date}</p>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Due Date</h3>
        <p className="text-[13px] text-gray-800 font-medium">{data.date}</p>
      </div>
      <div className="text-right">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Amount Due</h3>
        <p className="text-2xl font-bold text-[#6A5ACD]">{formatCurrency(data.totals?.grandTotal)}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-10 mb-10">
      <div>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">From</h3>
        <div className="text-[13px] text-gray-800 leading-relaxed">
          <strong>{data.businessSettings?.businessName || 'Your Business'}</strong><br />
          {data.businessSettings?.email}<br />
          {data.businessSettings?.phone}
        </div>
      </div>
      <div>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Bill To</h3>
        <div className="text-[13px] text-gray-800 leading-relaxed">
          <strong>{data.customerName}</strong><br />
          {data.customerPhone}
        </div>
      </div>
    </div>

    <table className="w-full text-left mb-8 border-collapse">
      <thead>
        <tr className="bg-gradient-to-br from-[#6A5ACD] to-[#7B68EE] text-white shadow-md">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-4 px-3 text-[11px] font-bold uppercase tracking-wide text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-3 text-[13px] text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="flex justify-between items-end mb-10">
      <div className="w-1/2">
        {data.qrCodeBase64 && (
          <div className="bg-[#6A5ACD]/5 p-3 rounded-xl border border-[#6A5ACD]/20 inline-block text-center">
            <p className="text-[9px] font-bold text-[#6A5ACD] uppercase tracking-widest mb-2">Scan & Pay</p>
            <img src={data.qrCodeBase64} alt="QR Code" className="w-20 h-20 rounded-md bg-white p-1 shadow-sm" />
          </div>
        )}
      </div>
      <div className="w-1/2 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Discount</span><span className="font-medium">{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Tax</span><span className="font-medium">{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 px-5 mt-4 text-[15px] font-bold text-white bg-gradient-to-br from-[#6A5ACD] to-[#7B68EE] rounded-lg shadow-lg">
            <span>TOTAL DUE</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>

    {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
      <div className="mt-8 pt-5 border-t border-gray-200 text-[11px] text-gray-500">
        <strong className="text-gray-700">Terms / Notes:</strong> {data.notes}
      </div>
    )}
  </div>
);

const OrangeGradientModern = ({ data }) => (
  <div className="bg-[#fcfaf8] font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto  p-12">
    <div className="text-center mb-10">
      <div className="inline-block bg-gradient-to-br from-[#FF8C00] to-[#FFA500] text-white px-10 py-4 rounded-full text-4xl font-black shadow-lg tracking-widest uppercase">
        INVOICE
      </div>
    </div>

    <div className="grid grid-cols-2 gap-10 mb-10 text-[13px]">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
        <h3 className="text-[11px] font-bold text-[#FF8C00] uppercase tracking-widest mb-3">From</h3>
        <p className="font-bold text-lg mb-1">{data.businessSettings?.businessName || 'Your Business'}</p>
        <p className="text-gray-600">{data.businessSettings?.email}</p>
        <p className="text-gray-600">{data.businessSettings?.phone}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
        <h3 className="text-[11px] font-bold text-[#FF8C00] uppercase tracking-widest mb-3">Bill To</h3>
        <p className="font-bold text-lg mb-1">{data.customerName}</p>
        <p className="text-gray-600">{data.customerPhone}</p>
      </div>
    </div>

    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-orange-100 mb-10">
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Invoice Number</p>
        <p className="text-lg font-bold text-gray-800">#{data.invoiceNumber}</p>
      </div>
      <div className="w-px h-10 bg-gray-200"></div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Date</p>
        <p className="text-[14px] font-bold text-gray-800">{data.date}</p>
      </div>
      <div className="w-px h-10 bg-gray-200"></div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Amount Due</p>
        <p className="text-[16px] font-black text-[#FF8C00]">{formatCurrency(data.totals?.grandTotal)}</p>
      </div>
    </div>

    <table className="w-full text-left mb-10 border-collapse">
      <thead>
        <tr className="bg-gradient-to-br from-[#FF8C00] to-[#FFA500] text-white shadow-sm">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-4 px-4 text-[11px] font-bold uppercase tracking-wider text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-100 bg-white">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-4 text-[13px] text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="flex justify-between items-start">
      <div className="w-1/2">
        {data.qrCodeBase64 && (
          <div className="inline-flex items-center gap-4 bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
            <img src={data.qrCodeBase64} alt="QR" className="w-16 h-16" />
            <div>
              <p className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-widest mb-1">Scan to Pay</p>
              <p className="text-[9px] text-gray-400 max-w-[100px]">Use any supported payment app</p>
            </div>
          </div>
        )}
        {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
          <div className="mt-6 bg-[#FF8C00]/5 border-l-4 border-[#FF8C00] p-4 rounded-r-lg">
            <p className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-widest mb-1">Notes</p>
            <p className="text-[11px] text-gray-600">{data.notes}</p>
          </div>
        )}
      </div>
      <div className="w-[45%]">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-50"><span className="text-gray-500">Subtotal</span><span className="font-bold">{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-50"><span className="text-gray-500">Discount</span><span className="font-bold">{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-2 text-[13px] mb-4"><span className="text-gray-500">Tax</span><span className="font-bold">{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 px-5 text-lg font-black text-white bg-gradient-to-br from-[#FF8C00] to-[#FFA500] rounded-xl shadow-md">
            <span>Total</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const OrangeGeometricCorner = ({ data }) => (
  <div className="bg-white font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto  p-12 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#FF8C00] to-[#FFA500] [clip-path:polygon(100%_0,0_0,100%_100%)] opacity-95 shadow-lg"></div>
    
    <div className="relative z-10 flex items-center justify-between border-b-[3px] border-[#FF8C00] pb-8 mb-12">
      <div className="flex items-center gap-4">
        {data.businessSettings?.logoUrl ? (
          <img src={data.businessSettings.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
        ) : (
          <div className="text-4xl">📋</div>
        )}
      </div>
      <div className="text-5xl font-bold text-[#FF8C00] tracking-widest text-right">INVOICE</div>
    </div>

    <div className="grid grid-cols-2 gap-8 mb-10">
      <div>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Invoice Number</h3>
        <p className="text-[14px] text-gray-800 mb-4">{data.invoiceNumber}</p>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date</h3>
        <p className="text-[14px] text-gray-800">{data.date}</p>
      </div>
      <div className="text-right">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Amount Due</h3>
        <p className="text-3xl font-bold text-[#FF8C00]">{formatCurrency(data.totals?.grandTotal)}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-10 mb-12">
      <div>
        <h3 className="text-[11px] font-bold text-[#FF8C00] uppercase tracking-widest mb-3 border-b border-[#FF8C00]/20 pb-2">From</h3>
        <div className="text-[13px] text-gray-700 leading-relaxed">
          <strong className="text-gray-900 text-[14px]">{data.businessSettings?.businessName || 'Your Business'}</strong><br />
          {data.businessSettings?.email}<br />
          {data.businessSettings?.phone}
        </div>
      </div>
      <div>
        <h3 className="text-[11px] font-bold text-[#FF8C00] uppercase tracking-widest mb-3 border-b border-[#FF8C00]/20 pb-2">Bill To</h3>
        <div className="text-[13px] text-gray-700 leading-relaxed">
          <strong className="text-gray-900 text-[14px]">{data.customerName}</strong><br />
          {data.customerPhone}
        </div>
      </div>
    </div>

    <table className="w-full text-left mb-10 border-collapse">
      <thead>
        <tr className="border-b-[3px] border-[#FF8C00]">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-3 px-2 text-[12px] font-bold text-[#FF8C00] uppercase tracking-wider text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-100">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-2 text-[13px] text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="flex justify-between items-end mb-16">
      <div className="w-1/2">
        {data.qrCodeBase64 && (
          <div className="text-center inline-block">
            <img src={data.qrCodeBase64} alt="QR Code" className="w-20 h-20 border border-gray-200 p-1 rounded mb-2" />
            <p className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-widest">Scan to Pay</p>
          </div>
        )}
      </div>
      <div className="w-1/2 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Subtotal</span><span>{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Discount</span><span>{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Tax</span><span>{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 px-4 mt-4 text-lg font-bold text-[#FF8C00] bg-gradient-to-r from-[#FF8C00]/10 to-[#FFA500]/5 border-l-4 border-[#FF8C00]">
            <span>TOTAL DUE</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>

    {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
      <div className="pt-5 border-t border-gray-200 text-[11px] text-gray-500">
        <strong className="text-gray-700">Terms:</strong> {data.notes}
      </div>
    )}
  </div>
);

const BlackOrangeBold = ({ data }) => (
  <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] text-white font-sans shadow-xl w-[595px] min-h-fit mx-auto  p-12">
    <div className="flex items-center gap-8 border-b-[3px] border-[#FF8C00] pb-6 mb-10 relative">
      <div className="absolute -bottom-2.5 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF8C00] to-transparent"></div>
      
      {data.businessSettings?.logoUrl ? (
        <div className="w-24 h-24 bg-white rounded-lg p-2 flex items-center justify-center shadow-lg shadow-[#FF8C00]/20">
          <img src={data.businessSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-24 h-24 bg-gradient-to-br from-[#FF8C00] to-[#FFA500] rounded-lg flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-[#FF8C00]/30">
          {data.businessSettings?.businessName?.charAt(0) || 'B'}
        </div>
      )}
      
      <div>
        <h1 className="text-5xl font-black text-[#FF8C00] tracking-widest uppercase">Invoice</h1>
        <p className="text-gray-400 mt-1">{data.invoiceNumber} | {data.date}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-10 mb-10">
      <div>
        <h3 className="text-[11px] font-bold text-[#FF8C00] uppercase tracking-widest mb-3">From</h3>
        <div className="text-[13px] text-gray-300 leading-relaxed">
          <strong className="text-white text-[14px]">{data.businessSettings?.businessName || 'Your Business'}</strong><br />
          {data.businessSettings?.email}<br />
          {data.businessSettings?.phone}
        </div>
      </div>
      <div>
        <h3 className="text-[11px] font-bold text-[#FF8C00] uppercase tracking-widest mb-3">To</h3>
        <div className="text-[13px] text-gray-300 leading-relaxed">
          <strong className="text-white text-[14px]">{data.customerName}</strong><br />
          {data.customerPhone}
        </div>
      </div>
    </div>

    <table className="w-full text-left mb-10 border-collapse">
      <thead>
        <tr className="bg-gradient-to-br from-[#FF8C00] to-[#FFA500] text-white shadow-md shadow-[#FF8C00]/20">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-4 px-4 text-[12px] font-bold uppercase tracking-wider text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-[#333]">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-4 text-[13px] text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="flex justify-between items-end mb-12">
      <div className="w-1/2">
        {data.qrCodeBase64 && (
          <div className="inline-block p-1 bg-white rounded-lg shadow-lg shadow-[#FF8C00]/20">
            <img src={data.qrCodeBase64} alt="QR Code" className="w-20 h-20" />
            <p className="text-[9px] font-bold text-[#FF8C00] uppercase tracking-widest text-center mt-1 pb-1">Scan to Pay</p>
          </div>
        )}
      </div>
      <div className="w-1/2 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 text-[13px] border-b border-[#333]"><span className="text-gray-400">Subtotal</span><span>{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-[#333]"><span className="text-gray-400">Discount</span><span>{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-[#333]"><span className="text-gray-400">Tax</span><span>{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 px-5 mt-4 text-lg font-black text-white bg-gradient-to-br from-[#FF8C00] to-[#FFA500] rounded-md shadow-lg shadow-[#FF8C00]/30">
            <span>TOTAL</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>

    {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
      <div className="pt-5 border-t border-[#333] text-[11px] text-gray-400">
        <strong className="text-[#FF8C00]">Notes:</strong> {data.notes}
      </div>
    )}
  </div>
);

const LuxuryGoldBlack = ({ data }) => (
  <div className="bg-gradient-to-b from-[#1a1a1a] to-[#222] text-white font-serif shadow-xl w-[595px] min-h-fit mx-auto  p-12 relative border-[3px] border-[#D4AF37]/60">
    <div className="absolute top-5 left-5 right-5 bottom-5 border border-[#D4AF37]/30 pointer-events-none"></div>
    <div className="absolute top-[20px] left-[20px] w-10 h-10 border-t-2 border-l-2 border-[#D4AF37] pointer-events-none"></div>
    <div className="absolute top-[20px] right-[20px] w-10 h-10 border-t-2 border-r-2 border-[#D4AF37] pointer-events-none"></div>
    <div className="absolute bottom-[20px] left-[20px] w-10 h-10 border-b-2 border-l-2 border-[#D4AF37] pointer-events-none"></div>
    <div className="absolute bottom-[20px] right-[20px] w-10 h-10 border-b-2 border-r-2 border-[#D4AF37] pointer-events-none"></div>

    <div className="text-center mb-12 pb-8 border-b-2 border-[#D4AF37]/60 relative z-10">
      {data.businessSettings?.logoUrl ? (
        <img src={data.businessSettings.logoUrl} alt="Logo" className="w-24 h-24 mx-auto object-contain bg-white rounded-full p-2 mb-6 shadow-lg shadow-[#D4AF37]/20" />
      ) : (
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#E6C200] rounded-full flex items-center justify-center text-[#1a1a1a] text-4xl font-bold mb-6 shadow-lg shadow-[#D4AF37]/30">
          {data.businessSettings?.businessName?.charAt(0) || 'L'}
        </div>
      )}
      <h1 className="text-5xl font-bold text-[#D4AF37] tracking-[4px] uppercase mb-2">Invoice</h1>
      <p className="text-gray-400 font-sans text-sm tracking-widest uppercase">{data.invoiceNumber} • {data.date}</p>
    </div>

    <div className="grid grid-cols-2 gap-10 mb-10 relative z-10 font-sans">
      <div>
        <h3 className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[2px] mb-3">Prepared For</h3>
        <div className="text-[13px] text-gray-300 leading-relaxed">
          <strong className="text-white text-[15px] font-serif">{data.customerName}</strong><br />
          {data.customerPhone}
        </div>
      </div>
      <div className="text-right">
        <h3 className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[2px] mb-3">Issued By</h3>
        <div className="text-[13px] text-gray-300 leading-relaxed">
          <strong className="text-white text-[15px] font-serif">{data.businessSettings?.businessName || 'Your Business'}</strong><br />
          {data.businessSettings?.email}<br />
          {data.businessSettings?.phone}
        </div>
      </div>
    </div>

    <table className="w-full text-left mb-10 border-collapse font-sans relative z-10">
      <thead>
        <tr className="border-t-2 border-b-2 border-[#D4AF37]/60">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-4 px-2 text-[11px] font-bold text-[#D4AF37] uppercase tracking-[2px] text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-[#333]">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-2 text-[13px] text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="flex justify-between items-end mb-12 relative z-10 font-sans">
      <div className="w-1/2">
        {data.qrCodeBase64 && (
          <div className="text-center inline-block">
            <div className="p-2 border border-[#D4AF37] rounded-sm bg-[#1a1a1a]">
              <img src={data.qrCodeBase64} alt="QR Code" className="w-16 h-16 bg-white p-1" />
            </div>
            <p className="text-[9px] text-[#D4AF37] uppercase tracking-[2px] mt-2">Scan & Pay</p>
          </div>
        )}
      </div>
      <div className="w-1/2 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 text-[13px] border-b border-[#333]"><span className="text-gray-400">Subtotal</span><span>{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-[#333]"><span className="text-gray-400">Discount</span><span>{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-[#333]"><span className="text-gray-400">Tax</span><span>{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 px-5 mt-4 text-lg font-bold text-[#1a1a1a] bg-gradient-to-br from-[#D4AF37] to-[#E6C200] shadow-lg shadow-[#D4AF37]/20 rounded-sm">
            <span>GRAND TOTAL</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>

    {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
      <div className="pt-5 border-t border-[#D4AF37]/30 text-[11px] text-gray-400 font-sans relative z-10 text-center">
        {data.notes}
      </div>
    )}
  </div>
);

const BlackHeaderProfessional = ({ data }) => (
  <div className="bg-white font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto  p-12">
    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] text-white p-10 -mx-12 -mt-12 mb-12 flex gap-8 items-center shadow-lg">
      {data.businessSettings?.logoUrl ? (
        <div className="w-20 h-20 bg-white rounded-lg p-2 flex items-center justify-center shadow-md">
          <img src={data.businessSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-[#1a1a1a] text-3xl font-black shadow-md">
          {data.businessSettings?.businessName?.charAt(0) || 'B'}
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold mb-1">{data.businessSettings?.businessName || 'Your Business'}</h1>
        <p className="text-sm text-gray-400 tracking-wide">{data.businessSettings?.email} | {data.businessSettings?.phone}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-10 mb-10 mt-10">
      <div>
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Bill To</h3>
        <div className="text-[13px] text-gray-700 leading-relaxed">
          <strong className="text-gray-900 text-[14px]">{data.customerName}</strong><br />
          {data.customerPhone}
        </div>
      </div>
      <div className="text-right">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Invoice Details</h3>
        <div className="text-[13px] text-gray-700 leading-relaxed">
          <strong>Invoice #:</strong> {data.invoiceNumber}<br />
          <strong>Date:</strong> {data.date}<br />
        </div>
      </div>
    </div>

    <table className="w-full text-left mb-10 border-collapse">
      <thead>
        <tr className="border-b-[3px] border-dashed border-[#1a1a1a]">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-4 px-2 text-[12px] font-bold text-[#1a1a1a] uppercase tracking-wider text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-100">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-2 text-[13px] text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="flex justify-between items-end mb-12">
      <div className="w-1/2">
        {data.qrCodeBase64 && (
          <div className="text-center inline-block">
            <img src={data.qrCodeBase64} alt="QR Code" className="w-20 h-20 border-2 border-[#1a1a1a] p-1 rounded-md mb-2" />
            <p className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest">Scan to Pay</p>
          </div>
        )}
      </div>
      <div className="w-1/2 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Subtotal</span><span>{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Discount</span><span>{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Tax</span><span>{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 px-4 mt-4 text-lg font-black text-[#1a1a1a] bg-gray-100 border-2 border-[#1a1a1a] rounded-sm shadow-sm">
            <span>TOTAL DUE</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>

    {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
      <div className="p-5 bg-[#1a1a1a]/5 rounded-md border border-gray-200">
        <h3 className="text-[11px] font-bold text-[#1a1a1a] uppercase tracking-widest mb-2">Terms / Notes</h3>
        <p className="text-[12px] text-gray-600 leading-relaxed">{data.notes}</p>
      </div>
    )}
  </div>
);

const BlueRoundedModern = ({ data }) => (
  <div className="bg-gradient-to-br from-[#1e90ff] via-[#4169e1] to-[#1e90ff] font-sans text-white shadow-xl w-[595px] min-h-fit mx-auto  p-12 rounded-[30px] relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08)_0%,transparent_50%)] pointer-events-none"></div>

    <div className="bg-white text-gray-800 p-10 rounded-[24px] shadow-2xl relative z-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-black text-[#1e90ff] tracking-tight">Invoice</h1>
        {data.businessSettings?.logoUrl ? (
          <img src={data.businessSettings.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
        ) : (
          <div className="w-16 h-16 bg-[#1e90ff]/10 rounded-full flex items-center justify-center text-[#1e90ff] font-bold text-2xl">
            {data.businessSettings?.businessName?.charAt(0) || 'B'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</h3>
          <div className="text-[13px] text-gray-600 leading-relaxed">
            <strong className="text-gray-900 text-[15px]">{data.customerName}</strong><br />
            {data.customerPhone}
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Invoice #{data.invoiceNumber}</h3>
          <div className="text-[13px] text-gray-600 leading-relaxed">
            Date: {data.date}<br />
          </div>
        </div>
      </div>

      <table className="w-full text-left mb-10 border-collapse">
        <thead>
        <tr className="bg-gradient-to-r from-[#1e90ff] to-[#4169e1] text-white shadow-md rounded-xl overflow-hidden block w-full table-row-group">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-4 px-4 text-[11px] font-bold uppercase tracking-wider text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
        <tbody className="table-row-group block w-full mt-2">
          {data.items?.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              {data.invoiceColumns?.find(c => c.id === 'description')?.visible !== false && <td className="py-4 px-4 text-[13px] text-gray-800 font-medium">{item.name || 'Item'}</td>}
              {data.invoiceColumns?.find(c => c.id === 'qty')?.visible !== false && <td className="py-4 px-4 text-[13px] text-center text-gray-500">{item.qty}</td>}
              {data.invoiceColumns?.find(c => c.id === 'rate')?.visible !== false && <td className="py-4 px-4 text-[13px] text-right text-gray-500">{formatCurrency(item.price)}</td>}
              {data.invoiceColumns?.find(c => c.id === 'total')?.visible !== false && <td className="py-4 px-4 text-[13px] text-right font-bold text-gray-800">{formatCurrency(item.qty * item.price)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">From</h3>
          <div className="text-[13px] text-gray-600 leading-relaxed">
            <strong className="text-gray-900 text-[14px]">{data.businessSettings?.businessName || 'Your Business'}</strong><br />
            {data.businessSettings?.email}<br />
            {data.businessSettings?.phone}
          </div>
        </div>
        <div className="text-right">
          <div className="flex justify-between py-1.5 text-[13px] border-b border-gray-50"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-800">{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-1.5 text-[13px] border-b border-gray-50"><span className="text-gray-500">Discount</span><span className="font-medium text-gray-800">{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-1.5 text-[13px] mb-4"><span className="text-gray-500">Tax</span><span className="font-medium text-gray-800">{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 px-5 text-lg font-black text-white bg-gradient-to-r from-[#1e90ff] to-[#4169e1] rounded-xl shadow-lg shadow-[#1e90ff]/30">
            <span>TOTAL</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#1e90ff]/5 p-6 rounded-xl border border-[#1e90ff]/10">
        <div className="w-2/3">
          {data.notes ? (
            <div className="text-[12px] text-gray-600 leading-relaxed">
              <strong className="text-[#1e90ff] uppercase text-[10px] tracking-widest block mb-1">Notes</strong>
              {data.notes}
            </div>
          ) : (
            <div className="text-[14px] font-bold text-[#1e90ff]">Thank you for your business!</div>
          )}
        </div>
        <div className="w-1/3 flex justify-end">
          {data.qrCodeBase64 && (
            <div className="text-center">
              <img src={data.qrCodeBase64} alt="QR Code" className="w-16 h-16 rounded-md bg-white p-1 shadow-sm border border-gray-200" />
              <p className="text-[9px] font-bold text-[#1e90ff] uppercase tracking-widest mt-1">Pay Now</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const RedCorporateClean = ({ data }) => (
  <div className="bg-white font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto  p-12">
    <div className="flex gap-6 mb-10 items-start">
      {data.businessSettings?.logoUrl ? (
        <div className="w-20 h-20 bg-gradient-to-br from-[#DC143C] to-[#FF1744] rounded-lg p-2 flex items-center justify-center shadow-lg shadow-[#DC143C]/30 shrink-0">
          <img src={data.businessSettings.logoUrl} alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
        </div>
      ) : (
        <div className="w-20 h-20 bg-gradient-to-br from-[#DC143C] to-[#FF1744] rounded-lg flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-[#DC143C]/30 shrink-0">
          {data.businessSettings?.businessName?.charAt(0) || 'B'}
        </div>
      )}
      <div>
        <h1 className="text-5xl font-black text-[#DC143C] tracking-widest uppercase mb-1">INVOICE</h1>
        <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Invoice #{data.invoiceNumber}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-8 mb-10">
      <div>
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">From</h3>
        <div className="text-[13px] text-gray-700 leading-relaxed mb-6">
          <strong className="text-gray-900 text-[14px]">{data.businessSettings?.businessName || 'Your Business'}</strong><br />
          {data.businessSettings?.email}<br />
          {data.businessSettings?.phone}
        </div>
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Bill To</h3>
        <div className="text-[13px] text-gray-700 leading-relaxed">
          <strong className="text-gray-900 text-[14px]">{data.customerName}</strong><br />
          {data.customerPhone}
        </div>
      </div>
      <div className="text-right">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Invoice Date</h3>
        <p className="text-[14px] text-gray-900 font-medium mb-6">{data.date}</p>
      </div>
    </div>

    <table className="w-full text-left mb-10 border-collapse">
      <thead>
        <tr className="bg-gradient-to-br from-[#DC143C] to-[#FF1744] text-white shadow-md">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-4 px-4 text-[11px] font-bold uppercase tracking-wider text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-100 even:bg-[#DC143C]/5">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-4 text-[13px] text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="flex justify-between items-end mb-10">
      <div className="w-1/2">
        {data.qrCodeBase64 && (
          <div className="text-center inline-block">
            <img src={data.qrCodeBase64} alt="QR Code" className="w-20 h-20 border border-gray-200 p-1 rounded-sm mb-2" />
            <p className="text-[10px] font-bold text-[#DC143C] uppercase tracking-widest">Scan & Pay</p>
          </div>
        )}
      </div>
      <div className="w-1/2 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Subtotal</span><span className="font-medium text-gray-900">{formatCurrency(data.totals?.subtotal)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Discount</span><span className="font-medium text-gray-900">{formatCurrency(data.totals?.discount)}</span></div>
          <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-600">Tax</span><span className="font-medium text-gray-900">{formatCurrency(data.totals?.tax)}</span></div>
          <div className="flex justify-between py-4 px-5 mt-4 text-lg font-black text-white bg-gradient-to-br from-[#DC143C] to-[#FF1744] shadow-lg shadow-[#DC143C]/30 rounded-sm">
            <span>TOTAL DUE</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>

    {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
      <div className="pt-5 border-t border-gray-200 text-[11px] text-gray-500">
        <strong className="text-gray-900">Terms / Notes:</strong> {data.notes}
      </div>
    )}
  </div>
);

const CleanTwoColumnModern = ({ data }) => (
  <div className="bg-white font-sans text-gray-800 shadow-xl w-[595px] min-h-fit mx-auto  p-12">
    <div className="grid grid-cols-2 gap-12 items-start mb-12">
      <div>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">From</h3>
        <div className="text-[13px] text-gray-700 leading-relaxed mb-6">
          <strong className="text-gray-900 text-[14px]">{data.businessSettings?.businessName || 'Your Business'}</strong><br />
          {data.businessSettings?.email}<br />
          {data.businessSettings?.phone}
        </div>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Bill To</h3>
        <div className="text-[13px] text-gray-700 leading-relaxed">
          <strong className="text-gray-900 text-[14px]">{data.customerName}</strong><br />
          {data.customerPhone}
        </div>
      </div>
      <div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm text-right">
          <div className="text-3xl font-black text-gray-900 mb-4">{data.invoiceNumber}</div>
          <div className="text-[13px] text-gray-600 mb-2 font-medium">Issue Date: {data.date}</div>
          {data.businessSettings?.logoUrl ? (
             <img src={data.businessSettings.logoUrl} alt="Logo" className="w-16 h-16 object-contain ml-auto mt-4" />
          ) : (
             <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-2xl font-bold ml-auto mt-4">
               {data.businessSettings?.businessName?.charAt(0) || 'B'}
             </div>
          )}
        </div>
      </div>
    </div>

    <table className="w-full text-left mb-12 border-collapse">
      <thead>
        <tr className="border-b-[3px] border-gray-200">
          {getInvoiceColumns(data, data.businessSettings).map((col, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            return (
              <th key={col.id} className={`py-3 px-2 text-[12px] font-bold text-gray-900 uppercase tracking-wider text-${col.align} ${isFirst ? 'rounded-l-md rounded-tl-xl' : ''} ${isLast ? 'rounded-r-md rounded-tr-xl' : ''}`}>
                {col.label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i} className="border-b border-gray-100">
            {getInvoiceColumns(data, data.businessSettings).map(col => {
              const val = getItemValue(item, col.id, data.billType);
              const displayVal = (col.id === 'amount' || col.id === 'rate' || col.id === 'tax' || col.id === 'discount') && val !== '' ? formatCurrency(val) : val;
              return (
                <td key={col.id} className={`py-4 px-2 text-[13px] text-${col.align} ${(col.id === 'amount' || col.id === 'total') ? 'font-bold' : ''}`}>
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="grid grid-cols-2 gap-10 items-end mb-10">
      <div>
        {data.qrCodeBase64 ? (
          <div className="inline-block text-center border border-gray-200 p-2 rounded-lg bg-gray-50">
            <img src={data.qrCodeBase64} alt="QR Code" className="w-16 h-16 mb-2" />
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Scan & Pay</p>
          </div>
        ) : <div />}
      </div>
      <div className="text-right">
        <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-800">{formatCurrency(data.totals?.subtotal)}</span></div>
        <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-500">Discount</span><span className="font-medium text-gray-800">{formatCurrency(data.totals?.discount)}</span></div>
        <div className="flex justify-between py-2 text-[13px] border-b border-gray-100"><span className="text-gray-500">Tax</span><span className="font-medium text-gray-800">{formatCurrency(data.totals?.tax)}</span></div>
        <div className="flex justify-between py-4 mt-4 text-lg font-black text-gray-900 border-l-4 border-gray-900 pl-4 bg-gray-50">
          <span>AMOUNT DUE</span><span>{formatCurrency(data.totals?.grandTotal)}</span>
        </div>
      </div>
    </div>

    {data.businessSettings?.bankDetails?.bankName && (
      <div className="pt-5 mt-5 border-t border-current/20 text-[11px] opacity-80 flex flex-col gap-1">
        <strong className="opacity-100">Bank Details</strong>
        <span>Bank: {data.businessSettings.bankDetails.bankName}</span>
        <span>A/C No: {data.businessSettings.bankDetails.accountNumber}</span>
        <span>IFSC: {data.businessSettings.bankDetails.ifscCode}</span>
        {data.businessSettings.bankDetails.upiId && <span>UPI ID: {data.businessSettings.bankDetails.upiId}</span>}
      </div>
    )}
    {data.notes && (
      <div className="pt-5 border-t border-gray-200 text-[11px] text-gray-500">
        <strong className="text-gray-700">Terms & Conditions:</strong> {data.notes}
      </div>
    )}
  </div>
);

export const LivePreviewLayouts = {
  'minimal-classic': MinimalClassic,
  'modern-corporate': ModernCorporate,
  'teal-bold-header': TealBoldHeader,
  'sage-green-curved': SageGreenCurved,
  'creative-agency': CreativeAgency,
  'purple-corporate': PurpleCorporate,
  'orange-gradient-modern': OrangeGradientModern,
  'orange-geometric': OrangeGeometricCorner,
  'black-orange-bold': BlackOrangeBold,
  'luxury-gold-black': LuxuryGoldBlack,
  'black-header-professional': BlackHeaderProfessional,
  'blue-rounded-modern': BlueRoundedModern,
  'red-corporate-clean': RedCorporateClean,
  'clean-two-column': CleanTwoColumnModern
};
