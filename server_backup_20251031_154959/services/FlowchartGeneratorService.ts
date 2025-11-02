
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface FlowchartNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'data';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlowchartConnection {
  from: string;
  to: string;
  label?: string;
}

export class FlowchartGeneratorService {
  private static createApplicationFlowchart(): { nodes: FlowchartNode[], connections: FlowchartConnection[] } {
    const nodes: FlowchartNode[] = [
      // Authentication Flow
      { id: 'start', label: 'User Access', type: 'start', x: 50, y: 50, width: 120, height: 40 },
      { id: 'login', label: 'Login/Register', type: 'process', x: 50, y: 120, width: 120, height: 40 },
      { id: 'dashboard', label: 'Dashboard', type: 'process', x: 50, y: 190, width: 120, height: 40 },
      
      // Storage & Warehousing Flow
      { id: 'storage_decision', label: 'Storage Method?', type: 'decision', x: 220, y: 190, width: 140, height: 60 },
      { id: 'green_channel', label: 'Green Channel\n(Direct Storage)', type: 'process', x: 200, y: 290, width: 120, height: 50 },
      { id: 'orange_channel', label: 'Orange Channel\n(External Import)', type: 'process', x: 340, y: 290, width: 120, height: 50 },
      { id: 'deposit_flow', label: 'Commodity Deposit', type: 'process', x: 270, y: 380, width: 120, height: 40 },
      { id: 'receipt_gen', label: 'Receipt Generation', type: 'process', x: 270, y: 450, width: 120, height: 40 },
      
      // QR & Verification
      { id: 'qr_verify', label: 'QR Code\nVerification', type: 'process', x: 420, y: 450, width: 100, height: 50 },
      { id: 'inspection', label: 'Commodity\nInspection', type: 'process', x: 540, y: 450, width: 100, height: 50 },
      
      // Lending Flow
      { id: 'lending_decision', label: 'Need Loan?', type: 'decision', x: 50, y: 350, width: 120, height: 60 },
      { id: 'loan_app', label: 'Loan Application', type: 'process', x: 50, y: 450, width: 120, height: 40 },
      { id: 'credit_check', label: 'Credit Assessment', type: 'process', x: 50, y: 520, width: 120, height: 40 },
      { id: 'smart_contract', label: 'Smart Contract\nCreation', type: 'process', x: 50, y: 590, width: 120, height: 50 },
      
      // Supply Chain & Tracking
      { id: 'supply_chain', label: 'Supply Chain\nTracking', type: 'process', x: 420, y: 190, width: 120, height: 50 },
      { id: 'delivery_track', label: 'Delivery Tracking', type: 'process', x: 560, y: 190, width: 120, height: 40 },
      { id: 'insurance', label: 'Insurance\nCoverage', type: 'process', x: 560, y: 260, width: 120, height: 50 },
      
      // Analytics & Risk
      { id: 'risk_mgmt', label: 'Risk Management', type: 'process', x: 420, y: 350, width: 120, height: 40 },
      { id: 'analytics', label: 'Analytics &\nReporting', type: 'process', x: 560, y: 350, width: 120, height: 50 },
      
      // Payments & Settlement
      { id: 'payment_decision', label: 'Payment Due?', type: 'decision', x: 200, y: 590, width: 120, height: 60 },
      { id: 'payment_process', label: 'Payment Processing', type: 'process', x: 340, y: 590, width: 120, height: 40 },
      { id: 'settlement', label: 'Settlement', type: 'process', x: 480, y: 590, width: 120, height: 40 },
      
      // End states
      { id: 'withdrawal', label: 'Commodity\nWithdrawal', type: 'process', x: 270, y: 520, width: 120, height: 50 },
      { id: 'transfer', label: 'Ownership\nTransfer', type: 'process', x: 420, y: 520, width: 120, height: 50 },
      { id: 'complete', label: 'Transaction\nComplete', type: 'end', x: 350, y: 680, width: 120, height: 40 }
    ];

    const connections: FlowchartConnection[] = [
      { from: 'start', to: 'login' },
      { from: 'login', to: 'dashboard' },
      { from: 'dashboard', to: 'storage_decision' },
      { from: 'storage_decision', to: 'green_channel', label: 'Direct' },
      { from: 'storage_decision', to: 'orange_channel', label: 'Import' },
      { from: 'green_channel', to: 'deposit_flow' },
      { from: 'orange_channel', to: 'deposit_flow' },
      { from: 'deposit_flow', to: 'receipt_gen' },
      { from: 'receipt_gen', to: 'qr_verify' },
      { from: 'qr_verify', to: 'inspection' },
      { from: 'dashboard', to: 'lending_decision' },
      { from: 'lending_decision', to: 'loan_app', label: 'Yes' },
      { from: 'loan_app', to: 'credit_check' },
      { from: 'credit_check', to: 'smart_contract' },
      { from: 'dashboard', to: 'supply_chain' },
      { from: 'supply_chain', to: 'delivery_track' },
      { from: 'supply_chain', to: 'insurance' },
      { from: 'supply_chain', to: 'risk_mgmt' },
      { from: 'risk_mgmt', to: 'analytics' },
      { from: 'receipt_gen', to: 'withdrawal' },
      { from: 'withdrawal', to: 'transfer' },
      { from: 'smart_contract', to: 'payment_decision' },
      { from: 'payment_decision', to: 'payment_process', label: 'Yes' },
      { from: 'payment_process', to: 'settlement' },
      { from: 'settlement', to: 'complete' },
      { from: 'transfer', to: 'complete' }
    ];

    return { nodes, connections };
  }

  static async generateFlowchartPDF(): Promise<string> {
    const { nodes, connections } = this.createApplicationFlowchart();
    const doc = new PDFDocument({ size: 'A3', layout: 'landscape' });
    const fileName = `tradewiser-flowchart-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', fileName);

    // Ensure uploads directory exists
    const uploadsDir = path.dirname(filePath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title
    doc.fontSize(24).font('Helvetica-Bold')
       .text('TradeWiser Platform - Application Flowchart', 50, 30);
    
    doc.fontSize(12).font('Helvetica')
       .text('Comprehensive flow of warehouse receipts, lending, and supply chain processes', 50, 60);

    // Draw nodes
    nodes.forEach(node => {
      const { x, y, width, height, label, type } = node;
      
      // Set colors based on node type
      let fillColor = '#f0f0f0';
      let strokeColor = '#333333';
      
      switch (type) {
        case 'start':
          fillColor = '#90EE90';
          break;
        case 'end':
          fillColor = '#FFB6C1';
          break;
        case 'decision':
          fillColor = '#FFE4B5';
          break;
        case 'process':
          fillColor = '#87CEEB';
          break;
        case 'data':
          fillColor = '#DDA0DD';
          break;
      }

      // Draw shape based on type
      if (type === 'decision') {
        // Diamond shape for decisions
        doc.save()
           .fillColor(fillColor)
           .strokeColor(strokeColor)
           .lineWidth(1);
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        doc.moveTo(centerX, y)
           .lineTo(x + width, centerY)
           .lineTo(centerX, y + height)
           .lineTo(x, centerY)
           .closePath()
           .fillAndStroke();
      } else if (type === 'start' || type === 'end') {
        // Rounded rectangles for start/end
        doc.roundedRect(x, y, width, height, 20)
           .fillColor(fillColor)
           .fillAndStroke()
           .strokeColor(strokeColor);
      } else {
        // Regular rectangles for processes
        doc.rect(x, y, width, height)
           .fillColor(fillColor)
           .fillAndStroke()
           .strokeColor(strokeColor);
      }

      // Add text
      doc.fillColor('#000000')
         .fontSize(9)
         .text(label, x + 5, y + height/2 - 6, {
           width: width - 10,
           align: 'center'
         });
    });

    // Draw connections
    doc.strokeColor('#333333').lineWidth(1);
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        const fromX = fromNode.x + fromNode.width / 2;
        const fromY = fromNode.y + fromNode.height;
        const toX = toNode.x + toNode.width / 2;
        const toY = toNode.y;

        // Draw arrow
        doc.moveTo(fromX, fromY)
           .lineTo(toX, toY)
           .stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        doc.moveTo(toX, toY)
           .lineTo(
             toX - arrowLength * Math.cos(angle - arrowAngle),
             toY - arrowLength * Math.sin(angle - arrowAngle)
           )
           .moveTo(toX, toY)
           .lineTo(
             toX - arrowLength * Math.cos(angle + arrowAngle),
             toY - arrowLength * Math.sin(angle + arrowAngle)
           )
           .stroke();

        // Add connection label if exists
        if (conn.label) {
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2;
          doc.fontSize(8)
             .text(conn.label, midX - 20, midY - 5, {
               width: 40,
               align: 'center'
             });
        }
      }
    });

    // Add legend
    const legendY = 650;
    doc.fontSize(14).font('Helvetica-Bold')
       .text('Legend:', 50, legendY);

    const legendItems = [
      { color: '#90EE90', label: 'Start/Entry Point' },
      { color: '#87CEEB', label: 'Process/Action' },
      { color: '#FFE4B5', label: 'Decision Point' },
      { color: '#DDA0DD', label: 'Data Storage' },
      { color: '#FFB6C1', label: 'End/Exit Point' }
    ];

    legendItems.forEach((item, index) => {
      const legendX = 50 + (index * 150);
      doc.rect(legendX, legendY + 20, 15, 15)
         .fillColor(item.color)
         .fillAndStroke()
         .strokeColor('#333333');
      
      doc.fillColor('#000000')
         .fontSize(10)
         .text(item.label, legendX + 20, legendY + 23);
    });

    // Add footer
    doc.fontSize(10)
       .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 750)
       .text('TradeWiser - Digital Warehouse & Lending Platform', 600, 750);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(fileName));
      stream.on('error', reject);
    });
  }
}
