(function () {
    const COUNTRY_PHONE_CODES = {
        'Afghanistan': '+93',
        'Albania': '+355',
        'Algeria': '+213',
        'Andorra': '+376',
        'Angola': '+244',
        'Antigua and Barbuda': '+1',
        'Argentina': '+54',
        'Armenia': '+374',
        'Australia': '+61',
        'Austria': '+43',
        'Azerbaijan': '+994',
        'Bahamas': '+1',
        'Bahrain': '+973',
        'Bangladesh': '+880',
        'Barbados': '+1',
        'Belarus': '+375',
        'Belgium': '+32',
        'Belize': '+501',
        'Benin': '+229',
        'Bhutan': '+975',
        'Bolivia': '+591',
        'Bosnia and Herzegovina': '+387',
        'Botswana': '+267',
        'Brazil': '+55',
        'Brunei': '+673',
        'Bulgaria': '+359',
        'Burkina Faso': '+226',
        'Burundi': '+257',
        'Cabo Verde': '+238',
        'Cambodia': '+855',
        'Cameroon': '+237',
        'Canada': '+1',
        'Central African Republic': '+236',
        'Chad': '+235',
        'Chile': '+56',
        'China': '+86',
        'Colombia': '+57',
        'Comoros': '+269',
        'Congo': '+242',
        'Costa Rica': '+506',
        'Croatia': '+385',
        'Cuba': '+53',
        'Cyprus': '+357',
        'Czechia': '+420',
        'Denmark': '+45',
        'Djibouti': '+253',
        'Dominica': '+1',
        'Dominican Republic': '+1',
        'Ecuador': '+593',
        'Egypt': '+20',
        'El Salvador': '+503',
        'Equatorial Guinea': '+240',
        'Eritrea': '+291',
        'Estonia': '+372',
        'Eswatini': '+268',
        'Ethiopia': '+251',
        'Fiji': '+679',
        'Finland': '+358',
        'France': '+33',
        'Gabon': '+241',
        'Gambia': '+220',
        'Georgia': '+995',
        'Germany': '+49',
        'Ghana': '+233',
        'Greece': '+30',
        'Grenada': '+1',
        'Guatemala': '+502',
        'Guinea': '+224',
        'Guinea-Bissau': '+245',
        'Guyana': '+592',
        'Haiti': '+509',
        'Honduras': '+504',
        'Hungary': '+36',
        'Iceland': '+354',
        'India': '+91',
        'Indonesia': '+62',
        'Iran': '+98',
        'Iraq': '+964',
        'Ireland': '+353',
        'Israel': '+972',
        'Italy': '+39',
        'Jamaica': '+1',
        'Japan': '+81',
        'Jordan': '+962',
        'Kazakhstan': '+7',
        'Kenya': '+254',
        'Kiribati': '+686',
        'Kuwait': '+965',
        'Kyrgyzstan': '+996',
        'Laos': '+856',
        'Latvia': '+371',
        'Lebanon': '+961',
        'Lesotho': '+266',
        'Liberia': '+231',
        'Libya': '+218',
        'Liechtenstein': '+423',
        'Lithuania': '+370',
        'Luxembourg': '+352',
        'Madagascar': '+261',
        'Malawi': '+265',
        'Malaysia': '+60',
        'Maldives': '+960',
        'Mali': '+223',
        'Malta': '+356',
        'Marshall Islands': '+692',
        'Mauritania': '+222',
        'Mauritius': '+230',
        'Mexico': '+52',
        'Micronesia': '+691',
        'Moldova': '+373',
        'Monaco': '+377',
        'Mongolia': '+976',
        'Montenegro': '+382',
        'Morocco': '+212',
        'Mozambique': '+258',
        'Myanmar': '+95',
        'Namibia': '+264',
        'Nauru': '+674',
        'Nepal': '+977',
        'Netherlands': '+31',
        'New Zealand': '+64',
        'Nicaragua': '+505',
        'Niger': '+227',
        'Nigeria': '+234',
        'North Korea': '+850',
        'North Macedonia': '+389',
        'Norway': '+47',
        'Oman': '+968',
        'Pakistan': '+92',
        'Palau': '+680',
        'Panama': '+507',
        'Papua New Guinea': '+675',
        'Paraguay': '+595',
        'Peru': '+51',
        'Philippines': '+63',
        'Poland': '+48',
        'Portugal': '+351',
        'Qatar': '+974',
        'Romania': '+40',
        'Russia': '+7',
        'Rwanda': '+250',
        'Saint Kitts and Nevis': '+1',
        'Saint Lucia': '+1',
        'Saint Vincent and the Grenadines': '+1',
        'Samoa': '+685',
        'San Marino': '+378',
        'Sao Tome and Principe': '+239',
        'Saudi Arabia': '+966',
        'Senegal': '+221',
        'Serbia': '+381',
        'Seychelles': '+248',
        'Sierra Leone': '+232',
        'Singapore': '+65',
        'Slovakia': '+421',
        'Slovenia': '+386',
        'Solomon Islands': '+677',
        'Somalia': '+252',
        'South Africa': '+27',
        'South Korea': '+82',
        'South Sudan': '+211',
        'Spain': '+34',
        'Sri Lanka': '+94',
        'Sudan': '+249',
        'Suriname': '+597',
        'Sweden': '+46',
        'Switzerland': '+41',
        'Syria': '+963',
        'Taiwan': '+886',
        'Tajikistan': '+992',
        'Tanzania': '+255',
        'Thailand': '+66',
        'Timor-Leste': '+670',
        'Togo': '+228',
        'Tonga': '+676',
        'Trinidad and Tobago': '+1',
        'Tunisia': '+216',
        'Turkey': '+90',
        'Turkmenistan': '+993',
        'Tuvalu': '+688',
        'Uganda': '+256',
        'Ukraine': '+380',
        'United Arab Emirates': '+971',
        'United Kingdom': '+44',
        'United States': '+1',
        'Uruguay': '+598',
        'Uzbekistan': '+998',
        'Vanuatu': '+678',
        'Vatican City': '+39',
        'Venezuela': '+58',
        'Vietnam': '+84',
        'Yemen': '+967',
        'Zambia': '+260',
        'Zimbabwe': '+263'
    };

    function getCountryDialCode(countryName) {
        if (!countryName) {
            return '+20';
        }
        return COUNTRY_PHONE_CODES[countryName] || '+20';
    }

    const COUNTRY_LOCAL_LENGTH_RULES = {
        Egypt: { min: 10, max: 10 },
        'United States': { min: 10, max: 10 },
        Canada: { min: 10, max: 10 },
        'United Kingdom': { min: 9, max: 10 },
        'Saudi Arabia': { min: 9, max: 9 },
        'United Arab Emirates': { min: 9, max: 9 },
        Kuwait: { min: 8, max: 8 },
        Qatar: { min: 8, max: 8 },
        Oman: { min: 8, max: 8 }
    };

    function buildDialCodeOptions() {
        return Object.keys(COUNTRY_PHONE_CODES)
            .sort((a, b) => a.localeCompare(b))
            .map((country) => ({
                country,
                dialCode: COUNTRY_PHONE_CODES[country],
                display: `${country} (${COUNTRY_PHONE_CODES[country]})`
            }));
    }

    const COUNTRY_DIAL_OPTIONS = buildDialCodeOptions();

    function findCountryByDialCode(dialCode) {
        return COUNTRY_DIAL_OPTIONS.find((option) => option.dialCode === dialCode)?.country || null;
    }

    function resolveDialCodeInput(value, fallbackCountry) {
        const fallbackDialCode = getCountryDialCode(fallbackCountry || 'Egypt');
        const raw = String(value || '').trim();
        if (!raw) {
            return { dialCode: fallbackDialCode, country: fallbackCountry || findCountryByDialCode(fallbackDialCode) };
        }

        // Examples supported: +20, Egypt, Egypt (+20), EG +20, +20 Egypt
        const directCode = raw.match(/\+(\d{1,3})/);
        if (directCode) {
            const dialCode = `+${directCode[1]}`;
            return { dialCode, country: findCountryByDialCode(dialCode) || fallbackCountry || null };
        }

        const normalized = raw.toLowerCase();
        const matchByCountry = COUNTRY_DIAL_OPTIONS.find((option) => option.country.toLowerCase() === normalized);
        if (matchByCountry) {
            return { dialCode: matchByCountry.dialCode, country: matchByCountry.country };
        }

        const matchByIncludes = COUNTRY_DIAL_OPTIONS.find((option) => normalized.includes(option.country.toLowerCase()));
        if (matchByIncludes) {
            return { dialCode: matchByIncludes.dialCode, country: matchByIncludes.country };
        }

        const digitsOnly = raw.replace(/\D/g, '');
        if (digitsOnly) {
            const dialCode = `+${digitsOnly.slice(0, 3)}`;
            return { dialCode, country: findCountryByDialCode(dialCode) || fallbackCountry || null };
        }

        return { dialCode: fallbackDialCode, country: fallbackCountry || findCountryByDialCode(fallbackDialCode) };
    }

    function formatNationalPhoneDigits(digits) {
        const clean = String(digits || '').replace(/\D/g, '');
        if (!clean) return '';

        // Group in readable chunks: 3-3-4 then remaining 3s
        const chunks = [];
        let cursor = 0;
        const preferred = [3, 3, 4];
        for (const size of preferred) {
            if (cursor >= clean.length) break;
            chunks.push(clean.slice(cursor, cursor + size));
            cursor += size;
        }
        while (cursor < clean.length) {
            chunks.push(clean.slice(cursor, cursor + 3));
            cursor += 3;
        }
        return chunks.join(' ').trim();
    }

    function normalizePhoneForStorage(phoneValue, fallbackDialCode) {
        const fallback = getCountryDialCode(fallbackDialCode || 'Egypt');
        const raw = String(phoneValue || '').trim();

        if (!raw) {
            return {
                isValid: false,
                normalized: '',
                dialCode: fallback,
                nationalDigits: '',
                reason: 'Phone number is required.'
            };
        }

        let dialCode = fallback;
        let nationalPart = raw;

        // Allow typed international numbers like +20 501234567
        const intlMatch = raw.match(/^\+(\d{1,3})\s*(.*)$/);
        if (intlMatch) {
            dialCode = `+${intlMatch[1]}`;
            nationalPart = intlMatch[2] || '';
        }

        const nationalDigits = nationalPart.replace(/\D/g, '');
        const dialDigits = dialCode.replace(/\D/g, '');
        const totalDigits = (dialDigits + nationalDigits).length;
        const inferredCountry = findCountryByDialCode(dialCode) || fallbackDialCode || null;
        const lengthRule = inferredCountry ? COUNTRY_LOCAL_LENGTH_RULES[inferredCountry] : null;

        if (lengthRule && (nationalDigits.length < lengthRule.min || nationalDigits.length > lengthRule.max)) {
            return {
                isValid: false,
                normalized: '',
                normalizedDisplay: '',
                e164: '',
                dialCode,
                country: inferredCountry,
                nationalDigits,
                reason: `Phone number for ${inferredCountry} must contain ${lengthRule.min}${lengthRule.min !== lengthRule.max ? `-${lengthRule.max}` : ''} digits.`
            };
        }

        // E.164 allows up to 15 digits (excluding +), practical min check included.
        if (nationalDigits.length < 6 || nationalDigits.length > 14 || totalDigits < 8 || totalDigits > 15) {
            return {
                isValid: false,
                normalized: '',
                normalizedDisplay: '',
                e164: '',
                dialCode,
                country: inferredCountry,
                nationalDigits,
                reason: 'Enter a valid international phone number (example: +20 50 123 4567).'
            };
        }

        const e164 = `+${dialDigits}${nationalDigits}`;

        return {
            isValid: true,
            normalized: e164,
            normalizedDisplay: `${dialCode} ${formatNationalPhoneDigits(nationalDigits)}`.trim(),
            e164,
            dialCode,
            country: inferredCountry,
            nationalDigits,
            reason: ''
        };
    }

    function validateAndBuildPhone(dialCodeInput, localNumberInput, fallbackCountry) {
        const resolved = resolveDialCodeInput(dialCodeInput, fallbackCountry || 'Egypt');
        const localDigits = String(localNumberInput || '').replace(/\D/g, '');
        return normalizePhoneForStorage(`${resolved.dialCode} ${localDigits}`, resolved.country || fallbackCountry || 'Egypt');
    }

    function maskPhoneInput(dialCode, nationalDigits) {
        return `${dialCode} ${formatNationalPhoneDigits(nationalDigits)}`.trim();
    }

    window.COUNTRY_PHONE_CODES = COUNTRY_PHONE_CODES;
    window.COUNTRY_DIAL_OPTIONS = COUNTRY_DIAL_OPTIONS;
    window.COUNTRY_LOCAL_LENGTH_RULES = COUNTRY_LOCAL_LENGTH_RULES;
    window.getCountryDialCode = getCountryDialCode;
    window.resolveDialCodeInput = resolveDialCodeInput;
    window.normalizePhoneForStorage = normalizePhoneForStorage;
    window.validateAndBuildPhone = validateAndBuildPhone;
    window.maskPhoneInput = maskPhoneInput;
    window.formatNationalPhoneDigits = formatNationalPhoneDigits;
})();
