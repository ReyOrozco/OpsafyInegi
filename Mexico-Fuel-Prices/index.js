const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const INEGI_API_URL = 'https://gaia.inegi.org.mx/sakbe_v3.1/combustible';
const INEGI_API_KEY = '6Gwy3bY5-mG1W-2Jmk-ViXt-jCS7lbiAbeBI';
const RECIPIENT_EMAIL = 'reynaldo.orozco@olpega.net';

// Gmail SMTP configuration
const GMAIL_USER = process.env.GMAIL_USER || 'your-email@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'your-app-password';

/**
 * Fetches fuel prices from INEGI API
 * @returns {Promise<Object>} API response data
 */
async function fetchFuelPrices() {
    try {
        console.log('🔄 Fetching fuel prices from INEGI API...');
        
        const response = await fetch(INEGI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'FuelPriceMonitor/1.0'
            },
            body: `type=json&key=${INEGI_API_KEY}`
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Successfully fetched fuel prices data');
        return data;
    } catch (error) {
        console.error('❌ Error fetching fuel prices:', error.message);
        throw error;
    }
}

/**
 * Extracts and formats fuel price data
 * @param {Object} apiData - Raw API response
 * @returns {Array} Formatted fuel price data
 */
function extractFuelPrices(apiData) {
    try {
        console.log('🔄 Processing fuel price data...');
        
        if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
            throw new Error('Invalid API response structure');
        }

        const fuelPrices = [];

        // Process each fuel type from the API
        apiData.data.forEach(fuel => {
            if (fuel.tipo && fuel.costo && !isNaN(parseFloat(fuel.costo))) {
                const fuelType = fuel.tipo.trim();
                const price = parseFloat(fuel.costo);
                
                fuelPrices.push({
                    type: fuelType,
                    averagePrice: price.toFixed(2),
                    minPrice: price.toFixed(2), // API provides average prices, so min/max are the same
                    maxPrice: price.toFixed(2),
                    stationCount: 'N/A' // API doesn't provide station count for averages
                });
            }
        });

        // Sort by fuel type name
        fuelPrices.sort((a, b) => a.type.localeCompare(b.type));
        
        console.log(`✅ Processed ${fuelPrices.length} fuel types from API data`);
        return fuelPrices;
    } catch (error) {
        console.error('❌ Error processing fuel price data:', error.message);
        throw error;
    }
}

/**
 * Generates HTML email content with fuel prices
 * @param {Array} fuelPrices - Formatted fuel price data
 * @returns {String} HTML email content
 */
function generateEmailHTML(fuelPrices) {
    try {
        console.log('🔄 Generating HTML email content...');
        
        const currentDate = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let tableRows = '';
        
        if (fuelPrices.length === 0) {
            tableRows = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #666; font-style: italic;">
                        No hay datos de precios disponibles en este momento
                    </td>
                </tr>
            `;
        } else {
            tableRows = fuelPrices.map(fuel => `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: 500;">${fuel.type}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: 600; color: #2c5530;">$${fuel.averagePrice}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #666;">$${fuel.minPrice}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #666;">$${fuel.maxPrice}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #666;">${fuel.stationCount}</td>
                </tr>
            `).join('');
        }

        const htmlContent = `
     <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Precios de Combustibles</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 800px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📊 Reporte de Precios</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 24px; font-weight: 600;">Combustibles México</h2>
            <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">
                Un reporte automático de 
                <a href="https://opsafy.com/" style="color: #fff; font-weight: bold; text-decoration: underline;" target="_blank">Opsafy</a> 
                con datos oficiales de INEGI
            </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            <div style="margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2a5298; border-radius: 4px;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                    <strong>Fecha del reporte:</strong> ${currentDate}
                </p>
            </div>

            <h3 style="color: #333; margin-bottom: 20px; font-size: 20px; text-align: center;">Precios Promedio por Tipo de Combustible</h3>

            <div style="overflow-x: auto; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background-color: #2a5298; color: white;">
                            <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px;">Tipo de Combustible</th>
                            <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 14px;">Precio Promedio</th>
                            <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 14px;">Precio Mínimo</th>
                            <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 14px;">Precio Máximo</th>
                            <th style="padding: 15px 12px; text-align: center; font-weight: 600; font-size: 14px;">Estaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                    <strong>📝 Nota:</strong> Los precios están expresados en pesos mexicanos por litro. 
                    Este reporte se genera automáticamente por 
                    <a href="https://opsafy.com/" style="font-weight: bold; color: #856404;" target="_blank">Opsafy</a> 
                    con los datos más recientes disponibles en la API de INEGI.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; color: #666; font-size: 12px;">
                Reporte generado automáticamente • Sistema de Monitoreo de Precios • <a href="https://opsafy.com/" target="_blank" style="color: #444;">Opsafy</a>
            </p>
        </div>
    </div>
</body>
</html>

        `;

        console.log('✅ HTML email content generated successfully');
        return htmlContent;
    } catch (error) {
        console.error('❌ Error generating HTML email:', error.message);
        throw error;
    }
}

/**
 * Sends email using Gmail SMTP
 * @param {String} htmlContent - HTML email content
 * @param {Array} fuelPrices - Fuel price data for subject line
 */
async function sendEmail(htmlContent, fuelPrices) {
    try {
        console.log('🔄 Configuring email transport...');
        
        // Validate Gmail credentials
        if (!GMAIL_USER || GMAIL_USER === 'your-email@gmail.com') {
            throw new Error('Gmail user not configured. Please set GMAIL_USER environment variable.');
        }
        
        if (!GMAIL_APP_PASSWORD || GMAIL_APP_PASSWORD === 'your-app-password') {
            throw new Error('Gmail app password not configured. Please set GMAIL_APP_PASSWORD environment variable.');
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_APP_PASSWORD
            }
        });

        // Verify connection
        await transporter.verify();
        console.log('✅ Gmail SMTP connection verified');

        // Generate subject line
        const currentDate = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const fuelCount = fuelPrices.length;
        const subject = `📊 Reporte Precios Combustibles - ${currentDate} (${fuelCount} tipos disponibles)`;

        // Email options
        const mailOptions = {
            from: {
                name: 'Sistema de Monitoreo de Precios',
                address: GMAIL_USER
            },
            to: RECIPIENT_EMAIL,
            subject: subject,
            html: htmlContent,
            // Add plain text version as fallback
            text: `Reporte de Precios de Combustibles - ${currentDate}\n\n` +
                  `Se han procesado ${fuelCount} tipos de combustibles.\n` +
                  `Para ver el reporte completo, consulte la versión HTML de este email.\n\n` +
                  `Datos proporcionados por INEGI.`
        };

        console.log(`🔄 Sending email to ${RECIPIENT_EMAIL}...`);
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully!');
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📫 Recipient: ${RECIPIENT_EMAIL}`);
        console.log(`📋 Subject: ${subject}`);
        
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        
        // Provide helpful error messages
        if (error.message.includes('Invalid login')) {
            console.error('💡 Tip: Make sure you are using an App Password, not your regular Gmail password.');
            console.error('💡 Enable 2FA and generate an App Password at: https://myaccount.google.com/apppasswords');
        }
        
        throw error;
    }
}

/**
 * Main function to orchestrate the fuel price reporting process
 */
async function main() {
    console.log('🚀 Starting Fuel Price Monitor...\n');
    
    try {
        // Step 1: Fetch data from INEGI API
        const apiData = await fetchFuelPrices();
        
        // Step 2: Extract and process fuel prices
        const fuelPrices = extractFuelPrices(apiData);
        
        if (fuelPrices.length === 0) {
            console.log('⚠️  No fuel price data available, but continuing with empty report...');
        } else {
            console.log(`📊 Found data for ${fuelPrices.length} fuel types:`);
            fuelPrices.forEach(fuel => {
                console.log(`   • ${fuel.type}: $${fuel.averagePrice} promedio`);
            });
        }
        
        // Step 3: Generate HTML email
        const htmlContent = generateEmailHTML(fuelPrices);
        
        // Step 4: Send email
        await sendEmail(htmlContent, fuelPrices);
        
        console.log('\n🎉 Fuel price report completed successfully!');
        
    } catch (error) {
        console.error('\n💥 Application failed:', error.message);
        
        // Exit with error code
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run the application
if (require.main === module) {
    main();
}

module.exports = { fetchFuelPrices, extractFuelPrices, generateEmailHTML, sendEmail };
