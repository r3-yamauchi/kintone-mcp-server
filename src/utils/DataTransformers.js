export function convertDropdownFieldType(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            
            if (key === 'type' && value === 'DROPDOWN') {
                obj[key] = 'DROP_DOWN';
                console.error('フィールドタイプ "DROPDOWN" を "DROP_DOWN" に自動変換しました。');
            }
            else if (key === 'field_type' && value === 'DROPDOWN') {
                obj[key] = 'DROP_DOWN';
                console.error('フィールドタイプ "DROPDOWN" を "DROP_DOWN" に自動変換しました。');
            }
            else if (value && typeof value === 'object') {
                convertDropdownFieldType(value);
            }
        }
    }
}
