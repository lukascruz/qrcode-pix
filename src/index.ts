import qrcode, { QRCodeToDataURLOptions } from 'qrcode';
import { crc } from 'polycrc';
import { string, number } from 'yup';

interface QrCodePixParams {
    version: string;
    city: string;
    name: string;
    value?: number;
    transactionId?: string;
    urlPayload: string;
    currency?: number;
    repeatPayment?: boolean;
    countryCode?: string;
}

function QrCodePix({
    version,
    city,
    name,
    value,
    urlPayload,
    transactionId = '***',
    currency = 986,
    countryCode = 'BR',
    repeatPayment = false
}: QrCodePixParams) {
    string().equals(['01'], 'Version not supported').validateSync(version);

    string()
        .min(2, 'countryCode: 2 characters')
        .max(2, 'countryCode: 2 characters')
        .nullable()
        .validateSync(countryCode);

    if (String(value) === '0') {
        value = undefined;
    }

    number().nullable().positive('Value must be a positive number').validateSync(value);

    string().max(25, 'transactionId: max 25 characters').nullable().validateSync(transactionId);

    const merchantAccount = generateMerchantAccount(urlPayload);

    const payload: string[] = [
        genEMV('00', version),
        genEMV('01', repeatPayment ? '11' : '12'),
        genEMV('26', merchantAccount),
        genEMV('52', '0000'),
        genEMV('53', String(currency)),
    ];

    if (value) {
        payload.push(genEMV('54', value.toFixed(2)));
    }

    name = String(name)
        .substring(0, 25)
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    city = String(city)
        .substring(0, 15)
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    payload.push(genEMV('58', countryCode.toUpperCase()));
    payload.push(genEMV('59', name));
    payload.push(genEMV('60', city));

    payload.push(genEMV('62', genEMV('05', transactionId)));

    payload.push('6304');

    const stringPayload = payload.join('');
    const buffer = Buffer.from(stringPayload, 'utf8');

    const crc16CCiTT = crc(16, 0x1021, 0xffff, 0x0000, false);
    const crcResult = crc16CCiTT(buffer).toString(16).toUpperCase().padStart(4, '0');

    const payloadPIX = `${stringPayload}${crcResult}`;

    return {
        payload: () => payloadPIX,
        base64: (options?: QRCodeToDataURLOptions) => qrcode.toDataURL(payloadPIX, options),
    };
}

function generateMerchantAccount(urlPayload: string): string {
    const payload: string[] = [genEMV('00', 'BR.GOV.BCB.PIX'), genEMV('25', urlPayload)];
    
    return payload.join('');
}

function genEMV(id: string, parameter: string): string {
    const len = parameter.length.toString().padStart(2, '0');
    return `${id}${len}${parameter}`;
}

export { QrCodePixParams, QrCodePix };
