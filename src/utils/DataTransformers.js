import { LoggingUtils } from './LoggingUtils.js';

export function convertDropdownFieldType(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            
            if (key === 'type' && value === 'DROPDOWN') {
                obj[key] = 'DROP_DOWN';
                LoggingUtils.debug('field', 'dropdown_type_normalized', { property: key });
            }
            else if (key === 'field_type' && value === 'DROPDOWN') {
                obj[key] = 'DROP_DOWN';
                LoggingUtils.debug('field', 'dropdown_type_normalized', { property: key });
            }
            else if (value && typeof value === 'object') {
                convertDropdownFieldType(value);
            }
        }
    }
}
