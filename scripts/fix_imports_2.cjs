const fs = require('fs');

const fixFile = (path) => {
    let content = fs.readFileSync(path, 'utf8');

    // For Settings2.jsx (has the same messed up import logic)
    content = content.replace(
        "import React, { useState, useEffect, useRef } from 'react';\nimport {\nimport { getThemePreviewColors } from '../utils/themeUtils';\n  Building2,",
        "import React, { useState, useEffect, useRef } from 'react';\nimport { getThemePreviewColors } from '../utils/themeUtils';\nimport {\n  Building2,"
    );

    // For Settings.jsx (we broke it in the last tool call)
    // We'll just manually restore the top section:
    if (path.includes('Settings.jsx')) {
        const topOfFile = `import React, { useState, useEffect, useRef } from 'react';
import { getThemePreviewColors } from '../utils/themeUtils';
import {
  Building2,
  MapPin,
  FileText,
  Save,
  Image as ImageIcon,
  Phone,
  Mail,
  User,`;
        // Replace from the top down to "Mail,"
        content = content.replace(/^[\s\S]*?Mail,\r?\n  User,/, topOfFile);
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log(`Fixed ${path}`);
};

fixFile('e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings.jsx');
fixFile('e:/Khair_Murafiq_Empire/BillQyro/src/pages/Settings2.jsx');
