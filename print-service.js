const express = require('express');
const axios = require('axios');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
escpos.Network = require('escpos-network');
const moment = require('moment');

const app = express();
const PORT = process.env.PRINT_PORT || 5003;

app.use(express.json());

// Store settings in memory (fetched from main API)
let settings = {};

// Fetch settings from main API
const fetchSettings = async () => {
  try {
    const response = await axios.get('http://localhost:5002/api/settings', {
      headers: {
        Authorization: `Bearer ${process.env.PRINT_SERVICE_TOKEN || ''}`
      }
    });
    settings = response.data;
    console.log('Settings loaded successfully');
  } catch (error) {
    console.error('Error fetching settings:', error.message);
  }
};

// Initialize settings
fetchSettings();
setInterval(fetchSettings, 60000); // Refresh every minute

// Helper function to format currency
const formatCurrency = (amount) => {
  const symbol = settings.currency_symbol || '$';
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
};

// Print ESC/POS receipt
const printReceipt = async (billData, printerConfig) => {
  return new Promise(async (resolve, reject) => {
    try {
      let device;
      
      // Configure printer based on settings
      if (printerConfig.type === 'usb') {
        // USB Printer
        const devices = escpos.USB.findPrinter();
        if (devices.length === 0) {
          throw new Error('No USB printer found');
        }
        device = new escpos.USB(devices[0].deviceDescriptor.idVendor, devices[0].deviceDescriptor.idProduct);
      } else if (printerConfig.type === 'network') {
        // Network Printer (IPP/TCP)
        device = new escpos.Network(printerConfig.ip, parseInt(printerConfig.port || 9100));
      } else {
        throw new Error('Unsupported printer type');
      }
      
      const printer = new escpos.Printer(device);
      
      device.open(async (error) => {
        if (error) {
          return reject(error);
        }
        
        try {
          // Print header
          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(2, 2)
            .text(settings.shop_name || 'Restaurant POS')
            .size(1, 1)
            .style('normal')
            .text(settings.shop_address || '')
            .text(`Tel: ${settings.shop_phone || ''}`)
            .text(`Email: ${settings.shop_email || ''}`)
            .text('--------------------------------')
            .style('b')
            .text('BILL/INVOICE')
            .style('normal')
            .text('--------------------------------')
            .align('lt');
          
          // Bill details
          printer
            .text(`Bill #: ${billData.id.substring(0, 8)}`)
            .text(`Date: ${moment(billData.created_at).format('DD/MM/YYYY HH:mm')}`)
            .text(`Table: ${billData.table_number}`)
            .text(`Staff: ${billData.staff_name || 'N/A'}`)
            .text('--------------------------------');
          
          // Customer info if available
          if (billData.customer_name) {
            printer
              .text(`Customer: ${billData.customer_name}`)
              .text(`Phone: ${billData.customer_phone || 'N/A'}`)
              .text('--------------------------------');
          }
          
          // Items header
          printer
            .style('b')
            .text('Item                 Qty  Price')
            .style('normal')
            .text('--------------------------------');
          
          // Print items
          billData.items.forEach(item => {
            const itemName = item.item_name + (item.variant_name ? ` (${item.variant_name})` : '');
            const itemLine = itemName.substring(0, 20).padEnd(20);
            const qty = item.quantity.toString().padStart(3);
            const price = formatCurrency(item.total).padStart(8);
            
            printer.text(`${itemLine} ${qty}  ${price}`);
            
            if (item.special_instructions) {
              printer.text(`  Note: ${item.special_instructions}`);
            }
          });
          
          printer.text('--------------------------------');
          
          // Totals
          const subtotalLine = `Subtotal:`.padEnd(26) + formatCurrency(billData.subtotal).padStart(8);
          printer.text(subtotalLine);
          
          if (billData.discount_amount > 0) {
            const discountLine = `Discount:`.padEnd(26) + `- ${formatCurrency(billData.discount_amount)}`.padStart(8);
            printer.text(discountLine);
            
            if (billData.discount_reason) {
              printer.text(`  (${billData.discount_reason})`);
            }
          }
          
          if (billData.service_charge > 0) {
            const serviceLine = `Service Charge:`.padEnd(26) + formatCurrency(billData.service_charge).padStart(8);
            printer.text(serviceLine);
          }
          
          if (billData.tax_amount > 0) {
            const taxLine = `Tax (GST):`.padEnd(26) + formatCurrency(billData.tax_amount).padStart(8);
            printer.text(taxLine);
          }
          
          if (billData.round_off && Math.abs(billData.round_off) > 0.01) {
            const roundOffLine = `Round Off:`.padEnd(26) + formatCurrency(billData.round_off).padStart(8);
            printer.text(roundOffLine);
          }
          
          printer
            .text('================================')
            .style('bu')
            .size(1, 2);
          
          const totalLine = `TOTAL:`.padEnd(13) + formatCurrency(billData.total_amount).padStart(8);
          printer.text(totalLine);
          
          printer
            .size(1, 1)
            .style('normal')
            .text('================================');
          
          // Payment details
          printer
            .text(`Payment: ${billData.payment_method?.toUpperCase() || 'CASH'}`)
            .text(`Status: ${billData.payment_status?.toUpperCase() || 'PENDING'}`);
          
          // Split bill info
          if (billData.is_split) {
            printer.text(`Split Bill: ${billData.split_count} ways`);
          }
          
          printer.text('--------------------------------');
          
          // Footer
          if (settings.receipt_header) {
            printer
              .align('ct')
              .text(settings.receipt_header);
          }
          
          printer
            .align('ct')
            .text('Thank you for your visit!')
            .text('Please come again!')
            .newLine();
          
          if (settings.receipt_footer) {
            printer.text(settings.receipt_footer);
          }
          
          // Print count if reprint
          if (billData.printed_count && billData.printed_count > 0) {
            printer.text(`(REPRINT #${billData.printed_count})`);
          }
          
          printer
            .newLine()
            .newLine()
            .cut()
            .close();
          
          resolve({ success: true, message: 'Receipt printed successfully' });
        } catch (printError) {
          device.close();
          reject(printError);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Print KOT (Kitchen Order Ticket)
const printKOT = async (orderData, printerConfig) => {
  return new Promise(async (resolve, reject) => {
    try {
      let device;
      
      if (printerConfig.type === 'usb') {
        const devices = escpos.USB.findPrinter();
        if (devices.length === 0) {
          throw new Error('No USB printer found');
        }
        device = new escpos.USB(devices[0].deviceDescriptor.idVendor, devices[0].deviceDescriptor.idProduct);
      } else if (printerConfig.type === 'network') {
        device = new escpos.Network(printerConfig.ip, parseInt(printerConfig.port || 9100));
      } else {
        throw new Error('Unsupported printer type');
      }
      
      const printer = new escpos.Printer(device);
      
      device.open((error) => {
        if (error) {
          return reject(error);
        }
        
        try {
          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(2, 2)
            .text('KITCHEN ORDER')
            .size(1, 1)
            .style('normal')
            .text('================================')
            .align('lt')
            .text(`Order #: ${orderData.order_id.substring(0, 8)}`)
            .text(`Table: ${orderData.table_number}`)
            .text(`Time: ${moment(orderData.created_at).format('HH:mm')}`)
            .text('================================');
          
          if (orderData.notes) {
            printer
              .style('b')
              .text(`NOTE: ${orderData.notes}`)
              .style('normal')
              .text('--------------------------------');
          }
          
          // Group items by category
          const itemsByCategory = {};
          orderData.items.forEach(item => {
            const category = item.category || 'Other';
            if (!itemsByCategory[category]) {
              itemsByCategory[category] = [];
            }
            itemsByCategory[category].push(item);
          });
          
          // Print items by category
          Object.keys(itemsByCategory).forEach(category => {
            printer
              .style('bu')
              .text(category)
              .style('normal');
            
            itemsByCategory[category].forEach(item => {
              const itemLine = `${item.quantity}x ${item.item_name}`;
              printer.text(itemLine);
              
              if (item.variant_name) {
                printer.text(`   Variant: ${item.variant_name}`);
              }
              
              if (item.special_instructions) {
                printer
                  .style('b')
                  .text(`   ** ${item.special_instructions} **`)
                  .style('normal');
              }
              
              printer.text('');
            });
          });
          
          printer
            .align('ct')
            .text('================================')
            .newLine()
            .newLine()
            .cut()
            .close();
          
          resolve({ success: true, message: 'KOT printed successfully' });
        } catch (printError) {
          device.close();
          reject(printError);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

// API Endpoints

// Print bill receipt
app.post('/print/bill', async (req, res) => {
  try {
    const { billData } = req.body;
    
    const printerConfig = {
      type: settings.printer_type || 'network',
      ip: settings.printer_ip || '192.168.1.100',
      port: settings.printer_port || '9100'
    };
    
    const result = await printReceipt(billData, printerConfig);
    
    // Update print count in main API
    try {
      await axios.post(`http://localhost:5002/api/bills/${billData.id}/reprint`, {}, {
        headers: {
          Authorization: `Bearer ${process.env.PRINT_SERVICE_TOKEN || ''}`
        }
      });
    } catch (err) {
      console.error('Error updating print count:', err.message);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Print error:', error);
    
    // Add to print queue if fails
    try {
      await axios.post('http://localhost:5002/api/print-queue', {
        bill_id: req.body.billData.id,
        printer_name: 'default',
        print_data: req.body.billData
      }, {
        headers: {
          Authorization: `Bearer ${process.env.PRINT_SERVICE_TOKEN || ''}`
        }
      });
    } catch (queueError) {
      console.error('Error adding to print queue:', queueError.message);
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Print KOT
app.post('/print/kot', async (req, res) => {
  try {
    const { orderData } = req.body;
    
    const printerConfig = {
      type: settings.printer_type || 'network',
      ip: settings.printer_ip || '192.168.1.100',
      port: settings.printer_port || '9100'
    };
    
    const result = await printKOT(orderData, printerConfig);
    res.json(result);
  } catch (error) {
    console.error('KOT print error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process print queue
app.post('/print/process-queue', async (req, res) => {
  try {
    // Fetch pending print jobs
    const response = await axios.get('http://localhost:5002/api/print-queue/pending', {
      headers: {
        Authorization: `Bearer ${process.env.PRINT_SERVICE_TOKEN || ''}`
      }
    });
    
    const jobs = response.data;
    const results = [];
    
    for (const job of jobs) {
      try {
        const printerConfig = {
          type: settings.printer_type || 'network',
          ip: settings.printer_ip || '192.168.1.100',
          port: settings.printer_port || '9100'
        };
        
        await printReceipt(job.print_data, printerConfig);
        
        // Mark as completed
        await axios.put(`http://localhost:5002/api/print-queue/${job.id}`, {
          status: 'completed'
        }, {
          headers: {
            Authorization: `Bearer ${process.env.PRINT_SERVICE_TOKEN || ''}`
          }
        });
        
        results.push({ id: job.id, status: 'completed' });
      } catch (error) {
        // Mark as failed
        await axios.put(`http://localhost:5002/api/print-queue/${job.id}`, {
          status: 'failed',
          error_message: error.message
        }, {
          headers: {
            Authorization: `Bearer ${process.env.PRINT_SERVICE_TOKEN || ''}`
          }
        });
        
        results.push({ id: job.id, status: 'failed', error: error.message });
      }
    }
    
    res.json({ processed: results.length, results });
  } catch (error) {
    console.error('Queue processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Automatically process queue every 30 seconds
setInterval(async () => {
  try {
    await axios.post('http://localhost:5003/print/process-queue');
  } catch (error) {
    // Silent fail
  }
}, 30000);

app.listen(PORT, () => {
  console.log(`Print service running on port ${PORT}`);
  console.log('Ready to process print jobs...');
});

