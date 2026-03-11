import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FURNITURE_ITEMS } from "./furniture";

interface ExportPdfOptions {
  projectId: string;
  projectName: string;
  clientName?: string;
  agencyName?: string;
  eventType: string;
  scenes: { 
    label: string; 
    src: string; 
    items: any[];
    dimensions?: string;
    setupTimeline?: string;
    rentPrice?: number;
  }[];
}

export async function exportProjectToPdf({
  projectId,
  projectName,
  clientName = "Valued Client",
  agencyName = "EventVista Agency",
  eventType,
  scenes,
}: ExportPdfOptions) {
  const doc = new jsPDF();
  const coralColor = [255, 107, 74]; // #FF6B4A
  const darkColor = [15, 15, 15];

  // Utility: Add Header/Footer
  const addHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("EVENTVISTA DESIGN PROPOSAL", 14, 10);
    doc.setDrawColor(230, 230, 230);
    doc.line(14, 12, 196, 12);
  };

  // --- 1. COVER PAGE ---
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 297, "F");

  // Logo placeholder
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  doc.text("EventVista", 105, 80, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(coralColor[0], coralColor[1], coralColor[2]);
  doc.text("DESIGN PRESENTATION & QUOTATION", 105, 95, { align: "center" });

  doc.setDrawColor(coralColor[0], coralColor[1], coralColor[2]);
  doc.setLineWidth(1);
  doc.line(85, 105, 125, 105);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(projectName.toUpperCase(), 105, 140, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(`PREPARED FOR: ${clientName.toUpperCase()}`, 105, 155, { align: "center" });
  doc.text(`BY: ${agencyName.toUpperCase()}`, 105, 162, { align: "center" });

    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(date, 105, 180, { align: "center" });

    // Interactive Link Branding on Cover
    const shareUrl = `${window.location.origin}/share/${projectId}`;
    doc.setFillColor(coralColor[0], coralColor[1], coralColor[2]);
    doc.roundedRect(65, 200, 80, 12, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CLICK FOR 360° INTERACTIVE TOUR", 105, 207.5, { align: "center" });
    doc.link(65, 200, 80, 12, { url: shareUrl });

    // --- 2. PROJECT OVERVIEW ---
  doc.addPage();
  addHeader();
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("1. PROJECT OVERVIEW", 14, 30);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const overviewText = `This proposal outlines the creative vision and technical requirements for the upcoming ${eventType} event. EventVista has carefully curated a selection of scenes and elements to ensure an immersive and high-fidelity experience for all attendees. Our focus remains on high-end scenography, professional furniture placement, and seamless spatial flow.`;
  const splitOverview = doc.splitTextToSize(overviewText, 180);
  doc.text(splitOverview, 14, 45);

  doc.setFont("helvetica", "bold");
  doc.text("Key Details:", 14, 75);
  doc.setFont("helvetica", "normal");
  doc.text(`• Event Type: ${eventType}`, 20, 85);
  doc.text(`• Total Scenes: ${scenes.length}`, 20, 92);
  doc.text(`• Project Status: Proposal Phase`, 20, 99);

  // --- 3. SCENES PRESENTATION ---
  doc.addPage();
  addHeader();
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("2. SCENES PRESENTATION", 14, 30);

  let sceneY = 45;
  scenes.forEach((scene, index) => {
    if (sceneY > 220) {
      doc.addPage();
      addHeader();
      sceneY = 30;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(coralColor[0], coralColor[1], coralColor[2]);
    doc.text(`Scene ${index + 1}: ${scene.label}`, 14, sceneY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Assets: ${scene.items.length} elements | Rent: $${(scene.rentPrice || 1200).toLocaleString()}/Day`, 14, sceneY + 7);
    doc.text(`Tech: ${scene.dimensions || "Auto-detected"} | Setup: ${scene.setupTimeline || "24-48 Hours"}`, 14, sceneY + 12);
    
      // Scene Interaction Link
      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, sceneY + 18, 180, 50, 4, 4, "FD");
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(coralColor[0], coralColor[1], coralColor[2]);
      doc.text("INTERACTIVE 360° ENVIRONMENT", 105, sceneY + 40, { align: "center" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("Click this section to view the live immersive scenography", 105, sceneY + 46, { align: "center" });
      doc.link(14, sceneY + 18, 180, 50, { url: `${window.location.origin}/share/${projectId}` });
      
      sceneY += 80;
  });

  // --- 4. TECHNICAL SPECS ---
  doc.addPage();
  addHeader();
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("3. TECHNICAL SPECS", 14, 30);

  const techRows = scenes.map(s => [
    s.label,
    s.dimensions || "Auto-detected",
    s.setupTimeline || "24-48 Hours",
    `$${(s.rentPrice || 1200).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 45,
    head: [["Venue / Scene", "Dimensions", "Setup Timeline", "Rent / Day"]],
    body: techRows,
    theme: "grid",
    headStyles: { fillColor: [60, 60, 60] },
    styles: { fontSize: 10, cellPadding: 5 },
  });

  // --- 5. FURNITURE & ELEMENTS ---
  doc.addPage();
  addHeader();
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("4. FURNITURE & ELEMENTS", 14, 30);

  const allFurniture: any[] = [];
  scenes.forEach(s => allFurniture.push(...s.items));
  
  // Group by item type
  const furnitureSummary: Record<string, { label: string; count: number; price: number }> = {};
  allFurniture.forEach(p => {
    const key = p.item.id;
    if (!furnitureSummary[key]) {
      // Robust price check with fallback
      let price = p.item.price;
      if (price === undefined || price === null || price === 0) {
        price = FURNITURE_ITEMS.find(fi => fi.id === p.item.id)?.price || 0;
      }
      
      furnitureSummary[key] = { label: p.item.label, count: 0, price: price };
    }
    furnitureSummary[key].count++;
  });

  const furnitureRows = Object.values(furnitureSummary).map(f => [
    f.label,
    f.count.toString(),
    `$${f.price.toLocaleString()}`,
    `$${(f.price * f.count).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 40,
    head: [["Item Description", "Quantity", "Unit Price", "Subtotal"]],
    body: furnitureRows,
    theme: "striped",
    headStyles: { fillColor: coralColor, textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 },
  });

  // --- 6. BUDGET SUMMARY ---
  doc.addPage();
  addHeader();
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("5. BUDGET SUMMARY", 14, 30);

  const totalFurnitureBudget = Object.values(furnitureSummary).reduce((acc, f) => acc + (f.price * f.count), 0);
  const totalVenueRent = scenes.reduce((acc, s) => acc + (s.rentPrice || 1200), 0);

  autoTable(doc, {
    startY: 45,
    body: [
      ["Furniture & Scenography Elements", `$${totalFurnitureBudget.toLocaleString()}`],
      ["Venue Rent (Total for all scenes)", `$${totalVenueRent.toLocaleString()}`],
      ["Logistics & Installation (Est. 15%)", `$${(totalFurnitureBudget * 0.15).toLocaleString()}`],
      ["Agency Fee (Fixed)", "$2,500"],
    ],
    theme: "plain",
    styles: { fontSize: 12, cellPadding: 8, fontStyle: "bold" },
  });

  const finalTotal = totalFurnitureBudget + totalVenueRent + (totalFurnitureBudget * 0.15) + 2500;
  const currentFinalY = (doc as any).lastAutoTable.finalY;

  doc.setFillColor(coralColor[0], coralColor[1], coralColor[2]);
  doc.rect(14, currentFinalY + 10, 180, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("TOTAL ESTIMATED INVESTMENT", 20, currentFinalY + 23);
  doc.text(`$${finalTotal.toLocaleString()}`, 190, currentFinalY + 23, { align: "right" });

  // --- 7. TWO BUDGETS: INITIAL VS FINAL ---
  doc.addPage();
  addHeader();
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("6. BUDGET EVOLUTION", 14, 30);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Comparison between initial estimation and final design proposal.", 14, 40);

  const initialEstimation = finalTotal * 0.85; // Simulating an 85% initial estimate

  autoTable(doc, {
    startY: 50,
    head: [["Budget Phase", "Total Amount", "Status", "Variance"]],
    body: [
      ["Initial Estimation", `$${initialEstimation.toLocaleString()}`, "Draft / Target", "-15.0%"],
      ["Final Design Proposal", `$${finalTotal.toLocaleString()}`, "Current / Confirmed", "+0.0%"],
    ],
    theme: "grid",
    headStyles: { fillColor: [40, 40, 40] },
    styles: { fontSize: 11, cellPadding: 8 },
  });

  // --- 8. NEXT STEPS ---
  doc.addPage();
  addHeader();
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("7. NEXT STEPS", 14, 30);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("1. Review this proposal with your internal stakeholders.", 14, 45);
  doc.text("2. Approve the scenography layout and item selection.", 14, 55);
  doc.text("3. Finalize logistics and site visit schedule.", 14, 65);
  doc.text("4. Sign the service agreement and process the 50% deposit.", 14, 75);

  // --- 9. TERMS & CONDITIONS ---
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("8. TERMS & CONDITIONS", 14, 110);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  const tcText = `All prices are estimated and subject to change based on final availability and site requirements. This proposal is valid for 30 days from the date of issuance. Cancellations made within 14 days of the event will incur a 50% penalty fee. All furniture remains the property of EventVista or its designated partners unless explicitly purchased as part of the project scope. Digital assets and 360° views are provided for visualization purposes only.`;
  const splitTc = doc.splitTextToSize(tcText, 180);
  doc.text(splitTc, 14, 125);

  // Footer branding
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(coralColor[0], coralColor[1], coralColor[2]);
  doc.text("www.eventvista.io", 105, 280, { align: "center" });

  doc.save(`${projectName.replace(/ /g, "_")}_Proposal.pdf`);
}
