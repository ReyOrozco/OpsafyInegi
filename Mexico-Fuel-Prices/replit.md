# Fuel Price Monitor - Mexico

## Overview

This is a Node.js automation tool that fetches real-time fuel prices from Mexico's INEGI (Instituto Nacional de Estadística y Geografía) official API and sends formatted email reports via Gmail SMTP. The application provides comprehensive fuel price analysis including averages, minimums, and maximums for different fuel types, delivered through professional HTML email templates.

## System Architecture

### Backend Architecture
- **Runtime**: Node.js (v14+ recommended)
- **Architecture Pattern**: Simple script-based automation tool
- **Execution Model**: Single-run process that fetches data, processes it, and sends email reports
- **Language**: JavaScript (CommonJS modules)

### Core Technologies
- **HTTP Client**: node-fetch v2.7.0 for API requests
- **Email Service**: nodemailer v7.0.3 for SMTP email delivery
- **Configuration**: dotenv v16.5.0 for environment variable management
- **Template Engine**: Static HTML templates with placeholder replacement

## Key Components

### 1. Data Fetcher (`fetchFuelPrices()`)
- **Purpose**: Retrieves fuel price data from INEGI API
- **Method**: POST request to INEGI's Sakbe API
- **Authentication**: Uses hardcoded API key
- **Error Handling**: Comprehensive error catching with detailed logging

### 2. Email Reporter
- **SMTP Provider**: Gmail with App Password authentication
- **Template System**: HTML email templates with dynamic content replacement
- **Security**: Environment variable-based credential management
- **Recipient**: Currently hardcoded to reynaldo.orozco@olpega.net

### 3. Configuration Management
- **Environment Variables**: Gmail credentials stored securely
- **Default Values**: Fallback configuration for missing environment variables
- **API Configuration**: INEGI API endpoint and key management

## Data Flow

1. **Initialization**: Load environment variables and configuration
2. **Data Fetching**: Make POST request to INEGI API with authentication key
3. **Data Processing**: Extract and calculate fuel price statistics (average, min, max)
4. **Template Generation**: Populate HTML email template with processed data
5. **Email Delivery**: Send formatted report via Gmail SMTP
6. **Completion**: Log results and exit

## External Dependencies

### APIs
- **INEGI Sakbe API**: Primary data source for fuel prices
  - Endpoint: `https://gaia.inegi.org.mx/sakbe_v3.1/combustible`
  - Authentication: API Key (6Gwy3bY5-mG1W-2Jmk-ViXt-jCS7lbiAbeBI)
  - Method: POST with JSON payload

### Email Service
- **Gmail SMTP**: Email delivery service
  - Host: Gmail SMTP servers
  - Authentication: App Password (2FA required)
  - Security: TLS/SSL encryption

### NPM Packages
- `node-fetch@2`: HTTP request library (specific v2 for CommonJS compatibility)
- `nodemailer@7`: Email sending library
- `dotenv@16`: Environment variable loader

## Deployment Strategy

### Environment Setup
- **Platform**: Replit-optimized with nodejs-20 module
- **Installation**: Automatic dependency installation via npm
- **Execution**: Direct Node.js script execution

### Configuration Requirements
1. Gmail account with 2-Factor Authentication enabled
2. Gmail App Password generation
3. Environment variable configuration (.env file)

### Security Considerations
- API keys and credentials stored in environment variables
- Gmail App Password instead of regular password
- No sensitive data hardcoded in source files

### Runtime Requirements
- Node.js v14 or higher
- Internet connectivity for API and email services
- Valid Gmail credentials and API access

## Changelog

```
Changelog:
- June 23, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```