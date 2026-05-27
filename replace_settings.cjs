const fs = require('fs');
let content = fs.readFileSync('e:/Billmint/src/pages/Settings.jsx', 'utf8');

const newArray = `[
                        { id: 'pink', name: 'Pink Premium', desc: 'Deep navy backgrounds with premium pink accents. Best for SaaS.', colors: ['#10122B', '#EC4899', '#FB7185'] },
                        { id: 'indigo', name: 'Royal Indigo', desc: 'Deep indigo and vibrant purple for an elegant touch.', colors: ['#312E81', '#5B34D6', '#7C3AED'] },
                        { id: 'emerald', name: 'Emerald Business', desc: 'Rich emerald greens for eco and finance sectors.', colors: ['#12372A', '#059669', '#34D399'] },
                        { id: 'rose', name: 'Rose Gold Luxe', desc: 'Warm rose and gold accents on dark brown backgrounds.', colors: ['#3A1F1A', '#F43F5E', '#D4A44A'] },
                        { id: 'midnight', name: 'Midnight Blue', desc: 'Deep blues and cyan for a professional marine look.', colors: ['#081A35', '#2563EB', '#38BDF8'] },
                        { id: 'champagne', name: 'Champagne Black', desc: 'Elegant black and champagne gold for high-end feel.', colors: ['#1E1A15', '#D6A84F', '#F97316'] },
                        { id: 'ruby', name: 'Ruby Burgundy', desc: 'Deep burgundy and ruby for a rich, vibrant aesthetic.', colors: ['#2B1220', '#BE185D', '#7C2D12'] }
                      ]`;

content = content.replace(/\{\[\s*\{\s*id:\s*'pink'[\s\S]*?\]\.map\(\(preset\)/, "{" + newArray + ".map((preset)");

const newSelectOptions = `<option value="pink">Pink Premium</option>
                                <option value="indigo">Royal Indigo</option>
                                <option value="emerald">Emerald Business</option>
                                <option value="rose">Rose Gold Luxe</option>
                                <option value="midnight">Midnight Blue</option>
                                <option value="champagne">Champagne Black</option>
                                <option value="ruby">Ruby Burgundy</option>`;

content = content.replace(/<option value="pink">.*?<\/select>/s, newSelectOptions + '\n                              </select>');

fs.writeFileSync('e:/Billmint/src/pages/Settings.jsx', content);
console.log('Settings.jsx updated successfully');
