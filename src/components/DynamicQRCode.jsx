import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const DynamicQRCode = ({ value, size = 120, logoUrl }) => {
  return (
    <div className="bg-white dark:bg-[#1a1a2e] p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 inline-block">
      <QRCodeSVG
        value={value}
        size={size}
        level={"H"} // High error correction for logo
        includeMargin={false}
        imageSettings={logoUrl ? {
          src: logoUrl,
          x: undefined,
          y: undefined,
          height: size * 0.25,
          width: size * 0.25,
          excavate: true, // Cut out a square in the QR code for the logo
        } : undefined}
      />
    </div>
  );
};

export default DynamicQRCode;
