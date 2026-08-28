import React, { useMemo, useState } from "react";

const INITIAL_INVOICE = {
  companyName: "MAKEMYTRIP (INDIA) PRIVATE LIMITED",

  registeredOffice:
    "19th Floor, Epitome Building No.5, DLF Cybercity, DLF Phase III, Gurgaon, Haryana, 122001",

  addressLines: [
    "19th Floor, Epitome Building No.5,",
    "DLF Cybercity, DLF Phase III,",
    "Gurgaon, Haryana, 122001",
  ],

  bookingId: "NF2AGZRS94485560284",
  invoiceNo: "M06AI26111704220",
  date: "2025-09-26",

  placeOfSupply: "Haryana",
  transactionType: "B2C/REG",
  transactionDetails: "RG",

  pan: "AADCM5146R",
  hsnSac: "998551",
  gstin: "06AADCM5146R1ZZ",
  cin: "U63040HR2000PTC090846",

  serviceDescription: ["Reservation Services For Air", "Transportation"],

  taxPayableRCM: "No",

  customerName: "Rahul Sharma",
  bookedBy: "Priya Sharma",

  flightRoute: "DEL-BLR",
  flightNumber: "IX 1163",

  passengerName: "Rahul Sharma",
  ticketNo: "T9XMPL",
  pnr: "T9XMPL",

  fareCharges: "4500.00",
  serviceFees: "300.00",
  cgst: "27.00",
  sgst: "27.00",

  fareDescription:
    "(including applicable flight taxes collected on behalf of airline & other ancillary charges)",

  taxNotice:
    "Input tax credit of GST charged by the original service provider is available only against the invoice issued by the respective service provider. FlyZone Travels acts only as a facilitator for these services.",

  invalidDocument: "This is not a valid travel document",

  qrVerificationUrl: "https://einvoice1.gst.gov.in/Others/QRCodeVerifyApp",
};

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toFixed(2);
}

function formatInvoiceDate(value) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


/* =========================================================
   EDIT FIELD
========================================================= */

function EditField({ label, value, onChange, type = "text", error }) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-[11px] font-bold text-gray-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "h-9 w-full rounded-md border",
          "bg-white px-2.5 text-[13px] text-gray-900",
          "outline-none transition",
          "focus:border-black focus:ring-2 focus:ring-black/5",
          error ? "border-red-500" : "border-gray-300",
        ].join(" ")}
      />

      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({ label, value, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-[3px] text-[10px] leading-[1.1] text-[#666]">
        {label}
      </div>

      <div className="break-words text-[11px] font-bold leading-[1.18] text-black">
        {children !== undefined ? children : value}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function TaxInvoice() {
  const [invoice, setInvoice] = useState(INITIAL_INVOICE);

  const [errors, setErrors] = useState({});

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  function updateField(field, value) {
    setInvoice((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  /* =======================================================
     TOTAL
  ======================================================= */

  const grandTotal = useMemo(() => {
    const fare = parseFloat(invoice.fareCharges) || 0;

    const service = parseFloat(invoice.serviceFees) || 0;

    const cgst = parseFloat(invoice.cgst) || 0;

    const sgst = parseFloat(invoice.sgst) || 0;

    return fare + service + cgst + sgst;
  }, [invoice.fareCharges, invoice.serviceFees, invoice.cgst, invoice.sgst]);

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateInvoice() {
    const newErrors = {};

    if (!invoice.customerName.trim()) {
      newErrors.customerName = "Customer name is required.";
    }

    if (!invoice.bookedBy.trim()) {
      newErrors.bookedBy = "Booked by is required.";
    }

    if (!invoice.passengerName.trim()) {
      newErrors.passengerName = "Passenger name is required.";
    }

    if (!invoice.pnr.trim()) {
      newErrors.pnr = "PNR is required.";
    }

    if (!invoice.invoiceNo.trim()) {
      newErrors.invoiceNo = "Invoice number is required.";
    }

    if (!invoice.date) {
      newErrors.date = "Date is required.";
    }

    const fare = parseFloat(invoice.fareCharges);

    if (invoice.fareCharges === "" || Number.isNaN(fare) || fare < 0) {
      newErrors.fareCharges = "Enter a valid fare amount.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  /* =======================================================
     PRINT
  ======================================================= */

function handlePrint() {
  if (!validateInvoice()) return;

  const originalTitle = document.title;

  // PDF / Print filename
  document.title = `Air Ticket - ${invoice.invoiceNo}`;

  window.print();

  // Print dialog close hone ke baad original title restore
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}


  /* =======================================================
     RESET
  ======================================================= */

  function handleReset() {
    setInvoice({
      ...INITIAL_INVOICE,
    });

    setErrors({});
  }

  return (
    <>
      {/* ===================================================
          PRINT ONLY CSS
      =================================================== */}

      <style>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body,
          #root {
            width: 210mm !important;
            min-width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .invoice-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#e9e9e9] p-6 print:bg-white print:p-0">
        {/* =================================================
            EDITOR
        ================================================= */}

        <section className="no-print mx-auto mb-4 w-full max-w-[210mm] rounded-lg border border-gray-200 bg-white p-[18px] shadow-sm">
          <h2 className="m-0 text-[19px] font-bold text-black">Edit Tax Invoice</h2>

          <p className="mb-[18px] mt-[5px] text-[12px] text-gray-500">
            Update the fields below. Changes will immediately appear in the
            invoice preview.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <EditField
              label="Customer Name"
              value={invoice.customerName}
              error={errors.customerName}
              onChange={(value) => {
                setInvoice((current) => ({
                  ...current,
                  customerName: value,
                  passengerName: value,
                }));

                setErrors((current) => {
                  const next = { ...current };
                  delete next.customerName;
                  delete next.passengerName;
                  return next;
                });
              }}
            />
            <EditField
              label="Booked By"
              value={invoice.bookedBy}
              error={errors.bookedBy}
              onChange={(value) => updateField("bookedBy", value)}
            />
            <EditField
              label="PNR"
              value={invoice.pnr}
              error={errors.pnr}
              onChange={(value) => updateField("pnr", value.toUpperCase())}
            />
            <EditField
              label="Fare Charges"
              type="number"
              value={invoice.fareCharges}
              error={errors.fareCharges}
              onChange={(value) => updateField("fareCharges", value)}
            />
            <EditField
              label="Date"
              type="date"
              value={invoice.date}
              error={errors.date}
              onChange={(value) => updateField("date", value)}
            />
            <EditField
              label="Invoice No."
              value={invoice.invoiceNo}
              error={errors.invoiceNo}
              onChange={(value) =>
                updateField("invoiceNo", value.toUpperCase())
              }
            />
            <EditField
              label="Booking ID"
              value={invoice.bookingId}
              onChange={(value) =>
                updateField("bookingId", value.toUpperCase())
              }
            />
            <EditField
              label="Flight Route"
              value={invoice.flightRoute}
              onChange={(value) => updateField("flightRoute", value)}
            />
          </div>

          <div className="mt-[18px] flex items-center justify-between gap-4 border-t border-gray-100 pt-[15px] max-sm:flex-col max-sm:items-stretch">
            <div className="text-[13px] text-gray-600">
              Grand Total:{" "}
              <strong className="text-black">
                ₹{formatCurrency(grandTotal)}
              </strong>
            </div>

            <div className="flex gap-2 max-sm:w-full">
              <button
                type="button"
                onClick={handleReset}
                className="h-[38px] rounded-md border border-gray-300 bg-white px-[17px] text-[12px] font-bold text-gray-800 hover:bg-gray-50 max-sm:flex-1"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="h-[38px] rounded-md border border-black bg-black px-[17px] text-[12px] font-bold text-white hover:bg-gray-800 max-sm:flex-1"
              >
                Print Tax Invoice
              </button>
            </div>
          </div>
        </section>

        {/* =================================================
            A4 INVOICE
        ================================================= */}

        <main className="invoice-page relative mx-auto h-[297mm] min-h-[297mm] w-[210mm] overflow-hidden bg-white px-[11mm] pb-[18mm] pt-[10mm] shadow-[0_2px_12px_rgba(0,0,0,0.12)] print:shadow-none">
          <section className="grid grid-cols-[1fr_1fr_1.15fr] items-start gap-x-[86px]">
            {/* LEFT */}
            <div>
              <h1 className="m-0 mt-3 text-[25px] text-black font-bold leading-none tracking-[-0.6px]">
                TAX INVOICE
              </h1>
            </div>

            {/* CENTER — MakeMyTrip Logo */}
            <div className="flex h-[55px] items-center justify-center">
              <img
                src="/makemytrip-logo.png"
                alt="MakeMyTrip"
                className="block h-[651px] w-auto object-contain"
              />
            </div>

            {/* RIGHT */}
            <div className="min-w-0">
              <div className="text-[10px] leading-[1.15] text-[#444]">
                {invoice.companyName}
              </div>

              <div className="text-[11.5px] font-bold leading-[1.2] text-black">
                {invoice.addressLines.map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < invoice.addressLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-[18px] grid grid-cols-[1fr_1fr_1fr] gap-x-[98px]">
            {/* COLUMN 1 */}
            <div className="flex flex-col gap-[14px]">
              <InfoItem label="Booking ID" value={invoice.bookingId} />

              <InfoItem label="Invoice No." value={invoice.invoiceNo} />

              <InfoItem label="Date" value={formatInvoiceDate(invoice.date)} />

              <InfoItem label="Place of Supply" value={invoice.placeOfSupply} />

              <InfoItem
                label="Transactional Type/Category"
                value={invoice.transactionType}
              />

              <InfoItem
                label="Transactional Details"
                value={invoice.transactionDetails}
              />
            </div>
            {/* COLUMN 2 */}
            <div className="flex flex-col gap-[14px]">
              <InfoItem label="PAN" value={invoice.pan} />

              <InfoItem label="HSN/SAC" value={invoice.hsnSac} />

              <InfoItem label="GSTIN" value={invoice.gstin} />

              <InfoItem label="CIN" value={invoice.cin} />

              <InfoItem label="Service Description">
                <div>
                  {invoice.serviceDescription.map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < invoice.serviceDescription.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </InfoItem>

              <InfoItem
                label="Tax Payable under RCM"
                value={invoice.taxPayableRCM}
              />
            </div>
            {/* COLUMN 3
                QR STARTS EXACTLY WITH BOOKING ID/PAN
            */}
            <div className="flex items-start justify-center pt-[31px]">
              <div className="flex h-[180px] w-[180px] items-center justify-center">
                <img
                  src="/qrcode.png"
                  alt="Invoice QR Code"
                  className="block h-[180px] w-[180px] object-contain"
                />
              </div>
            </div>
          </section>

          {/* =================================================
              CUSTOMER
          ================================================= */}

          <section className="mt-[18px] grid grid-cols-2 border-y-2 border-dotted border-[#100101] py-[9px]">
            <div className="pr-5">
              <div className="mb-[3px] text-[10px] text-[#777]">
                Customer Name
              </div>

              <div className="break-words text-[11px] mb-2 font-bold leading-[1.2] text-black">
                {invoice.customerName}
              </div>
            </div>

            <div className="pl-5">
              <div className="mb-[3px] text-[10px] text-[#666]">Booked By</div>

              <div className="break-words text-[11px] font-bold leading-[1.2] text-black">
                {invoice.bookedBy}
              </div>
            </div>
          </section>

          {/* =================================================
              FLIGHT
          ================================================= */}

          <section className="mt-[12px] overflow-hidden rounded-[9px] border-2 border-[#222]">
            <div className="flex min-h-[25px] items-center justify-between gap-4 border-b-2 border-[#222] px-[12px] py-[4px] text-[10.5px] font-bold">
              <span className="break-words text-[11px] font-bold leading-[1.2] text-black">
                {invoice.flightRoute} ({formatInvoiceDate(invoice.date)})
              </span>
              <span className="mb-[4px] text-[10px] text-[#777]">
                {invoice.flightNumber}
              </span>
            </div>

            <div className="grid grid-cols-[1.3fr_1fr_1fr]">
              <div className="min-w-0 px-[9px] py-[7px]">
                <div className="mb-[4px] text-[10px] text-[#777]">
                  Passenger Name(s)
                </div>

                <div className="break-words text-[11px] font-bold leading-[1.2] text-black">
                  {invoice.passengerName}
                </div>
              </div>

              <div className="min-w-0 px-[9px] py-[7px]">
                <div className="mb-[4px] text-[10px] text-[#777]">
                  Ticket No.
                </div>

                <div className="break-words text-[10px] text-[#777] font-bold leading-[1.1]">
                  {invoice.ticketNo}
                </div>
              </div>

              <div className="min-w-0 px-[9px] py-[7px]">
                <div className="mb-[4px] text-[10px] text-[#777]">PNR</div>

                <div className="break-words text-[10px] font-bold text-[#777] leading-[1.1]">
                  {invoice.pnr}
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              PAYMENT HEADING
          ================================================= */}

          <div className="my-[14px] flex w-full items-center gap-[14px]">
            <div className="flex-1 border-t-2 border-dotted border-[#444]" />

            <span className="break-words text-[11px] font-bold leading-[1.2] text-black">
              PAYMENT BREAKUP
            </span>

            <div className="flex-1 border-t-2 border-dotted border-[#444]" />
          </div>

          {/* =================================================
              PAYMENT
          ================================================= */}

          <section className="overflow-hidden rounded-[9px] border-2 border-[#222]">
            {/* Fare */}

            <div className="min-h-[43px] px-[10px] py-[5px]">
              <div className="flex items-center justify-between gap-4">
                <span className="break-words text-[11px] font-bold leading-[1.2] text-black">
                  *Fare Charges
                </span>

                <span className="break-words text-[12px] font-bold leading-[1.2] text-black">
                  ₹{formatCurrency(invoice.fareCharges)}
                </span>
              </div>

              <div className="mt-[2px] pr-3 text-[8.5px] leading-[1.1] text-[#333]">
                {invoice.fareDescription}
              </div>
            </div>

            {/* Service Fees */}

            <div className="flex min-h-[25px] items-center justify-between gap-4 px-[10px] py-[4px]">
              <span className="wrap-break-word text-[11px] font-bold leading-[1.2] text-black">
                Service Fees
              </span>

              <span className="wrap-break-word text-[11px] font-bold leading-[1.2] text-black">
                ₹{formatCurrency(invoice.serviceFees)}
              </span>
            </div>

            {/* CGST */}

            <div className="flex min-h-[25px] items-center justify-between gap-4 px-[10px] py-[4px]">
              <span className="break-words text-[11px] font-bold leading-[1.2] text-black">
                CGST @9%
              </span>

              <span className="break-words text-[11px] font-bold leading-[1.2] text-black">
                ₹{formatCurrency(invoice.cgst)}
              </span>
            </div>

            {/* SGST */}

            <div className="flex min-h-[25px] items-center justify-between gap-4 border-b-2 border-[#222] px-[10px] py-[4px]">
              <span className="break-words text-[11px] font-bold leading-[1.2] text-black">
                SGST @9%
              </span>

              <span className="break-words text-[11px] font-bold leading-[1.2] text-black">
                ₹{formatCurrency(invoice.sgst)}
              </span>
            </div>

            {/* Grand Total */}

            <div className="flex min-h-[28px] mb-3 items-center justify-between gap-4 border-b-2 border-[#222] px-[10px] py-[4px]">
              <span className="break-words text-[11px] font-bold leading-[1.2] text-black ">
                Grand Total
              </span>

              <span className="break-words text-[11px] font-bold leading-[1.2] text-black">
                ₹{formatCurrency(grandTotal)}
              </span>
            </div>
          </section>

          {/* =================================================
              NOTICE
          ================================================= */}

          <div className="break-words text-[11px] mt-3 font-bold leading-[1.2] text-black">
            {invoice.taxNotice}
          </div>

          <div className="break-words text-[11px] mt-1.5 font-bold leading-[1.2] text-black">
            {invoice.invalidDocument}
          </div>

          {/* =================================================
              TERMS
          ================================================= */}

          <section className="mt-[13px]">
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t-3 border-dotted border-[#444]" />

              <span className="break-words text-[11px] font-bold leading-[1.2] text-black">
                TERMS &amp; CONDITIONS
              </span>

              <div className="flex-1 border-t-3 border-dotted border-[#444]" />
            </div>

            <ol className="mt-[10px] list-decimal pl-2">
              <li className="pl-[3px] text-[10px] leading-[1.45] text-[#222]">
                Any dispute with respect to the invoice is to be reported back
                to FlyZone Travels within 48 hours of receipt of invoice.
              </li>

              <li className="pl-[3px] text-[10px] leading-[1.45] text-[#222]">
                QR code for B2B and SEZ category invoices can only be scanned
                using app downloaded from the link.
                <br />
                <a
                  href={invoice.qrVerificationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-black underline"
                >
                  {invoice.qrVerificationUrl}
                </a>
              </li>

              <li className="pl-[3px] text-[10px] leading-[1.45] text-[#222]">
                This is system generated invoice and does not require
                signatures.
              </li>
            </ol>
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="absolute bottom-[7mm] left-[11mm] right-[11mm] flex items-end justify-between gap-5">
            <div className="max-w-[80%]">
              <div className="mb-[2px] text-[9px] text-[#666]">
                Registered Office
              </div>

              <div className="break-words text-[11px] font-bold leading-[1.2] text-black">
                {invoice.registeredOffice}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end text-right text-[9px] leading-[1.25] text-[#666]">
              <div>{invoice.invoiceNo}</div>

              <div className="break-words text-[11px] font-bold leading-[1.2] text-black">
                Page 1 of 1
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
