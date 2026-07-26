
const DynamicQRCode = ({ value, size = 120, logoUrl }) => {
  return (
    <div className="bg-theme-card dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-theme-border-soft dark:border-slate-700 inline-block">
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
