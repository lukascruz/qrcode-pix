import qrcode from 'qrcode';
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
declare function QrCodePix({ version, city, name, value, urlPayload, transactionId, currency, countryCode, repeatPayment }: QrCodePixParams): {
    payload: () => string;
    base64: (options?: qrcode.QRCodeToDataURLOptions | undefined) => Promise<string>;
};
export { QrCodePixParams, QrCodePix };
