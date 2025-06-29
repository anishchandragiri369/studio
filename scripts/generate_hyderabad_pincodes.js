// Script to generate Hyderabad pincode-to-area mapping using pincode-india
// Usage: node scripts/generate_hyderabad_pincodes.js > sql/hyderabad_pincodes.json

const fs = require('fs');
const pincodeIndia = require('pincode-india');

// List of Hyderabad district names (can be expanded for GHMC limits)
const hyderabadDistricts = [
  'Hyderabad',
  'Medchal Malkajgiri',
  'Ranga Reddy',
  'Sangareddy',
  'Secunderabad',
  'Malkajgiri',
  'Cyberabad',
  'Serilingampally',
  'LB Nagar',
  'Quthbullapur',
  'Gachibowli',
  'Kukatpally',
  'Patancheru',
  'Kapra',
  'Alwal',
  'Rajendranagar',
  'Shamirpet',
  'Uppal',
  'Amberpet',
  'Bahadurpura',
  'Charminar',
  'Nampally',
  'Musheerabad',
  'Secunderabad',
  'Saidabad',
  'Khairatabad',
  'Miyapur',
  'Dilsukhnagar',
  'Banjara Hills',
  'Jubilee Hills',
  'Ameerpet',
  'Begumpet',
  'Madhapur',
  'Lingampally',
  'Manikonda',
  'Attapur',
  'Tolichowki',
  'Mehdipatnam',
  'Moula Ali',
  'ECIL',
  'Nacharam',
  'Habsiguda',
  'LB Nagar',
  'Kompally',
  'Bachupally',
  'Nizampet',
  'Pragathi Nagar',
  'Chandanagar',
  'Bolarum',
  'Bowenpally',
  'Yapral',
  'Alwal',
  'Kapra',
  'Sainikpuri',
  'Jeedimetla',
  'Balanagar',
  'Sanathnagar',
  'Erragadda',
  'Malkajgiri',
  'Tirumalagiri',
  'Trimulgherry',
  'Golkonda',
  'Golconda',
  'Patancheru',
  'Medchal',
  'Ghatkesar',
  'Hayathnagar',
  'Shivarampally',
  'Attapur',
  'Rajendranagar',
  'Serilingampally',
  'RC Puram',
  'Dundigal',
  'Bahadurpally',
  'JNTU',
  'Madinaguda',
  'Borabanda',
  'Keesara',
  'Amberpet',
  'Saidabad',
  'Charminar',
  'Nampally',
  'Musheerabad',
  'Basheerbagh',
  'Lakdikapul',
  'Khairatabad',
  'Masab Tank',
  'Somajiguda',
  'Punjagutta',
  'Prakash Nagar',
  'S R Nagar',
  'Yousufguda',
  'Kondapur',
  'Madhapur',
  'Hitech City',
  'Road No 3 Banjara Hills',
  'Film Nagar',
  'Shaikpet',
  'Tolichowki',
  'Mehdipatnam',
  'Toli Chowki',
  'Rethibowli',
  'Langar Houz',
  'Pillar No 135',
  'Jubilee Hills Road No 36',
  'Jubilee Hills Road No 45',
  'Banjara Hills Road No 12',
  'Himayath Nagar',
  'Narayanguda',
  'Himayathnagar',
  'Basheerbagh',
  'Lakdikapul',
  'Khairatabad',
  'Masab Tank',
  'Banjara Hills Road No 8',
  'Film Nagar Extension',
  'Cyberabad',
  'Lingampally',
  'Chandanagar',
  'Nizampet',
  'Bachupally',
  'Pragathi Nagar',
  'Kompally',
  'Bollaram',
  'Quthbullapur Municipality',
  'Dundigal',
  'Bahadurpally',
  'Medak Road',
  'Jinnaram',
  'Gajularamaram',
  'JNTU',
  'Madinaguda',
  'Borabanda'
];

// Get all pincodes for Telangana
const allTelangana = pincodeIndia.filter(p => p.stateName === 'Telangana');

// Filter for Hyderabad pincodes (city or district match)
const hyderabadPincodes = allTelangana.filter(p => {
  const area = p.officeName.toLowerCase();
  const district = p.districtName.toLowerCase();
  // Check if district or area matches any of the known Hyderabad localities
  return hyderabadDistricts.some(d =>
    area.includes(d.toLowerCase()) ||
    district.includes(d.toLowerCase())
  );
});

// Remove duplicates by pincode
const uniquePincodes = {};
hyderabadPincodes.forEach(p => {
  if (!uniquePincodes[p.pincode]) {
    uniquePincodes[p.pincode] = p;
  }
});

// Sort by pincode
const sorted = Object.values(uniquePincodes).sort((a, b) => a.pincode.localeCompare(b.pincode));

// Output as JSON array
const output = sorted.map(p => ({
  pincode: p.pincode,
  area: p.officeName
}));

fs.writeFileSync(
  __dirname + '/../sql/hyderabad_pincodes.json',
  JSON.stringify(output, null, 2),
  'utf8'
);

console.log('Hyderabad pincodes written to sql/hyderabad_pincodes.json');
