/** Browser-generated example documents; never presented as legal originals. */
export async function createDemoPdf(title: string, lines: string[]): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  pdf.setFontSize(18);
  pdf.text("Nexora Platform", 20, 22);
  pdf.setFontSize(12);
  pdf.text("DOCUMENTO DE EJEMPLO - SIN VALIDEZ LEGAL", 20, 34);
  pdf.setFontSize(15);
  pdf.text(pdf.splitTextToSize(title, 170), 20, 50);
  pdf.setFontSize(11);
  let y = 72;
  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, 170) as string[];
    for (const part of wrapped) {
      if (y > 275) { pdf.addPage(); y = 22; }
      pdf.text(part, 20, y);
      y += 7;
    }
    y += 3;
  }
  return URL.createObjectURL(pdf.output("blob"));
}

export function downloadPdf(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  if (url.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(url), 60_000);
}